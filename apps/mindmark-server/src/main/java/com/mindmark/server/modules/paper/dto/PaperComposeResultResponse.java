package com.mindmark.server.modules.paper.dto;

import java.math.BigDecimal;
import java.util.List;

public record PaperComposeResultResponse(
    PaperResponse paper,
    Integer addedCount,
    BigDecimal addedScore,
    BigDecimal targetScore,
    BigDecimal actualScore,
    PaperComposeMode mode,
    PaperComposeStrategy strategy,
    List<PaperComposeGapResponse> gaps,
    List<String> warnings,
    PaperComposeQualityReportResponse qualityReport,
    PaperComposeAgentPlanResponse agentPlan
) {
}