package com.mindmark.server.modules.ai.provider;

import com.mindmark.server.modules.review.dto.ExamReviewReportResponse;
import com.mindmark.server.modules.review.dto.KnowledgeWeaknessResponse;
import com.mindmark.server.modules.review.dto.QuestionPerformanceResponse;
import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class KimiLectureDraftProvider implements LectureDraftProvider {

    public static final String CODE = "KIMI";

    private final RestClient restClient;
    private final String apiKey;
    private final String model;
    private final Integer maxTokens;
    private final LocalTemplateLectureDraftProvider localTemplateProvider;

    public KimiLectureDraftProvider(
        RestClient.Builder restClientBuilder,
        @Value("${mindmark.ai.kimi.base-url}") String baseUrl,
        @Value("${mindmark.ai.kimi.api-key:}") String apiKey,
        @Value("${mindmark.ai.kimi.model:kimi-k2.6}") String model,
        @Value("${mindmark.ai.kimi.max-tokens:1800}") Integer maxTokens,
        @Value("${mindmark.ai.kimi.timeout-ms:20000}") Integer timeoutMs,
        LocalTemplateLectureDraftProvider localTemplateProvider
    ) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(timeoutMs));
        requestFactory.setReadTimeout(Duration.ofMillis(timeoutMs));
        this.restClient = restClientBuilder.baseUrl(baseUrl).requestFactory(requestFactory).build();
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model == null || model.isBlank() ? "kimi-k2.6" : model.trim();
        this.maxTokens = maxTokens == null || maxTokens <= 0 ? 1800 : maxTokens;
        this.localTemplateProvider = localTemplateProvider;
    }

    @Override
    public String providerCode() {
        return CODE;
    }

    @Override
    public boolean available() {
        return !apiKey.isBlank();
    }

    @Override
    public LectureDraftGenerationResult generate(ExamReviewReportResponse report) {
        if (!available()) {
            throw new IllegalStateException("Kimi API key is not configured");
        }

        LectureDraftGenerationResult local = localTemplateProvider.generate(report);
        KimiChatResponse response = restClient.post()
            .uri("/chat/completions")
            .header("Authorization", "Bearer " + apiKey)
            .body(Map.of(
                "model", model,
                "temperature", 0.3,
                "max_tokens", maxTokens,
                "messages", List.of(
                    Map.of("role", "system", "content", "你是教学考试复盘助手。请基于用户提供的真实考试数据生成简洁、事实准确的 Markdown 教师讲评稿，不要编造数据。"),
                    Map.of("role", "user", "content", buildPrompt(report, local))
                )
            ))
            .retrieve()
            .body(KimiChatResponse.class);

        String content = response == null || response.choices() == null || response.choices().isEmpty()
            ? ""
            : response.choices().getFirst().message().content();
        if (content == null || content.isBlank()) {
            throw new IllegalStateException("Kimi returned empty lecture draft");
        }

        BigDecimal confidence = report.reviewedCount() > 0 && report.reviewedCount().equals(report.submittedCount())
            ? BigDecimal.valueOf(0.8800)
            : BigDecimal.valueOf(0.7800);
        return new LectureDraftGenerationResult(
            providerCode(),
            confidence,
            local.riskLabels(),
            local.outline(),
            content,
            local.promptSnapshot() + "; provider=KIMI; model=" + model
        );
    }

    private String buildPrompt(ExamReviewReportResponse report, LectureDraftGenerationResult local) {
        StringBuilder builder = new StringBuilder();
        builder.append("请基于以下考试复盘数据生成教师讲评稿，使用 Markdown，避免编造未提供的数据。\n");
        builder.append("考试：").append(report.examTitle()).append('\n');
        builder.append("课程：").append(report.courseName()).append('\n');
        builder.append("满分：").append(report.totalScore()).append('\n');
        builder.append("已批改/已提交：").append(report.reviewedCount()).append('/').append(report.submittedCount()).append('\n');
        builder.append("平均分：").append(report.averageScore()).append('\n');
        builder.append("及格率：").append(report.passRate()).append("%\n");
        builder.append("风险标签：").append(String.join("、", local.riskLabels())).append("\n\n");
        builder.append("知识薄弱点：\n");
        for (KnowledgeWeaknessResponse item : report.knowledgeWeaknesses()) {
            builder.append("- ").append(item.knowledgePoint()).append("：得分率 ").append(item.scoreRate()).append("%，建议：").append(item.suggestion()).append('\n');
        }
        builder.append("\n题目表现：\n");
        for (QuestionPerformanceResponse item : report.questionPerformances()) {
            builder.append("- 第 ").append(item.order()).append(" 题：").append(item.title())
                .append("：平均 ").append(item.averageScore()).append('/').append(item.maxScore())
                .append("，得分率 ").append(item.scoreRate()).append("%\n");
        }
        builder.append("\n请包含：总体概览、主要问题、讲解顺序、分层作业、教师注意事项。输出仅包含 Markdown 正文。");
        return builder.toString();
    }

    private record KimiChatResponse(List<KimiChoice> choices) {}

    private record KimiChoice(KimiMessage message) {}

    private record KimiMessage(String content) {}
}