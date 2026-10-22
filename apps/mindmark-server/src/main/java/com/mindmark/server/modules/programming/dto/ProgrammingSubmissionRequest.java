package com.mindmark.server.modules.programming.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProgrammingSubmissionRequest(
    @NotBlank String questionId,
    @NotBlank @Size(max = 32) String language,
    @NotBlank String sourceCode
) {
}
