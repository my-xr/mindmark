package com.mindmark.server.modules.audit.dto;

import com.mindmark.server.modules.audit.domain.ExamSecurityEventType;
import com.mindmark.server.modules.audit.domain.ExamSecuritySeverity;
import java.time.OffsetDateTime;

public record ExamSecurityEventResponse(
    String id,
    String examId,
    String answerSheetId,
    String studentId,
    String studentName,
    ExamSecurityEventType eventType,
    ExamSecuritySeverity severity,
    String message,
    Integer clientEventCount,
    OffsetDateTime clientOccurredAt,
    OffsetDateTime serverReceivedAt,
    String userAgent
) {
}
