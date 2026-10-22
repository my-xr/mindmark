package com.mindmark.server.modules.auth.service;

import com.mindmark.server.modules.auth.domain.AuthAuditLogEntity;
import com.mindmark.server.modules.auth.repository.AuthAuditLogRepository;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class AuthAuditService {

    private final AuthAuditLogRepository authAuditLogRepository;

    public AuthAuditService(AuthAuditLogRepository authAuditLogRepository) {
        this.authAuditLogRepository = authAuditLogRepository;
    }

    public void record(String actorId, String action, String targetUserId, String result, String detail) {
        AuthAuditLogEntity auditLog = new AuthAuditLogEntity();
        auditLog.setId("audit-" + UUID.randomUUID());
        auditLog.setActorId(actorId == null || actorId.isBlank() ? "anonymous" : actorId);
        auditLog.setAction(action);
        auditLog.setTargetUserId(targetUserId);
        auditLog.setResult(result);
        auditLog.setDetail(detail);
        auditLog.setCreatedAt(OffsetDateTime.now());
        authAuditLogRepository.save(auditLog);
    }
}
