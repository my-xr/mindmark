package com.mindmark.server.modules.score.dto;

public record ScoreBandSummaryResponse(
    String key,
    String label,
    Integer minPercent,
    Integer maxPercent,
    Integer count
) {
}