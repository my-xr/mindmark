package com.mindmark.server.modules.review.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.api.PageResponse;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.ai.provider.LectureDraftGenerationResult;
import com.mindmark.server.modules.ai.provider.LectureDraftProvider;
import com.mindmark.server.modules.ai.provider.LocalTemplateLectureDraftProvider;
import com.mindmark.server.modules.auth.domain.AuthUserEntity;
import com.mindmark.server.modules.auth.domain.RoleCode;
import com.mindmark.server.modules.auth.service.ClassScopeService;
import com.mindmark.server.modules.exam.domain.ExamEntity;
import com.mindmark.server.modules.exam.repository.ExamRepository;
import com.mindmark.server.modules.grading.domain.GradingItemEntity;
import com.mindmark.server.modules.grading.domain.GradingTaskEntity;
import com.mindmark.server.modules.grading.domain.GradingTaskStatus;
import com.mindmark.server.modules.grading.repository.GradingTaskRepository;
import com.mindmark.server.modules.question.domain.QuestionEntity;
import com.mindmark.server.modules.review.domain.LectureDraftEntity;
import com.mindmark.server.modules.review.domain.LectureDraftStatus;
import com.mindmark.server.modules.review.dto.AiLectureDraftResponse;
import com.mindmark.server.modules.review.dto.ApproveLectureDraftRequest;
import com.mindmark.server.modules.review.dto.CreateReviewArtifactRequest;
import com.mindmark.server.modules.review.dto.ExamReviewReportResponse;
import com.mindmark.server.modules.review.dto.KnowledgeWeaknessResponse;
import com.mindmark.server.modules.review.dto.QuestionPerformanceResponse;
import com.mindmark.server.modules.review.dto.ReviewArtifactResponse;
import com.mindmark.server.modules.review.dto.ScoreBandResponse;
import com.mindmark.server.modules.review.dto.StudentLayerInsightResponse;
import com.mindmark.server.modules.review.repository.LectureDraftRepository;
import com.mindmark.server.modules.storage.domain.ReviewArtifactEntity;
import com.mindmark.server.modules.storage.domain.ReviewArtifactType;
import com.mindmark.server.modules.storage.repository.ReviewArtifactRepository;
import com.mindmark.server.modules.storage.service.ReviewArtifactStorageService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Set;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewService {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {};

    private final ExamRepository examRepository;
    private final GradingTaskRepository gradingTaskRepository;
    private final LectureDraftRepository lectureDraftRepository;
    private final ReviewArtifactRepository reviewArtifactRepository;
    private final ReviewArtifactStorageService storageService;
    private final ObjectMapper objectMapper;
    private final ClassScopeService classScopeService;
    private final List<LectureDraftProvider> lectureDraftProviders;

    public ReviewService(
        ExamRepository examRepository,
        GradingTaskRepository gradingTaskRepository,
        LectureDraftRepository lectureDraftRepository,
        ReviewArtifactRepository reviewArtifactRepository,
        ReviewArtifactStorageService storageService,
        ObjectMapper objectMapper,
        ClassScopeService classScopeService,
        List<LectureDraftProvider> lectureDraftProviders
    ) {
        this.examRepository = examRepository;
        this.gradingTaskRepository = gradingTaskRepository;
        this.lectureDraftRepository = lectureDraftRepository;
        this.reviewArtifactRepository = reviewArtifactRepository;
        this.storageService = storageService;
        this.objectMapper = objectMapper;
        this.classScopeService = classScopeService;
        this.lectureDraftProviders = lectureDraftProviders;
    }

    @Transactional
    public PageResponse<ExamReviewReportResponse> listReports(Integer page, Integer pageSize) {
        classScopeService.requireStaffRole();
        AuthUserEntity currentUser = classScopeService.currentUser();
        boolean admin = currentUser.getRoles().contains(RoleCode.ADMIN);
        Set<String> visibleClassIds = classScopeService.visibleClassIds();
        if (!admin && visibleClassIds.isEmpty()) {
            return PageResponse.empty(page, pageSize);
        }

        PageRequest pageRequest = PageRequest.of(
            PageResponse.normalizePage(page) - 1,
            PageResponse.normalizePageSize(pageSize),
            Sort.by(Sort.Direction.DESC, "updatedAt")
        );
        var examPage = examRepository.pageVisibleExamsWithGradingTasks(
            admin,
            admin ? List.of("__ADMIN_SCOPE__") : visibleClassIds,
            pageRequest
        );
        return PageResponse.fromPage(examPage.map(this::buildReportWithExistingDraft));
    }

    @Transactional
    public ExamReviewReportResponse getReport(String examId) {
        classScopeService.requireStaffRole();
        ExamEntity exam = findExam(examId);
        classScopeService.requireCanAccessExam(exam);
        return buildReport(exam);
    }

    @Transactional
    public AiLectureDraftResponse regenerateLectureDraft(String examId) {
        classScopeService.requireStaffRole();
        ExamEntity exam = findExam(examId);
        classScopeService.requireCanAccessExam(exam);
        AuthUserEntity user = classScopeService.currentUser();
        ExamReviewReportResponse report = buildReportWithoutEnsuringDraft(exam);
        LectureDraftEntity draft = createDraft(exam, report, LectureDraftStatus.REVIEWING, user.getId());
        return toDraftResponse(lectureDraftRepository.save(draft));
    }

    @Transactional
    public AiLectureDraftResponse generateLectureDraftForTask(String examId, String requestedBy) {
        ExamEntity exam = findExam(examId);
        ExamReviewReportResponse report = buildReportWithoutEnsuringDraft(exam);
        LectureDraftEntity draft = createDraft(exam, report, LectureDraftStatus.REVIEWING, requestedBy);
        return toDraftResponse(lectureDraftRepository.save(draft));
    }

    @Transactional(readOnly = true)
    public AiLectureDraftResponse getLectureDraft(String draftId) {
        return lectureDraftRepository.findById(draftId)
            .map(this::toDraftResponse)
            .orElse(null);
    }

    @Transactional
    public AiLectureDraftResponse approveLectureDraft(String examId, ApproveLectureDraftRequest request) {
        classScopeService.requireStaffRole();
        ExamEntity exam = findExam(examId);
        classScopeService.requireCanAccessExam(exam);
        ExamReviewReportResponse report = buildReportWithoutEnsuringDraft(exam);
        LectureDraftEntity draft = lectureDraftRepository.findFirstByExamIdOrderByUpdatedAtDesc(examId)
            .orElseGet(() -> lectureDraftRepository.save(createDraft(exam, report, LectureDraftStatus.REVIEWING, classScopeService.currentUser().getId())));
        OffsetDateTime now = OffsetDateTime.now();
        draft.setStatus(LectureDraftStatus.APPROVED);
        draft.setApprovedAt(now);
        draft.setUpdatedAt(now);
        if (request != null && request.teacherEditedContent() != null && !request.teacherEditedContent().isBlank()) {
            draft.setTeacherEditedContent(request.teacherEditedContent());
        }
        return toDraftResponse(lectureDraftRepository.save(draft));
    }

    @Transactional
    public ReviewArtifactResponse createArtifact(String examId, CreateReviewArtifactRequest request) {
        classScopeService.requireStaffRole();
        if (request == null || request.artifactType() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "artifactType is required");
        }
        ExamEntity exam = findExam(examId);
        classScopeService.requireCanAccessExam(exam);
        ExamReviewReportResponse report = buildReport(exam);
        ArtifactPayload payload = buildArtifactPayload(report, request.artifactType());
        String objectKey = "reviews/%s/%s-%s".formatted(examId, UUID.randomUUID(), payload.fileName());
        ReviewArtifactStorageService.StoredObject stored = storageService.putText(objectKey, payload.contentType(), payload.content());

        AuthUserEntity user = classScopeService.currentUser();
        OffsetDateTime now = OffsetDateTime.now();
        ReviewArtifactEntity artifact = new ReviewArtifactEntity();
        artifact.setId("artifact-" + UUID.randomUUID());
        artifact.setExam(exam);
        artifact.setArtifactType(request.artifactType());
        artifact.setFileName(payload.fileName());
        artifact.setObjectKey(stored.objectKey());
        artifact.setContentType(payload.contentType());
        artifact.setSizeBytes(stored.sizeBytes());
        artifact.setChecksumSha256(stored.checksumSha256());
        artifact.setCreatedBy(user.getId());
        artifact.setCreatedAt(now);
        ReviewArtifactEntity saved = reviewArtifactRepository.save(artifact);

        if (request.artifactType() == ReviewArtifactType.LECTURE_DRAFT_MARKDOWN && report.lectureDraft() != null) {
            lectureDraftRepository.findFirstByExamIdOrderByUpdatedAtDesc(examId).ifPresent(draft -> {
                draft.setArtifactId(saved.getId());
                draft.setUpdatedAt(now);
                lectureDraftRepository.save(draft);
            });
        }

        return toArtifactResponse(saved, true);
    }

    @Transactional(readOnly = true)
    public ReviewArtifactResponse getArtifactDownload(String artifactId) {
        classScopeService.requireStaffRole();
        ReviewArtifactEntity artifact = reviewArtifactRepository.findWithExamById(artifactId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Review artifact not found"));
        classScopeService.requireCanAccessExam(artifact.getExam());
        return toArtifactResponse(artifact, true);
    }

    @Transactional(readOnly = true)
    public ReviewArtifactFile downloadArtifactFile(String artifactId) {
        classScopeService.requireStaffRole();
        ReviewArtifactEntity artifact = reviewArtifactRepository.findWithExamById(artifactId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Review artifact not found"));
        classScopeService.requireCanAccessExam(artifact.getExam());
        byte[] bytes = storageService.getBytes(artifact.getObjectKey());
        return new ReviewArtifactFile(artifact.getFileName(), artifact.getContentType(), artifact.getSizeBytes(), bytes);
    }

    private ExamEntity findExam(String examId) {
        return examRepository.findWithDetailsById(examId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Exam not found"));
    }


    private ExamReviewReportResponse buildReportWithExistingDraft(ExamEntity exam) {
        ExamReviewReportResponse base = buildReportWithoutEnsuringDraft(exam);
        AiLectureDraftResponse draft = lectureDraftRepository.findFirstByExamIdOrderByUpdatedAtDesc(exam.getId())
            .map(this::toDraftResponse)
            .orElse(null);
        return copyWithDraft(base, draft);
    }
    private ExamReviewReportResponse buildReport(ExamEntity exam) {
        ExamReviewReportResponse base = buildReportWithoutEnsuringDraft(exam);
        AiLectureDraftResponse draft = lectureDraftRepository.findFirstByExamIdOrderByUpdatedAtDesc(exam.getId())
            .map(this::toDraftResponse)
            .orElseGet(() -> toDraftResponse(lectureDraftRepository.save(createDraft(exam, base, LectureDraftStatus.DRAFT, classScopeService.currentUser().getId()))));
        return copyWithDraft(base, draft);
    }

    private ExamReviewReportResponse buildReportWithoutEnsuringDraft(ExamEntity exam) {
        List<GradingTaskEntity> tasks = gradingTaskRepository.findByExamIdOrderByUpdatedAtDesc(exam.getId());
        List<GradingTaskEntity> reviewedTasks = tasks.stream()
            .filter(task -> task.getStatus() == GradingTaskStatus.REVIEWED && task.getFinalScore() != null)
            .toList();
        BigDecimal averageScore = average(reviewedTasks.stream().map(GradingTaskEntity::getFinalScore).toList());
        BigDecimal passRate = reviewedTasks.isEmpty()
            ? BigDecimal.ZERO
            : percent(BigDecimal.valueOf(reviewedTasks.stream()
                .filter(task -> rate(task.getFinalScore(), exam.getTotalScore()).compareTo(BigDecimal.valueOf(60)) >= 0)
                .count()), BigDecimal.valueOf(reviewedTasks.size()));

        return new ExamReviewReportResponse(
            exam.getId(),
            exam.getTitle(),
            exam.getPaper().getCourseName(),
            exam.getTotalScore(),
            averageScore,
            passRate,
            tasks.size(),
            reviewedTasks.size(),
            buildScoreBands(reviewedTasks, exam.getTotalScore()),
            buildQuestionPerformances(reviewedTasks),
            buildKnowledgeWeaknesses(reviewedTasks),
            buildStudentLayerInsights(reviewedTasks, exam.getTotalScore()),
            null,
            reviewArtifactRepository.findByExamIdOrderByCreatedAtDesc(exam.getId()).stream()
                .map(artifact -> toArtifactResponse(artifact, false))
                .toList()
        );
    }

    private ExamReviewReportResponse copyWithDraft(ExamReviewReportResponse report, AiLectureDraftResponse draft) {
        return new ExamReviewReportResponse(
            report.examId(),
            report.examTitle(),
            report.courseName(),
            report.totalScore(),
            report.averageScore(),
            report.passRate(),
            report.submittedCount(),
            report.reviewedCount(),
            report.scoreBands(),
            report.questionPerformances(),
            report.knowledgeWeaknesses(),
            report.studentLayerInsights(),
            draft,
            report.artifacts()
        );
    }

    private List<ScoreBandResponse> buildScoreBands(List<GradingTaskEntity> tasks, BigDecimal totalScore) {
        return List.of(
            scoreBand("0-59%", tasks, totalScore, BigDecimal.ZERO, BigDecimal.valueOf(60), false),
            scoreBand("60-74%", tasks, totalScore, BigDecimal.valueOf(60), BigDecimal.valueOf(75), false),
            scoreBand("75-89%", tasks, totalScore, BigDecimal.valueOf(75), BigDecimal.valueOf(90), false),
            scoreBand("90-100%", tasks, totalScore, BigDecimal.valueOf(90), BigDecimal.valueOf(101), true)
        );
    }

    private ScoreBandResponse scoreBand(String label, List<GradingTaskEntity> tasks, BigDecimal totalScore, BigDecimal min, BigDecimal max, boolean includeMax) {
        int count = (int) tasks.stream()
            .map(task -> rate(task.getFinalScore(), totalScore))
            .filter(scoreRate -> scoreRate.compareTo(min) >= 0 && (includeMax ? scoreRate.compareTo(max) <= 0 : scoreRate.compareTo(max) < 0))
            .count();
        BigDecimal ratio = tasks.isEmpty() ? BigDecimal.ZERO : percent(BigDecimal.valueOf(count), BigDecimal.valueOf(tasks.size()));
        return new ScoreBandResponse(label, count, ratio);
    }

    private List<QuestionPerformanceResponse> buildQuestionPerformances(List<GradingTaskEntity> tasks) {
        Map<String, QuestionAggregate> bucket = new LinkedHashMap<>();
        int[] order = {1};
        for (GradingTaskEntity task : tasks) {
            for (GradingItemEntity item : task.getItems()) {
                QuestionEntity question = item.getQuestion();
                QuestionAggregate aggregate = bucket.computeIfAbsent(question.getId(), key -> new QuestionAggregate(order[0]++, question.getTitle(), item.getMaxScore()));
                aggregate.score = aggregate.score.add(score(item));
                aggregate.count++;
                aggregate.riskCount += rate(score(item), item.getMaxScore()).compareTo(BigDecimal.valueOf(60)) < 0 ? 1 : 0;
            }
        }
        return bucket.entrySet().stream()
            .map(entry -> {
                QuestionAggregate value = entry.getValue();
                BigDecimal averageScore = value.count == 0 ? BigDecimal.ZERO : scale(value.score.divide(BigDecimal.valueOf(value.count), 4, RoundingMode.HALF_UP));
                BigDecimal scoreRate = rate(averageScore, value.maxScore);
                List<String> weaknessTags = new ArrayList<>();
                if (scoreRate.compareTo(BigDecimal.valueOf(60)) < 0) {
                    weaknessTags.add("得分率偏低");
                } else if (scoreRate.compareTo(BigDecimal.valueOf(80)) < 0) {
                    weaknessTags.add("步骤或表达需巩固");
                }
                if (value.riskCount > 0) {
                    weaknessTags.add("低分答卷 " + value.riskCount + " 份");
                }
                return new QuestionPerformanceResponse(entry.getKey(), value.order, value.title, value.maxScore, averageScore, scoreRate, weaknessTags);
            })
            .sorted(Comparator.comparing(QuestionPerformanceResponse::order))
            .toList();
    }

    private List<KnowledgeWeaknessResponse> buildKnowledgeWeaknesses(List<GradingTaskEntity> tasks) {
        Map<String, KnowledgeAggregate> bucket = new LinkedHashMap<>();
        for (GradingTaskEntity task : tasks) {
            for (GradingItemEntity item : task.getItems()) {
                List<String> points = item.getQuestion().getKnowledgePoints().isEmpty()
                    ? List.of("综合能力")
                    : item.getQuestion().getKnowledgePoints();
                for (String point : points) {
                    KnowledgeAggregate aggregate = bucket.computeIfAbsent(point, key -> new KnowledgeAggregate());
                    aggregate.score = aggregate.score.add(score(item));
                    aggregate.total = aggregate.total.add(item.getMaxScore());
                }
            }
        }
        return bucket.entrySet().stream()
            .map(entry -> {
                BigDecimal scoreRate = rate(entry.getValue().score, entry.getValue().total);
                String level = scoreRate.compareTo(BigDecimal.valueOf(80)) >= 0 ? "GOOD" : scoreRate.compareTo(BigDecimal.valueOf(60)) >= 0 ? "WARNING" : "RISK";
                return new KnowledgeWeaknessResponse(entry.getKey(), scoreRate, level, suggestion(entry.getKey(), scoreRate));
            })
            .sorted(Comparator.comparing(KnowledgeWeaknessResponse::scoreRate))
            .toList();
    }

    private List<StudentLayerInsightResponse> buildStudentLayerInsights(List<GradingTaskEntity> tasks, BigDecimal totalScore) {
        int excellent = 0;
        int stable = 0;
        int consolidating = 0;
        int risk = 0;
        for (GradingTaskEntity task : tasks) {
            BigDecimal scoreRate = rate(task.getFinalScore(), totalScore);
            if (scoreRate.compareTo(BigDecimal.valueOf(90)) >= 0) {
                excellent++;
            } else if (scoreRate.compareTo(BigDecimal.valueOf(75)) >= 0) {
                stable++;
            } else if (scoreRate.compareTo(BigDecimal.valueOf(60)) >= 0) {
                consolidating++;
            } else {
                risk++;
            }
        }
        return List.of(
            new StudentLayerInsightResponse("优秀层", excellent, "安排拓展题和讲题任务，促进高阶迁移。"),
            new StudentLayerInsightResponse("稳定层", stable, "用易错题复盘和限时练习巩固稳定得分。"),
            new StudentLayerInsightResponse("巩固层", consolidating, "围绕关键步骤和表达规范进行二次订正。"),
            new StudentLayerInsightResponse("风险层", risk, "优先补齐基础概念，安排教师或助教跟进。")
        );
    }

    private LectureDraftEntity createDraft(ExamEntity exam, ExamReviewReportResponse report, LectureDraftStatus status, String createdBy) {
        OffsetDateTime now = OffsetDateTime.now();
        LectureDraftGenerationResult generation = generateLectureDraft(report);
        LectureDraftEntity draft = new LectureDraftEntity();
        draft.setId("draft-" + UUID.randomUUID());
        draft.setExam(exam);
        draft.setStatus(status);
        draft.setProvider(generation.provider());
        draft.setConfidence(generation.confidence());
        draft.setRiskLabelsJson(writeStringList(generation.riskLabels()));
        draft.setOutlineJson(writeStringList(generation.outline()));
        draft.setContent(generation.content());
        draft.setPromptSnapshot(generation.promptSnapshot());
        draft.setGeneratedAt(now);
        draft.setCreatedBy(createdBy);
        draft.setUpdatedAt(now);
        return draft;
    }

    private LectureDraftGenerationResult generateLectureDraft(ExamReviewReportResponse report) {
        LectureDraftProvider localProvider = lectureDraftProviders.stream()
            .filter(provider -> LocalTemplateLectureDraftProvider.CODE.equals(provider.providerCode()))
            .findFirst()
            .orElseThrow(() -> new BusinessException(ErrorCode.INTERNAL_ERROR, "Local lecture draft provider is not configured"));
        LectureDraftProvider preferredProvider = lectureDraftProviders.stream()
            .filter(provider -> !LocalTemplateLectureDraftProvider.CODE.equals(provider.providerCode()))
            .filter(LectureDraftProvider::available)
            .findFirst()
            .orElse(localProvider);
        try {
            return preferredProvider.generate(report);
        } catch (RuntimeException exception) {
            LectureDraftGenerationResult fallback = localProvider.generate(report);
            if (preferredProvider == localProvider) {
                return fallback;
            }
            return fallback.withProvider(preferredProvider.providerCode() + "_FALLBACK_LOCAL");
        }
    }

    private ArtifactPayload buildArtifactPayload(ExamReviewReportResponse report, ReviewArtifactType artifactType) {
        String baseName = sanitizeFileName(report.examTitle());
        return switch (artifactType) {
            case REVIEW_REPORT_MARKDOWN -> new ArtifactPayload(baseName + "-复盘报告.md", "text/markdown; charset=utf-8", buildReportMarkdown(report));
            case LECTURE_DRAFT_MARKDOWN -> new ArtifactPayload(baseName + "-AI讲评稿.md", "text/markdown; charset=utf-8", report.lectureDraft().teacherEditedContent() == null ? report.lectureDraft().content() : report.lectureDraft().teacherEditedContent());
            case SCORE_SUMMARY_CSV -> new ArtifactPayload(baseName + "-成绩汇总.csv", "text/csv; charset=utf-8", buildScoreCsv(report));
        };
    }

    private String buildReportMarkdown(ExamReviewReportResponse report) {
        StringBuilder builder = new StringBuilder();
        builder.append("# ").append(report.examTitle()).append(" 复盘分析报告\n\n");
        builder.append("- 课程：").append(report.courseName()).append("\n");
        builder.append("- 满分：").append(report.totalScore()).append("\n");
        builder.append("- 平均分：").append(report.averageScore()).append("\n");
        builder.append("- 及格率：").append(report.passRate()).append("%\n");
        builder.append("- 已批改/已提交：").append(report.reviewedCount()).append("/").append(report.submittedCount()).append("\n\n");
        builder.append("## 分数段\n| 分数段 | 人数 | 占比 |\n| --- | ---: | ---: |\n");
        report.scoreBands().forEach(item -> builder.append("| ").append(item.label()).append(" | ").append(item.count()).append(" | ").append(item.ratio()).append("% |\n"));
        builder.append("\n## 知识薄弱点\n");
        report.knowledgeWeaknesses().forEach(item -> builder.append("- ").append(item.knowledgePoint()).append("：得分率 ").append(item.scoreRate()).append("%，").append(item.suggestion()).append("\n"));
        builder.append("\n## 题目表现\n");
        report.questionPerformances().forEach(item -> builder.append("- 第 ").append(item.order()).append(" 题：").append(item.title()).append("：平均得分 ").append(item.averageScore()).append("/").append(item.maxScore()).append("，得分率 ").append(item.scoreRate()).append("%\n"));
        builder.append("\n## 学生分层建议\n");
        report.studentLayerInsights().forEach(item -> builder.append("- ").append(item.layer()).append("：").append(item.count()).append(" 人；").append(item.suggestion()).append("\n"));
        return builder.toString();
    }

    private String buildScoreCsv(ExamReviewReportResponse report) {
        StringBuilder builder = new StringBuilder("type,label,count,ratio\n");
        report.scoreBands().forEach(item -> builder.append("score_band,").append(csv(item.label())).append(',').append(item.count()).append(',').append(item.ratio()).append('\n'));
        report.studentLayerInsights().forEach(item -> builder.append("student_layer,").append(csv(item.layer())).append(',').append(item.count()).append(",\n"));
        return builder.toString();
    }

    private String csv(String value) {
        String safeValue = value == null ? "" : value;
        return '"' + safeValue.replace("\"", "\"\"") + '"';
    }

    private String sanitizeFileName(String value) {
        return value.replaceAll("[\\\\/:*?\"<>|]", "_");
    }

    private ReviewArtifactResponse toArtifactResponse(ReviewArtifactEntity artifact, boolean includeDownloadUrl) {
        String downloadUrl = includeDownloadUrl ? "/api/v1/review-artifacts/" + artifact.getId() + "/file" : null;
        return new ReviewArtifactResponse(
            artifact.getId(),
            artifact.getExam().getId(),
            artifact.getArtifactType(),
            artifact.getFileName(),
            artifact.getObjectKey(),
            artifact.getContentType(),
            artifact.getSizeBytes(),
            artifact.getChecksumSha256(),
            artifact.getCreatedAt(),
            downloadUrl
        );
    }

    private AiLectureDraftResponse toDraftResponse(LectureDraftEntity draft) {
        return new AiLectureDraftResponse(
            draft.getId(),
            draft.getExam().getId(),
            draft.getExam().getTitle() + " AI讲评稿",
            draft.getStatus(),
            draft.getGeneratedAt(),
            draft.getProvider(),
            draft.getConfidence(),
            readStringList(draft.getRiskLabelsJson()),
            readStringList(draft.getOutlineJson()),
            draft.getContent(),
            draft.getTeacherEditedContent(),
            draft.getApprovedAt(),
            draft.getArtifactId()
        );
    }

    private String writeStringList(List<String> values) {
        try {
            return objectMapper.writeValueAsString(values == null ? List.of() : values);
        } catch (JsonProcessingException exception) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Cannot serialize lecture draft metadata");
        }
    }

    private List<String> readStringList(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, STRING_LIST_TYPE);
        } catch (JsonProcessingException exception) {
            return List.of();
        }
    }

    private BigDecimal score(GradingItemEntity item) {
        return item.getFinalScore() == null ? BigDecimal.ZERO : item.getFinalScore();
    }

    private BigDecimal average(List<BigDecimal> values) {
        if (values.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return scale(values.stream().reduce(BigDecimal.ZERO, BigDecimal::add).divide(BigDecimal.valueOf(values.size()), 4, RoundingMode.HALF_UP));
    }

    private BigDecimal rate(BigDecimal score, BigDecimal total) {
        if (score == null || total == null || total.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return scale(score.multiply(HUNDRED).divide(total, 4, RoundingMode.HALF_UP));
    }

    private BigDecimal percent(BigDecimal numerator, BigDecimal denominator) {
        if (denominator == null || denominator.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return scale(numerator.multiply(HUNDRED).divide(denominator, 4, RoundingMode.HALF_UP));
    }

    private BigDecimal scale(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private String suggestion(String knowledgePoint, BigDecimal scoreRate) {
        if (scoreRate.compareTo(BigDecimal.valueOf(80)) >= 0) {
            return knowledgePoint + "掌握较好，可安排迁移应用与高阶题巩固。";
        }
        if (scoreRate.compareTo(BigDecimal.valueOf(60)) >= 0) {
            return knowledgePoint + "处于可提升区间，建议结合错题复盘强化关键步骤。";
        }
        return knowledgePoint + "薄弱明显，建议回到基础概念并安排针对性练习。";
    }

    private static class QuestionAggregate {
        private final Integer order;
        private final String title;
        private final BigDecimal maxScore;
        private BigDecimal score = BigDecimal.ZERO;
        private int count = 0;
        private int riskCount = 0;

        private QuestionAggregate(Integer order, String title, BigDecimal maxScore) {
            this.order = order;
            this.title = title;
            this.maxScore = maxScore;
        }
    }

    private static class KnowledgeAggregate {
        private BigDecimal score = BigDecimal.ZERO;
        private BigDecimal total = BigDecimal.ZERO;
    }

    public record ReviewArtifactFile(String fileName, String contentType, Long sizeBytes, byte[] bytes) {
    }

    private record ArtifactPayload(String fileName, String contentType, String content) {
    }
}
