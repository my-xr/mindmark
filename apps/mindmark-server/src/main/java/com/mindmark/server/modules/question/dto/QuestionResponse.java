package com.mindmark.server.modules.question.dto;

import java.io.Serializable;

import com.fasterxml.jackson.databind.JsonNode;
import com.mindmark.server.modules.question.domain.Difficulty;
import com.mindmark.server.modules.question.domain.QuestionReviewAction;
import com.mindmark.server.modules.question.domain.QuestionSource;
import com.mindmark.server.modules.question.domain.QuestionStatus;
import com.mindmark.server.modules.question.domain.QuestionType;
import java.math.BigDecimal;
import java.util.List;

public record QuestionResponse(
    String id,
    String title,
    QuestionType type,
    Difficulty difficulty,
    String courseId,
    String courseName,
    String chapterId,
    Integer chapterNo,
    String chapterTitle,
    List<String> knowledgePoints,
    QuestionSource source,
    QuestionStatus status,
    BigDecimal score,
    JsonNode answer,
    String analysis,
    JsonNode options,
    JsonNode scoringPoints,
    String updatedAt,
    String createdBy,
    String reviewedBy,
    String reviewedAt,
    String reviewComment,
    QuestionReviewAction reviewAction
) implements Serializable {
}
