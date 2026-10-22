package com.mindmark.server.modules.question.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mindmark.server.modules.question.domain.QuestionEntity;
import com.mindmark.server.modules.question.dto.QuestionResponse;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.stereotype.Component;

@Component
public class QuestionResponseMapper {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final ObjectMapper objectMapper;

    public QuestionResponseMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public QuestionResponse toResponse(QuestionEntity entity) {
        return new QuestionResponse(
            entity.getId(),
            entity.getTitle(),
            entity.getType(),
            entity.getDifficulty(),
            entity.getCourseId(),
            entity.getCourseName(),
            entity.getChapterId(),
            entity.getChapterNo(),
            entity.getChapterTitle(),
            entity.getKnowledgePoints() == null ? List.of() : entity.getKnowledgePoints().stream().filter(Objects::nonNull).toList(),
            entity.getSource(),
            entity.getStatus(),
            entity.getScore(),
            parseJson(entity.getAnswerJson()),
            entity.getAnalysis(),
            parseJson(entity.getOptionsJson()),
            parseJson(entity.getScoringPointsJson()),
            formatDateTime(entity.getUpdatedAt()),
            entity.getCreatedBy(),
            entity.getReviewedBy(),
            formatDateTime(entity.getReviewedAt()),
            entity.getReviewComment(),
            entity.getReviewAction()
        );
    }

    /**
     * Student exam payloads intentionally contain only answerable content.
     * Correct answers, analysis, scoring points and review metadata must never
     * cross the student API boundary.
     */
    public QuestionResponse toStudentResponse(QuestionEntity entity) {
        return toStudentResponse(entity, Map.of());
    }

    public QuestionResponse toStudentResponse(
        QuestionEntity entity,
        Map<String, String> displayToOriginalOptionKey
    ) {
        return new QuestionResponse(
            entity.getId(),
            entity.getTitle(),
            entity.getType(),
            entity.getDifficulty(),
            entity.getCourseId(),
            entity.getCourseName(),
            entity.getChapterId(),
            entity.getChapterNo(),
            entity.getChapterTitle(),
            entity.getKnowledgePoints() == null ? List.of() : entity.getKnowledgePoints().stream().filter(Objects::nonNull).toList(),
            entity.getSource(),
            entity.getStatus(),
            entity.getScore(),
            null,
            null,
            reorderStudentOptions(parseJson(entity.getOptionsJson()), displayToOriginalOptionKey),
            null,
            formatDateTime(entity.getUpdatedAt()),
            null,
            null,
            null,
            null,
            null
        );
    }

    private JsonNode reorderStudentOptions(
        JsonNode options,
        Map<String, String> displayToOriginalOptionKey
    ) {
        if (displayToOriginalOptionKey == null
            || displayToOriginalOptionKey.isEmpty()
            || options == null
            || !options.isArray()) {
            return options;
        }

        Map<String, JsonNode> optionsByKey = new LinkedHashMap<>();
        options.forEach(option -> {
            JsonNode key = option.get("key");
            if (key != null && key.isTextual()) {
                optionsByKey.put(key.asText(), option);
            }
        });
        if (optionsByKey.size() != options.size()) {
            return options;
        }

        ArrayNode reordered = objectMapper.createArrayNode();
        for (Map.Entry<String, String> entry : displayToOriginalOptionKey.entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .toList()) {
            JsonNode original = optionsByKey.get(entry.getValue());
            if (original == null) {
                return options;
            }
            if (original.isObject()) {
                ObjectNode displayOption = (ObjectNode) original.deepCopy();
                displayOption.put("key", entry.getKey());
                reordered.add(displayOption);
            } else {
                reordered.add(original);
            }
        }
        return reordered.size() == options.size() ? reordered : options;
    }

    private String formatDateTime(OffsetDateTime value) {
        if (value == null) {
            return null;
        }
        return DATE_TIME_FORMATTER.format(value.atZoneSameInstant(ZoneId.systemDefault()));
    }

    private JsonNode parseJson(String value) {
        String payload = value == null || value.isBlank() ? "null" : value;
        try {
            return objectMapper.readTree(payload);
        } catch (Exception exception) {
            throw new IllegalStateException("Invalid stored JSON payload", exception);
        }
    }
}
