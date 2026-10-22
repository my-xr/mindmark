package com.mindmark.server.modules.auth.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "auth_audit_log")
public class AuthAuditLogEntity {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "actor_id", nullable = false, length = 64)
    private String actorId;

    @Column(nullable = false, length = 64)
    private String action;

    @Column(name = "target_user_id", length = 160)
    private String targetUserId;

    @Column(nullable = false, length = 32)
    private String result;

    @Column(columnDefinition = "text")
    private String detail;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getActorId() { return actorId; }
    public void setActorId(String actorId) { this.actorId = actorId; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getTargetUserId() { return targetUserId; }
    public void setTargetUserId(String targetUserId) { this.targetUserId = targetUserId; }
    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }
    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
