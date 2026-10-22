package com.mindmark.server.modules.ai.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "ai_provider_setting")
public class AiProviderSettingEntity {

    @Id
    @Column(length = 128)
    private String id;

    @Column(name = "teacher_id", nullable = false, length = 64)
    private String teacherId;

    @Column(nullable = false, length = 32)
    private String provider;

    @Column(name = "encrypted_api_key", nullable = false, columnDefinition = "text")
    private String encryptedApiKey;

    @Column(name = "key_suffix", nullable = false, length = 12)
    private String keySuffix;

    @Column(name = "base_url", nullable = false, length = 512)
    private String baseUrl;

    @Column(nullable = false, length = 128)
    private String model;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTeacherId() { return teacherId; }
    public void setTeacherId(String teacherId) { this.teacherId = teacherId; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getEncryptedApiKey() { return encryptedApiKey; }
    public void setEncryptedApiKey(String encryptedApiKey) { this.encryptedApiKey = encryptedApiKey; }
    public String getKeySuffix() { return keySuffix; }
    public void setKeySuffix(String keySuffix) { this.keySuffix = keySuffix; }
    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
