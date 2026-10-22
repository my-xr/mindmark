package com.mindmark.server.modules.ai.dto;

public record AiProviderRuntimeConfig(
    String provider,
    String apiKey,
    String baseUrl,
    String model
) {
}
