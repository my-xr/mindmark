<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { normalizePostAuthRedirect } from '@/app/authRedirect';
import AppActionButton from '@/components/common/AppActionButton.vue';
import OperationNotice from '@/components/common/OperationNotice.vue';
import logoUrl from '@/assets/mindmark3.png';
import { useAuthStore } from '@/stores/authStore';
import type { RoleCode } from '@/types/user';
import { getErrorMessage } from '@/utils/errorMessage';

type LoginPortal = 'admin' | 'teacher' | 'student';

interface PortalConfig {
  label: string;
  badge: string;
  eyebrow: string;
  title: string;
  description: string;
  heroTitle: string;
  heroDescription: string;
  accountLabel: string;
  accountPlaceholder: string;
  roles: RoleCode[];
  features: readonly string[];
  note: string;
}

const PORTAL_CONFIG: Record<LoginPortal, PortalConfig> = {
  admin: {
    label: '管理员',
    badge: '管理员入口',
    eyebrow: '管理端登录',
    title: '进入系统管理后台',
    description: '管理课程、班级、账号和平台运行状态。',
    heroTitle: '让平台治理清晰、可控、可追溯',
    heroDescription: '管理员负责组织基础数据与账号权限治理，维护平台稳定运行。',
    accountLabel: '管理员账号',
    accountPlaceholder: '请输入管理员账号',
    roles: ['ADMIN'],
    features: ['课程与班级维护', '账号与角色治理', '安全审计可追溯'],
    note: '管理员账号仅用于平台管理，不参与教师出题或学生答题。',
  },
  teacher: {
    label: '教师 / 助教',
    badge: '教师入口',
    eyebrow: '教师端登录',
    title: '进入教师工作台',
    description: '完成出题、组卷、开考、批改、出分与考试复盘。',
    heroTitle: '从出题到复盘，一站完成考试闭环',
    heroDescription: '教师负责考试业务的创建与管理，助教可以在授权范围内协助相关工作。',
    accountLabel: '教师账号',
    accountPlaceholder: '请输入教师账号或邮箱',
    roles: ['TEACHER', 'TA'],
    features: ['题库与 AI 出题审核', '试卷、考试与批改', '成绩发布与复盘分析'],
    note: '教师和助教使用账号登录；首次登录或密码被重置后需要先修改密码。',
  },
  student: {
    label: '学生',
    badge: '学生入口',
    eyebrow: '学生端登录',
    title: '进入学生考试中心',
    description: '查看考试安排、阅读考前须知并完成在线答题。',
    heroTitle: '专注答题，考试过程清晰可控',
    heroDescription: '学生可以查看考试时间窗口、进入全屏答题并完成在线考试。',
    accountLabel: '学号 / 学生账号',
    accountPlaceholder: '请输入学号或学生账号',
    roles: ['STUDENT'],
    features: ['考试时间状态清晰', '全屏答题与草稿保存', '成绩反馈与错题复盘'],
    note: '导入学生账号的初始密码为学号后 6 位，首次登录必须修改密码。',
  },
};

const props = defineProps<{
  portal: LoginPortal;
}>();

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const config = computed(() => PORTAL_CONFIG[props.portal]);

const username = ref('');
const password = ref('');
const errorMessage = ref<string | null>(null);

const requestedRedirect = computed(() => route.query.redirect);
const getSafeRedirectPath = () =>
  normalizePostAuthRedirect(requestedRedirect.value, authStore.roleCodes);

const clearInvalidPortalSession = async () => {
  try {
    await authStore.logout();
  } catch {
    // logout action always clears the local session in finally.
  }
};

const submitLogin = async () => {
  errorMessage.value = null;

  if (!username.value.trim() || !password.value) {
    errorMessage.value = `请输入${config.value.accountLabel}和密码。`;
    return;
  }

  try {
    await authStore.login(username.value, password.value);

    if (!authStore.hasAnyRole(config.value.roles)) {
      await clearInvalidPortalSession();
      errorMessage.value = `该账号不是${config.value.label}账号，请从对应入口登录。`;
      return;
    }

    if (authStore.mustChangePassword) {
      await router.replace({
        path: '/auth/change-password',
        query: { redirect: getSafeRedirectPath() },
      });
      return;
    }

    await router.replace(getSafeRedirectPath());
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '登录失败，请检查账号和密码后重试。');
  }
};
</script>

<template>
  <section class="auth-card auth-card--split auth-card--portal" :class="`auth-card--${portal}`">
    <div class="auth-hero">
      <div class="brand large auth-brand">
        <img class="brand-logo" :src="logoUrl" alt="" />
        <div>
          <strong>MindMark 明镜台</strong>
          <small>智慧教考评一体化平台</small>
        </div>
      </div>

      <div class="auth-hero-copy">
        <span class="soft-tag">{{ config.badge }}</span>
        <h1>{{ config.heroTitle }}</h1>
        <p>{{ config.heroDescription }}</p>
      </div>

      <div class="auth-feature-grid">
        <article v-for="(feature, index) in config.features" :key="feature">
          <strong>{{ String(index + 1).padStart(2, '0') }}</strong>
          <span>{{ feature }}</span>
        </article>
      </div>
    </div>

    <div class="auth-form-panel">
      <div class="auth-entry-heading">
        <span class="auth-entry-eyebrow">{{ config.eyebrow }}</span>
        <h2>{{ config.title }}</h2>
        <p class="muted-text">{{ config.description }}</p>
      </div>

      <form class="auth-login-form" @submit.prevent="submitLogin">
        <label class="form-field form-field--full">
          {{ config.accountLabel }}
          <input
            v-model.trim="username"
            class="text-input"
            :placeholder="config.accountPlaceholder"
            autocomplete="username"
            autofocus
          />
        </label>
        <label class="form-field form-field--full">
          密码
          <input
            v-model="password"
            class="text-input"
            placeholder="请输入密码"
            autocomplete="current-password"
            type="password"
          />
        </label>
        <OperationNotice
          v-if="errorMessage || authStore.loginError"
          title="登录失败"
          tone="danger"
          :description="
            errorMessage || authStore.loginError || '登录失败，请检查账号和密码后重试。'
          "
        />
        <AppActionButton
          class="auth-submit-button"
          variant="primary"
          :disabled="authStore.loggingIn"
          html-type="submit"
        >
          {{ authStore.loggingIn ? '登录中...' : `登录${config.label}` }}
        </AppActionButton>
      </form>

      <p class="auth-entry-note">{{ config.note }}</p>
    </div>
  </section>
</template>
