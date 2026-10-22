package com.mindmark.server.modules.answer.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.time.OffsetDateTime;
import java.util.List;

public record SaveAnswerDraftRequest(
    @NotEmpty List<@Valid AnswerItemRequest> answers,
    OffsetDateTime clientSavedAt,
    Integer expectedVersion
) {
}
