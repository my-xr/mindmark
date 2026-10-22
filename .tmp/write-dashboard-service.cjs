const fs = require('fs');
const content = `package com.mindmark.server.modules.dashboard.service;

import com.mindmark.server.modules.auth.domain.AuthUserEntity;
import com.mindmark.server.modules.auth.domain.RoleCode;
import com.mindmark.server.modules.auth.service.ClassScopeService;
import com.mindmark.server.modules.dashboard.dto.TeacherDashboardMetricResponse;
import com.mindmark.server.modules.dashboard.dto.TeacherDashboardResponse;
import com.mindmark.server.modules.dashboard.dto.TeacherDashboardTaskResponse;
import com.mindmark.server.modules.exam.domain.ExamEntity;
import com.mindmark.server.modules.exam.domain.ExamStatus;
import com.mindmark.server.modules.exam.repository.ExamParticipantRepository;
import com.mindmark.server.modules.exam.repository.ExamRepository;
import com.mindmark.server.modules.grading.domain.GradingTaskEntity;
import com.mindmark.server.modules.grading.domain.GradingTaskStatus;
import com.mindmark.server.modules.grading.repository.GradingTaskRepository;
import com.mindmark.server.modules.question.domain.QuestionSource;
import com.mindmark.server.modules.question.domain.QuestionStatus;
import com.mindmark.server.modules.question.repository.QuestionRepository;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TeacherDashboardService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final String ADMIN_VISIBLE_CLASS_SENTINEL = "__ALL_CLASSES__";

    private final QuestionRepository questionRepository;
    private final ExamRepository examRepository;
    private final ExamParticipantRepository examParticipantRepository;
    private final GradingTaskRepository gradingTaskRepository;
    private final ClassScopeService classScopeService;

    public TeacherDashboardService(
        QuestionRepository questionRepository,
        ExamRepository examRepository,
        ExamParticipantRepository examParticipantRepository,
        GradingTaskRepository gradingTaskRepository,
        ClassScopeService classScopeService
    ) {
        this.questionRepository = questionRepository;
        this.examRepository = examRepository;
        this.examParticipantRepository = examParticipantRepository;
        this.gradingTaskRepository = gradingTaskRepository;
        this.classScopeService = classScopeService;
    }

    @Transactional(readOnly = true)
    public TeacherDashboardResponse getDashboard() {
        AuthUserEntity currentUser = classScopeService.currentUser();
        boolean admin = currentUser.getRoles().contains(RoleCode.ADMIN);
        Set<String> visibleClassIds = visibleClassIdsForQuery(admin);
        if (!admin && visibleClassIds.isEmpty()) {
            return emptyDashboard();
        }

        Page<ExamEntity> ongoingPage = examRepository.pageVisibleExamsByStatus(
            ExamStatus.ONGOING,
            admin,
            visibleClassIds,
            PageRequest.of(0, 2)
        );
        Page<ExamEntity> upcomingPage = examRepository.pageVisibleExamsByStatus(
            ExamStatus.SCHEDULED,
            admin,
            visibleClassIds,
            PageRequest.of(0, 1)
        );
        Page<GradingTaskEntity> pendingTaskPage = gradingTaskRepository.pageVisibleTasksByStatusNot(
            GradingTaskStatus.REVIEWED,
            admin,
            visibleClassIds,
            PageRequest.of(0, 2)
        );

        long pendingScorePublishCount = examRepository.countVisibleFullyReviewedExamsByStatus(
            ExamStatus.GRADING,
            admin,
            visibleClassIds
        );
        long pendingAiQuestionCount = questionRepository.countBySourceAndStatus(
            QuestionSource.AI,
            QuestionStatus.PENDING_REVIEW
        );

        List<ExamEntity> taskRelatedExams = new ArrayList<>();
        taskRelatedExams.addAll(ongoingPage.getContent());
        taskRelatedExams.addAll(upcomingPage.getContent());
        Map<String, Long> participantCounts = countParticipantsByExam(taskRelatedExams);
        Map<String, Long> submittedCounts = countSubmittedTasksByExam(ongoingPage.getContent());

        List<TeacherDashboardTaskResponse> tasks = new ArrayList<>();
        ongoingPage.getContent().forEach(exam -> tasks.add(new TeacherDashboardTaskResponse(
            exam.getTitle(),
            exam.getPaper().getCourseName()
                + " · "
                + submittedCounts.getOrDefault(exam.getId(), 0L)
                + "/"
                + participantCounts.getOrDefault(exam.getId(), 0L)
                + " 已交卷 · "
                + DATE_TIME_FORMATTER.format(exam.getEndAt())
                + " 结束",
            "考试进行中",
            "info",
            "/teacher/exams"
        )));
        pendingTaskPage.getContent().forEach(task -> tasks.add(new TeacherDashboardTaskResponse(
            task.getExam().getTitle() + " · " + task.getStudentName(),
            statusLabel(task.getStatus()) + " · 当前得分 " + scoreText(task.getFinalScore() == null ? task.getAiScore() : task.getFinalScore()),
            task.getStatus() == GradingTaskStatus.PENDING ? "待批改" : "待复核",
            "warning",
            "/teacher/grading"
        )));
        if (pendingScorePublishCount > 0) {
            tasks.add(new TeacherDashboardTaskResponse(
                "成绩发布待办",
                pendingScorePublishCount + " 场考试已完成复核，可发布学生成绩。",
                "待发布",
                "success",
                "/teacher/grading"
            ));
        }
        if (pendingAiQuestionCount > 0) {
            tasks.add(new TeacherDashboardTaskResponse(
                "AI 生成题目审核",
                "当前有 " + pendingAiQuestionCount + " 道 AI 题目等待教师审核入库。",
                "待审核",
                "warning",
                "/teacher/ai-questions"
            ));
        }
        upcomingPage.getContent().forEach(exam -> tasks.add(new TeacherDashboardTaskResponse(
            exam.getTitle(),
            exam.getPaper().getCourseName()
                + " · "
                + DATE_TIME_FORMATTER.format(exam.getStartAt())
                + " 开始 · "
                + participantCounts.getOrDefault(exam.getId(), 0L)
                + " 人",
            "待开始",
            "processing",
            "/teacher/exams"
        )));

        return new TeacherDashboardResponse(
            List.of(
                new TeacherDashboardMetricResponse("题库题目", formatNumber(questionRepository.count()), "题库真实总量"),
                new TeacherDashboardMetricResponse("进行中考试", formatNumber(ongoingPage.getTotalElements()), upcomingPage.getTotalElements() + " 场待开始"),
                new TeacherDashboardMetricResponse("待复核答卷", formatNumber(pendingTaskPage.getTotalElements()), "未完成复核的答卷"),
                new TeacherDashboardMetricResponse("待发布成绩", formatNumber(pendingScorePublishCount), "复核完成后可发布")
            ),
            tasks.stream().limit(6).toList()
        );
    }

    private TeacherDashboardResponse emptyDashboard() {
        return new TeacherDashboardResponse(
            List.of(
                new TeacherDashboardMetricResponse("题库题目", "0", "当前账号暂无可见班级"),
                new TeacherDashboardMetricResponse("进行中考试", "0", "当前账号暂无可见班级"),
                new TeacherDashboardMetricResponse("待复核答卷", "0", "当前账号暂无可见班级"),
                new TeacherDashboardMetricResponse("待发布成绩", "0", "当前账号暂无可见班级")
            ),
            List.of()
        );
    }

    private Set<String> visibleClassIdsForQuery(boolean admin) {
        if (admin) {
            return Set.of(ADMIN_VISIBLE_CLASS_SENTINEL);
        }
        return classScopeService.visibleClassIds();
    }

    private Map<String, Long> countParticipantsByExam(Collection<ExamEntity> exams) {
        Set<String> examIds = examIds(exams);
        if (examIds.isEmpty()) {
            return Map.of();
        }
        return examParticipantRepository.countByExamIds(examIds).stream()
            .collect(Collectors.toMap(row -> (String) row[0], row -> (Long) row[1]));
    }

    private Map<String, Long> countSubmittedTasksByExam(Collection<ExamEntity> exams) {
        Set<String> examIds = examIds(exams);
        if (examIds.isEmpty()) {
            return Map.of();
        }
        return gradingTaskRepository.countByExamIds(examIds).stream()
            .collect(Collectors.toMap(row -> (String) row[0], row -> (Long) row[1]));
    }

    private Set<String> examIds(Collection<ExamEntity> exams) {
        return exams.stream()
            .map(ExamEntity::getId)
            .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private String formatNumber(long value) {
        return NumberFormat.getIntegerInstance(Locale.CHINA).format(value);
    }

    private String scoreText(BigDecimal score) {
        return score == null ? "待评分" : score.stripTrailingZeros().toPlainString() + " 分";
    }

    private String statusLabel(GradingTaskStatus status) {
        return switch (status) {
            case PENDING -> "待客观题预批";
            case AI_CHECKED -> "AI 已预批";
            case REVIEWED -> "复核完成";
        };
    }
}
`;
fs.writeFileSync('apps/mindmark-server/src/main/java/com/mindmark/server/modules/dashboard/service/TeacherDashboardService.java', content.replace(/\n/g, '\r\n'), 'utf8');
