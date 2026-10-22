package com.mindmark.server.modules.question.dto;

import com.mindmark.server.modules.question.domain.Difficulty;
import com.mindmark.server.modules.question.domain.QuestionSource;
import com.mindmark.server.modules.question.domain.QuestionStatus;
import com.mindmark.server.modules.question.domain.QuestionType;

public record QuestionQuery(
    String keyword,
    QuestionType type,
    Difficulty difficulty,
    QuestionStatus status,
    QuestionSource source,
    String courseId,
    String chapterId,
    Integer chapterFromNo,
    Integer chapterToNo,
    String knowledgePoint,
    String excludePaperId,
    int page,
    int pageSize
) {
}
