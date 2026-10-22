const fs = require('fs');
function read(p){ return fs.readFileSync(p, 'utf8'); }
function write(p,s){ fs.writeFileSync(p, s, 'utf8'); }
let p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/domain/AiProviderSettingEntity.java';
let s=read(p);
s=s.replace(`    @Column(name = "encrypted_api_key", nullable = false, columnDefinition = "text")
    private String encryptedApiKey;

    @Column(name = "key_suffix", nullable = false, length = 12)
    private String keySuffix;
`, `    @Column(name = "encrypted_api_key", nullable = false, columnDefinition = "text")
    private String encryptedApiKey;

    @Column(name = "key_suffix", nullable = false, length = 12)
    private String keySuffix;

    @Column(name = "base_url", nullable = false, length = 512)
    private String baseUrl;

    @Column(nullable = false, length = 128)
    private String model;
`);
s=s.replace(`    public String getKeySuffix() { return keySuffix; }
    public void setKeySuffix(String keySuffix) { this.keySuffix = keySuffix; }
`, `    public String getKeySuffix() { return keySuffix; }
    public void setKeySuffix(String keySuffix) { this.keySuffix = keySuffix; }
    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
`);
write(p,s);
write('apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/dto/AiProviderSettingRequest.java', `package com.mindmark.server.modules.ai.dto;

public record AiProviderSettingRequest(
    String provider,
    String baseUrl,
    String model,
    String apiKey
) {
}
`);
write('apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/dto/AiProviderSettingResponse.java', `package com.mindmark.server.modules.ai.dto;

import java.time.OffsetDateTime;

public record AiProviderSettingResponse(
    String provider,
    String providerLabel,
    boolean configured,
    String keyPreview,
    String baseUrl,
    String model,
    OffsetDateTime updatedAt
) {
}
`);
write('apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/dto/AiProviderRuntimeConfig.java', `package com.mindmark.server.modules.ai.dto;

public record AiProviderRuntimeConfig(
    String provider,
    String apiKey,
    String baseUrl,
    String model
) {
}
`);
