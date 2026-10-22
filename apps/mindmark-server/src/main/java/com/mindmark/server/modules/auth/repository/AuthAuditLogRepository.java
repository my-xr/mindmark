package com.mindmark.server.modules.auth.repository;

import com.mindmark.server.modules.auth.domain.AuthAuditLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AuthAuditLogRepository extends JpaRepository<AuthAuditLogEntity, String>, JpaSpecificationExecutor<AuthAuditLogEntity> {
}