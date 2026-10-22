package com.mindmark.server.modules.grading.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.question.domain.QuestionEntity;
import com.mindmark.server.modules.question.domain.QuestionType;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class ObjectiveGradingPolicy {

    private final ObjectMapper objectMapper;

    public ObjectiveGradingPolicy(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public boolean isObjective(QuestionType type) {
        return switch (type) {
            case SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, FILL_BLANK -> true;
            case SHORT_ANSWER, ESSAY, CASE_ANALYSIS, PROGRAMMING -> false;
        };
    }

    public ObjectiveGradingResult grade(QuestionEntity question, String answerJson, BigDecimal maxScore) {
        return grade(question, answerJson, maxScore, Map.of());
    }

    public ObjectiveGradingResult grade(
        QuestionEntity question,
        String answerJson,
        BigDecimal maxScore,
        Map<String, String> displayToOriginalOptionKey
    ) {
        if (!isObjective(question.getType())) {
            return new ObjectiveGradingResult(null, null);
        }
        JsonNode expected = readTree(question.getAnswerJson());
        JsonNode actual = restoreCanonicalOptionKeys(
            question.getType(),
            readTree(answerJson),
            displayToOriginalOptionKey
        );
        boolean correct = switch (question.getType()) {
            case SINGLE_CHOICE, TRUE_FALSE -> normalizeText(expected).equals(normalizeText(actual));
            case MULTIPLE_CHOICE -> normalizeArray(expected).equals(normalizeArray(actual));
            case FILL_BLANK -> normalizeText(expected).equalsIgnoreCase(normalizeText(actual));
            case SHORT_ANSWER, ESSAY, CASE_ANALYSIS, PROGRAMMING -> false;
        };
        return new ObjectiveGradingResult(correct ? maxScore : BigDecimal.ZERO, correct);
    }

    private JsonNode restoreCanonicalOptionKeys(
        QuestionType type,
        JsonNode actual,
        Map<String, String> displayToOriginalOptionKey
    ) {
        if ((type != QuestionType.SINGLE_CHOICE && type != QuestionType.MULTIPLE_CHOICE)
            || displayToOriginalOptionKey == null
            || displayToOriginalOptionKey.isEmpty()) {
            return actual;
        }

        if (actual.isArray()) {
            var restored = objectMapper.createArrayNode();
            actual.forEach(value -> restored.add(restoreCanonicalOptionKey(value, displayToOriginalOptionKey)));
            return restored;
        }
        return restoreCanonicalOptionKey(actual, displayToOriginalOptionKey);
    }

    private JsonNode restoreCanonicalOptionKey(JsonNode value, Map<String, String> displayToOriginalOptionKey) {
        if (value == null || !value.isTextual()) {
            return value;
        }
        return objectMapper.getNodeFactory().textNode(
            displayToOriginalOptionKey.getOrDefault(value.asText().trim(), value.asText().trim())
        );
    }

    private JsonNode readTree(String json) {
        try {
            return objectMapper.readTree(json == null || json.isBlank() ? "null" : json);
        } catch (Exception exception) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Invalid answer JSON for auto grading");
        }
    }

    private String normalizeText(JsonNode node) {
        if (node == null || node.isNull()) {
            return "";
        }
        if (node.isTextual()) {
            return node.asText().trim();
        }
        return node.toString().trim();
    }

    private List<String> normalizeArray(JsonNode node) {
        List<String> values = new ArrayList<>();
        if (node != null && node.isArray()) {
            node.forEach(value -> values.add(normalizeText(value)));
        } else {
            values.add(normalizeText(node));
        }
        return values.stream().sorted(Comparator.naturalOrder()).toList();
    }

    public record ObjectiveGradingResult(BigDecimal score, Boolean correct) {
    }
}
