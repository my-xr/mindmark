package com.mindmark.server.modules.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.academic.domain.CourseEntity;
import com.mindmark.server.modules.ai.dto.AiProviderRuntimeConfig;
import com.mindmark.server.modules.ai.dto.AiQuestionGenerateRequest;
import com.mindmark.server.modules.ai.dto.QuestionCreateRequest;
import com.mindmark.server.modules.question.domain.Difficulty;
import com.mindmark.server.modules.question.domain.QuestionType;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.ClientHttpRequestFactories;
import org.springframework.boot.web.client.ClientHttpRequestFactorySettings;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

@Component
public class AiChatQuestionGenerationClient {

    private static final String SYSTEM_PROMPT = """
        你是高校考试题目生成助手。必须使用简体中文生成题干、选项、答案解析和评分点。
        只返回严格 JSON，不要包含 Markdown 代码块、解释性前后缀或英文说明。
        生成内容必须适合教师人工审核后入库，不得编造课程之外的知识点。
        判断题答案统一使用“正确”或“错误”。选择题选项 key 使用 A/B/C/D。
        """;

    private static final String CONNECTION_TEST_SYSTEM_PROMPT = """
        你是模型连接测试助手。请严格按用户要求做一次极简中文回复，不要输出 JSON、Markdown 或解释。
        """;

    private final RestClient.Builder restClientBuilder;
    private final ObjectMapper objectMapper;
    private final int maxTokens;
    private final long timeoutMs;
    private final int providerMaxAttempts;
    private final long providerRetryBackoffMs;
    private final Semaphore providerRequestGate;

    public AiChatQuestionGenerationClient(
        RestClient.Builder restClientBuilder,
        ObjectMapper objectMapper,
        @Value("${mindmark.ai.question.max-tokens:2200}") int maxTokens,
        @Value("${mindmark.ai.question.timeout-ms:30000}") long timeoutMs,
        @Value("${mindmark.ai.provider.max-attempts:3}") int providerMaxAttempts,
        @Value("${mindmark.ai.provider.retry-backoff-ms:1500}") long providerRetryBackoffMs,
        @Value("${mindmark.ai.provider.max-concurrency:1}") int providerMaxConcurrency
    ) {
        this.restClientBuilder = restClientBuilder;
        this.objectMapper = objectMapper;
        this.maxTokens = maxTokens;
        this.timeoutMs = timeoutMs;
        this.providerMaxAttempts = Math.max(1, providerMaxAttempts);
        this.providerRetryBackoffMs = Math.max(0L, providerRetryBackoffMs);
        this.providerRequestGate = new Semaphore(Math.max(1, providerMaxConcurrency), true);
    }

    public List<QuestionCreateRequest> generate(
        AiProviderRuntimeConfig config,
        CourseEntity course,
        AiQuestionGenerateRequest request
    ) {
        int count = normalizeCount(request.count());
        if (count == 1) {
            return generateOneBatch(config, course, withCount(request, 1));
        }

        ArrayList<QuestionCreateRequest> generated = new ArrayList<>();
        for (int index = 1; index <= count; index += 1) {
            AiQuestionGenerateRequest singleRequest = withSingleQuestionRequirement(request, index, count);
            List<QuestionCreateRequest> batch = generateOneBatch(config, course, singleRequest);
            if (batch.isEmpty()) {
                throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI provider returned empty questions array");
            }
            generated.add(batch.getFirst());
        }
        return List.copyOf(generated);
    }

