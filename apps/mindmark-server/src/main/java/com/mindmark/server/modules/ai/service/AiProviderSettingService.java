package com.mindmark.server.modules.ai.service;

import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.ai.domain.AiProviderSettingEntity;
import com.mindmark.server.modules.ai.dto.AiProviderConnectionTestRequest;
import com.mindmark.server.modules.ai.dto.AiProviderRuntimeConfig;
import com.mindmark.server.modules.ai.dto.AiProviderSettingRequest;
import com.mindmark.server.modules.ai.dto.AiProviderSettingResponse;
import com.mindmark.server.modules.ai.repository.AiProviderSettingRepository;
import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AiProviderSettingService {

    public static final String OPENAI_PROVIDER = "OPENAI";
    public static final String ANTHROPIC_PROVIDER = "ANTHROPIC";

    private static final Set<String> SUPPORTED_PROVIDERS = Set.of(OPENAI_PROVIDER, ANTHROPIC_PROVIDER);
    private static final Map<String, String> PROVIDER_LABELS = Map.of(
        OPENAI_PROVIDER, "OpenAI",
        ANTHROPIC_PROVIDER, "Anthropic"
    );

    private final AiProviderSettingRepository settingRepository;
    private final AiKeyCipher aiKeyCipher;
    private final String defaultProvider;
    private final String globalOpenAiApiKey;
    private final String globalAnthropicApiKey;
    private final String defaultOpenAiBaseUrl;
    private final String defaultOpenAiModel;
    private final String legacyKimiApiKey;
    private final String legacyKimiBaseUrl;
    private final String legacyKimiModel;
    private final String defaultAnthropicBaseUrl;
    private final String defaultAnthropicModel;
    private final boolean allowPrivateBaseUrl;

    public AiProviderSettingService(
        AiProviderSettingRepository settingRepository,
        AiKeyCipher aiKeyCipher,
        @Value("${mindmark.ai.question.default-provider:OPENAI}") String defaultProvider,
        @Value("${mindmark.ai.openai.api-key:}") String globalOpenAiApiKey,
        @Value("${mindmark.ai.anthropic.api-key:}") String globalAnthropicApiKey,
        @Value("${mindmark.ai.openai.base-url:https://api.openai.com/v1}") String defaultOpenAiBaseUrl,
        @Value("${mindmark.ai.openai.model:gpt-4.1-mini}") String defaultOpenAiModel,
        @Value("${mindmark.ai.kimi.api-key:}") String legacyKimiApiKey,
        @Value("${mindmark.ai.kimi.base-url:https://api.moonshot.cn/v1}") String legacyKimiBaseUrl,
        @Value("${mindmark.ai.kimi.model:kimi-k2.6}") String legacyKimiModel,
        @Value("${mindmark.ai.anthropic.base-url:https://api.anthropic.com/v1}") String defaultAnthropicBaseUrl,
        @Value("${mindmark.ai.anthropic.model:claude-3-5-sonnet-latest}") String defaultAnthropicModel,
        @Value("${mindmark.ai.provider.allow-private-base-url:false}") boolean allowPrivateBaseUrl
    ) {
        this.settingRepository = settingRepository;
        this.aiKeyCipher = aiKeyCipher;
        this.defaultProvider = normalizeProviderOrDefault(defaultProvider);
        this.globalOpenAiApiKey = normalize(globalOpenAiApiKey);
        this.globalAnthropicApiKey = normalize(globalAnthropicApiKey);
        this.defaultOpenAiBaseUrl = trimTrailingSlash(defaultOpenAiBaseUrl);
        this.defaultOpenAiModel = normalizeOrFallback(defaultOpenAiModel, "gpt-4.1-mini");
        this.legacyKimiApiKey = normalize(legacyKimiApiKey);
        this.legacyKimiBaseUrl = trimTrailingSlash(legacyKimiBaseUrl);
        this.legacyKimiModel = normalizeOrFallback(legacyKimiModel, "kimi-k2.6");
        this.defaultAnthropicBaseUrl = trimTrailingSlash(defaultAnthropicBaseUrl);
        this.defaultAnthropicModel = normalizeOrFallback(defaultAnthropicModel, "claude-3-5-sonnet-latest");
        this.allowPrivateBaseUrl = allowPrivateBaseUrl;
    }

    @Transactional(readOnly = true)
    public AiProviderSettingResponse getSetting(String teacherId, String provider) {
        String normalizedProvider = normalizeProviderOrDefault(provider);
        return settingRepository.findByTeacherIdAndProvider(teacherId, normalizedProvider)
            .map(this::toResponse)
            .orElseGet(() -> globalResponse(normalizedProvider));
    }

    @Transactional
    public AiProviderSettingResponse saveSetting(String teacherId, AiProviderSettingRequest request) {
        String provider = normalizeProviderOrDefault(request == null ? null : request.provider());
        String apiKey = request == null ? null : normalize(request.apiKey());
        String baseUrl = normalizeBaseUrl(request == null ? null : request.baseUrl(), provider);
        String model = normalizeModel(request == null ? null : request.model(), provider);
        OffsetDateTime now = OffsetDateTime.now();
        AiProviderSettingEntity setting = settingRepository.findByTeacherIdAndProvider(teacherId, provider)
            .orElseGet(() -> {
                AiProviderSettingEntity created = new AiProviderSettingEntity();
                created.setId(teacherId + ":" + provider);
                created.setTeacherId(teacherId);
                created.setProvider(provider);
                created.setCreatedAt(now);
                return created;
            });

        if (hasText(apiKey)) {
            setting.setEncryptedApiKey(aiKeyCipher.encrypt(apiKey));
            setting.setKeySuffix(suffix(apiKey));
        } else if (!hasText(setting.getEncryptedApiKey())) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, providerLabel(provider) + " API key is required for first save");
        }

        setting.setBaseUrl(baseUrl);
        setting.setModel(model);
        setting.setUpdatedAt(now);
        return toResponse(settingRepository.save(setting));
    }

    @Transactional(readOnly = true)
    public AiProviderRuntimeConfig resolveRuntimeConfig(String teacherId, String provider) {
        String normalizedProvider = normalizeProviderOrDefault(provider);
        return settingRepository.findByTeacherIdAndProvider(teacherId, normalizedProvider)
            .map(setting -> new AiProviderRuntimeConfig(
                normalizedProvider,
                aiKeyCipher.decrypt(setting.getEncryptedApiKey()),
                normalizeBaseUrl(setting.getBaseUrl(), normalizedProvider),
                normalizeModel(setting.getModel(), normalizedProvider)
            ))
            .orElseGet(() -> {
                String runtimeApiKey = resolveRuntimeApiKey(normalizedProvider);
                if (!hasText(runtimeApiKey)) {
                    throw new BusinessException(
                        ErrorCode.VALIDATION_ERROR,
                        providerLabel(normalizedProvider) + " API key is not configured for current teacher"
                    );
                }
                return new AiProviderRuntimeConfig(
                    normalizedProvider,
                    runtimeApiKey,
                    runtimeDefaultBaseUrl(normalizedProvider),
                    runtimeDefaultModel(normalizedProvider)
                );
            });
    }

    @Transactional(readOnly = true)
    public AiProviderRuntimeConfig buildAdHocRuntimeConfig(String teacherId, AiProviderConnectionTestRequest request) {
        String provider = normalizeProviderOrDefault(request == null ? null : request.provider());
        String baseUrl = normalizeBaseUrl(request == null ? null : request.baseUrl(), provider);
        String model = normalizeModel(request == null ? null : request.model(), provider);
        String apiKey = normalize(request == null ? null : request.apiKey());
        if (!hasText(apiKey)) {
            apiKey = settingRepository.findByTeacherIdAndProvider(teacherId, provider)
                .map(setting -> aiKeyCipher.decrypt(setting.getEncryptedApiKey()))
                .orElseGet(() -> resolveRuntimeApiKey(provider));
        }
        if (!hasText(apiKey)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, providerLabel(provider) + " API key is required for connection test");
        }
        return new AiProviderRuntimeConfig(provider, apiKey, baseUrl, model);
    }

    public String defaultProvider() {
        return defaultProvider;
    }

    public String normalizeProviderOrDefault(String provider) {
        if (!hasText(provider)) {
            return defaultProvider == null ? OPENAI_PROVIDER : defaultProvider;
        }
        String normalized = provider.trim().toUpperCase();
        if ("KIMI".equals(normalized)) {
            return OPENAI_PROVIDER;
        }
        if (!SUPPORTED_PROVIDERS.contains(normalized)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Unsupported AI provider: " + provider);
        }
        return normalized;
    }

    private AiProviderSettingResponse globalResponse(String provider) {
        boolean useLegacyKimiFallback = OPENAI_PROVIDER.equals(provider)
            && !hasText(globalOpenAiApiKey)
            && hasText(legacyKimiApiKey);
        String globalKey = useLegacyKimiFallback ? legacyKimiApiKey : globalApiKey(provider);
        String baseUrl = useLegacyKimiFallback ? legacyKimiBaseUrl : defaultBaseUrl(provider);
        String model = useLegacyKimiFallback ? legacyKimiModel : defaultModel(provider);
        return new AiProviderSettingResponse(
            provider,
            providerLabel(provider),
            hasText(globalKey),
            hasText(globalKey) ? mask(globalKey) : null,
            baseUrl,
            model,
            null
        );
    }

    private AiProviderSettingResponse toResponse(AiProviderSettingEntity setting) {
        return new AiProviderSettingResponse(
            setting.getProvider(),
            providerLabel(setting.getProvider()),
            true,
            "****" + setting.getKeySuffix(),
            normalizeBaseUrl(setting.getBaseUrl(), setting.getProvider()),
            normalizeModel(setting.getModel(), setting.getProvider()),
            setting.getUpdatedAt()
        );
    }

    private String globalApiKey(String provider) {
        if (ANTHROPIC_PROVIDER.equals(provider)) {
            return globalAnthropicApiKey;
        }
        return globalOpenAiApiKey;
    }

    private String defaultBaseUrl(String provider) {
        return ANTHROPIC_PROVIDER.equals(provider) ? defaultAnthropicBaseUrl : defaultOpenAiBaseUrl;
    }

    private String defaultModel(String provider) {
        return ANTHROPIC_PROVIDER.equals(provider) ? defaultAnthropicModel : defaultOpenAiModel;
    }

    private String runtimeDefaultBaseUrl(String provider) {
        if (ANTHROPIC_PROVIDER.equals(provider)) {
            return defaultAnthropicBaseUrl;
        }
        if (hasText(globalOpenAiApiKey)) {
            return defaultOpenAiBaseUrl;
        }
        if (hasText(legacyKimiApiKey)) {
            return legacyKimiBaseUrl;
        }
        return defaultOpenAiBaseUrl;
    }

    private String runtimeDefaultModel(String provider) {
        if (ANTHROPIC_PROVIDER.equals(provider)) {
            return defaultAnthropicModel;
        }
        if (hasText(globalOpenAiApiKey)) {
            return defaultOpenAiModel;
        }
        if (hasText(legacyKimiApiKey)) {
            return legacyKimiModel;
        }
        return defaultOpenAiModel;
    }

    private String resolveRuntimeApiKey(String provider) {
        if (ANTHROPIC_PROVIDER.equals(provider)) {
            return globalAnthropicApiKey;
        }
        if (hasText(globalOpenAiApiKey)) {
            return globalOpenAiApiKey;
        }
        if (hasText(legacyKimiApiKey)) {
            return legacyKimiApiKey;
        }
        return globalOpenAiApiKey;
    }
    public String providerLabel(String provider) {
        return PROVIDER_LABELS.getOrDefault(provider, provider);
    }

    private String normalizeBaseUrl(String value, String provider) {
        String normalized = trimTrailingSlash(value);
        if (!hasText(normalized)) {
            normalized = defaultBaseUrl(provider);
        }
        try {
            URI uri = URI.create(normalized);
            String scheme = uri.getScheme();
            String host = uri.getHost();
            if ((! "https".equalsIgnoreCase(scheme) && ! "http".equalsIgnoreCase(scheme))
                || host == null
                || uri.getUserInfo() != null
                || uri.getQuery() != null
                || uri.getFragment() != null) {
                throw new BusinessException(
                    ErrorCode.VALIDATION_ERROR,
                    "AI Provider server URL must be an http(s) URL without credentials, query or fragment"
                );
            }
            if (!allowPrivateBaseUrl && isPrivateOrLocalHost(host)) {
                throw new BusinessException(
                    ErrorCode.VALIDATION_ERROR,
                    "AI Provider server URL cannot target localhost or a private network"
                );
            }
        } catch (IllegalArgumentException exception) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "AI Provider server URL is invalid");
        }
        return normalized;
    }

    private boolean isPrivateOrLocalHost(String host) {
        String normalizedHost = host.trim().toLowerCase();
        if (normalizedHost.equals("localhost")
            || normalizedHost.endsWith(".localhost")
            || normalizedHost.endsWith(".local")
            || normalizedHost.endsWith(".internal")) {
            return true;
        }
        try {
            for (InetAddress address : InetAddress.getAllByName(normalizedHost)) {
                if (address.isAnyLocalAddress()
                    || address.isLoopbackAddress()
                    || address.isLinkLocalAddress()
                    || address.isSiteLocalAddress()
                    || address.isMulticastAddress()) {
                    return true;
                }
            }
            return false;
        } catch (UnknownHostException exception) {
            throw new BusinessException(
                ErrorCode.VALIDATION_ERROR,
                "AI Provider server URL host cannot be resolved"
            );
        }
    }

    private String normalizeModel(String value, String provider) {
        return normalizeOrFallback(value, defaultModel(provider));
    }

    private String normalizeOrFallback(String value, String fallback) {
        String normalized = normalize(value);
        return hasText(normalized) ? normalized : fallback;
    }

    private String suffix(String apiKey) {
        return apiKey.length() <= 6 ? apiKey : apiKey.substring(apiKey.length() - 6);
    }

    private String mask(String apiKey) {
        return "****" + suffix(apiKey);
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String trimTrailingSlash(String value) {
        String normalized = normalize(value);
        if (normalized == null) {
            return null;
        }
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
