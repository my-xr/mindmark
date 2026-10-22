package com.mindmark.server.modules.auth.service;

import cn.dev33.satoken.stp.StpInterface;
import com.mindmark.server.modules.auth.repository.AuthUserRepository;
import com.mindmark.server.modules.auth.domain.UserStatus;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class SaTokenPermissionService implements StpInterface {

    private final AuthUserRepository authUserRepository;

    public SaTokenPermissionService(AuthUserRepository authUserRepository) {
        this.authUserRepository = authUserRepository;
    }

    @Override
    public List<String> getPermissionList(Object loginId, String loginType) {
        return List.of();
    }

    @Override
    public List<String> getRoleList(Object loginId, String loginType) {
        if (loginId == null) {
            return List.of();
        }

        return authUserRepository.findById(String.valueOf(loginId))
            .filter(user -> user.getStatus() == UserStatus.ACTIVE)
            .filter(AuthRolePolicy::isValid)
            .map(user -> user.getRoles().stream()
                .map(Enum::name)
                .sorted()
                .toList())
            .orElse(List.of());
    }
}
