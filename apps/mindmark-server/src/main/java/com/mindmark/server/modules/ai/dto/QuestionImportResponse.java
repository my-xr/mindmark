package com.mindmark.server.modules.ai.dto;

import com.mindmark.server.modules.question.dto.QuestionResponse;
import java.util.List;

public record QuestionImportResponse(
    int importedCount,
    int skippedCount,
    List<QuestionResponse> importedQuestions
) {
}
