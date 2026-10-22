package com.mindmark.server.modules.ai.provider;

import com.mindmark.server.modules.review.dto.ExamReviewReportResponse;
import com.mindmark.server.modules.review.dto.KnowledgeWeaknessResponse;
import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class LocalTemplateLectureDraftProvider implements LectureDraftProvider {

    public static final String CODE = "LOCAL_TEMPLATE";

    @Override
    public String providerCode() {
        return CODE;
    }

    @Override
    public boolean available() {
        return true;
    }

    @Override
    public LectureDraftGenerationResult generate(ExamReviewReportResponse report) {
        List<String> riskLabels = riskLabels(report);
        List<String> outline = outline(report);
        return new LectureDraftGenerationResult(
            providerCode(),
            confidence(report),
            riskLabels,
            outline,
            buildDraftContent(report, outline),
            buildPromptSnapshot(report, riskLabels)
        );
    }

    private BigDecimal confidence(ExamReviewReportResponse report) {
        return report.reviewedCount() > 0 && report.reviewedCount().equals(report.submittedCount())
            ? BigDecimal.valueOf(0.8600)
            : BigDecimal.valueOf(0.7400);
    }

    private List<String> riskLabels(ExamReviewReportResponse report) {
        Set<String> labels = new LinkedHashSet<>();
        if (report.passRate().compareTo(BigDecimal.valueOf(60)) < 0) {
            labels.add("及格率偏低");
        }
        report.knowledgeWeaknesses().stream()
            .filter(item -> item.scoreRate().compareTo(BigDecimal.valueOf(60)) < 0)
            .limit(3)
            .map(KnowledgeWeaknessResponse::knowledgePoint)
            .map(point -> "知识薄弱：" + point)
            .forEach(labels::add);
        report.questionPerformances().stream()
            .filter(item -> item.scoreRate().compareTo(BigDecimal.valueOf(60)) < 0)
            .limit(2)
            .map(item -> "高风险题目：第 " + item.order() + " 题")
            .forEach(labels::add);
        if (labels.isEmpty()) {
            labels.add("整体表现稳定");
        }
        return List.copyOf(labels);
    }

    private List<String> outline(ExamReviewReportResponse report) {
        String firstWeak = report.knowledgeWeaknesses().isEmpty()
            ? "核心概念"
            : report.knowledgeWeaknesses().getFirst().knowledgePoint();
        return List.of(
            "考试目标与成绩分布回顾",
            "题目级共性错误与评分标准对齐",
            firstWeak + " 的重点补救讲解",
            "分层课后任务与后续跟踪证据"
        );
    }

    private String buildDraftContent(ExamReviewReportResponse report, List<String> outline) {
        StringBuilder builder = new StringBuilder();
        builder.append("# ").append(report.examTitle()).append(" AI讲评稿\n\n");
        builder.append("## 1. 考试概览\n");
        builder.append("课程：").append(report.courseName()).append("。 ");
        builder.append("已批改/已提交：").append(report.reviewedCount()).append("/").append(report.submittedCount()).append("。 ");
        builder.append("平均分：").append(report.averageScore()).append("，及格率：").append(report.passRate()).append("%。\n\n");

        builder.append("## 2. 建议讲评顺序\n");
        for (int i = 0; i < outline.size(); i++) {
            builder.append(i + 1).append(". ").append(outline.get(i)).append("\n");
        }

        builder.append("\n## 3. 优先讲解的知识薄弱点\n");
        if (report.knowledgeWeaknesses().isEmpty()) {
            builder.append("- 暂无明显薄弱点，建议围绕易错步骤做快速回顾。\n");
        } else {
            report.knowledgeWeaknesses().stream().limit(5).forEach(item -> builder
                .append("- ").append(item.knowledgePoint())
                .append("：得分率 ").append(item.scoreRate()).append("%。")
                .append(item.suggestion()).append("\n"));
        }

        builder.append("\n## 4. 题目级讲评提示\n");
        if (report.questionPerformances().isEmpty()) {
            builder.append("- 暂无可分析题目。\n");
        } else {
            report.questionPerformances().stream().limit(5).forEach(item -> builder
                .append("- 第 ").append(item.order()).append(" 题：").append(item.title())
                .append("；平均得分 ").append(item.averageScore()).append("/").append(item.maxScore())
                .append("，得分率 ").append(item.scoreRate()).append("%。\n"));
        }

        builder.append("\n## 5. 课后跟进\n");
        builder.append("请学生完成错题订正；风险层补做基础题，稳定层完成同类变式题，优秀层完成拓展题并整理讲解思路。\n");
        return builder.toString();
    }

    private String buildPromptSnapshot(ExamReviewReportResponse report, List<String> riskLabels) {
        return "基于考试复盘数据生成教师讲评稿：examId=%s, reviewed=%d, average=%s, passRate=%s, riskLabels=%s".formatted(
            report.examId(),
            report.reviewedCount(),
            report.averageScore(),
            report.passRate(),
            String.join("/", riskLabels)
        );
    }
}