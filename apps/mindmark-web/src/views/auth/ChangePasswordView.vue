<script setup lang="ts">
import AppActionButton from '@/components/common/AppActionButton.vue';
import { getLoginPathForRoles, normalizePostAuthRedirect } from '@/app/authRedirect';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import OperationNotice from '@/components/common/OperationNotice.vue';
import { useAuthStore } from '@/stores/authStore';
import { getErrorMessage } from '@/utils/errorMessage';
import { getPasswordRuleStates, validateNewPassword } from '@/utils/passwordPolicy';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const oldPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const errorMessage = ref<string | null>(null);

const requestedRedirect = computed(() => route.query.redirect);

const getSafeRedirectPath = () =>
  normalizePostAuthRedirect(requestedRedirect.value, authStore.roleCodes);

const passwordRules = computed(() => getPasswordRuleStates(newPassword.value, oldPassword.value));

const submitChangePassword = async () => {
  errorMessage.value = null;
  if (!oldPassword.value) {
    errorMessage.value = '请输入当前密码。';
    return;
  }

  const passwordError = validateNewPassword(newPassword.value, oldPassword.value, [
    authStore.currentUser?.username,
    authStore.currentUser?.email,
  ]);
  if (passwordError) {
    errorMessage.value = passwordError;
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = '两次输入的新密码不一致。';
    return;
  }

  try {
    const redirectPath = getSafeRedirectPath();
    const loginPath = getLoginPathForRoles(authStore.roleCodes);
    await authStore.changePassword(oldPassword.value, newPassword.value);
    if (!authStore.isAuthenticated) {
      await router.replace({
        path: loginPath,
        query: { redirect: redirectPath },
      });
      return;
    }
    await router.replace(redirectPath);
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '修改密码失败，请稍后重试。');
  }
};
</script>

<template>
  <section class="auth-card">
    <div class="brand large">
      <span class="brand-mark">密</span>
      <div>
        <strong>首次登录修改密码</strong>
        <small>为保障考试账号安全，请先设置新密码</small>
      </div>
    </div>

    <p class="operation-notice operation-notice--warning">
      学生初始密码为学号后 6 位。首次登录或教师/助教重置密码后，必须完成改密才能进入考试页面。
    </p>

    <form class="auth-login-form" @submit.prevent="submitChangePassword">
      <label class="form-field form-field--full">
        当前密码
        <input
          v-model="oldPassword"
          class="text-input"
          type="password"
          aria-required="true"
          autocomplete="current-password"
        />
      </label>
      <label class="form-field form-field--full">
        新密码
        <input
          v-model="newPassword"
          class="text-input"
          type="password"
          aria-required="true"
          autocomplete="new-password"
        />
      </label>
      <div class="password-policy-card" aria-live="polite">
        <div class="password-policy-heading">
          <strong>密码规则</strong>
          <span>请设置便于记忆但不易猜测的密码</span>
        </div>
        <ul class="password-policy-list">
          <li v-for="rule in passwordRules" :key="rule.id" :class="{ valid: rule.valid }">
            <span aria-hidden="true">{{ rule.valid ? '✓' : '○' }}</span>
            {{ rule.label }}
          </li>
        </ul>
        <p class="password-policy-note">不要使用姓名、学号、手机号或其他容易被猜到的信息。</p>
      </div>
      <label class="form-field form-field--full">
        确认新密码
        <input
          v-model="confirmPassword"
          class="text-input"
          type="password"
          aria-required="true"
          autocomplete="new-password"
        />
      </label>
      <OperationNotice
        v-if="errorMessage || authStore.changePasswordError"
        title="修改密码失败"
        tone="danger"
        :description="errorMessage || authStore.changePasswordError || '修改密码失败，请稍后重试。'"
      />
      <AppActionButton
        class="auth-submit-button"
        variant="primary"
        :disabled="authStore.changingPassword"
        html-type="submit"
      >
        {{ authStore.changingPassword ? '提交中...' : '确认修改' }}
      </AppActionButton>
    </form>
  </section>
</template>

<style scoped>
.password-policy-card {
  display: grid;
  gap: 8px;
  padding: 12px 14px;
  color: var(--mm-color-text-secondary);
  background: color-mix(in srgb, var(--mm-color-primary) 4%, var(--mm-color-card));
  border: 1px solid color-mix(in srgb, var(--mm-color-primary) 16%, var(--mm-color-border));
  border-radius: 8px;
}

.password-policy-heading {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  align-items: baseline;
}

.password-policy-heading strong {
  color: var(--mm-color-text);
  font-size: 13px;
}

.password-policy-heading span,
.password-policy-note {
  margin: 0;
  font-size: 11px;
  line-height: 1.5;
}

.password-policy-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px 12px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 12px;
}

.password-policy-list li {
  display: flex;
  gap: 6px;
  align-items: center;
  color: var(--mm-color-text-secondary);
}

.password-policy-list li span {
  color: var(--mm-color-text-muted);
  font-size: 13px;
}

.password-policy-list li.valid {
  color: var(--mm-color-success);
}

.password-policy-list li.valid span {
  color: var(--mm-color-success);
}

.password-policy-note {
  color: var(--mm-color-text-muted);
}

@media (width <= 560px) {
  .password-policy-list {
    grid-template-columns: 1fr;
  }
}
</style>
