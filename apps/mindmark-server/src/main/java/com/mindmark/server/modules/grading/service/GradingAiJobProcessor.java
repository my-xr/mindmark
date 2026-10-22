package com.mindmark.server.modules.grading.service;

import com.mindmark.server.modules.ai.dto.AiProviderRuntimeConfig;
import com.mindmark.server.modules.ai.service.AiProviderSettingService;
import com.mindmark.server.modules.answer.domain.AnswerItemEntity;
import com.mindmark.server.modules.answer.repository.AnswerItemRepository;
import com.mindmark.server.modules.auth.service.AuthAuditService;
import com.mindmark.server.modules.grading.domain.GradingAiJobEntity;
import com.mindmark.server.modules.grading.domain.GradingAiJobStatus;
import com.mindmark.server.modules.grading.domain.GradingItemEntity;
import com.mindmark.server.modules.grading.domain.GradingTaskEntity;
import com.mindmark.server.modules.grading.domain.GradingTaskStatus;
import com.mindmark.server.modules.grading.repository.GradingAiJobRepository;
import com.mindmark.server.modules.grading.repository.GradingTaskRepository;
import com.mindmark.server.modules.question.domain.QuestionEntity;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class GradingAiJobProcessor {

    private final GradingAiJobRepository jobRepository;
    private final GradingTaskRepository gradingTaskRepository;
    private final AnswerItemRepository answerItemRepository;
    private final SubjectiveGradingPolicy subjectiveGradingPolicy;
    private final AiProviderSettingService aiProviderSettingService;
    private final TransactionTemplate transactionTemplate;
    private final AuthAuditService authAuditService;
    private final long jobTimeoutMs;

    public GradingAiJobProcessor(
        GradingAiJobRepository jobRepository,
        GradingTaskRepository gradingTaskRepository,
        AnswerItemRepository answerItemRepository,
        SubjectiveGradingPolicy subjectiveGradingPolicy,
        AiProviderSettingService aiProviderSettingService,
        TransactionTemplate transactionTemplate,
        AuthAuditService authAuditService,
        @Value("${mindmark.ai.grading.job-timeout-ms:300000}") long jobTimeoutMs
    ) {
        this.jobRepository = jobRepository;
        this.gradingTaskRepository = gradingTaskRepository;
        this.answerItemRepository = answerItemRepository;
        this.subjectiveGradingPolicy = subjectiveGradingPolicy;
        this.aiProviderSettingService = aiProviderSettingService;
        this.transactionTemplate = transactionTemplate;
        this.authAuditService = authAuditService;
        this.jobTimeoutMs = jobTimeoutMs;
    }

    @Async("gradingAiTaskExecutor")
    public void process(String jobId) {
        JobContext context = markRunning(jobId);
        if (context == null) {
            return;
        }

        AiProviderRuntimeConfig config;
        try {
            config = aiProviderSettingService.resolveRuntimeConfig(context.teacherId(), null);
            updateProviderInfo(jobId, config);
        } catch (RuntimeException exception) {
            markSkipped(jobId, "未配置可用 AI Provider，已保留系统基线分。" + summarize(exception.getMessage()));
            return;
        }

        List<ItemGradingResult> results;
        try {
            results = gradeAllWithinJobDeadline(context, config);
        } catch (RuntimeException exception) {
            markSkipped(jobId, "AI 评分任务执行异常，已保留系统基线分。" + summarize(exception.getMessage()), context.items().size(), 0);
            return;
        }

        if (results.isEmpty()) {
            markSkipped(jobId, "AI Provider 未返回可用评分，已保留系统基线分。", context.items().size(), 0);
            return;
        }
        applyResults(jobId, results, context.items().size());
    }

    @Scheduled(initialDelayString = "${mindmark.ai.grading.recover-initial-delay-ms:60000}", fixedDelayString = "${mindmark.ai.grading.recover-fixed-delay-ms:120000}")
    public void recoverPendingJobs() {
        jobRepository.findByStatusInOrderByCreatedAtAsc(List.of(GradingAiJobStatus.PENDING)).stream()
            .limit(10)
            .forEach(job -> process(job.getId()));
        recoverStalledRunningJobs();
    }

    private void recoverStalledRunningJobs() {
        OffsetDateTime deadline = OffsetDateTime.now().minus(Duration.ofMillis(Math.max(1000L, jobTimeoutMs)));
        jobRepository.findByStatusInOrderByCreatedAtAsc(List.of(GradingAiJobStatus.RUNNING)).stream()
            .filter(job -> job.getStartedAt() != null && job.getStartedAt().isBefore(deadline))
            .limit(10)
            .forEach(job -> markSkipped(
                job.getId(),
                "AI 评分任务超过最大执行时间，已停止等待并保留系统基线分。",
                job.getProcessedItemCount(),
                job.getRefreshedItemCount()
            ));
    }
    private List<ItemGradingResult> gradeAllWithinJobDeadline(JobContext context, AiProviderRuntimeConfig config) {
        long deadlineNanos = System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(Math.max(1000L, jobTimeoutMs - 1000L));
        ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
        List<CompletableFuture<Optional<ItemGradingResult>>> futures = context.items().stream()
            .map(item -> CompletableFuture.supplyAsync(() -> gradeOne(item, config), executor))
            .toList();
        try {
            ArrayList<ItemGradingResult> results = new ArrayList<>();
            for (CompletableFuture<Optional<ItemGradingResult>> future : futures) {
                long remainingNanos = deadlineNanos - System.nanoTime();
                if (remainingNanos <= 0) {
                    break;
                }
                try {
                    future.get(remainingNanos, TimeUnit.NANOSECONDS).ifPresent(results::add);
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                    break;
                } catch (ExecutionException | TimeoutException exception) {
                    // 单题 AI 评分失败不影响整张答卷，保留该题系统基线分。
                }
            }
            return List.copyOf(results);
        } finally {
            futures.forEach(future -> future.cancel(true));
            executor.shutdownNow();
        }
    }

    private Optional<ItemGradingResult> gradeOne(WorkItem item, AiProviderRuntimeConfig config) {
        return subjectiveGradingPolicy.gradeWithProviderConfig(
                item.question(),
                item.answerJson(),
                item.maxScore(),
                config
            )
            .map(result -> new ItemGradingResult(item.itemId(), result));
    }

    private JobContext markRunning(String jobId) {
        return transactionTemplate.execute(status -> {
            GradingAiJobEntity job = jobRepository.findById(jobId).orElse(null);
            if (job == null || job.getStatus() != GradingAiJobStatus.PENDING) {
                return null;
            }
            GradingTaskEntity task = gradingTaskRepository.findWithItemsById(job.getGradingTask().getId()).orElse(null);
            if (task == null || task.getStatus() == GradingTaskStatus.REVIEWED) {
                markJobSkippedInTransaction(job, "答卷已由教师复核，后台 AI 评分不再覆盖成绩。", 0, 0);
                return null;
            }
            OffsetDateTime now = OffsetDateTime.now();
            job.setStatus(GradingAiJobStatus.RUNNING);
            job.setStartedAt(now);
            job.setUpdatedAt(now);
            jobRepository.save(job);
            return new JobContext(job.getId(), task.getId(), job.getTeacherId(), buildWorkItems(task));
        });
    }

    private List<WorkItem> buildWorkItems(GradingTaskEntity task) {
        Map<String, AnswerItemEntity> answers = task.getAnswerSheet().getItems().stream()
            .collect(
                LinkedHashMap::new,
                (map, item) -> map.put(item.getQuestionId(), item),
                LinkedHashMap::putAll
            );
        return task.getItems().stream()
            .filter(item -> !Boolean.TRUE.equals(item.getObjective()))
            .map(item -> new WorkItem(
                item.getId(),
                item.getQuestion(),
                item.getMaxScore(),
                answers.get(item.getQuestion().getId()) == null ? null : answers.get(item.getQuestion().getId()).getAnswerJson()
            ))
            .toList();
    }

    private void updateProviderInfo(String jobId, AiProviderRuntimeConfig config) {
        transactionTemplate.executeWithoutResult(status -> {
            GradingAiJobEntity job = jobRepository.findById(jobId).orElse(null);
            if (job == null) {
                return;
            }
            job.setProvider(config.provider());
            job.setModel(config.model());
            job.setUpdatedAt(OffsetDateTime.now());
            jobRepository.save(job);
        });
    }

    private void applyResults(String jobId, List<ItemGradingResult> results, int processedCount) {
        transactionTemplate.executeWithoutResult(status -> {
            GradingAiJobEntity job = jobRepository.findById(jobId).orElse(null);
            if (job == null || job.getStatus() != GradingAiJobStatus.RUNNING) {
                return;
            }
            GradingTaskEntity task = gradingTaskRepository.findWithItemsById(job.getGradingTask().getId()).orElse(null);
            if (task == null || task.getStatus() == GradingTaskStatus.REVIEWED) {
                markJobSkippedInTransaction(job, "答卷已由教师复核，后台 AI 评分不再覆盖成绩。", processedCount, 0);
                return;
            }

            Map<String, SubjectiveGradingPolicy.SubjectiveGradingResult> resultMap = results.stream()
                .collect(
                    LinkedHashMap::new,
                    (map, item) -> map.put(item.itemId(), item.result()),
                    LinkedHashMap::putAll
                );
            OffsetDateTime now = OffsetDateTime.now();
            int refreshed = 0;
            for (GradingItemEntity item : task.getItems()) {
                SubjectiveGradingPolicy.SubjectiveGradingResult result = resultMap.get(item.getId());
                if (result == null) {
                    continue;
                }
                item.setAutoScore(result.score());
                item.setFinalScore(result.score());
                item.setCorrect(result.correct());
                item.setAiConfidence(result.confidence());
                item.setNeedsReview(result.needsReview());
                item.setComment(result.comment());
                item.setGradingSource(result.gradingSource());
                item.setAiProvider(result.aiProvider());
                item.setAiModel(result.aiModel());
                item.setAiRubricVersion(result.aiRubricVersion());
                item.setAiRawScore(result.aiRawScore());
                item.setScoreDiff(BigDecimal.ZERO);
                item.setUpdatedAt(now);
                refreshed += 1;
            }
            recalculateTaskScore(task, now);
            job.setStatus(GradingAiJobStatus.SUCCEEDED);
            job.setProcessedItemCount(processedCount);
            job.setRefreshedItemCount(refreshed);
            job.setErrorMessage(null);
            job.setDurationMs(durationMs(job.getStartedAt(), now));
            job.setResultSummary("AI 已处理 " + processedCount + " 题，刷新 " + refreshed + " 题默认分。");
            job.setFinishedAt(now);
            job.setUpdatedAt(now);
            gradingTaskRepository.save(task);
            jobRepository.save(job);
            authAuditService.record(job.getTeacherId(), "GRADING_AI_JOB_SUCCEEDED", task.getId(), "SUCCESS", "refreshedItemCount=" + refreshed);
        });
    }

    private void recalculateTaskScore(GradingTaskEntity task, OffsetDateTime now) {
        BigDecimal objectiveScore = BigDecimal.ZERO;
        BigDecimal subjectiveScore = BigDecimal.ZERO;
        for (GradingItemEntity item : task.getItems()) {
            BigDecimal score = item.getFinalScore() == null ? BigDecimal.ZERO : item.getFinalScore();
            if (Boolean.TRUE.equals(item.getObjective())) {
                objectiveScore = objectiveScore.add(score);
            } else {
                subjectiveScore = subjectiveScore.add(score);
            }
        }
        BigDecimal totalScore = objectiveScore.add(subjectiveScore);
        task.setObjectiveScore(objectiveScore);
        task.setSubjectiveScore(subjectiveScore);
        task.setAiScore(totalScore);
        task.setFinalScore(totalScore);
        task.setStatus(GradingTaskStatus.AI_CHECKED);
        task.setUpdatedAt(now);
    }

    private void markSkipped(String jobId, String message) {
        markSkipped(jobId, message, 0, 0);
    }

    private void markSkipped(String jobId, String message, int processedCount, int refreshedCount) {
        transactionTemplate.executeWithoutResult(status -> {
            GradingAiJobEntity job = jobRepository.findById(jobId).orElse(null);
            if (job == null) {
                return;
            }
            markJobSkippedInTransaction(job, message, processedCount, refreshedCount);
        });
    }

    private void markJobSkippedInTransaction(GradingAiJobEntity job, String message, int processedCount, int refreshedCount) {
        OffsetDateTime now = OffsetDateTime.now();
        job.setStatus(GradingAiJobStatus.SKIPPED);
        job.setProcessedItemCount(processedCount);
        job.setRefreshedItemCount(refreshedCount);
        job.setErrorMessage(summarize(message));
        job.setDurationMs(durationMs(job.getStartedAt(), now));
        job.setResultSummary(job.getErrorMessage());
        job.setFinishedAt(now);
        job.setUpdatedAt(now);
        jobRepository.save(job);
        authAuditService.record(job.getTeacherId(), "GRADING_AI_JOB_SKIPPED", job.getGradingTask().getId(), "SUCCESS", job.getErrorMessage());
    }

    private Long durationMs(OffsetDateTime startedAt, OffsetDateTime finishedAt) {
        if (startedAt == null || finishedAt == null) {
            return null;
        }
        return Math.max(0L, Duration.between(startedAt, finishedAt).toMillis());
    }

    private String summarize(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String compact = value.replaceAll("\\s+", " ").trim();
        return compact.length() > 500 ? compact.substring(0, 500) : compact;
    }

    private record JobContext(String jobId, String gradingTaskId, String teacherId, List<WorkItem> items) {}

    private record WorkItem(String itemId, QuestionEntity question, BigDecimal maxScore, String answerJson) {}

    private record ItemGradingResult(String itemId, SubjectiveGradingPolicy.SubjectiveGradingResult result) {}
}
