package com.mindmark.server.modules.review.dto;

import com.mindmark.server.modules.review.domain.LectureDraftStatus;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record AiLectureDraftResponse(
    String id,
    String examId,
    String title,
    LectureDraftStatus status,
    OffsetDateTime generatedAt,
    String provider,
    BigDecimal confidence,
    List<String> riskLabels,
    List<String> outline,
    String content,
    String teacherEditedContent,
    OffsetDateTime approvedAt,
    String artifactId
) {
}
