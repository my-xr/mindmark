package com.mindmark.server.modules.answer.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindmark.server.modules.answer.domain.AnswerSheetEntity;
import com.mindmark.server.modules.answer.domain.AnswerSheetStatus;
import com.mindmark.server.modules.paper.domain.PaperEntity;
import com.mindmark.server.modules.paper.domain.PaperQuestionEntity;
import com.mindmark.server.modules.question.domain.QuestionEntity;
import com.mindmark.server.modules.question.domain.QuestionType;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

/**
 * Creates and reads the per-answer-sheet option order.
 *
 * <p>The question bank keeps the canonical option order and answer keys. A
 * student answer sheet stores only the display-key to canonical-key mapping,
 * so a refresh or reconnect always renders the same order and grading can
 * restore the canonical answer before comparison.</p>
 */
@Component
public class AnswerSheetOptionOrderService {

    private final ObjectMapper objectMapper;
    private final SecureRandom secureRandom = new SecureRandom();

    public AnswerSheetOptionOrderService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Ensures every single/multiple-choice question in the paper has a stable
     * mapping on the answer sheet. Existing answer sheets that already have
     * answers keep canonical order for backward compatibility.
     */
    public Map<String, Map<String, String>> ensureOptionOrder(
        AnswerSheetEntity answerSheet,
        PaperEntity paper
    ) {
        LinkedHashMap<String, LinkedHashMap<String, String>> mappings = readMappings(
            answerSheet.getOptionOrderJson()
        );
        boolean preserveLegacyOrder = hasExistingAnswers(answerSheet);

        for (PaperQuestionEntity paperQuestion : distinctQuestions(paper)) {
            QuestionEntity question = paperQuestion.getQuestion();
            if (!isShuffledChoice(question.getType())) {
                continue;
            }

            List<String> optionKeys = readOptionKeys(question);
            if (optionKeys.size() < 2) {
                continue;
            }

            Map<String, String> current = mappings.get(question.getId());
            if (isValidMapping(current, optionKeys)) {
                continue;
            }

            List<String> orderedOriginalKeys = preserveLegacyOrder
                ? optionKeys
                : shuffled(optionKeys);
            mappings.put(question.getId(), buildMapping(optionKeys, orderedOriginalKeys));
        }

        String serialized = writeMappings(mappings);
        if (!serialized.equals(normalizeJson(answerSheet.getOptionOrderJson()))) {
            answerSheet.setOptionOrderJson(serialized);
        }

        LinkedHashMap<String, Map<String, String>> result = new LinkedHashMap<>();
        mappings.forEach((questionId, mapping) ->
            result.put(questionId, Collections.unmodifiableMap(new LinkedHashMap<>(mapping)))
        );
        return Collections.unmodifiableMap(result);
    }

    public Map<String, String> readMapping(AnswerSheetEntity answerSheet, String questionId) {
        return readMappings(answerSheet.getOptionOrderJson())
            .getOrDefault(questionId, new LinkedHashMap<>());
    }

    private boolean hasExistingAnswers(AnswerSheetEntity answerSheet) {
        return answerSheet.getVersion() != null
            && answerSheet.getVersion() > 0
            || answerSheet.getStatus() != null && answerSheet.getStatus() != AnswerSheetStatus.DRAFT;
    }

    private boolean isShuffledChoice(QuestionType type) {
        return type == QuestionType.SINGLE_CHOICE || type == QuestionType.MULTIPLE_CHOICE;
    }

    private List<PaperQuestionEntity> distinctQuestions(PaperEntity paper) {
        return paper.getQuestions().stream()
            .collect(
                LinkedHashMap<String, PaperQuestionEntity>::new,
                (map, item) -> map.putIfAbsent(item.getQuestion().getId(), item),
                LinkedHashMap::putAll
            )
            .values()
            .stream()
            .toList();
    }

    private List<String> readOptionKeys(QuestionEntity question) {
        try {
            JsonNode options = objectMapper.readTree(
                question.getOptionsJson() == null || question.getOptionsJson().isBlank()
                    ? "[]"
                    : question.getOptionsJson()
            );
            if (!options.isArray()) {
                return List.of();
            }

            List<String> keys = new ArrayList<>();
            options.forEach(option -> {
                JsonNode key = option.get("key");
                if (key != null && key.isTextual() && !key.asText().isBlank()) {
                    keys.add(key.asText().trim());
                }
            });
            if (keys.size() != options.size() || new LinkedHashSet<>(keys).size() != keys.size()) {
                return List.of();
            }
            return List.copyOf(keys);
        } catch (Exception exception) {
            return List.of();
        }
    }

    private List<String> shuffled(List<String> optionKeys) {
        List<String> shuffled = new ArrayList<>(optionKeys);
        Collections.shuffle(shuffled, secureRandom);
        if (shuffled.equals(optionKeys) && shuffled.size() > 1) {
            Collections.swap(shuffled, 0, 1);
        }
        return shuffled;
    }

    private LinkedHashMap<String, String> buildMapping(
        List<String> displayKeys,
        List<String> originalKeysInDisplayOrder
    ) {
        LinkedHashMap<String, String> mapping = new LinkedHashMap<>();
        for (int index = 0; index < displayKeys.size(); index += 1) {
            mapping.put(displayKeys.get(index), originalKeysInDisplayOrder.get(index));
        }
        return mapping;
    }

    private boolean isValidMapping(Map<String, String> mapping, List<String> optionKeys) {
        if (mapping == null || mapping.size() != optionKeys.size()) {
            return false;
        }
        Set<String> expected = Set.copyOf(optionKeys);
        return mapping.keySet().equals(expected) && new LinkedHashSet<>(mapping.values()).equals(expected);
    }

    private LinkedHashMap<String, LinkedHashMap<String, String>> readMappings(String value) {
        LinkedHashMap<String, LinkedHashMap<String, String>> result = new LinkedHashMap<>();
        if (value == null || value.isBlank()) {
            return result;
        }
        try {
            JsonNode root = objectMapper.readTree(value);
            if (!root.isObject()) {
                return result;
            }
            root.fields().forEachRemaining(questionEntry -> {
                JsonNode questionMapping = questionEntry.getValue();
                if (!questionMapping.isObject()) {
                    return;
                }
                LinkedHashMap<String, String> mapping = new LinkedHashMap<>();
                questionMapping.fields().forEachRemaining(optionEntry -> {
                    JsonNode originalKey = optionEntry.getValue();
                    if (originalKey.isTextual() && !originalKey.asText().isBlank()) {
                        mapping.put(optionEntry.getKey(), originalKey.asText());
                    }
                });
                if (!mapping.isEmpty()) {
                    result.put(questionEntry.getKey(), mapping);
                }
            });
        } catch (Exception ignored) {
            // A corrupt legacy value is repaired by ensureOptionOrder.
        }
        return result;
    }

    private String writeMappings(Map<String, ? extends Map<String, String>> mappings) {
        try {
            return objectMapper.writeValueAsString(mappings);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to persist answer sheet option order", exception);
        }
    }

    private String normalizeJson(String value) {
        return value == null || value.isBlank() ? "{}" : value;
    }
}
