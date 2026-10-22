package com.mindmark.server.modules.ai.dto;

public record AiProviderConnectionTestRequest(
    String provider,
    String baseUrl,
    String model,
    String apiKey
) {
}