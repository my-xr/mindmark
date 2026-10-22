package com.mindmark.server.modules.paper.dto;

import java.io.Serializable;
import java.math.BigDecimal;

public record PaperComposeDistributionItemResponse(
    String key,
    String label,
    Integer count,
    BigDecimal score,
    BigDecimal percentage
) implements Serializable {}