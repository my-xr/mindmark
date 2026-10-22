package com.mindmark.server.common.exception;

import cn.dev33.satoken.exception.NotLoginException;
import cn.dev33.satoken.exception.NotPermissionException;
import cn.dev33.satoken.exception.NotRoleException;
import com.mindmark.server.common.api.ApiResponse;
import com.mindmark.server.common.api.ErrorCode;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException exception) {
        ErrorCode errorCode = exception.errorCode();
        return ResponseEntity.status(errorCode.httpStatus())
            .body(ApiResponse.failure(errorCode, exception.getMessage()));
    }

    @ExceptionHandler(NotLoginException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotLoginException(NotLoginException exception) {
        return ResponseEntity.status(ErrorCode.UNAUTHORIZED.httpStatus())
            .body(ApiResponse.failure(ErrorCode.UNAUTHORIZED, ErrorCode.UNAUTHORIZED.message()));
    }

    @ExceptionHandler({NotRoleException.class, NotPermissionException.class})
    public ResponseEntity<ApiResponse<Void>> handleSaTokenForbiddenException(Exception exception) {
        return ResponseEntity.status(ErrorCode.FORBIDDEN.httpStatus())
            .body(ApiResponse.failure(ErrorCode.FORBIDDEN, ErrorCode.FORBIDDEN.message()));
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class, ConstraintViolationException.class})
    public ResponseEntity<ApiResponse<Void>> handleValidationException(Exception exception) {
        return ResponseEntity.status(ErrorCode.VALIDATION_ERROR.httpStatus())
            .body(ApiResponse.failure(
                ErrorCode.VALIDATION_ERROR,
                "请求参数不完整或格式不正确，请检查后重试"
            ));
    }

    @ExceptionHandler({NoHandlerFoundException.class, NoResourceFoundException.class})
    public ResponseEntity<ApiResponse<Void>> handleNotFound(Exception exception) {
        return ResponseEntity.status(ErrorCode.NOT_FOUND.httpStatus())
            .body(ApiResponse.failure(ErrorCode.NOT_FOUND, ErrorCode.NOT_FOUND.message()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception exception) {
        log.error(
            "Unhandled server exception type={} message={}",
            exception.getClass().getName(),
            redactSensitiveText(exception.getMessage())
        );
        log.debug("Unhandled server exception stack trace", exception);
        return ResponseEntity.status(ErrorCode.INTERNAL_ERROR.httpStatus())
            .body(ApiResponse.failure(ErrorCode.INTERNAL_ERROR, ErrorCode.INTERNAL_ERROR.message()));
    }

    private String redactSensitiveText(String message) {
        if (message == null || message.isBlank()) {
            return "<no-message>";
        }
        return message.replaceAll("(?i)(sk-[a-z0-9_-]{12,})", "[REDACTED_API_KEY]");
    }
}
