package com.mindmark.server.common.api;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    SUCCESS("0", "成功", HttpStatus.OK),
    VALIDATION_ERROR("MM-400-001", "请求参数校验失败", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED("MM-401-001", "请先登录或重新登录", HttpStatus.UNAUTHORIZED),
    FORBIDDEN("MM-403-001", "当前账号没有执行此操作的权限", HttpStatus.FORBIDDEN),
    NOT_FOUND("MM-404-001", "请求的资源不存在或已被删除", HttpStatus.NOT_FOUND),
    CONFLICT("MM-409-001", "当前数据状态不允许执行此操作", HttpStatus.CONFLICT),
    RATE_LIMITED("MM-429-001", "请求过于频繁，请稍后再试", HttpStatus.TOO_MANY_REQUESTS),
    NOT_IMPLEMENTED("MM-501-001", "该功能尚未开放", HttpStatus.NOT_IMPLEMENTED),
    INTERNAL_ERROR("MM-500-001", "服务器处理失败，请稍后重试", HttpStatus.INTERNAL_SERVER_ERROR);

    private final String code;
    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(String code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }

    public String code() {
        return code;
    }

    public String message() {
        return message;
    }

    public HttpStatus httpStatus() {
        return httpStatus;
    }
}
