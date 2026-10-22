package com.mindmark.server.modules.paper.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import java.math.BigDecimal;
import java.util.List;

public record PaperComposeRequest(
    @DecimalMin("0.1") BigDecimal targetScore,
    PaperComposeMode mode,
    @Valid List<PaperComposeRuleRequest> rules
) {
}

