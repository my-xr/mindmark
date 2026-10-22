package com.mindmark.server.modules.review.dto;

import java.math.BigDecimal;

public record ScoreBandResponse(
    String label,
    Integer count,
    BigDecimal ratio
) {
}
