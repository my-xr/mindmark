package com.mindmark.server.modules.review.dto;

public record StudentLayerInsightResponse(
    String layer,
    Integer count,
    String suggestion
) {
}
