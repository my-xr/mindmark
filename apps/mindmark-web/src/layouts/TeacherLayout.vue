<script setup lang="ts">
import AppActionButton from '@/components/common/AppActionButton.vue';
import { computed, ref } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';

import logoUrl from '@/assets/mindmark3.png';
import ThemeSwitcher from '@/components/common/ThemeSwitcher.vue';
import { TEACHER_MENU_ITEMS } from '@/constants/menu';
import { useAuthStore } from '@/stores/authStore';
import { requestUserConfirmation } from '@/utils/confirmAction';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const visibleMenus = computed(() =>
  TEACHER_MENU_ITEMS.filter((item) => authStore.hasAnyRole(item.roles)),
);
const pageTitle = computed(() => String(route.meta.title ?? '考试闭环工作台'));
const isSidebarCollapsed = ref(false);

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

const handleLogout = async () => {
  const confirmed = await requestUserConfirmation({
    title: '确认退出登录？',
    message: '退出后需要重新登录才能继续使用系统。',
    confirmText: '退出登录',
    cancelText: '继续使用',
    tone: 'danger',
    maskClosable: false,
  });
  if (!confirmed) {
    return;
  }

  try {
    await authStore.logout();
  } catch {
    // 即使服务端注销请求失败，也应清理本地会话并返回登录页。
    authStore.clearSession();
  } finally {
    await router.replace('/auth/login');
  }
};
</script>

<template>
  <div :class="['portal-layout', { 'portal-layout--collapsed': isSidebarCollapsed }]">
    <aside class="portal-sidebar">
      <div class="portal-sidebar-inner">
        <RouterLink class="brand portal-brand" to="/teacher/dashboard" aria-label="返回教师工作台">
          <img class="brand-logo" :src="logoUrl" alt="" />
          <div class="brand-copy">
            <strong>MindMark</strong>
            <small>Teacher Console</small>
          </div>
        </RouterLink>

        <div class="portal-nav-panel">
          <nav class="portal-menu" aria-label="教师后台导航">
            <RouterLink
              v-for="item in visibleMenus"
              :key="item.key"
              :class="['portal-menu-item', { active: route.meta.menuKey === item.key }]"
              :to="item.path"
              :title="item.label"
            >
              <span class="portal-menu-emoji" aria-hidden="true">{{ item.icon }}</span>
              <span class="portal-menu-text">{{ item.label }}</span>
            </RouterLink>
          </nav>
        </div>

        <div class="portal-sidebar-footer">
          <span>当前空间</span>
          <strong>{{ authStore.currentUser?.name ?? '未登录' }}</strong>
        </div>
      </div>
    </aside>

    <div class="portal-main">
      <header class="portal-topbar">
        <div class="portal-topbar-left">
          <button
            class="sidebar-toggle-button"
            type="button"
            :aria-label="isSidebarCollapsed ? '展开左侧导航栏' : '收缩左侧导航栏'"
            :aria-pressed="isSidebarCollapsed"
            @click="toggleSidebar"
          >
            <span aria-hidden="true">{{ isSidebarCollapsed ? '›' : '‹' }}</span>
          </button>
          <strong>{{ pageTitle }}</strong>
        </div>
        <div class="topbar-user-area">
          <ThemeSwitcher />
          <div class="user-chip">{{ authStore.currentUser?.name ?? '未登录' }}</div>
          <AppActionButton @click="handleLogout">退出</AppActionButton>
        </div>
      </header>
      <main class="portal-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>
