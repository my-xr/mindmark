import 'ant-design-vue/dist/reset.css';
import './styles/index.css';

import { createPinia } from 'pinia';
import { createApp } from 'vue';

import { getLoginPathForRoles, isLoginPath } from '@/app/authRedirect';
import { installRouterGuard } from '@/app/permission';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';

import App from './App.vue';
import { router } from './router';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
useAppStore().initTheme();
installRouterGuard(router);

if (typeof window !== 'undefined') {
  window.addEventListener('mindmark:auth-expired', () => {
    const authStore = useAuthStore();
    const redirect = router.currentRoute.value.fullPath;
    const loginPath = getLoginPathForRoles([...authStore.roleCodes]);
    authStore.clearSession();
    if (!isLoginPath(router.currentRoute.value.path)) {
      void router.push({ path: loginPath, query: { redirect } });
    }
  });
}

app.use(router);

app.mount('#app');
