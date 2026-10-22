package com.mindmark.server.modules.ai.dto;

public record AiProviderSettingRequest(
    String provider,
    String baseUrl,
    String model,
    String apiKey
) {
}
