package com.mindmark.server.modules.paper.dto;

import java.math.BigDecimal;
import java.util.List;

public record PaperComposePreviewResponse(
    String paperId,
    PaperComposeMode mode,
    PaperComposeStrategy strategy,
    BigDecimal targetScore,
    BigDecimal currentScore,
    BigDecimal plannedAddedScore,
    BigDecimal plannedFinalScore,
    Integer plannedAddedCount,
    Boolean ready,
    List<PaperComposeGapResponse> gaps,
    List<String> warnings,
    PaperComposeQualityReportResponse qualityReport,
    PaperComposeAgentPlanResponse agentPlan
) {}