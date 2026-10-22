package com.mindmark.server.modules.ai.dto;

import java.io.Serializable;

import com.mindmark.server.modules.question.domain.Difficulty;
import com.mindmark.server.modules.question.domain.QuestionType;

public record AiQuestionGenerateRequest(
    String courseId,
    String provider,
    String prompt,
    QuestionType questionType,
    Difficulty difficulty,
    Integer count,
    String knowledgePoint,
    String requirement
) implements Serializable {
}
