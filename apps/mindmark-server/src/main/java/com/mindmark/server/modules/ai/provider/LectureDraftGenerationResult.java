package com.mindmark.server.modules.ai.provider;

import java.math.BigDecimal;
import java.util.List;

public record LectureDraftGenerationResult(
    String provider,
    BigDecimal confidence,
    List<String> riskLabels,
    List<String> outline,
    String content,
    String promptSnapshot
) {
    public LectureDraftGenerationResult withProvider(String provider) {
        return new LectureDraftGenerationResult(provider, confidence, riskLabels, outline, content, promptSnapshot);
    }
}
