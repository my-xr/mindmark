package com.mindmark.server.common.config;

import jakarta.annotation.PostConstruct;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/** Fails fast when a production profile is pointed at local infrastructure. */
@Component
@Profile("prod")
public class ProductionConfigurationValidator {

    private static final String LOCAL_AI_SECRET = "mindmark-local-ai-key-secret";
    private static final String LOCAL_MINIO_ACCESS_KEY = "minioadmin";
    private static final String LOCAL_MINIO_SECRET_KEY = "minioadmin123";

    private final String databaseUrl;
    private final String databaseUsername;
    private final String databasePassword;
    private final String redisHost;
    private final String redisPassword;
    private final String aiKeySecret;
    private final String minioEndpoint;
    private final String minioAccessKey;
    private final String minioSecretKey;
    private final String minioBucket;
    private final boolean strictSecrets;
    private final boolean openApiEnabled;
    private final String actuatorEndpoints;

    public ProductionConfigurationValidator(
        @Value("${spring.datasource.url}") String databaseUrl,
        @Value("${spring.datasource.username}") String databaseUsername,
        @Value("${spring.datasource.password}") String databasePassword,
        @Value("${spring.data.redis.host}") String redisHost,
        @Value("${spring.data.redis.password:}") String redisPassword,
        @Value("${mindmark.ai.key-secret}") String aiKeySecret,
        @Value("${mindmark.storage.minio.endpoint}") String minioEndpoint,
        @Value("${mindmark.storage.minio.access-key}") String minioAccessKey,
        @Value("${mindmark.storage.minio.secret-key}") String minioSecretKey,
        @Value("${mindmark.storage.minio.bucket}") String minioBucket,
        @Value("${mindmark.security.strict-secrets:true}") boolean strictSecrets,
        @Value("${springdoc.api-docs.enabled:false}") boolean openApiEnabled,
        @Value("${management.endpoints.web.exposure.include:health}") String actuatorEndpoints
    ) {
        this.databaseUrl = databaseUrl;
        this.databaseUsername = databaseUsername;
        this.databasePassword = databasePassword;
        this.redisHost = redisHost;
        this.redisPassword = redisPassword;
        this.aiKeySecret = aiKeySecret;
        this.minioEndpoint = minioEndpoint;
        this.minioAccessKey = minioAccessKey;
        this.minioSecretKey = minioSecretKey;
        this.minioBucket = minioBucket;
        this.strictSecrets = strictSecrets;
        this.openApiEnabled = openApiEnabled;
        this.actuatorEndpoints = actuatorEndpoints;
    }

    @PostConstruct
    void validate() {
        require(strictSecrets, "mindmark.security.strict-secrets must remain true");
        require(!isBlank(databaseUrl), "a production database URL is required");
        require(!isLocalHost(databaseUrl), "the production database URL cannot point to localhost");
        require(!containsDatabaseName(databaseUrl, "/postgres"), "the production database cannot be postgres");
        require(!isBlank(databaseUsername), "a production database username is required");
        require(!"postgres".equalsIgnoreCase(trim(databaseUsername)), "the local postgres user is not allowed in production");
        require(!isBlank(databasePassword) && !"123456".equals(databasePassword), "a non-default database password is required");

        require(!isBlank(redisHost) && !isLocalHost(redisHost), "a non-local Redis host is required");
        require(!isBlank(redisPassword), "a Redis password is required in production");

        require(!isBlank(aiKeySecret) && aiKeySecret.trim().length() >= 32, "a 32-character AI encryption secret is required");
        require(!LOCAL_AI_SECRET.equals(trim(aiKeySecret)), "the local AI encryption secret is not allowed in production");

        require(!isBlank(minioEndpoint) && !isLocalHost(minioEndpoint), "a non-local MinIO endpoint is required");
        require(!isBlank(minioAccessKey) && !LOCAL_MINIO_ACCESS_KEY.equals(trim(minioAccessKey)), "a non-default MinIO access key is required");
        require(!isBlank(minioSecretKey) && !LOCAL_MINIO_SECRET_KEY.equals(trim(minioSecretKey)), "a non-default MinIO secret key is required");
        require(!isBlank(minioBucket), "a MinIO bucket is required");

        require(!openApiEnabled, "OpenAPI must be disabled in the production profile");
        require(onlyHealthEndpointExposed(actuatorEndpoints), "only the health actuator endpoint may be exposed");
    }

    private boolean onlyHealthEndpointExposed(String endpoints) {
        if (isBlank(endpoints)) {
            return true;
        }
        return "health".equalsIgnoreCase(endpoints.trim());
    }

    private boolean containsDatabaseName(String url, String suffix) {
        String normalized = url == null ? "" : url.toLowerCase(Locale.ROOT).split("\\?", 2)[0];
        return normalized.endsWith(suffix);
    }

    private boolean isLocalHost(String value) {
        String normalized = value == null ? "" : value.toLowerCase(Locale.ROOT);
        return normalized.contains("localhost")
            || normalized.contains("127.0.0.1")
            || normalized.contains("[::1]")
            || normalized.contains("0:0:0:0:0:0:0:1");
    }

    private void require(boolean condition, String message) {
        if (!condition) {
            throw new IllegalStateException("Production configuration rejected: " + message);
        }
    }

    private String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
