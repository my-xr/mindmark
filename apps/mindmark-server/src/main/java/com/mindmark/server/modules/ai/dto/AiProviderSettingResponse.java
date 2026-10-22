package com.mindmark.server.modules.ai.dto;

import java.time.OffsetDateTime;

public record AiProviderSettingResponse(
    String provider,
    String providerLabel,
    boolean configured,
    String keyPreview,
    String baseUrl,
    String model,
    OffsetDateTime updatedAt
) {
}
