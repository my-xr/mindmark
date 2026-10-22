from pathlib import Path
p=Path('apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/domain/AiProviderSettingEntity.java')
s=p.read_text(encoding='utf-8')
s=s.replace('''    @Column(name = "encrypted_api_key", nullable = false, columnDefinition = "text")
    private String encryptedApiKey;

    @Column(name = "key_suffix", nullable = false, length = 12)
    private String keySuffix;
''','''    @Column(name = "encrypted_api_key", nullable = false, columnDefinition = "text")
    private String encryptedApiKey;

    @Column(name = "key_suffix", nullable = false, length = 12)
    private String keySuffix;

    @Column(name = "base_url", nullable = false, length = 512)
    private String baseUrl;

    @Column(nullable = false, length = 128)
    private String model;
''')
s=s.replace('''    public String getKeySuffix() { return keySuffix; }
    public void setKeySuffix(String keySuffix) { this.keySuffix = keySuffix; }
''','''    public String getKeySuffix() { return keySuffix; }
    public void setKeySuffix(String keySuffix) { this.keySuffix = keySuffix; }
    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
''')
p.write_text(s, encoding='utf-8')

Path('apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/dto/AiProviderSettingRequest.java').write_text('''package com.mindmark.server.modules.ai.dto;

public record AiProviderSettingRequest(
    String provider,
    String baseUrl,
    String model,
    String apiKey
) {
}
''', encoding='utf-8')
Path('apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/dto/AiProviderSettingResponse.java').write_text('''package com.mindmark.server.modules.ai.dto;

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
''', encoding='utf-8')
Path('apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/dto/AiProviderRuntimeConfig.java').write_text('''package com.mindmark.server.modules.ai.dto;

public record AiProviderRuntimeConfig(
    String provider,
    String apiKey,
    String baseUrl,
    String model
) {
}
''', encoding='utf-8')
