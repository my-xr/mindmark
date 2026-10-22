package com.mindmark.server.modules.score.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.api.PageResponse;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.auth.domain.AuthUserEntity;
import com.mindmark.server.modules.auth.domain.RoleCode;
import com.mindmark.server.modules.auth.domain.StudentProfileEntity;
import com.mindmark.server.modules.auth.service.ClassScopeService;
import com.mindmark.server.modules.exam.domain.ExamEntity;
import com.mindmark.server.modules.exam.domain.ExamStatus;
import com.mindmark.server.modules.exam.repository.ExamRepository;
import com.mindmark.server.modules.grading.domain.GradingItemEntity;
import com.mindmark.server.modules.grading.domain.GradingTaskEntity;
import com.mindmark.server.modules.grading.domain.GradingTaskStatus;
import com.mindmark.server.modules.grading.repository.GradingTaskRepository;
import com.mindmark.server.modules.score.domain.ScoreReportEntity;
import com.mindmark.server.modules.score.dto.ExamScoreSummaryResponse;
import com.mindmark.server.modules.score.dto.PublishScoreResponse;
import com.mindmark.server.modules.score.dto.ScoreBandSummaryResponse;
import com.mindmark.server.modules.score.dto.ScoreReportResponse;
import com.mindmark.server.modules.score.dto.ScoreSummaryItemResponse;
import com.mindmark.server.modules.score.repository.ScoreReportRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ScoreService {

    private final ExamRepository examRepository;
    private final GradingTaskRepository gradingTaskRepository;
    private final ScoreReportRepository scoreReportRepository;
    private final ScoreReportMapper scoreReportMapper;
    private final ObjectMapper objectMapper;
    private final ClassScopeService classScopeService;

    public ScoreService(
        ExamRepository examRepository,
        GradingTaskRepository gradingTaskRepository,
        ScoreReportRepository scoreReportRepository,
        ScoreReportMapper scoreReportMapper,
        ObjectMapper objectMapper,
        ClassScopeService classScopeService
    ) {
        this.examRepository = examRepository;
        this.gradingTaskRepository = gradingTaskRepository;
        this.scoreReportRepository = scoreReportRepository;
        this.scoreReportMapper = scoreReportMapper;
        this.objectMapper = objectMapper;
        this.classScopeService = classScopeService;
    }

    @Transactional(readOnly = true)
    public PageResponse<ExamScoreSummaryResponse> listExamScoreSummaries(Integer page, Integer pageSize) {
        classScopeService.requireStaffRole();
        boolean admin = currentUserIsAdmin();
        Set<String> visibleClassIds = visibleClassIdsForQuery(admin);
        if (!admin && visibleClassIds.isEmpty()) {
            return PageResponse.empty(page, pageSize);
        }

        PageRequest pageRequest = toPageRequest(page, pageSize);
        Page<ExamEntity> examPage = examRepository.pageVisibleExamsWithGradingTasks(admin, visibleClassIds, pageRequest);
        if (examPage.isEmpty() && examPage.getTotalElements() > 0 && pageRequest.getPageNumber() >= examPage.getTotalPages()) {
            pageRequest = PageRequest.of(examPage.getTotalPages() - 1, pageRequest.getPageSize());
            examPage = examRepository.pageVisibleExamsWithGradingTasks(admin, visibleClassIds, pageRequest);
        }
        return PageResponse.fromPage(examPage.map(exam -> buildExamScoreSummary(exam, false)));
    }

    @Transactional(readOnly = true)
    public ExamScoreSummaryResponse getExamScores(String examId) {
        classScopeService.requireStaffRole();
        ExamEntity exam = examRepository.findById(examId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Exam not found"));
        classScopeService.requireCanAccessExam(exam);
        return buildExamScoreSummary(exam, true);
    }

    @Transactional(readOnly = true)
    public PageResponse<ScoreSummaryItemResponse> listExamScoreReports(String examId, Integer page, Integer pageSize) {
        classScopeService.requireStaffRole();
        ExamEntity exam = examRepository.findById(examId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Exam not found"));
        classScopeService.requireCanAccessExam(exam);

        PageRequest pageRequest = toPageRequest(page, pageSize);
        Page<GradingTaskEntity> taskPage = gradingTaskRepository.findByExamIdAndStatusAndFinalScoreIsNotNullOrderByFinalScoreDescUpdatedAtAsc(
            examId,
            GradingTaskStatus.REVIEWED,
            pageRequest
        );
        if (taskPage.isEmpty() && taskPage.getTotalElements() > 0 && pageRequest.getPageNumber() >= taskPage.getTotalPages()) {
            pageRequest = PageRequest.of(taskPage.getTotalPages() - 1, pageRequest.getPageSize());
            taskPage = gradingTaskRepository.findByExamIdAndStatusAndFinalScoreIsNotNullOrderByFinalScoreDescUpdatedAtAsc(
                examId,
                GradingTaskStatus.REVIEWED,
                pageRequest
            );
        }

        int rankStart = taskPage.getNumber() * taskPage.getSize() + 1;
        List<ScoreSummaryItemResponse> items = toRankedSummaryItems(taskPage.getContent(), rankStart);
        return new PageResponse<>(
            items,
            taskPage.getTotalElements(),
            taskPage.getNumber() + 1,
            taskPage.getSize(),
            Math.max(1, taskPage.getTotalPages()),
            taskPage.hasPrevious(),
            taskPage.hasNext()
        );
    }

    private ExamScoreSummaryResponse buildExamScoreSummary(ExamEntity exam, boolean includeItems) {
        List<GradingTaskEntity> reviewedTasks = reviewedTasks(exam.getId());
        List<ScoreSummaryItemResponse> items = includeItems ? toRankedSummaryItems(reviewedTasks) : List.of();
        List<BigDecimal> scores = reviewedTasks.stream().map(GradingTaskEntity::getFinalScore).toList();
        BigDecimal highest = scores.stream().max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
        BigDecimal lowest = scores.stream().min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
        BigDecimal average = scores.isEmpty()
            ? BigDecimal.ZERO
            : scores.stream().reduce(BigDecimal.ZERO, BigDecimal::add).divide(BigDecimal.valueOf(scores.size()), 2, RoundingMode.HALF_UP);
        return new ExamScoreSummaryResponse(
            exam.getId(),
            exam.getTitle(),
            exam.getTotalScore(),
            reviewedTasks.size(),
            Math.toIntExact(gradingTaskRepository.countByExamId(exam.getId())),
            average,
            highest,
            lowest,
            buildScoreBands(reviewedTasks, exam.getTotalScore()),
            items
        );
    }


    private List<ScoreBandSummaryResponse> buildScoreBands(List<GradingTaskEntity> reviewedTasks, BigDecimal totalScore) {
        return List.of(
            new ScoreBandSummaryResponse("FAILED", "不及格", null, 59, countScoreBand(reviewedTasks, totalScore, "FAILED")),
            new ScoreBandSummaryResponse("S60_69", "60-69", 60, 69, countScoreBand(reviewedTasks, totalScore, "S60_69")),
            new ScoreBandSummaryResponse("S70_79", "70-79", 70, 79, countScoreBand(reviewedTasks, totalScore, "S70_79")),
            new ScoreBandSummaryResponse("S80_89", "80-89", 80, 89, countScoreBand(reviewedTasks, totalScore, "S80_89")),
            new ScoreBandSummaryResponse("S90_100", "90-100", 90, 100, countScoreBand(reviewedTasks, totalScore, "S90_100"))
        );
    }

    private int countScoreBand(List<GradingTaskEntity> reviewedTasks, BigDecimal totalScore, String scoreBand) {
        return Math.toIntExact(reviewedTasks.stream()
            .filter(task -> matchesScoreBand(task.getFinalScore(), totalScore, scoreBand))
            .count());
    }

    private boolean matchesScoreBand(BigDecimal score, BigDecimal totalScore, String scoreBand) {
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

    @Transactional
    public PublishScoreResponse publishScores(String examId) {
        classScopeService.requireStaffRole();
        ExamEntity exam = examRepository.findById(examId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Exam not found"));
        classScopeService.requireCanPublishScores(exam);
        List<GradingTaskEntity> reviewedTasks = reviewedTasks(examId);
        if (reviewedTasks.isEmpty()) {
            throw new BusinessException(ErrorCode.CONFLICT, "No reviewed grading tasks can be published");
        }
        if (gradingTaskRepository.countByExamIdAndStatusNot(examId, GradingTaskStatus.REVIEWED) > 0) {
            throw new BusinessException(ErrorCode.CONFLICT, "All grading tasks must be reviewed before publishing scores");
        }

        OffsetDateTime now = OffsetDateTime.now();
        int rank = 1;
        for (GradingTaskEntity task : reviewedTasks) {
            ScoreReportEntity report = scoreReportRepository.findByExamIdAndStudentId(examId, task.getStudentId())
                .orElseGet(ScoreReportEntity::new);
            report.setId(report.getId() == null ? "SR-" + examId + "-" + task.getStudentId() : report.getId());
            report.setExam(exam);
            report.setAnswerSheet(task.getAnswerSheet());
            report.setStudentId(task.getStudentId());
            report.setStudentName(task.getStudentName());
            report.setExamTitle(exam.getTitle());
            report.setScore(task.getFinalScore());
            report.setRankNo(rank++);
            report.setWeakKnowledgePointsJson(writeWeakKnowledgePoints(weakKnowledgePoints(task)));
            report.setFeedback(buildFeedback(task));
            report.setPublishedAt(now);
            scoreReportRepository.save(report);
        }

        exam.setStatus(ExamStatus.SCORES_PUBLISHED);
        exam.setUpdatedAt(now);
        return new PublishScoreResponse(examId, reviewedTasks.size(), now);
    }

    @Transactional(readOnly = true)
    public List<ScoreReportResponse> listStudentReports() {
        classScopeService.requireStudentRole();
        StudentProfileEntity profile = classScopeService.currentStudentProfile();
        return scoreReportRepository.findByStudentIdOrderByPublishedAtDesc(profile.getId()).stream()
            .map(scoreReportMapper::toResponse)
            .toList();
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

    private List<GradingTaskEntity> reviewedTasks(String examId) {
        return gradingTaskRepository.findByExamIdOrderByUpdatedAtDesc(examId).stream()
            .filter(task -> task.getStatus() == GradingTaskStatus.REVIEWED && task.getFinalScore() != null)
            .sorted(Comparator.comparing(GradingTaskEntity::getFinalScore).reversed().thenComparing(GradingTaskEntity::getUpdatedAt))
            .toList();
    }

    private List<ScoreSummaryItemResponse> toRankedSummaryItems(List<GradingTaskEntity> reviewedTasks) {
        return toRankedSummaryItems(reviewedTasks, 1);
    }

    private List<ScoreSummaryItemResponse> toRankedSummaryItems(List<GradingTaskEntity> reviewedTasks, int rankStart) {
        List<ScoreSummaryItemResponse> items = new ArrayList<>();
        int rank = rankStart;
        for (GradingTaskEntity task : reviewedTasks) {
            items.add(new ScoreSummaryItemResponse(
                task.getId(),
                task.getAnswerSheet().getId(),
                task.getStudentId(),
                task.getStudentName(),
                task.getObjectiveScore(),
                task.getSubjectiveScore(),
                task.getFinalScore(),
                rank++
            ));
        }
        return items;
    }

    private Set<String> weakKnowledgePoints(GradingTaskEntity task) {
        Set<String> knowledgePoints = new LinkedHashSet<>();
        for (GradingItemEntity item : task.getItems()) {
            BigDecimal finalScore = item.getFinalScore() == null ? BigDecimal.ZERO : item.getFinalScore();
            if (finalScore.compareTo(item.getMaxScore()) < 0) {
                knowledgePoints.addAll(item.getQuestion().getKnowledgePoints());
            }
        }
        return knowledgePoints;
    }

    private String writeWeakKnowledgePoints(Set<String> knowledgePoints) {
        try {
            return objectMapper.writeValueAsString(knowledgePoints);
        } catch (JsonProcessingException exception) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Cannot serialize weak knowledge points");
        }
    }

    private String buildFeedback(GradingTaskEntity task) {
        Set<String> weakPoints = weakKnowledgePoints(task);
        if (weakPoints.isEmpty()) {
            return "整体表现稳定，建议保持当前练习节奏。";
        }
        return "建议重点复习薄弱知识点：" + String.join("、", weakPoints) + "。";
    }
}
