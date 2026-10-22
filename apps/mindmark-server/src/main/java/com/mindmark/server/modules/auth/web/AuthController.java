package com.mindmark.server.modules.auth.web;

import com.mindmark.server.common.api.ApiResponse;
import com.mindmark.server.modules.auth.dto.ChangePasswordRequest;
import com.mindmark.server.modules.auth.dto.ChangePasswordResponse;
import com.mindmark.server.modules.auth.dto.CurrentUserResponse;
import com.mindmark.server.modules.auth.dto.LoginRequest;
import com.mindmark.server.modules.auth.dto.LoginResponse;
import com.mindmark.server.modules.auth.dto.LogoutResponse;
import com.mindmark.server.modules.auth.service.AuthContextService;
import com.mindmark.server.modules.auth.service.LoginRateLimiter;
import com.mindmark.server.common.config.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthContextService authContextService;
    private final LoginRateLimiter loginRateLimiter;
    private final ClientIpResolver clientIpResolver;

    public AuthController(
        AuthContextService authContextService,
        LoginRateLimiter loginRateLimiter,
        ClientIpResolver clientIpResolver
    ) {
        this.authContextService = authContextService;
        this.loginRateLimiter = loginRateLimiter;
        this.clientIpResolver = clientIpResolver;
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(
        @RequestBody(required = false) LoginRequest request,
        HttpServletRequest httpRequest
    ) {
        loginRateLimiter.check(request, clientIpResolver.resolve(httpRequest));
        return ApiResponse.success(authContextService.login(request));
    }

    @PostMapping("/change-password")
    public ApiResponse<ChangePasswordResponse> changePassword(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestBody ChangePasswordRequest request
    ) {
        return ApiResponse.success(authContextService.changePassword(authorization, request));
    }

    @PostMapping("/logout")
    public ApiResponse<LogoutResponse> logout() {
        return ApiResponse.success(authContextService.logout());
    }

    @GetMapping("/me")
    public ApiResponse<CurrentUserResponse> currentUser(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestHeader(value = "X-MindMark-User-Id", required = false) String userId,
        @RequestHeader(value = "X-MindMark-Roles", required = false) String roles
    ) {
        return ApiResponse.success(authContextService.getCurrentUser(authorization, userId, roles));
    }
}
