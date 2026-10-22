package com.mindmark.server.modules.ai.dto;

import java.time.OffsetDateTime;

public record AiProviderConnectionTestResponse(
    boolean success,
    String provider,
    String providerLabel,
    String baseUrl,
    String model,
    Long latencyMs,
    String message,
    String responsePreview,
    OffsetDateTime testedAt
) {
}