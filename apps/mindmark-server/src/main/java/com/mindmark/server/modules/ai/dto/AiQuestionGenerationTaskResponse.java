package com.mindmark.server.modules.ai.dto;

import com.mindmark.server.modules.ai.domain.AiQuestionGenerationTaskStatus;
import com.mindmark.server.modules.question.domain.Difficulty;
import com.mindmark.server.modules.question.domain.QuestionType;
import java.time.OffsetDateTime;
import java.util.List;

public record AiQuestionGenerationTaskResponse(
    String id,
    AiQuestionGenerationTaskStatus status,
    String provider,
    String courseId,
    String courseName,
    String prompt,
    QuestionType questionType,
    Difficulty difficulty,
    Integer count,
    String knowledgePoint,
    String requirement,
    String teacherName,
    Integer generatedCount,
    List<String> generatedQuestionIds,
    String errorMessage,
    OffsetDateTime requestedAt,
    OffsetDateTime startedAt,
    OffsetDateTime finishedAt,
    OffsetDateTime updatedAt
) {
}