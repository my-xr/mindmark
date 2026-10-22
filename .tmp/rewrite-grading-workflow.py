from pathlib import Path
p = Path('apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/LangGraphGradingWorkflow.java')
p.write_text(r'''package com.mindmark.server.modules.grading.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.ai.dto.AiProviderRuntimeConfig;
import com.mindmark.server.modules.ai.service.AiChatQuestionGenerationClient;
import com.mindmark.server.modules.question.domain.QuestionType;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutionException;
import org.bsc.langgraph4j.StateGraph;
import org.bsc.langgraph4j.state.AgentState;
import org.bsc.langgraph4j.state.Channel;
import org.bsc.langgraph4j.state.Channels;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import static org.bsc.langgraph4j.action.AsyncNodeAction.node_async;

@Service
public class LangGraphGradingWorkflow {

    public static final String WORKFLOW_VERSION = "grading-langgraph-v20260721";

    private static final Logger LOGGER = LoggerFactory.getLogger(LangGraphGradingWorkflow.class);
    private static final String START = "__START__";
    private static final String END = "__END__";
    private static final String SYSTEM_PROMPT = """
        你是高校考试 AI 批改智能体。必须使用简体中文，依据题干、参考答案、评分点和学生作答给出稳定、保守、可审计的系统默认分。
        只返回严格 JSON，不要包含 Markdown、解释性前后缀或英文说明。
        JSON 字段必须包含：score（数字）、correct（布尔）、confidence（0 到 1 数字）、needsReview（布尔）、comment（中文简短评语）。
        不确定、低置信度、不及格、疑似偏题、论证不足或编程题无法确认可运行性时，needsReview 必须为 true。
        """;

    private final AiChatQuestionGenerationClient aiClient;
    private final ObjectMapper objectMapper;

    public LangGraphGradingWorkflow(AiChatQuestionGenerationClient aiClient, ObjectMapper objectMapper) {
        this.aiClient = aiClient;
        this.objectMapper = objectMapper;
    }

    public GradingWorkflowResult run(GradingWorkflowInput input, AiProviderRuntimeConfig config) {
        try {
            StateGraph<GradingWorkflowState> graph = new StateGraph<>(GradingWorkflowState.SCHEMA, GradingWorkflowState::new)
                .addNode("validate_input", node_async(this::validateInput))
                .addNode("extract_rubric", node_async(this::extractRubric))
                .addNode("route_question_type", node_async(this::routeQuestionType))
                .addNode("call_ai_scorer", node_async(state -> callAiScorer(state, config)))
                .addNode("quality_gate", node_async(this::qualityGate))
                .addEdge(START, "validate_input")
                .addEdge("validate_input", "extract_rubric")
                .addEdge("extract_rubric", "route_question_type")
                .addEdge("route_question_type", "call_ai_scorer")
                .addEdge("call_ai_scorer", "quality_gate")
                .addEdge("quality_gate", END);

            GradingWorkflowState finalState = graph.compile()
                .invoke(Map.of("input", input))
                .orElseThrow(() -> new BusinessException(ErrorCode.INTERNAL_ERROR, "AI grading workflow returned empty state"));
            return require(finalState, "result", GradingWorkflowResult.class);
        } catch (BusinessException exception) {
            throw exception;
        } catch (Exception exception) {
            Throwable rootCause = unwrapWorkflowException(exception);
            if (rootCause instanceof BusinessException businessException) {
                throw businessException;
            }
            LOGGER.warn("AI grading workflow failed", rootCause);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI grading workflow failed: " + summarize(rootCause.getMessage()));
        }
    }

    private Map<String, Object> validateInput(GradingWorkflowState state) {
        GradingWorkflowInput input = require(state, "input", GradingWorkflowInput.class);
        if (input.questionType() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "questionType is required");
        }
        if (input.maxScore() == null || input.maxScore().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "maxScore must be positive");
        }
        if (!hasText(input.studentAnswer())) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "studentAnswer is required");
        }
        return Map.of("validated", true);
    }

    private Map<String, Object> extractRubric(GradingWorkflowState state) {
        GradingWorkflowInput input = require(state, "input", GradingWorkflowInput.class);
        String rubric = """
            【通用评分约束】
            1. score 必须在 0 到满分之间，禁止超过满分。
            2. correct 表示是否达到及格性正确，不等同于满分。
            3. confidence 必须反映评分确定性；评分点缺失、答案含糊、编程题无法运行验证时应降低置信度。
            4. comment 必须中文、简洁，指出主要得分依据或复核原因，控制在 80 字以内。
            【教师评分点】
            %s
            """.formatted(blankToDefault(input.scoringPointsJson(), "未配置结构化评分点，请依据参考答案和题干保守评分。"));
        String reference = blankToDefault(input.referenceAnswer(), "未配置参考答案，请更保守评分并建议教师复核。");
        return Map.of("rubric", rubric, "reference", reference, "questionTypeLabel", questionTypeLabel(input.questionType()));
    }

    private Map<String, Object> routeQuestionType(GradingWorkflowState state) {
        GradingWorkflowInput input = require(state, "input", GradingWorkflowInput.class);
        QuestionType type = input.questionType();
        String instruction = switch (type) {
            case SHORT_ANSWER -> "按知识点覆盖、关键概念准确性、表达完整性评分；允许同义表达。";
            case ESSAY -> "按观点完整性、论证逻辑、概念准确性、材料结合、表达规范性评分；避免只按关键词给分。";
            case CASE_ANALYSIS -> "按问题识别、案例证据使用、分析链路、解决方案可行性和结论完整性评分。";
            case PROGRAMMING -> "按算法思路、边界条件、复杂度、代码健壮性和输出正确性评分；当前不执行代码，无法确认可运行性时 needsReview=true。";
            default -> "当前题型通常不应进入 AI 主观批改，请保守输出低置信度并建议复核。";
        };
        return Map.of("typeInstruction", instruction);
    }

    private Map<String, Object> callAiScorer(GradingWorkflowState state, AiProviderRuntimeConfig config) {
        GradingWorkflowInput input = require(state, "input", GradingWorkflowInput.class);
        String prompt = buildPrompt(state, input);
        String content = aiClient.completeText(
            config,
            prompt,
            Math.max(256, input.responseMaxTokens()),
            SYSTEM_PROMPT,
            Math.max(1000L, input.timeoutMs())
        );
        return Map.of("prompt", prompt, "providerContent", content == null ? "" : content);
    }

    private Map<String, Object> qualityGate(GradingWorkflowState state) {
        GradingWorkflowInput input = require(state, "input", GradingWorkflowInput.class);
        String content = require(state, "providerContent", String.class);
        if (!hasText(content)) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI grading provider returned empty content");
        }
        JsonNode json = readJson(extractJson(stripMarkdownFence(content)));
        if (json == null || !json.isObject() || json.get("score") == null) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI grading provider returned invalid JSON");
        }
        GradingWorkflowResult result = new GradingWorkflowResult(
            content,
            WORKFLOW_VERSION,
            List.of("validate_input", "extract_rubric", "route_question_type", "call_ai_scorer", "quality_gate"),
            input.providerModel()
        );
        return Map.of("result", result);
    }

    private String buildPrompt(GradingWorkflowState state, GradingWorkflowInput input) {
        String rubric = require(state, "rubric", String.class);
        String reference = require(state, "reference", String.class);
        String questionTypeLabel = require(state, "questionTypeLabel", String.class);
        String typeInstruction = require(state, "typeInstruction", String.class);
        return """
            请执行一次 AI 批改工作流，并只返回 JSON。

            【工作流版本】%s
            【题型】%s
            【满分】%s
            【题干】%s
            【参考答案】%s
            %s
            【题型专项评分策略】%s
            【学生作答】%s

            【输出格式】
            {"score": 数字, "correct": true/false, "confidence": 0到1数字, "needsReview": true/false, "comment": "中文评语"}
            """.formatted(
            WORKFLOW_VERSION,
            questionTypeLabel,
            input.maxScore().stripTrailingZeros().toPlainString(),
            blankToDefault(input.questionTitle(), "无题干"),
            reference,
            rubric,
            typeInstruction,
            input.studentAnswer()
        );
    }

    private JsonNode readJson(String value) {
        try {
            return objectMapper.readTree(value);
        } catch (Exception exception) {
            return null;
        }
    }

    private String questionTypeLabel(QuestionType type) {
        if (type == null) {
            return "未知题型";
        }
        return switch (type) {
            case SINGLE_CHOICE -> "单选题";
            case MULTIPLE_CHOICE -> "多选题";
            case TRUE_FALSE -> "判断题";
            case FILL_BLANK -> "填空题";
            case SHORT_ANSWER -> "简答题";
            case ESSAY -> "论述题";
            case CASE_ANALYSIS -> "案例分析题";
            case PROGRAMMING -> "编程题";
        };
    }

    private String extractJson(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return trimmed.substring(start, end + 1);
        }
        return trimmed;
    }

    private String stripMarkdownFence(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        if (!trimmed.startsWith("```")) {
            return trimmed;
        }
        return trimmed.replaceFirst("^```[a-zA-Z]*\\s*", "").replaceFirst("\\s*```$", "").trim();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String blankToDefault(String value, String defaultValue) {
        return hasText(value) ? value.trim() : defaultValue;
    }

    @SuppressWarnings("unchecked")
    private <T> T require(GradingWorkflowState state, String key, Class<T> type) {
        return (T) state.value(key).orElseThrow();
    }

    private Throwable unwrapWorkflowException(Throwable exception) {
        Throwable current = exception;
        while ((current instanceof CompletionException || current instanceof ExecutionException) && current.getCause() != null) {
            current = current.getCause();
        }
        return current;
    }

    private String summarize(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String compact = value.replaceAll("\\s+", " ").trim();
        return compact.length() > 300 ? compact.substring(0, 300) : compact;
    }

    public record GradingWorkflowInput(
        String questionTitle,
        QuestionType questionType,
        String studentAnswer,
        String referenceAnswer,
        String scoringPointsJson,
        BigDecimal maxScore,
        int responseMaxTokens,
        long timeoutMs,
        String providerModel
    ) implements Serializable {}

    public record GradingWorkflowResult(
        String providerContent,
        String workflowVersion,
        List<String> executedNodes,
        String providerModel
    ) implements Serializable {}

    public static class GradingWorkflowState extends AgentState {
        private static final GradingWorkflowInput EMPTY_INPUT = new GradingWorkflowInput(
            "",
            null,
            "",
            "",
            "",
            BigDecimal.ZERO,
            0,
            0,
            ""
        );
        private static final GradingWorkflowResult EMPTY_RESULT = new GradingWorkflowResult("", "", List.of(), "");

        static final Map<String, Channel<?>> SCHEMA = Map.of(
            "input", Channels.base(() -> EMPTY_INPUT),
            "validated", Channels.base(() -> false),
            "rubric", Channels.base(() -> ""),
            "reference", Channels.base(() -> ""),
            "questionTypeLabel", Channels.base(() -> ""),
            "typeInstruction", Channels.base(() -> ""),
            "prompt", Channels.base(() -> ""),
            "providerContent", Channels.base(() -> ""),
            "result", Channels.base(() -> EMPTY_RESULT)
        );

        public GradingWorkflowState(Map<String, Object> initData) {
            super(initData);
        }
    }
}
''', encoding='utf-8')
