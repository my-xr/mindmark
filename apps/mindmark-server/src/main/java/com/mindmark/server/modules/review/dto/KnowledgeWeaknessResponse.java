package com.mindmark.server.modules.review.dto;

import java.math.BigDecimal;

public record KnowledgeWeaknessResponse(
    String knowledgePoint,
    BigDecimal scoreRate,
    String level,
    String suggestion
) {
}
