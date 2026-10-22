package com.mindmark.server.modules.auth.dto;

import java.time.OffsetDateTime;

public record AuthAuditLogResponse(
    String id,
    String actorId,
    String action,
    String targetUserId,
    String result,
    String detail,
    OffsetDateTime createdAt
) {
}