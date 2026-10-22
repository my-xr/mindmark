package com.mindmark.server.modules.storage.service;

import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.http.Method;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ReviewArtifactStorageService {

    private static final String DEFAULT_ACCESS_KEY = "minioadmin";
    private static final String DEFAULT_SECRET_KEY = "minioadmin123";

    private final String endpoint;
    private final String accessKey;
    private final String secretKey;
    private final String bucket;
    private final Path localRoot;

    public ReviewArtifactStorageService(
        @Value("${mindmark.storage.minio.endpoint}") String endpoint,
        @Value("${mindmark.storage.minio.access-key}") String accessKey,
        @Value("${mindmark.storage.minio.secret-key}") String secretKey,
        @Value("${mindmark.storage.minio.bucket}") String bucket,
        @Value("${mindmark.storage.local-root:}") String localRoot,
        @Value("${mindmark.security.strict-secrets:false}") boolean strictSecrets
    ) {
        validateCredentials(endpoint, accessKey, secretKey, bucket, strictSecrets);
        this.endpoint = endpoint;
        this.accessKey = accessKey;
        this.secretKey = secretKey;
        this.bucket = bucket;
        this.localRoot = resolveLocalRoot(localRoot);
    }

    private void validateCredentials(
        String endpoint,
        String accessKey,
        String secretKey,
        String bucket,
        boolean strictSecrets
    ) {
        if (!strictSecrets) {
            return;
        }
        if (isBlank(endpoint) || isBlank(accessKey) || isBlank(secretKey) || isBlank(bucket)
            || DEFAULT_ACCESS_KEY.equals(accessKey.trim())
            || DEFAULT_SECRET_KEY.equals(secretKey.trim())) {
            throw new IllegalStateException(
                "Production MinIO endpoint, bucket and non-default credentials are required"
            );
        }
    }

    public StoredObject putText(String objectKey, String contentType, String content) {
        return putBytes(objectKey, contentType, content.getBytes(StandardCharsets.UTF_8));
    }

    public StoredObject putBytes(String objectKey, String contentType, byte[] bytes) {
        try {
            MinioClient client = client();
            ensureBucket(client);
            client.putObject(
                PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .contentType(contentType)
                    .stream(new ByteArrayInputStream(bytes), bytes.length, -1)
                    .build()
            );
            return new StoredObject(objectKey, (long) bytes.length, sha256(bytes));
        } catch (Exception exception) {
            return putBytesLocally(objectKey, bytes);
        }
    }

    public String presignedGetUrl(String objectKey) {
        try {
            return client().getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket(bucket)
                    .object(objectKey)
                    .expiry((int) Duration.ofHours(1).toSeconds())
                    .build()
            );
        } catch (Exception exception) {
            return null;
        }
    }

    public byte[] getBytes(String objectKey) {
        try (var stream = client().getObject(
            GetObjectArgs.builder()
                .bucket(bucket)
                .object(objectKey)
                .build()
        ); var output = new ByteArrayOutputStream()) {
            stream.transferTo(output);
            return output.toByteArray();
        } catch (Exception exception) {
            return getBytesLocally(objectKey, exception);
        }
    }

    private MinioClient client() {
        if (isBlank(endpoint) || isBlank(accessKey) || isBlank(secretKey) || isBlank(bucket)) {
            throw new IllegalStateException("MinIO storage credentials are not configured");
        }
        return MinioClient.builder()
            .endpoint(endpoint)
            .credentials(accessKey, secretKey)
            .build();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private void ensureBucket(MinioClient client) throws Exception {
        boolean exists = client.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
        if (!exists) {
            client.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
        }
    }

    private StoredObject putBytesLocally(String objectKey, byte[] bytes) {
        try {
            Path target = localPath(objectKey);
            Files.createDirectories(target.getParent());
            Files.write(target, bytes);
            return new StoredObject(objectKey, (long) bytes.length, sha256(bytes));
        } catch (Exception exception) {
            throw new IllegalStateException("Cannot write review artifact to local fallback storage: " + exception.getMessage(), exception);
        }
    }

    private byte[] getBytesLocally(String objectKey, Exception minioException) {
        try {
            Path target = localPath(objectKey);
            if (Files.exists(target)) {
                return Files.readAllBytes(target);
            }
        } catch (Exception exception) {
            throw new IllegalStateException("Cannot read review artifact from local fallback storage: " + exception.getMessage(), exception);
        }
        throw new IllegalStateException("Cannot download review artifact from object storage: " + minioException.getMessage(), minioException);
    }

    private Path localPath(String objectKey) {
        Path target = localRoot.resolve(objectKey.replace("/", java.io.File.separator)).normalize();
        if (!target.startsWith(localRoot)) {
            throw new IllegalArgumentException("Invalid artifact object key");
        }
        return target;
    }

    private Path resolveLocalRoot(String configuredLocalRoot) {
        String root = isBlank(configuredLocalRoot) ? "target/review-artifacts" : configuredLocalRoot;
        return Path.of(root).toAbsolutePath().normalize();
    }

    private String sha256(byte[] bytes) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        return HexFormat.of().formatHex(digest.digest(bytes));
    }

    public record StoredObject(String objectKey, Long sizeBytes, String checksumSha256) {
    }
}
