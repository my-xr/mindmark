package com.mindmark.server.modules.ai.dto;

import java.io.Serializable;

import com.fasterxml.jackson.databind.JsonNode;
import com.mindmark.server.modules.question.domain.Difficulty;
import com.mindmark.server.modules.question.domain.QuestionType;
import java.math.BigDecimal;
import java.util.List;

public record QuestionCreateRequest(
    String courseId,
    String chapterId,
    String title,
    QuestionType type,
    Difficulty difficulty,
    List<String> knowledgePoints,
    BigDecimal score,
    JsonNode answer,
    String analysis,
    JsonNode options,
    JsonNode scoringPoints
) implements Serializable {
}
