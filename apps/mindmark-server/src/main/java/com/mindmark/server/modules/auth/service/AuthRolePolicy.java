package com.mindmark.server.modules.auth.service;

import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.auth.domain.AuthUserEntity;
import com.mindmark.server.modules.auth.domain.RoleCode;
import java.util.Set;

/**
 * Central role-shape policy.
 *
 * <p>Sa-Token answers whether an account has a role. It does not define
 * whether a persisted role combination is valid. Keeping that invariant in
 * one place prevents legacy or manually-corrupted role rows from turning a
 * student account into a staff account.</p>
 */
public final class AuthRolePolicy {

    public static final Set<RoleCode> STAFF_ROLES = Set.of(RoleCode.ADMIN, RoleCode.TEACHER, RoleCode.TA);

    private AuthRolePolicy() {
    }

    public static boolean isStaff(AuthUserEntity user) {
        return user != null
            && user.getRoles() != null
            && user.getRoles().stream().anyMatch(STAFF_ROLES::contains);
    }

    public static boolean isStudentOnly(AuthUserEntity user) {
        return user != null
            && user.getRoles() != null
            && user.getRoles().contains(RoleCode.STUDENT)
            && user.getRoles().stream().noneMatch(STAFF_ROLES::contains);
    }

    public static boolean isValid(AuthUserEntity user) {
        if (user == null || user.getRoles() == null || user.getRoles().isEmpty()) {
            return false;
        }
        if (user.getRoles().contains(RoleCode.ADMIN) && user.getRoles().size() > 1) {
            return false;
        }
        return !(user.getRoles().contains(RoleCode.STUDENT) && isStaff(user));
    }

    public static void requireValid(AuthUserEntity user) {
        if (!isValid(user)) {
            throw new BusinessException(
                ErrorCode.FORBIDDEN,
                "账号角色配置无效，请联系管理员修复后再登录"
            );
        }
    }
}
