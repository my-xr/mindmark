package com.mindmark.server.modules.question.dto;

import java.util.List;

public record MarkdownQuestionImportResponse(
    int parsedCount,
    int importedCount,
    int skippedCount,
    List<String> warnings,
    List<QuestionResponse> importedQuestions
) {
}