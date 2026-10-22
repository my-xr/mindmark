package com.mindmark.server.modules.paper.dto;

import com.mindmark.server.modules.question.domain.QuestionType;
import java.util.List;

public record PaperComposeGapResponse(
    QuestionType type,
    Integer requiredCount,
    Integer availableCount,
    List<String> knowledgePoints,
    String message
) {
}
