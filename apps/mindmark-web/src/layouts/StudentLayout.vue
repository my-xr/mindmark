<script setup lang="ts">
import AppActionButton from '@/components/common/AppActionButton.vue';
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';

import logoUrl from '@/assets/mindmark3.png';
import ThemeSwitcher from '@/components/common/ThemeSwitcher.vue';
import { STUDENT_MENU_ITEMS } from '@/constants/menu';
import { useAuthStore } from '@/stores/authStore';
import { requestUserConfirmation } from '@/utils/confirmAction';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const isExamTaking = computed(() => route.name === 'ExamTaking');

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
  <div :class="['student-layout', { 'student-layout--exam-mode': isExamTaking }]">
    <header v-if="!isExamTaking" class="student-header">
      <RouterLink class="student-brand" to="/student/exams">
        <img class="brand-logo" :src="logoUrl" alt="" />
        <span>MindMark 明镜台</span>
      </RouterLink>
      <nav class="student-nav" aria-label="学生端导航">
        <RouterLink
          v-for="item in STUDENT_MENU_ITEMS"
          :key="item.key"
          :class="['student-nav-item', { active: route.meta.menuKey === item.key }]"
          :to="item.path"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
      <div class="topbar-user-area">
        <ThemeSwitcher />
        <div class="user-chip">{{ authStore.currentUser?.name ?? '未登录' }}</div>
        <AppActionButton @click="handleLogout">退出</AppActionButton>
      </div>
    </header>
    <main class="student-content">
      <RouterView />
    </main>
  </div>
</template>
