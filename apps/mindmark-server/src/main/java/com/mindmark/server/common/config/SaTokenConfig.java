package com.mindmark.server.common.config;

import cn.dev33.satoken.context.SaHolder;
import cn.dev33.satoken.interceptor.SaInterceptor;
import cn.dev33.satoken.router.SaRouter;
import cn.dev33.satoken.stp.StpUtil;
import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.auth.domain.AuthUserEntity;
import com.mindmark.server.modules.auth.domain.UserStatus;
import com.mindmark.server.modules.auth.repository.AuthUserRepository;
import com.mindmark.server.modules.auth.service.AuthRolePolicy;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class SaTokenConfig implements WebMvcConfigurer {

    private final AuthUserRepository authUserRepository;

    public SaTokenConfig(AuthUserRepository authUserRepository) {
        this.authUserRepository = authUserRepository;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new SaInterceptor(handle -> {
            if ("OPTIONS".equalsIgnoreCase(SaHolder.getRequest().getMethod())) {
                return;
            }

            SaRouter.match("/api/v1/**")
                .notMatch("/api/v1/auth/login")
                .notMatch("/api/v1/system/health")
                .check(route -> {
                    StpUtil.checkLogin();
                    checkActiveAccount();
                });
        })).addPathPatterns("/**");
    }

    /**
     * Sa-Token only knows whether the token exists. Account lifecycle state is
     * business data, so it must be checked on every authenticated request.
     * This closes the gap where a disabled user keeps using an old token.
     */
    private void checkActiveAccount() {
        String loginId = StpUtil.getLoginIdAsString();
        AuthUserEntity user = authUserRepository.findById(loginId).orElse(null);
        if (user == null) {
            StpUtil.logout();
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "Account session is no longer valid");
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            StpUtil.logout();
            throw new BusinessException(ErrorCode.FORBIDDEN, "Account is disabled");
        }
        if (!AuthRolePolicy.isValid(user)) {
            StpUtil.logout();
            throw new BusinessException(ErrorCode.FORBIDDEN, "账号角色配置无效，请联系管理员修复后再登录");
        }
    }
}
