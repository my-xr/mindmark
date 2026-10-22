package com.mindmark.server.modules.auth.service;

import cn.dev33.satoken.stp.StpUtil;
import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.auth.domain.AuthUserEntity;
import com.mindmark.server.modules.auth.domain.RoleCode;
import com.mindmark.server.modules.auth.domain.UserStatus;
import com.mindmark.server.modules.auth.dto.ChangePasswordRequest;
import com.mindmark.server.modules.auth.dto.ChangePasswordResponse;
import com.mindmark.server.modules.auth.dto.CurrentUserResponse;
import com.mindmark.server.modules.auth.dto.LoginRequest;
import com.mindmark.server.modules.auth.dto.LoginResponse;
import com.mindmark.server.modules.auth.dto.LogoutResponse;
import com.mindmark.server.modules.auth.repository.AuthUserRepository;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthContextService {

    private static final int MIN_PASSWORD_LENGTH = 8;
    private static final int MAX_FAILED_LOGIN_ATTEMPTS = 5;
    private static final int LOCK_MINUTES = 15;

    private final AuthUserRepository authUserRepository;
    private final PasswordHashService passwordHashService;
    private final AuthAuditService authAuditService;

    public AuthContextService(
        AuthUserRepository authUserRepository,
        PasswordHashService passwordHashService,
        AuthAuditService authAuditService
    ) {
        this.authUserRepository = authUserRepository;
        this.passwordHashService = passwordHashService;
        this.authAuditService = authAuditService;
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        String principal = request == null ? null : normalize(request.username());
        if (principal == null) {
            principal = request == null ? null : normalize(request.userId());
        }
        String password = request == null ? null : request.password();
        if (principal == null || password == null || password.isBlank()) {
            authAuditService.record("anonymous", "LOGIN", null, "FAILED", "Missing username or password");
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "账号或密码错误");
        }

        String loginPrincipal = principal;
        AuthUserEntity user = findLoginUser(loginPrincipal)
            .orElseThrow(() -> {
                authAuditService.record("anonymous", "LOGIN", null, "FAILED", "Unknown principal: " + loginPrincipal);
                return new BusinessException(ErrorCode.UNAUTHORIZED, "账号或密码错误");
            });

        ensureActiveUser(user);
        AuthRolePolicy.requireValid(user);
        ensureNotLocked(user);
        if (!passwordHashService.matches(password, user.getPasswordHash())) {
            recordFailedLogin(user);
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "账号或密码错误");
        }

        StpUtil.login(user.getId());

        OffsetDateTime now = OffsetDateTime.now();
        user.setFailedLoginCount(0);
        user.setLockedUntil(null);
        user.setLastLoginAt(now);
        user.setUpdatedAt(now);
        AuthUserEntity saved = authUserRepository.save(user);
        authAuditService.record(saved.getId(), "LOGIN", saved.getId(), "SUCCESS", "Sa-Token login success");

        CurrentUserResponse currentUser = toCurrentUser(saved, saved.getRoles());
        return new LoginResponse(StpUtil.getTokenValue(), currentUser, saved.isMustChangePassword());
    }

    public LogoutResponse logout() {
        if (StpUtil.isLogin()) {
            String loginId = StpUtil.getLoginIdAsString();
            StpUtil.logout();
            authAuditService.record(loginId, "LOGOUT", loginId, "SUCCESS", "Sa-Token logout success");
        }
        return new LogoutResponse(true);
    }

    @Transactional
    public ChangePasswordResponse changePassword(String authorizationHeader, ChangePasswordRequest request) {
        AuthUserEntity user = getCurrentAuthUser(authorizationHeader, null, null);
        String oldPassword = request == null ? null : request.oldPassword();
        String newPassword = request == null ? null : request.newPassword();
        if (oldPassword == null || oldPassword.isBlank() || newPassword == null || newPassword.isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "请输入当前密码和新密码");
        }
        validateNewPassword(user, oldPassword, newPassword);
        if (!passwordHashService.matches(oldPassword, user.getPasswordHash())) {
            authAuditService.record(user.getId(), "CHANGE_PASSWORD", user.getId(), "FAILED", "Old password mismatch");
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "当前密码不正确");
        }

        OffsetDateTime now = OffsetDateTime.now();
        user.setPasswordHash(passwordHashService.hash(newPassword));
        user.setMustChangePassword(false);
        user.setPasswordUpdatedAt(now);
        user.setUpdatedAt(now);
        authUserRepository.save(user);
        // Password changes revoke every existing token, not only the token
        // used by this request. This prevents a stolen/old session from
        // remaining usable after the credential has changed.
        StpUtil.logout(user.getId());
        authAuditService.record(user.getId(), "CHANGE_PASSWORD", user.getId(), "SUCCESS", "Password changed by current user");
        return new ChangePasswordResponse(true, false, true);
    }

    @Transactional(readOnly = true)
    public CurrentUserResponse getCurrentUser(String authorizationHeader, String userIdHeader, String rolesHeader) {
        AuthUserEntity user = getCurrentAuthUser(authorizationHeader, userIdHeader, rolesHeader);
        return toCurrentUser(user, user.getRoles());
    }

    @Transactional(readOnly = true)
    public AuthUserEntity getCurrentAuthUser(String authorizationHeader, String userIdHeader, String rolesHeader) {
        String userId = StpUtil.getLoginIdAsString();
        AuthUserEntity user = authUserRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED, "登录状态已失效"));
        ensureActiveUser(user);
        AuthRolePolicy.requireValid(user);
        return user;
    }

    @Transactional(readOnly = true)
    public Optional<AuthUserEntity> findUserById(String userId) {
        return userId == null || userId.isBlank()
            ? Optional.empty()
            : authUserRepository.findById(userId.trim());
    }

    private Optional<AuthUserEntity> findLoginUser(String principal) {
        return authUserRepository.findByUsernameIgnoreCase(principal)
            .or(() -> authUserRepository.findByEmailIgnoreCase(principal))
            .or(() -> authUserRepository.findById(principal));
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void ensureActiveUser(AuthUserEntity user) {
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "账号已被停用，请联系管理员");
        }
    }

    private void ensureNotLocked(AuthUserEntity user) {
        OffsetDateTime lockedUntil = user.getLockedUntil();
        if (lockedUntil != null && lockedUntil.isAfter(OffsetDateTime.now())) {
            authAuditService.record(user.getId(), "LOGIN", user.getId(), "FAILED", "Account locked until " + lockedUntil);
            throw new BusinessException(ErrorCode.FORBIDDEN, "账号已被暂时锁定，请稍后再试或联系管理员");
        }
        if (lockedUntil != null) {
            user.setLockedUntil(null);
            user.setFailedLoginCount(0);
            user.setUpdatedAt(OffsetDateTime.now());
            authUserRepository.save(user);
        }
    }

    private void recordFailedLogin(AuthUserEntity user) {
        int failedCount = user.getFailedLoginCount() + 1;
        user.setFailedLoginCount(failedCount);
        String detail = "Password mismatch, failedCount=" + failedCount;
        if (failedCount >= MAX_FAILED_LOGIN_ATTEMPTS) {
            OffsetDateTime lockedUntil = OffsetDateTime.now().plusMinutes(LOCK_MINUTES);
            user.setLockedUntil(lockedUntil);
            detail = detail + ", lockedUntil=" + lockedUntil;
        }
        user.setUpdatedAt(OffsetDateTime.now());
        authUserRepository.save(user);
        authAuditService.record(user.getId(), "LOGIN", user.getId(), "FAILED", detail);
    }

    private void validateNewPassword(AuthUserEntity user, String oldPassword, String newPassword) {
        if (newPassword.length() < MIN_PASSWORD_LENGTH) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                "新密码至少需要 " + MIN_PASSWORD_LENGTH + " 个字符");
        }
        if (newPassword.equals(oldPassword)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "新密码不能与当前密码相同");
        }
        if (newPassword.equalsIgnoreCase(user.getUsername()) || newPassword.equalsIgnoreCase(user.getEmail())) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "新密码不能直接使用账号或邮箱");
        }
        boolean hasLetter = newPassword.chars().anyMatch(Character::isLetter);
        boolean hasDigit = newPassword.chars().anyMatch(Character::isDigit);
        if (!hasLetter || !hasDigit) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "新密码必须同时包含字母和数字");
        }
    }

    private CurrentUserResponse toCurrentUser(AuthUserEntity user, Set<RoleCode> roles) {
        List<RoleCode> sortedRoles = roles.stream()
            .sorted(Comparator.comparing(Enum::name))
            .toList();
        return new CurrentUserResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getUsername(),
            sortedRoles,
            user.getStatus(),
            user.getStudentId(),
            user.isMustChangePassword()
        );
    }
}
