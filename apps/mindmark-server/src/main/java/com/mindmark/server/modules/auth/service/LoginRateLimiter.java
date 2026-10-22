package com.mindmark.server.modules.auth.service;

import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.auth.dto.LoginRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

/**
 * Distributed login-attempt limiter.
 *
 * <p>Both dimensions are hashed before becoming Redis keys. The limiter is
 * intentionally placed at the HTTP login boundary, before password checking,
 * so invalid credentials cannot be used to exhaust database work.</p>
 */
@Service
public class LoginRateLimiter {

    private static final Logger LOGGER = LoggerFactory.getLogger(LoginRateLimiter.class);
    private static final String KEY_PREFIX = "mindmark:auth:login:v1:";
    private static final String INCREMENT_SCRIPT = """
        local count = redis.call('INCR', KEYS[1])
        if count == 1 then
          redis.call('EXPIRE', KEYS[1], ARGV[1])
        end
        return count
        """;

    private final StringRedisTemplate redisTemplate;
    private final DefaultRedisScript<Long> incrementScript =
        new DefaultRedisScript<>(INCREMENT_SCRIPT, Long.class);
    private final int windowSeconds;
    private final int accountLimit;
    private final int ipLimit;

    public LoginRateLimiter(
        StringRedisTemplate redisTemplate,
        @Value("${mindmark.security.login-rate-limit.window-seconds:300}") int windowSeconds,
        @Value("${mindmark.security.login-rate-limit.account-max-attempts:10}") int accountLimit,
        @Value("${mindmark.security.login-rate-limit.ip-max-attempts:50}") int ipLimit
    ) {
        this.redisTemplate = redisTemplate;
        this.windowSeconds = Math.max(60, windowSeconds);
        this.accountLimit = Math.max(1, accountLimit);
        this.ipLimit = Math.max(1, ipLimit);
    }

    public void check(LoginRequest request, String remoteAddress) {
        String principal = request == null
            ? "anonymous"
            : firstNonBlank(request.username(), request.userId(), "anonymous");
        String normalizedPrincipal = principal.trim().toLowerCase(Locale.ROOT);
        String normalizedAddress = firstNonBlank(remoteAddress, "unknown").trim();

        long accountCount = increment("account", normalizedPrincipal);
        long ipCount = increment("ip", normalizedAddress);
        if (accountCount > accountLimit || ipCount > ipLimit) {
            throw new BusinessException(ErrorCode.RATE_LIMITED, ErrorCode.RATE_LIMITED.message());
        }
    }

    private long increment(String dimension, String value) {
        String digest = sha256(dimension + ":" + value);
        String key = KEY_PREFIX + dimension + ":" + digest;
        try {
            Long count = redisTemplate.execute(
                incrementScript,
                List.of(key),
                String.valueOf(windowSeconds)
            );
            if (count == null) {
                throw new IllegalStateException("Redis login limiter returned no count");
            }
            return count;
        } catch (DataAccessException | IllegalStateException exception) {
            // Do not silently bypass the limiter when Redis is unavailable.
            // Failing closed is safer for an authentication endpoint.
            LOGGER.error("Redis login limiter unavailable", exception);
            throw new BusinessException(
                ErrorCode.INTERNAL_ERROR,
                "登录安全服务暂不可用，请稍后重试"
            );
        }
    }

    private String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                .digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private String firstNonBlank(String first, String second, String fallback) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        if (second != null && !second.isBlank()) {
            return second;
        }
        return fallback;
    }

    private String firstNonBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
