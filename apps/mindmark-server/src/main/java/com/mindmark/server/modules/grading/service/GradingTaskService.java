package com.mindmark.server.modules.grading.service;

import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.api.PageResponse;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.answer.domain.AnswerItemEntity;
import com.mindmark.server.modules.answer.domain.AnswerSheetEntity;
import com.mindmark.server.modules.answer.domain.AnswerSheetStatus;
import com.mindmark.server.modules.answer.repository.AnswerItemRepository;
import com.mindmark.server.modules.answer.repository.AnswerSheetRepository;
import com.mindmark.server.modules.answer.service.AnswerSheetOptionOrderService;
import com.mindmark.server.modules.auth.domain.AuthUserEntity;
import com.mindmark.server.modules.auth.domain.RoleCode;
import com.mindmark.server.modules.auth.service.ClassScopeService;
import com.mindmark.server.modules.exam.domain.ExamEntity;
import com.mindmark.server.modules.exam.domain.ExamStatus;
import com.mindmark.server.modules.grading.domain.GradingItemEntity;
import com.mindmark.server.modules.grading.domain.GradingTaskEntity;
import com.mindmark.server.modules.grading.domain.GradingTaskStatus;
import com.mindmark.server.modules.grading.dto.BatchConfirmGradingTasksRequest;
import com.mindmark.server.modules.grading.dto.BatchGradingTaskOperationResponse;
import com.mindmark.server.modules.grading.dto.GradingItemResponse;
import com.mindmark.server.modules.grading.dto.GradingTaskResponse;
import com.mindmark.server.modules.grading.dto.ReviewGradingItemRequest;
import com.mindmark.server.modules.grading.dto.ReviewGradingTaskRequest;
import com.mindmark.server.modules.grading.repository.GradingItemRepository;
import com.mindmark.server.modules.grading.repository.GradingTaskRepository;
import com.mindmark.server.modules.paper.domain.PaperEntity;
import com.mindmark.server.modules.paper.domain.PaperQuestionEntity;
import com.mindmark.server.modules.paper.repository.PaperRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GradingTaskService {

    private final GradingTaskRepository gradingTaskRepository;
    private final GradingItemRepository gradingItemRepository;
    private final AnswerItemRepository answerItemRepository;
    private final AnswerSheetRepository answerSheetRepository;
    private final PaperRepository paperRepository;
    private final ObjectiveGradingPolicy objectiveGradingPolicy;
    private final SubjectiveGradingPolicy subjectiveGradingPolicy;
    private final GradingTaskMapper mapper;
    private final ClassScopeService classScopeService;
    private final GradingAiJobService gradingAiJobService;
    private final AnswerSheetOptionOrderService answerSheetOptionOrderService;

    public GradingTaskService(
        GradingTaskRepository gradingTaskRepository,
        GradingItemRepository gradingItemRepository,
        AnswerItemRepository answerItemRepository,
        AnswerSheetRepository answerSheetRepository,
        PaperRepository paperRepository,
        ObjectiveGradingPolicy objectiveGradingPolicy,
        SubjectiveGradingPolicy subjectiveGradingPolicy,
        GradingTaskMapper mapper,
        ClassScopeService classScopeService,
        GradingAiJobService gradingAiJobService,
        AnswerSheetOptionOrderService answerSheetOptionOrderService
    ) {
        this.gradingTaskRepository = gradingTaskRepository;
        this.gradingItemRepository = gradingItemRepository;
        this.answerItemRepository = answerItemRepository;
        this.answerSheetRepository = answerSheetRepository;
        this.paperRepository = paperRepository;
        this.objectiveGradingPolicy = objectiveGradingPolicy;
        this.subjectiveGradingPolicy = subjectiveGradingPolicy;
        this.mapper = mapper;
        this.classScopeService = classScopeService;
        this.gradingAiJobService = gradingAiJobService;
        this.answerSheetOptionOrderService = answerSheetOptionOrderService;
    }

    @Transactional(readOnly = true)
    public List<GradingTaskResponse> listTasks(String examId, String courseName, String scoreBand) {
        classScopeService.requireStaffRole();
        String normalizedCourseName = normalizeCourseName(courseName);
        String normalizedScoreBand = normalizeScoreBand(scoreBand);
        List<GradingTaskEntity> tasks = examId == null || examId.isBlank()
            ? gradingTaskRepository.findAllByOrderByUpdatedAtDesc()
            : gradingTaskRepository.findByExamIdOrderByUpdatedAtDesc(examId);
        return tasks.stream()
            .filter(task -> classScopeService.canAccessAllExamClasses(task.getExam()))
            .filter(task -> normalizedCourseName == null
                || task.getExam().getPaper().getCourseName().equalsIgnoreCase(normalizedCourseName))
            .filter(task -> normalizedScoreBand == null || matchesScoreBand(task, normalizedScoreBand))
            .map(task -> mapper.toResponse(task, false))
            .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<GradingTaskResponse> listTasksPage(String examId, String courseName, String scoreBand, Integer page, Integer pageSize) {
        classScopeService.requireStaffRole();
        boolean admin = currentUserIsAdmin();
        Set<String> visibleClassIds = visibleClassIdsForQuery(admin);
        if (!admin && visibleClassIds.isEmpty()) {
            return PageResponse.empty(page, pageSize);
        }

        PageRequest pageRequest = toPageRequest(page, pageSize);
        Page<GradingTaskEntity> taskPage = gradingTaskRepository.pageVisibleTasks(
            normalizeExamId(examId),
            normalizeCourseName(courseName),
            normalizeScoreBand(scoreBand),
            admin,
            visibleClassIds,
            pageRequest
        );
        if (taskPage.isEmpty() && taskPage.getTotalElements() > 0 && pageRequest.getPageNumber() >= taskPage.getTotalPages()) {
            pageRequest = PageRequest.of(taskPage.getTotalPages() - 1, pageRequest.getPageSize());
            taskPage = gradingTaskRepository.pageVisibleTasks(
                normalizeExamId(examId),
                normalizeCourseName(courseName),
                normalizeScoreBand(scoreBand),
            admin,
                visibleClassIds,
                pageRequest
            );
        }
        return PageResponse.fromPage(taskPage.map(task -> mapper.toResponse(task, false)));
    }

    @Transactional(readOnly = true)
    public GradingTaskResponse getTask(String gradingTaskId) {
        classScopeService.requireStaffRole();
        GradingTaskEntity task = findTaskWithItems(gradingTaskId);
        classScopeService.requireCanAccessExam(task.getExam());
        return mapper.toResponse(task, true);
    }

    @Transactional(readOnly = true)
    public PageResponse<GradingItemResponse> listTaskItems(String gradingTaskId, Integer page, Integer pageSize) {
        classScopeService.requireStaffRole();
        GradingTaskEntity task = findTaskForScopeCheck(gradingTaskId);
        classScopeService.requireCanAccessExam(task.getExam());

        PageRequest pageRequest = toPageRequest(page, pageSize);
        Page<GradingItemEntity> itemPage = gradingItemRepository.findByGradingTaskIdOrderByCreatedAtAsc(gradingTaskId, pageRequest);
        if (itemPage.isEmpty() && itemPage.getTotalElements() > 0 && pageRequest.getPageNumber() >= itemPage.getTotalPages()) {
            pageRequest = PageRequest.of(itemPage.getTotalPages() - 1, pageRequest.getPageSize());
            itemPage = gradingItemRepository.findByGradingTaskIdOrderByCreatedAtAsc(gradingTaskId, pageRequest);
        }

        List<String> questionIds = itemPage.getContent().stream()
            .map(item -> item.getQuestion().getId())
            .toList();
        Map<String, AnswerItemEntity> answers = questionIds.isEmpty()
            ? Map.of()
            : answerItemRepository.findByAnswerSheetIdAndQuestionIdIn(task.getAnswerSheet().getId(), questionIds).stream()
                .collect(
                    LinkedHashMap::new,
                    (map, item) -> map.put(item.getQuestionId(), item),
                    LinkedHashMap::putAll
                );

        return PageResponse.fromPage(itemPage.map(item -> mapper.toItemResponse(item, answers.get(item.getQuestion().getId()))));
    }

    @Transactional
    public GradingTaskEntity createTaskForSubmittedAnswerSheet(String answerSheetId) {
        GradingTaskEntity task = gradingTaskRepository.findByAnswerSheetId(answerSheetId)
            .orElseGet(() -> createNewTask(answerSheetId));
        if (task.getStatus() == GradingTaskStatus.PENDING) {
            applyAutoGrade(task, false);
            task = gradingTaskRepository.save(task);
            gradingAiJobService.enqueueSystemIfNeeded(task.getId());
        }
        promoteExamToGradingIfReady(task.getExam(), OffsetDateTime.now());
        return task;
    }

    @Transactional
    public GradingTaskResponse autoGrade(String gradingTaskId) {
        classScopeService.requireStaffRole();
        GradingTaskEntity task = findTaskWithItems(gradingTaskId);
        classScopeService.requireCanAccessExam(task.getExam());
        applyAutoGrade(task, false);
        GradingTaskEntity savedTask = gradingTaskRepository.save(task);
        gradingAiJobService.enqueueIfNeeded(savedTask.getId());
        return mapper.toResponse(savedTask, true);
    }

    @Transactional
    public GradingTaskResponse confirmSystemScore(String gradingTaskId, boolean includeFailed) {
        classScopeService.requireStaffRole();
        GradingTaskEntity task = findTaskWithItems(gradingTaskId);
        classScopeService.requireCanAccessExam(task.getExam());
        if (task.getStatus() == GradingTaskStatus.PENDING) {
            applyAutoGrade(task, false);
        }
        if (!includeFailed && isFailed(task)) {
            throw new BusinessException(ErrorCode.CONFLICT, "不及格答卷需要教师单独复核，不能直接确认系统分");
        }
        confirmTaskWithSystemScore(task, OffsetDateTime.now());
        return mapper.toResponse(gradingTaskRepository.save(task), true);
    }

    @Transactional
    public BatchGradingTaskOperationResponse batchAutoGrade(BatchConfirmGradingTasksRequest request) {
        classScopeService.requireStaffRole();
        List<GradingTaskEntity> tasks = findVisibleBatchTasks(request);
        int processed = 0;
        int skippedReviewed = 0;
        for (GradingTaskEntity task : tasks) {
            if (task.getStatus() == GradingTaskStatus.REVIEWED) {
                skippedReviewed += 1;
                continue;
            }
            applyAutoGrade(task, false);
            gradingAiJobService.enqueueIfNeeded(task.getId());
            processed += 1;
        }
        gradingTaskRepository.saveAll(tasks);
        return new BatchGradingTaskOperationResponse(
            tasks.size(),
            processed,
            0,
            0,
            skippedReviewed,
            "已完成当前筛选答卷的系统自动判分"
        );
    }

    @Transactional
    public BatchGradingTaskOperationResponse batchConfirm(BatchConfirmGradingTasksRequest request) {
        classScopeService.requireStaffRole();
        List<GradingTaskEntity> tasks = findVisibleBatchTasks(request);
        boolean includeFailed = Boolean.TRUE.equals(request.includeFailed());
        boolean onlyAutoGraded = !Boolean.FALSE.equals(request.onlyAutoGraded());
        int processed = 0;
        int skippedFailed = 0;
        int skippedPending = 0;
        int skippedReviewed = 0;
        OffsetDateTime now = OffsetDateTime.now();
        for (GradingTaskEntity task : tasks) {
            if (task.getStatus() == GradingTaskStatus.REVIEWED) {
                skippedReviewed += 1;
                continue;
            }
            if (task.getStatus() == GradingTaskStatus.PENDING) {
                if (onlyAutoGraded) {
                    skippedPending += 1;
                    continue;
                }
                applyAutoGrade(task, false);
            }
            if (!includeFailed && isFailed(task)) {
                skippedFailed += 1;
                continue;
            }
            confirmTaskWithSystemScore(task, now);
            processed += 1;
        }
        gradingTaskRepository.saveAll(tasks);
        return new BatchGradingTaskOperationResponse(
            tasks.size(),
            processed,
            skippedFailed,
            skippedPending,
            skippedReviewed,
            includeFailed ? "已按系统默认分批量核对全部答卷" : "已批量核对通过，未自动确认不及格答卷"
        );
    }

    @Transactional
    public GradingTaskResponse reviewItem(String gradingTaskId, String questionId, ReviewGradingItemRequest request) {
        classScopeService.requireStaffRole();
        GradingTaskEntity task = findTaskWithItems(gradingTaskId);
        classScopeService.requireCanAccessExam(task.getExam());
        if (task.getStatus() == GradingTaskStatus.PENDING) {
            applyAutoGrade(task, false);
        }

        GradingItemEntity item = task.getItems().stream()
            .filter(candidate -> candidate.getQuestion().getId().equals(questionId) || candidate.getId().equals(questionId))
            .findFirst()
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Grading item not found"));
        validateItemScore(item, request.finalScore());

        OffsetDateTime now = OffsetDateTime.now();
        item.setFinalScore(request.finalScore());
        if (request.comment() != null && !request.comment().isBlank()) {
            item.setComment(request.comment());
        }
        if (request.comment() != null && !request.comment().isBlank()) {
            item.setTeacherOverrideReason(request.comment());
        }
        item.setGradingSource("TEACHER_REVIEW");
        item.setScoreDiff(request.finalScore().subtract(nullToZero(item.getAutoScore())));
        item.setCorrect(request.finalScore().compareTo(item.getMaxScore().multiply(new BigDecimal("0.60"))) >= 0);
        item.setNeedsReview(false);
        item.setUpdatedAt(now);
        recalculateTaskScoreFromItems(task, now);

        return mapper.toResponse(gradingTaskRepository.save(task), true);
    }

    @Transactional
    public GradingTaskResponse review(String gradingTaskId, ReviewGradingTaskRequest request) {
        classScopeService.requireStaffRole();
        GradingTaskEntity task = findTaskWithItems(gradingTaskId);
        classScopeService.requireCanAccessExam(task.getExam());
        validateFinalScore(task, request.finalScore());
        OffsetDateTime now = OffsetDateTime.now();

        if (task.getStatus() == GradingTaskStatus.PENDING) {
            applyAutoGrade(task, false);
        }

        BigDecimal objectiveScore = task.getObjectiveScore() == null ? BigDecimal.ZERO : task.getObjectiveScore();
        BigDecimal subjectiveScore = request.finalScore().subtract(objectiveScore);
        if (subjectiveScore.compareTo(BigDecimal.ZERO) < 0) {
            subjectiveScore = BigDecimal.ZERO;
        }

        task.setSubjectiveScore(subjectiveScore);
        task.setFinalScore(request.finalScore());
        task.setComment(request.comment());
        task.setStatus(GradingTaskStatus.REVIEWED);
        task.setReviewedAt(now);
        task.setUpdatedAt(now);

        AnswerSheetEntity answerSheet = task.getAnswerSheet();
        answerSheet.setStatus(AnswerSheetStatus.GRADED);
        answerSheet.setUpdatedAt(now);

        return mapper.toResponse(gradingTaskRepository.save(task), true);
    }

    private GradingTaskEntity createNewTask(String answerSheetId) {
        AnswerSheetEntity answerSheet = answerSheetRepository.findWithItemsById(answerSheetId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Answer sheet not found"));
        if (answerSheet.getStatus() != AnswerSheetStatus.SUBMITTED && answerSheet.getStatus() != AnswerSheetStatus.GRADING) {
            throw new BusinessException(ErrorCode.CONFLICT, "Only submitted answer sheets can create grading tasks");
        }

        PaperEntity paper = paperRepository.findWithQuestionsById(answerSheet.getExam().getPaper().getId())
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Paper not found"));
        OffsetDateTime now = OffsetDateTime.now();

        GradingTaskEntity task = new GradingTaskEntity();
        task.setId("GT-" + answerSheet.getId());
        task.setExam(answerSheet.getExam());
        task.setAnswerSheet(answerSheet);
        task.setStudentId(answerSheet.getStudentId());
        task.setStudentName(answerSheet.getStudentName());
        task.setStatus(GradingTaskStatus.PENDING);
        task.setObjectiveScore(BigDecimal.ZERO);
        task.setSubjectiveScore(BigDecimal.ZERO);
        task.setCreatedAt(now);
        task.setUpdatedAt(now);

        for (PaperQuestionEntity paperQuestion : distinctPaperQuestions(paper)) {
            GradingItemEntity item = new GradingItemEntity();
            item.setId("GI-" + java.util.UUID.randomUUID());
            item.setGradingTask(task);
            item.setQuestion(paperQuestion.getQuestion());
            item.setQuestionType(paperQuestion.getQuestion().getType());
            item.setMaxScore(paperQuestion.getScore());
            item.setObjective(objectiveGradingPolicy.isObjective(paperQuestion.getQuestion().getType()));
            item.setCreatedAt(now);
            item.setUpdatedAt(now);
            task.getItems().add(item);
        }

        answerSheet.setStatus(AnswerSheetStatus.GRADING);
        answerSheet.setUpdatedAt(now);
        return gradingTaskRepository.save(task);
    }

    private void promoteExamToGradingIfReady(ExamEntity exam, OffsetDateTime now) {
        if (exam.getStatus() == ExamStatus.SCORES_PUBLISHED || exam.getStatus() == ExamStatus.GRADING) {
            return;
        }
        long draftAnswerSheetCount = answerSheetRepository.countByExamIdAndStatus(exam.getId(), AnswerSheetStatus.DRAFT);
        if (!now.isBefore(exam.getEndAt()) || draftAnswerSheetCount == 0) {
            exam.setStatus(ExamStatus.GRADING);
            exam.setUpdatedAt(now);
        }
    }

    private List<PaperQuestionEntity> distinctPaperQuestions(PaperEntity paper) {
        return paper.getQuestions().stream()
            .collect(
                LinkedHashMap<String, PaperQuestionEntity>::new,
                (map, item) -> map.putIfAbsent(item.getId(), item),
                LinkedHashMap::putAll
            )
            .values()
            .stream()
            .toList();
    }

    private void applyAutoGrade(GradingTaskEntity task, boolean allowProvider) {
        OffsetDateTime now = OffsetDateTime.now();
        Map<String, AnswerItemEntity> answers = task.getAnswerSheet().getItems().stream()
            .collect(
                LinkedHashMap::new,
                (map, item) -> map.put(item.getQuestionId(), item),
                LinkedHashMap::putAll
            );

        BigDecimal objectiveScore = BigDecimal.ZERO;
        BigDecimal subjectiveScore = BigDecimal.ZERO;
        BigDecimal totalScore = BigDecimal.ZERO;
        for (GradingItemEntity item : task.getItems()) {
            AnswerItemEntity answer = answers.get(item.getQuestion().getId());
            if (Boolean.TRUE.equals(item.getObjective())) {
                ObjectiveGradingPolicy.ObjectiveGradingResult result = objectiveGradingPolicy.grade(
                    item.getQuestion(),
                    answer == null ? null : answer.getAnswerJson(),
                    item.getMaxScore(),
                    answerSheetOptionOrderService.readMapping(
                        task.getAnswerSheet(),
                        item.getQuestion().getId()
                    )
                );
                item.setAutoScore(result.score());
                item.setFinalScore(result.score());
                item.setCorrect(result.correct());
                item.setAiConfidence(new BigDecimal("1.00"));
                item.setNeedsReview(false);
                item.setComment(Boolean.TRUE.equals(result.correct()) ? "客观题自动判分：答案正确。" : "客观题自动判分：答案错误。");
                item.setGradingSource("AUTO_RULE");
                item.setAiProvider(null);
                item.setAiModel(null);
                item.setAiRubricVersion(SubjectiveGradingPolicy.OBJECTIVE_RUBRIC_VERSION);
                item.setAiRawScore(result.score());
                item.setScoreDiff(BigDecimal.ZERO);
                objectiveScore = objectiveScore.add(nullToZero(result.score()));
            } else {
                SubjectiveGradingPolicy.SubjectiveGradingResult result = allowProvider
                    ? subjectiveGradingPolicy.grade(
                        item.getQuestion(),
                        answer == null ? null : answer.getAnswerJson(),
                        item.getMaxScore(),
                        task.getExam().getCreatedBy()
                    )
                    : subjectiveGradingPolicy.gradeBaseline(
                        item.getQuestion(),
                        answer == null ? null : answer.getAnswerJson(),
                        item.getMaxScore()
                    );
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
                subjectiveScore = subjectiveScore.add(nullToZero(result.score()));
            }
            item.setUpdatedAt(now);
            totalScore = totalScore.add(nullToZero(item.getFinalScore()));
        }

        task.setObjectiveScore(objectiveScore);
        task.setSubjectiveScore(subjectiveScore);
        task.setAiScore(totalScore);
        task.setFinalScore(totalScore);
        task.setStatus(GradingTaskStatus.AI_CHECKED);
        task.setUpdatedAt(now);
    }

    private void recalculateTaskScoreFromItems(GradingTaskEntity task, OffsetDateTime now) {
        BigDecimal objectiveScore = BigDecimal.ZERO;
        BigDecimal subjectiveScore = BigDecimal.ZERO;
        BigDecimal finalScore = BigDecimal.ZERO;
        boolean allItemsReviewed = true;

        for (GradingItemEntity item : task.getItems()) {
            BigDecimal itemScore = item.getFinalScore();
            if (itemScore == null) {
                allItemsReviewed = false;
                continue;
            }
            finalScore = finalScore.add(itemScore);
            if (Boolean.TRUE.equals(item.getObjective())) {
                objectiveScore = objectiveScore.add(itemScore);
            } else {
                subjectiveScore = subjectiveScore.add(itemScore);
            }
        }

        task.setObjectiveScore(objectiveScore);
        task.setSubjectiveScore(subjectiveScore);
        task.setAiScore(objectiveScore.add(subjectiveScore));
        task.setFinalScore(allItemsReviewed ? finalScore : null);
        task.setStatus(allItemsReviewed ? GradingTaskStatus.REVIEWED : GradingTaskStatus.AI_CHECKED);
        task.setReviewedAt(allItemsReviewed ? now : task.getReviewedAt());
        task.setUpdatedAt(now);

        if (allItemsReviewed) {
            AnswerSheetEntity answerSheet = task.getAnswerSheet();
            answerSheet.setStatus(AnswerSheetStatus.GRADED);
            answerSheet.setUpdatedAt(now);
        }
    }

    private List<GradingTaskEntity> findVisibleBatchTasks(BatchConfirmGradingTasksRequest request) {
        boolean admin = currentUserIsAdmin();
        Set<String> visibleClassIds = visibleClassIdsForQuery(admin);
        if (!admin && visibleClassIds.isEmpty()) {
            return List.of();
        }
        return gradingTaskRepository.findVisibleTasksWithItems(
            normalizeExamId(request.examId()),
            normalizeCourseName(request.courseName()),
            normalizeScoreBand(request.scoreBand()),
            admin,
            visibleClassIds
        );
    }

    private void confirmTaskWithSystemScore(GradingTaskEntity task, OffsetDateTime now) {
        if (task.getFinalScore() == null) {
            task.setFinalScore(nullToZero(task.getAiScore()));
        }
        task.setStatus(GradingTaskStatus.REVIEWED);
        task.setReviewedAt(now);
        task.setUpdatedAt(now);
        task.setComment(task.getComment() == null || task.getComment().isBlank() ? "教师已核对系统默认分。" : task.getComment());

        AnswerSheetEntity answerSheet = task.getAnswerSheet();
        answerSheet.setStatus(AnswerSheetStatus.GRADED);
        answerSheet.setUpdatedAt(now);
    }

    private boolean isFailed(GradingTaskEntity task) {
        BigDecimal score = task.getFinalScore() == null ? task.getAiScore() : task.getFinalScore();
        if (score == null) {
            return false;
        }
        return score.compareTo(passScore(task)) < 0;
    }

    private BigDecimal passScore(GradingTaskEntity task) {
        BigDecimal totalScore = task.getExam().getTotalScore() == null ? BigDecimal.ZERO : task.getExam().getTotalScore();
        return totalScore.multiply(new BigDecimal("0.60")).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal nullToZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private GradingTaskEntity findTaskForScopeCheck(String gradingTaskId) {
        return gradingTaskRepository.findWithScopeById(gradingTaskId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Grading task not found"));
    }

    private PageRequest toPageRequest(Integer page, Integer pageSize) {
        return PageRequest.of(PageResponse.normalizePage(page) - 1, PageResponse.normalizePageSize(pageSize));
    }

    private boolean currentUserIsAdmin() {
        AuthUserEntity user = classScopeService.currentUser();
        return user.getRoles().contains(RoleCode.ADMIN);
    }

    private Set<String> visibleClassIdsForQuery(boolean admin) {
        return admin ? Set.of("__ALL_CLASSES__") : classScopeService.visibleClassIds();
    }

    private String normalizeScoreBand(String scoreBand) {
        if (scoreBand == null || scoreBand.isBlank()) {
            return null;
        }
        String normalized = scoreBand.trim().toUpperCase();
        if (!Set.of("FAILED", "S60_69", "S70_79", "S80_89", "S90_100").contains(normalized)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Unsupported score band");
        }
        return normalized;
    }

    private boolean matchesScoreBand(GradingTaskEntity task, String scoreBand) {
        BigDecimal score = task.getFinalScore() == null ? task.getAiScore() : task.getFinalScore();
        if (score == null) {
            score = task.getObjectiveScore();
        }
        BigDecimal totalScore = task.getExam().getTotalScore();
        if (score == null || totalScore == null || totalScore.compareTo(BigDecimal.ZERO) <= 0) {
            return false;
        }
        BigDecimal percent = score.multiply(BigDecimal.valueOf(100)).divide(totalScore, 4, RoundingMode.HALF_UP);
        return switch (scoreBand) {
            case "FAILED" -> percent.compareTo(BigDecimal.valueOf(60)) < 0;
            case "S60_69" -> percent.compareTo(BigDecimal.valueOf(60)) >= 0 && percent.compareTo(BigDecimal.valueOf(70)) < 0;
            case "S70_79" -> percent.compareTo(BigDecimal.valueOf(70)) >= 0 && percent.compareTo(BigDecimal.valueOf(80)) < 0;
            case "S80_89" -> percent.compareTo(BigDecimal.valueOf(80)) >= 0 && percent.compareTo(BigDecimal.valueOf(90)) < 0;
            case "S90_100" -> percent.compareTo(BigDecimal.valueOf(90)) >= 0;
            default -> false;
        };
    }

    private String normalizeExamId(String examId) {
        return examId == null || examId.isBlank() ? null : examId;
    }

    private String normalizeCourseName(String courseName) {
        return courseName == null || courseName.isBlank() ? null : courseName.trim().toLowerCase();
    }

    private GradingTaskEntity findTaskWithItems(String gradingTaskId) {
        return gradingTaskRepository.findWithItemsById(gradingTaskId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Grading task not found"));
    }

    private void validateFinalScore(GradingTaskEntity task, BigDecimal finalScore) {
        BigDecimal totalScore = task.getExam().getTotalScore();
        if (finalScore.compareTo(totalScore) > 0) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Final score cannot exceed exam total score");
        }
    }

    private void validateItemScore(GradingItemEntity item, BigDecimal finalScore) {
        if (finalScore.compareTo(item.getMaxScore()) > 0) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Item final score cannot exceed item max score");
        }
    }
}
