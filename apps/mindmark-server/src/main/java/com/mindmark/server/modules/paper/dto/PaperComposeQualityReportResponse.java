package com.mindmark.server.modules.paper.dto;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;

public record PaperComposeQualityReportResponse(
    BigDecimal targetScore,
    BigDecimal actualScore,
    Integer totalQuestionCount,
    Integer knowledgePointCount,
    List<PaperComposeDistributionItemResponse> typeDistribution,
    List<PaperComposeDistributionItemResponse> difficultyDistribution,
    List<PaperComposeDistributionItemResponse> chapterDistribution,
    List<PaperComposeDistributionItemResponse> knowledgePointDistribution,
    List<String> highlights,
    List<String> risks
) implements Serializable {}