package com.mindmark.server.modules.auth.service;

import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.exception.BusinessException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.KeySpec;
import java.util.Base64;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import org.springframework.stereotype.Service;

@Service
public class PasswordHashService {

    private static final String FORMAT_PREFIX = "pbkdf2";
    private static final int ITERATIONS = 120_000;
    private static final int KEY_LENGTH = 256;
    private static final int SALT_BYTES = 16;
    private final SecureRandom secureRandom = new SecureRandom();

    public String hash(String password) {
        if (password == null || password.isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Password must not be blank");
        }
        byte[] salt = new byte[SALT_BYTES];
        secureRandom.nextBytes(salt);
        byte[] digest = pbkdf2(password, salt, ITERATIONS);
        return FORMAT_PREFIX + ":" + ITERATIONS + ":"
            + Base64.getEncoder().encodeToString(salt) + ":"
            + Base64.getEncoder().encodeToString(digest);
    }

    public boolean matches(String password, String encoded) {
        if (password == null || encoded == null || encoded.isBlank()) {
            return false;
        }
        String[] parts = encoded.split(":");
        if (parts.length != 4 || !FORMAT_PREFIX.equals(parts[0])) {
            return false;
        }
        int iterations;
        try {
            iterations = Integer.parseInt(parts[1]);
        } catch (NumberFormatException exception) {
            return false;
        }
        byte[] salt;
        byte[] expected;
        try {
            salt = Base64.getDecoder().decode(parts[2]);
            expected = Base64.getDecoder().decode(parts[3]);
        } catch (IllegalArgumentException exception) {
            return false;
        }
        byte[] actual = pbkdf2(password, salt, iterations);
        return constantTimeEquals(expected, actual);
    }

    private byte[] pbkdf2(String password, byte[] salt, int iterations) {
        try {
            KeySpec spec = new PBEKeySpec(password.toCharArray(), salt, iterations, KEY_LENGTH);
            return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
        } catch (NoSuchAlgorithmException | InvalidKeySpecException exception) {
            throw new IllegalStateException("Password hashing algorithm is unavailable", exception);
        }
    }

    private boolean constantTimeEquals(byte[] expected, byte[] actual) {
        if (expected.length != actual.length) {
            return false;
        }
        int result = 0;
        for (int index = 0; index < expected.length; index += 1) {
            result |= expected[index] ^ actual[index];
        }
        return result == 0;
    }
}
