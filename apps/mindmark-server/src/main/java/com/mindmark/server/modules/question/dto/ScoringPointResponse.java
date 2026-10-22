package com.mindmark.server.modules.question.dto;

import java.math.BigDecimal;
import java.util.List;

public record ScoringPointResponse(String id, String description, BigDecimal score, List<String> keywords, boolean required) {
}
