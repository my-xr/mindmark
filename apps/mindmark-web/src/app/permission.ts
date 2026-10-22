import type { Router } from 'vue-router';

import { getLoginPathForTarget, isLoginPath } from '@/app/authRedirect';
import { useAuthStore } from '@/stores/authStore';

export function installRouterGuard(router: Router) {
  router.beforeEach(async (to) => {
    const authStore = useAuthStore();

    if (to.meta.requiresAuth) {
      await authStore.bootstrap();
    }

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      return {
        path: getLoginPathForTarget(to.path),
        query: { redirect: to.fullPath },
      };
    }

    if (
      authStore.isAuthenticated &&
      authStore.mustChangePassword &&
      to.path !== '/auth/change-password' &&
      !isLoginPath(to.path)
    ) {
      return {
        path: '/auth/change-password',
        query: { redirect: to.fullPath },
      };
    }

    if (!authStore.hasAnyRole(to.meta.roles)) {
      return { path: '/error/403' };
    }

    if (to.meta.title) {
      document.title = `${to.meta.title} - MindMark 明镜台`;
    }

    return true;
  });
}
