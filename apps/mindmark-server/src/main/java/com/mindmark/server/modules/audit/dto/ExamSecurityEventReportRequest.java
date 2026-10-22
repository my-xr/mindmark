package com.mindmark.server.modules.audit.dto;

import com.mindmark.server.modules.audit.domain.ExamSecurityEventType;
import java.time.OffsetDateTime;

public record ExamSecurityEventReportRequest(
    ExamSecurityEventType eventType,
    String message,
    Integer clientEventCount,
    OffsetDateTime clientOccurredAt
) {
}
