package com.mindmark.server.modules.ai.dto;

import java.util.List;

public record QuestionImportRequest(List<QuestionCreateRequest> questions) {
}