    private List<QuestionCreateRequest> generateOneBatch(
        AiProviderRuntimeConfig config,
        CourseEntity course,
        AiQuestionGenerateRequest request
    ) {
        String basePrompt = buildPrompt(course, request);
        String prompt = basePrompt;
        int responseMaxTokens = recommendedMaxTokens(request);
        BusinessException lastRetryableException = null;
        for (int attempt = 1; attempt <= 3; attempt++) {
            String content = callQuestionProviderWithRetry(config, prompt, responseMaxTokens);
            try {
                List<QuestionCreateRequest> questions = parseQuestions(content, request);
                if (questions.isEmpty()) {
                    throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI provider returned empty questions array");
                }
                return questions;
            } catch (BusinessException exception) {
                if (!isRetryableGenerationFailure(exception) || attempt == 3) {
                    throw exception;
                }
                lastRetryableException = exception;
                prompt = basePrompt + retryInstruction(exception, attempt + 1);
                responseMaxTokens = Math.max(responseMaxTokens, 6000);
            }
        }
        throw lastRetryableException == null
            ? new BusinessException(ErrorCode.INTERNAL_ERROR, "AI question generation failed")
            : lastRetryableException;
    }
    private int normalizeCount(Integer count) {
        int normalized = count == null ? 1 : count;
        if (normalized < 1 || normalized > 5) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "count must be between 1 and 5");
        }
        return normalized;
    }

    private AiQuestionGenerateRequest withCount(AiQuestionGenerateRequest request, int count) {
        return new AiQuestionGenerateRequest(
            request.courseId(),
            request.provider(),
            request.prompt(),
            request.questionType(),
            request.difficulty(),
            count,
            request.knowledgePoint(),
            request.requirement()
        );
    }

    private AiQuestionGenerateRequest withSingleQuestionRequirement(AiQuestionGenerateRequest request, int index, int total) {
        String requirement = safe(request.requirement())
            + "\n请只生成 1 道题，这是本次任务的第 " + index + "/" + total
            + " 道。题干、选项和解析必须与本批次其他题有明显差异，避免重复。";
        return new AiQuestionGenerateRequest(
            request.courseId(),
            request.provider(),
            request.prompt(),
            request.questionType(),
            request.difficulty(),
            1,
            request.knowledgePoint(),
            requirement
        );
    }

    public String testConnection(AiProviderRuntimeConfig config) {
        String prompt = "请只回复：连接成功";
        String content = callProvider(config, prompt, 256, CONNECTION_TEST_SYSTEM_PROMPT);
        return content.length() > 120 ? content.substring(0, 120) : content;
    }

    public String completeText(AiProviderRuntimeConfig config, String prompt, int responseMaxTokens, String systemPrompt) {
        return completeText(config, prompt, responseMaxTokens, systemPrompt, timeoutMs);
    }

    public String completeText(
        AiProviderRuntimeConfig config,
        String prompt,
        int responseMaxTokens,
        String systemPrompt,
        long requestTimeoutMs
    ) {
        return callProvider(config, prompt, responseMaxTokens, systemPrompt, requestTimeoutMs);
    }

    private String callProvider(AiProviderRuntimeConfig config, String prompt) {
        return callProvider(config, prompt, maxTokens);
    }

    private String callProvider(AiProviderRuntimeConfig config, String prompt, int responseMaxTokens) {
        return callProvider(config, prompt, responseMaxTokens, SYSTEM_PROMPT);
    }

    private String callProvider(AiProviderRuntimeConfig config, String prompt, int responseMaxTokens, String systemPrompt) {
        return callProvider(config, prompt, responseMaxTokens, systemPrompt, timeoutMs);
    }

    private String callProvider(
        AiProviderRuntimeConfig config,
        String prompt,
        int responseMaxTokens,
        String systemPrompt,
        long requestTimeoutMs
    ) {
        BusinessException lastFailure = null;
        for (int attempt = 1; attempt <= providerMaxAttempts; attempt += 1) {
            try {
                providerRequestGate.acquire();
                try {
                    return callProviderOnce(config, prompt, responseMaxTokens, systemPrompt, requestTimeoutMs);
                } finally {
                    providerRequestGate.release();
                }
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI provider request was interrupted");
            } catch (BusinessException exception) {
                throw exception;
            } catch (RestClientResponseException exception) {
                lastFailure = new BusinessException(
                    ErrorCode.INTERNAL_ERROR,
                    "AI provider request failed: HTTP " + exception.getStatusCode().value() + " "
                        + summarize(exception.getResponseBodyAsString())
                );
                if (!isRetryableProviderStatus(exception) || attempt == providerMaxAttempts) {
                    throw lastFailure;
                }
                waitBeforeProviderRetry(attempt, retryAfterMillis(exception));
            } catch (RestClientException exception) {
                lastFailure = new BusinessException(
                    ErrorCode.INTERNAL_ERROR,
                    "AI provider request failed: " + summarize(exception.getMessage())
                );
                if (!isRetryableProviderTransportFailure(exception) || attempt == providerMaxAttempts) {
                    throw lastFailure;
                }
                waitBeforeProviderRetry(attempt, null);
            }
        }
        throw lastFailure == null
            ? new BusinessException(ErrorCode.INTERNAL_ERROR, "AI provider request failed")
            : lastFailure;
    }

    private String callProviderOnce(
        AiProviderRuntimeConfig config,
        String prompt,
        int responseMaxTokens,
        String systemPrompt,
        long requestTimeoutMs
    ) {
        return AiProviderSettingService.ANTHROPIC_PROVIDER.equals(config.provider())
            ? generateWithAnthropic(config, prompt, responseMaxTokens, systemPrompt, requestTimeoutMs)
            : generateWithOpenAiCompatible(config, prompt, responseMaxTokens, systemPrompt, requestTimeoutMs);
    }

    private boolean isRetryableProviderStatus(RestClientResponseException exception) {
        int status = exception.getStatusCode().value();
        return status == 408
            || status == 425
            || status == 429
            || status == 500
            || status == 502
            || status == 503
            || status == 504;
    }

    private boolean isRetryableProviderTransportFailure(RestClientException exception) {
        String message = exception.getMessage();
        return message == null
            || message.toLowerCase().contains("timeout")
            || message.toLowerCase().contains("timed out")
            || message.toLowerCase().contains("connection reset");
    }

    private Long retryAfterMillis(RestClientResponseException exception) {
        String retryAfter = exception.getResponseHeaders() == null
            ? null
            : exception.getResponseHeaders().getFirst("Retry-After");
        if (retryAfter == null || retryAfter.isBlank()) {
            return null;
        }
        try {
            return Math.max(0L, Long.parseLong(retryAfter.trim()) * 1000L);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private void waitBeforeProviderRetry(int attempt, Long retryAfterMs) {
        long exponentialBackoff = providerRetryBackoffMs * (1L << Math.min(attempt - 1, 3));
        long waitMs = Math.min(10_000L, Math.max(exponentialBackoff, retryAfterMs == null ? 0L : retryAfterMs));
        if (waitMs <= 0) {
            return;
        }
        try {
            TimeUnit.MILLISECONDS.sleep(waitMs);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI provider retry was interrupted");
        }
    }

    private boolean isNonChineseContentFailure(BusinessException exception) {
        return exception.getMessage() != null && exception.getMessage().contains("AI generated non-Chinese content");
    }

    private String callQuestionProviderWithRetry(AiProviderRuntimeConfig config, String prompt, int responseMaxTokens) {
        try {
            return callProvider(config, prompt, responseMaxTokens);
        } catch (BusinessException exception) {
            if (!isEmptyOrLengthFailure(exception)) {
                throw exception;
            }
            int retryMaxTokens = Math.max(responseMaxTokens * 2, 8000);
            String retryPrompt = prompt
                + "\n\n请直接输出最终 JSON，不要输出思考过程；如果需要推理，请在内部完成，最终答案必须放在 message.content 中。"
                + "如为编程题，请压缩代码篇幅，但必须保留中文题干、中文参考思路和评分点。";
            return callProvider(config, retryPrompt, retryMaxTokens);
        }
    }

    private int recommendedMaxTokens(AiQuestionGenerateRequest request) {
        int count = normalizeCount(request.count());
        int baseline = Math.max(maxTokens, 1200 * count);
        if (request.questionType() == QuestionType.PROGRAMMING) {
            return Math.max(baseline, 6000);
        }
        if (request.questionType() == QuestionType.SHORT_ANSWER) {
            return Math.max(baseline, 3600);
        }
        return baseline;
    }

    private boolean isEmptyOrLengthFailure(BusinessException exception) {
        String message = exception.getMessage();
        return message != null && (
            message.contains("empty content")
                || message.contains("empty question content")
                || message.contains("finish_reason=length")
        );
    }

    private boolean isJsonParseFailure(BusinessException exception) {
        String message = exception.getMessage();
        return message != null && (
            message.contains("Failed to parse AI question JSON")
                || message.contains("AI response must contain questions array")
                || message.contains("AI generated question missing required")
                || message.contains("AI generated question missing scoringPoints")
                || message.contains("AI generated question must contain")
        );
    }

    private boolean isEmptyQuestionsFailure(BusinessException exception) {
        String message = exception.getMessage();
        return message != null && message.contains("empty questions array");
    }

    private boolean isRetryableGenerationFailure(BusinessException exception) {
        return isNonChineseContentFailure(exception)
            || isJsonParseFailure(exception)
            || isEmptyOrLengthFailure(exception)
            || isEmptyQuestionsFailure(exception);
    }

    private String retryInstruction(BusinessException exception, int nextAttempt) {
        if (isNonChineseContentFailure(exception)) {
            return "\n\n第 " + nextAttempt + " 次生成要求：上一次输出仍包含英文题干/选项/解析。请重新生成，所有题干、选项 content、解析 analysis、评分点 description 必须包含简体中文说明；技术名词如 props、emit、provide/inject 可以保留，但必须写成中文解释短语，例如：\"props 属性用于父组件向子组件传递数据\"。";
        }
        if (isJsonParseFailure(exception)) {
            return "\n\n第 " + nextAttempt + " 次生成要求：上一次输出不是合法题目 JSON。请只输出一个 JSON 对象，格式必须是 {\"questions\":[...]}，不要输出 Markdown、解释、思考过程或多余文本。";
        }
        if (isEmptyQuestionsFailure(exception)) {
            return "\n\n第 " + nextAttempt + " 次生成要求：上一次返回了空 questions 数组，这是不可接受的。必须生成且只生成 1 道完整题目，questions 数组长度必须等于 1，字段 title、options、answer、analysis 不能为空，并且必须使用简体中文。";
        }
        return "\n\n第 " + nextAttempt + " 次生成要求：上一次输出为空或被截断。请压缩表达，直接输出最终 JSON，不要输出思考过程，最终答案必须放在 message.content 中。";
    }
    private String generateWithOpenAiCompatible(
        AiProviderRuntimeConfig config,
        String prompt,
        int responseMaxTokens,
        String systemPrompt,
        long requestTimeoutMs
    ) {
        OpenAiChatResponse response = restClient(config.baseUrl(), requestTimeoutMs).post()
            .uri("/chat/completions")
            .contentType(MediaType.APPLICATION_JSON)
            .headers(headers -> headers.setBearerAuth(config.apiKey()))
            .body(new OpenAiChatRequest(
                config.model(),
                List.of(
                    new OpenAiMessage("system", systemPrompt),
                    new OpenAiMessage("user", prompt)
                ),
                responseMaxTokens
            ))
            .retrieve()
            .body(OpenAiChatResponse.class);

        OpenAiChoice choice = response == null || response.choices() == null || response.choices().isEmpty()
            ? null
            : response.choices().getFirst();
        OpenAiMessage message = choice == null ? null : choice.message();
        String content = firstNonBlank(message == null ? null : message.content(), message == null ? null : message.reasoning_content());
        if (content == null || content.isBlank()) {
            throw new BusinessException(
                ErrorCode.INTERNAL_ERROR,
                "AI provider returned empty content" + finishReasonSuffix(choice)
                    + ". If this is a reasoning/code model, increase max output tokens or use a non-thinking chat model for connection test."
            );
        }
        return content;
    }

    private String generateWithAnthropic(
        AiProviderRuntimeConfig config,
        String prompt,
        int responseMaxTokens,
        String systemPrompt,
        long requestTimeoutMs
    ) {
        AnthropicMessageResponse response = restClient(config.baseUrl(), requestTimeoutMs).post()
            .uri("/messages")
            .contentType(MediaType.APPLICATION_JSON)
            .header("x-api-key", config.apiKey())
            .header("anthropic-version", "2023-06-01")
            .body(new AnthropicMessageRequest(
                config.model(),
                responseMaxTokens,
                0.2,
                systemPrompt,
                List.of(new AnthropicMessage("user", prompt))
            ))
            .retrieve()
            .body(AnthropicMessageResponse.class);

        String content = response == null || response.content() == null || response.content().isEmpty()
            ? null
            : response.content().stream()
                .filter(item -> item.text() != null && !item.text().isBlank())
                .map(AnthropicContent::text)
                .findFirst()
                .orElse(null);
        if (content == null || content.isBlank()) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI provider returned empty question content");
        }
        return content;
    }

    private List<QuestionCreateRequest> parseQuestions(String content, AiQuestionGenerateRequest request) {
        try {
            String normalized = extractJson(stripMarkdownFence(content));
            JsonNode root = objectMapper.readTree(normalized);
            List<GeneratedQuestionPayload> payloads = parseQuestionPayloads(root);
            if (payloads.isEmpty()) {
                throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI provider returned empty questions array");
            }
            return payloads.stream()
                .map(item -> item.toCreateRequest(request))
                .toList();
        } catch (BusinessException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Failed to parse AI question JSON");
        }
    }

    private List<GeneratedQuestionPayload> parseQuestionPayloads(JsonNode root) {
        ArrayList<GeneratedQuestionPayload> payloads = new ArrayList<>();
        collectQuestionPayloads(root, payloads, 0);
        return payloads;
    }

    private void collectQuestionPayloads(JsonNode node, List<GeneratedQuestionPayload> payloads, int depth) {
        if (node == null || node.isMissingNode() || node.isNull() || depth > 8) {
            return;
        }
        if (node.isArray()) {
            node.forEach(item -> collectQuestionPayloads(item, payloads, depth + 1));
            return;
        }
        if (!node.isObject()) {
            return;
        }
        if (looksLikeQuestionPayload(node)) {
            payloads.add(toGeneratedQuestionPayload(node));
            return;
        }
        node.fields().forEachRemaining(entry -> collectQuestionPayloads(entry.getValue(), payloads, depth + 1));
    }

    private boolean looksLikeQuestionPayload(JsonNode node) {
        boolean hasTitle = firstText(node, "title", "questionTitle", "stem", "content", "题干", "题目", "题目标题") != null;
        boolean hasQuestionSignal = firstNode(node, "answer", "referenceAnswer", "analysis", "explanation", "options", "choices", "scoringPoints", "scorePoints", "答案", "参考答案", "解析", "选项", "评分点") != null;
        return hasTitle && hasQuestionSignal;
    }

    private GeneratedQuestionPayload toGeneratedQuestionPayload(JsonNode node) {
        String title = firstText(node, "title", "questionTitle", "stem", "content", "题干", "题目", "题目标题");
        List<String> knowledgePoints = readStringList(firstNode(node, "knowledgePoints", "knowledgePoint", "知识点"));
        BigDecimal score = readBigDecimal(firstNode(node, "score", "points", "分值"));
        JsonNode answer = firstNode(node, "answer", "referenceAnswer", "correctAnswer", "solution", "答案", "参考答案", "标准答案", "解法");
        String analysis = firstText(node, "analysis", "explanation", "reason", "解析", "答案解析", "解题思路");
        JsonNode options = normalizeOptions(firstNode(node, "options", "choices", "选项"));
        JsonNode scoringPoints = normalizeScoringPoints(firstNode(node, "scoringPoints", "scorePoints", "rubric", "评分点", "评分标准"));
        return new GeneratedQuestionPayload(title, knowledgePoints, score, answer, analysis, options, scoringPoints);
    }

    private JsonNode firstNode(JsonNode node, String... fieldNames) {
        if (node == null || !node.isObject()) {
            return null;
        }
        for (String fieldName : fieldNames) {
            JsonNode value = node.get(fieldName);
            if (value != null && !value.isMissingNode() && !value.isNull()) {
                return value;
            }
        }
        return null;
    }

    private String firstText(JsonNode node, String... fieldNames) {
        return textValue(firstNode(node, fieldNames));
    }

    private String textValue(JsonNode value) {
        if (value == null || value.isMissingNode() || value.isNull()) {
            return null;
        }
        if (value.isTextual() || value.isNumber() || value.isBoolean()) {
            String text = value.asText().trim();
            return text.isEmpty() ? null : text;
        }
        if (value.isArray()) {
            for (JsonNode item : value) {
                String text = textValue(item);
                if (text != null) {
                    return text;
                }
            }
        }
        return null;
    }

    private List<String> readStringList(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return List.of();
        }
        ArrayList<String> values = new ArrayList<>();
        if (node.isArray()) {
            node.forEach(item -> addStringValue(values, item));
        } else {
            addStringValue(values, node);
        }
        return List.copyOf(values);
    }

    private void addStringValue(List<String> values, JsonNode item) {
        if (item == null || item.isNull() || item.isMissingNode()) {
            return;
        }
        if (item.isTextual() || item.isNumber() || item.isBoolean()) {
            String text = item.asText().trim();
            if (!text.isBlank()) {
                for (String part : text.split("[,，、;；]")) {
                    String normalized = part.trim();
                    if (!normalized.isBlank()) {
                        values.add(normalized);
                    }
                }
            }
            return;
        }
        if (item.isObject()) {
            addNonBlank(values, firstText(item, "name", "title", "content", "description", "label", "value", "知识点", "名称"));
        }
    }

    private BigDecimal readBigDecimal(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        if (node.isNumber()) {
            return node.decimalValue();
        }
        if (node.isTextual()) {
            try {
                return new BigDecimal(node.asText().trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private JsonNode normalizeOptions(JsonNode node) {
        ArrayNode array = JsonNodeFactory.instance.arrayNode();
        if (node == null || node.isMissingNode() || node.isNull()) {
            return array;
        }
        if (node.isArray()) {
            int index = 0;
            for (JsonNode item : node) {
                String key = firstNonBlank(firstText(item, "key", "label", "option", "序号"), optionKey(index));
                String content = item.isTextual() ? item.asText() : firstText(item, "content", "text", "value", "description", "内容", "选项内容");
                if (content != null && !content.isBlank()) {
                    ObjectNode option = JsonNodeFactory.instance.objectNode();
                    option.put("key", key);
                    option.put("content", content.trim());
                    array.add(option);
                    index += 1;
                }
            }
            return array;
        }
        if (node.isObject()) {
            node.fields().forEachRemaining(entry -> {
                String content = textValue(entry.getValue());
                if (content != null) {
                    ObjectNode option = JsonNodeFactory.instance.objectNode();
                    option.put("key", entry.getKey());
                    option.put("content", content);
                    array.add(option);
                }
            });
        }
        return array;
    }

    private JsonNode normalizeScoringPoints(JsonNode node) {
        ArrayNode array = JsonNodeFactory.instance.arrayNode();
        if (node == null || node.isMissingNode() || node.isNull()) {
            return array;
        }
        if (node.isArray()) {
            int index = 1;
            for (JsonNode item : node) {
                ObjectNode point = normalizeScoringPoint(item, index);
                if (point != null) {
                    array.add(point);
                    index += 1;
                }
            }
            return array;
        }
        ObjectNode point = normalizeScoringPoint(node, 1);
        if (point != null) {
            array.add(point);
        }
        return array;
    }

    private ObjectNode normalizeScoringPoint(JsonNode item, int index) {
        String description = item != null && item.isTextual()
            ? item.asText()
            : firstText(item, "description", "content", "text", "title", "desc", "说明", "描述", "评分点");
        if (description == null || description.isBlank()) {
            return null;
        }
        ObjectNode point = JsonNodeFactory.instance.objectNode();
        point.put("id", firstNonBlank(firstText(item, "id", "key"), "SP-" + index));
        point.put("description", description.trim());
        BigDecimal scoreValue = readBigDecimal(firstNode(item, "score", "points", "分值"));
        point.put("score", scoreValue == null ? BigDecimal.ONE : scoreValue);
        ArrayNode keywordArray = JsonNodeFactory.instance.arrayNode();
        readStringList(firstNode(item, "keywords", "keyword", "关键词")).forEach(keywordArray::add);
        point.set("keywords", keywordArray);
        JsonNode required = firstNode(item, "required", "必需", "必要");
        point.put("required", required == null || required.asBoolean(true));
        return point;
    }

    private String optionKey(int index) {
        return switch (index) {
            case 0 -> "A";
            case 1 -> "B";
            case 2 -> "C";
            case 3 -> "D";
            default -> String.valueOf((char) ('A' + index));
        };
    }

    private String buildPrompt(CourseEntity course, AiQuestionGenerateRequest request) {
        return """
            请为课程《%s》生成 %d 道考试题。
            课程ID：%s
            题型：%s
            难度：%s
            知识点：%s
            出题要求：%s
            补充说明：%s

            输出 JSON 结构必须为：
            {"questions":[{"title":string,"knowledgePoints":[string],"score":number,"answer":string|array|object,"analysis":string,"options":[{"key":string,"content":string}],"scoringPoints":[{"id":string,"description":string,"score":number,"keywords":[string],"required":boolean}]}]}

            约束：
            1. 所有 title、content、analysis、description 必须是简体中文。
            2. 单选题/多选题必须给出 4 个选项；非选择题 options 返回 []。
            3. 简答题/编程题必须给出 scoringPoints，且至少 3 项；客观题 scoringPoints 返回 []。
            4. 编程题 title 必须包含中文题目背景、输入输出或实现要求；answer 可包含代码，但必须同时包含中文参考思路；options 必须返回 []。
            5. 判断题 answer 只能是“正确”或“错误”。
            6. questions 数组长度必须等于请求题目数量，不允许返回空数组。
            7. 不要输出 Markdown，不要输出 JSON 以外的任何内容。
            """.formatted(
            course.getName(),
            request.count() == null ? 1 : request.count(),
            course.getId(),
            questionTypeLabel(request.questionType()),
            difficultyLabel(request.difficulty()),
            safe(request.knowledgePoint()),
            safe(request.prompt()),
            safe(request.requirement())
        );
    }

    private RestClient restClient(String baseUrl) {
        return restClient(baseUrl, timeoutMs);
    }

    private RestClient restClient(String baseUrl, long requestTimeoutMs) {
        long effectiveTimeoutMs = requestTimeoutMs > 0 ? requestTimeoutMs : timeoutMs;
        return restClientBuilder.clone()
            .baseUrl(baseUrl)
            .requestFactory(ClientHttpRequestFactories.get(ClientHttpRequestFactorySettings.DEFAULTS
                .withConnectTimeout(Duration.ofMillis(effectiveTimeoutMs))
                .withReadTimeout(Duration.ofMillis(effectiveTimeoutMs))))
            .build();
    }

    private String questionTypeLabel(QuestionType questionType) {
        if (questionType == null) {
            return "未指定";
        }
        return switch (questionType) {
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

    private String difficultyLabel(Difficulty difficulty) {
        if (difficulty == null) {
            return "未指定";
        }
        return switch (difficulty) {
            case VERY_EASY -> "1级/很容易";
            case EASY -> "2级/容易";
            case MEDIUM -> "3级/中等";
            case HARD -> "4级/困难";
            case VERY_HARD -> "5级/很困难";
        };
    }

    private String stripMarkdownFence(String content) {
        String trimmed = content.trim();
        if (trimmed.startsWith("```")) {
            int firstLineEnd = trimmed.indexOf('\n');
            int lastFence = trimmed.lastIndexOf("```");
            if (firstLineEnd >= 0 && lastFence > firstLineEnd) {
                return trimmed.substring(firstLineEnd + 1, lastFence).trim();
            }
        }
        return trimmed;
    }

    private String extractJson(String content) {
        String trimmed = content.trim();
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
            return trimmed;
        }
        int objectStart = trimmed.indexOf('{');
        int arrayStart = trimmed.indexOf('[');
        int start;
        if (objectStart < 0) {
            start = arrayStart;
        } else if (arrayStart < 0) {
            start = objectStart;
        } else {
            start = Math.min(objectStart, arrayStart);
        }
        int objectEnd = trimmed.lastIndexOf('}');
        int arrayEnd = trimmed.lastIndexOf(']');
        int end = Math.max(objectEnd, arrayEnd);
        if (start >= 0 && end > start) {
            return trimmed.substring(start, end + 1).trim();
        }
        return trimmed;
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private void addNonBlank(List<String> values, String value) {
        if (value != null && !value.isBlank()) {
            values.add(value.trim());
        }
    }

    private String finishReasonSuffix(OpenAiChoice choice) {
        if (choice == null || choice.finish_reason() == null || choice.finish_reason().isBlank()) {
            return "";
        }
        return " (finish_reason=" + choice.finish_reason() + ")";
    }

    private String summarize(String value) {
        if (value == null || value.isBlank()) {
            return "no detail";
        }
        String compact = value.replaceAll("\\s+", " ").trim();
        return compact.length() > 300 ? compact.substring(0, 300) : compact;
    }

    private String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String trimmed = value.trim();
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }

    private record OpenAiChatRequest(String model, List<OpenAiMessage> messages, int max_tokens) {
    }

    private record OpenAiMessage(String role, String content, String reasoning_content) {
        private OpenAiMessage(String role, String content) {
            this(role, content, null);
        }
    }

    private record OpenAiChatResponse(List<OpenAiChoice> choices) {
    }

    private record OpenAiChoice(OpenAiMessage message, String finish_reason) {
    }

    private record AnthropicMessageRequest(
        String model,
        int max_tokens,
        double temperature,
        String system,
        List<AnthropicMessage> messages
    ) {
    }

    private record AnthropicMessage(String role, String content) {
    }

    private record AnthropicMessageResponse(List<AnthropicContent> content) {
    }

    private record AnthropicContent(String type, String text) {
    }

    private record GeneratedQuestionPayload(
        String title,
        List<String> knowledgePoints,
        BigDecimal score,
        JsonNode answer,
        String analysis,
        JsonNode options,
        JsonNode scoringPoints
    ) {
        private QuestionCreateRequest toCreateRequest(AiQuestionGenerateRequest request) {
            String normalizedTitle = requireNonBlank("title", title);
            String normalizedAnalysis = requireNonBlank("analysis", analysis);
            JsonNode normalizedAnswer = requireNode("answer", answer);
            JsonNode normalizedOptions = options == null || options.isNull() ? JsonNodeFactory.instance.arrayNode() : options;
            JsonNode normalizedScoringPoints = scoringPoints == null || scoringPoints.isNull()
                ? JsonNodeFactory.instance.arrayNode()
                : scoringPoints;

            requireChinese("title", normalizedTitle);
            requireChinese("analysis", normalizedAnalysis);
            requireChineseOptions(normalizedOptions);
            requireChineseScoringPoints(normalizedScoringPoints);
            validateTypeSpecificFields(request.questionType(), normalizedOptions, normalizedScoringPoints);

            return new QuestionCreateRequest(
                request.courseId(),
                null,
                normalizedTitle,
                request.questionType(),
                request.difficulty(),
                normalizeKnowledgePoints(knowledgePoints, request.knowledgePoint()),
                normalizeScore(score, request.questionType()),
                normalizedAnswer,
                normalizedAnalysis,
                normalizedOptions,
                normalizedScoringPoints
            );
        }

        private static void validateTypeSpecificFields(QuestionType questionType, JsonNode options, JsonNode scoringPoints) {
            if (questionType == QuestionType.SINGLE_CHOICE || questionType == QuestionType.MULTIPLE_CHOICE) {
                if (!options.isArray() || options.size() < 4) {
                    throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI generated question must contain 4 options");
                }
            }
            if (questionType == QuestionType.SHORT_ANSWER || questionType == QuestionType.PROGRAMMING) {
                if (!scoringPoints.isArray() || scoringPoints.isEmpty()) {
                    throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI generated question missing scoringPoints");
                }
            }
        }

        private static String requireNonBlank(String fieldName, String value) {
            if (value == null || value.isBlank()) {
                throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI generated question missing required field: " + fieldName);
            }
            return value.trim();
        }

        private static JsonNode requireNode(String fieldName, JsonNode value) {
            if (value == null || value.isNull() || value.isMissingNode()) {
                throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI generated question missing required field: " + fieldName);
            }
            return value;
        }

        private static List<String> normalizeKnowledgePoints(List<String> values, String fallback) {
            ArrayList<String> normalized = new ArrayList<>();
            if (values != null) {
                values.stream()
                    .filter(value -> value != null && !value.isBlank())
                    .map(String::trim)
                    .distinct()
                    .forEach(normalized::add);
            }
            if (normalized.isEmpty() && fallback != null && !fallback.isBlank()) {
                normalized.add(fallback.trim());
            }
            return List.copyOf(normalized);
        }

        private static BigDecimal normalizeScore(BigDecimal value, QuestionType questionType) {
            if (value != null && value.compareTo(BigDecimal.ZERO) >= 0) {
                return value;
            }
            return questionType == QuestionType.PROGRAMMING ? BigDecimal.TEN : BigDecimal.valueOf(2);
        }

        private static void requireChineseOptions(JsonNode node) {
            if (node == null || !node.isArray()) {
                return;
            }
            node.forEach(option -> requireChinese("option.content", option.path("content").asText(null)));
        }

        private static void requireChineseScoringPoints(JsonNode node) {
            if (node == null || !node.isArray()) {
                return;
            }
            node.forEach(point -> requireChinese("scoringPoint.description", point.path("description").asText(null)));
        }

        private static void requireChinese(String fieldName, String value) {
            if (value != null && !value.isBlank() && !containsCjk(value)) {
                throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI generated non-Chinese content in " + fieldName);
            }
        }

        private static boolean containsCjk(String value) {
            return value.codePoints().anyMatch(codePoint ->
                Character.UnicodeScript.of(codePoint) == Character.UnicodeScript.HAN
            );
        }
    }
}
