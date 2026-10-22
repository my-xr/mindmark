package com.mindmark.server.common.api;

import java.time.OffsetDateTime;

public record ApiResponse<T>(String code, String message, T data, String traceId, OffsetDateTime timestamp) {

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(ErrorCode.SUCCESS.code(), ErrorCode.SUCCESS.message(), data, null, OffsetDateTime.now());
    }

    public static <T> ApiResponse<T> failure(ErrorCode errorCode, String message) {
        return new ApiResponse<>(errorCode.code(), message, null, null, OffsetDateTime.now());
    }
}
