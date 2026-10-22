<script setup lang="ts">
import AppActionButton from '@/components/common/AppActionButton.vue';
import AppFormControl from '@/components/common/AppFormControl.vue';
import { computed, onMounted, reactive, ref, watch } from 'vue';

import StatusTag from '@/components/common/StatusTag.vue';
import {
  getAiProviderSetting,
  providerDefaults,
  providerLabels,
  saveAiProviderSetting,
  testAiProviderConnection,
  type AiProvider,
  type AiProviderConnectionTestResponse,
  type AiProviderSetting,
} from '@/services/aiQuestionService';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { getErrorMessage } from '@/utils/errorMessage';

const appStore = useAppStore();
const authStore = useAuthStore();

const providerOptions: Array<{
  value: AiProvider;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: 'OPENAI',
    label: 'OpenAI Compatible',
    description: '兼容 OpenAI Chat Completions 协议，可接入 OpenAI、Kimi、DeepSeek 等服务。',
    icon: '◈',
  },
  {
    value: 'ANTHROPIC',
    label: 'Anthropic',
    description: 'Claude Messages API，适合接入 Anthropic 原生接口。',
    icon: '◆',
  },
];

const selectedProvider = ref<AiProvider>('OPENAI');
const setting = ref<AiProviderSetting | null>(null);
const isLoading = ref(false);
const isSaving = ref(false);
const isTesting = ref(false);
const message = ref<string | null>(null);
const testResult = ref<AiProviderConnectionTestResponse | null>(null);
const testResultMessage = computed(() => {
  if (!testResult.value) {
    return '';
  }

  return testResult.value.success
    ? '连接测试成功，Provider 已返回有效响应。'
    : getErrorMessage(testResult.value.message, 'AI Provider 连接测试失败，请检查配置。');
});

const form = reactive({
  baseUrl: providerDefaults.OPENAI.baseUrl,
  model: providerDefaults.OPENAI.model,
  apiKey: '',
});

const selectedOption = computed(
  () =>
    providerOptions.find((option) => option.value === selectedProvider.value) ?? providerOptions[0],
);
const keyStatusText = computed(() => setting.value?.keyPreview || '未配置个人 Key');
const actionButtonModeTitle = computed(() =>
  appStore.actionButtonMode === 'expanded' ? '收起按钮文字' : '展开按钮文字',
);
const actionButtonWeightTitle = computed(() =>
  appStore.actionButtonWeight === 'bold' ? '按钮常规字重' : '按钮文字加粗',
);

const toggleActionButtonMode = () => {
  appStore.toggleActionButtonMode();
};

const toggleActionButtonWeight = () => {
  appStore.toggleActionButtonWeight();
};

const applySettingToForm = (next: AiProviderSetting) => {
  form.baseUrl = next.baseUrl || providerDefaults[next.provider].baseUrl;
  form.model = next.model || providerDefaults[next.provider].model;
  form.apiKey = '';
};

const loadSetting = async () => {
  isLoading.value = true;
  message.value = null;
  try {
    setting.value = await getAiProviderSetting(selectedProvider.value);
    applySettingToForm(setting.value);
  } finally {
    isLoading.value = false;
  }
};

const resetToDefault = () => {
  form.baseUrl = providerDefaults[selectedProvider.value].baseUrl;
  form.model = providerDefaults[selectedProvider.value].model;
};

const saveSetting = async () => {
  if (!form.baseUrl.trim() || !form.model.trim()) {
    message.value = '请填写服务器地址和模型名称。';
    return;
  }
  if (!setting.value?.configured && !form.apiKey.trim()) {
    message.value = '首次保存个人 Provider 配置时需要填写 API Key。';
    return;
  }

  isSaving.value = true;
  message.value = null;
  testResult.value = null;
  try {
    setting.value = await saveAiProviderSetting({
      provider: selectedProvider.value,
      baseUrl: form.baseUrl.trim(),
      model: form.model.trim(),
      ...(form.apiKey.trim() ? { apiKey: form.apiKey.trim() } : {}),
    });
    applySettingToForm(setting.value);
    message.value = `已保存 ${providerLabels[selectedProvider.value]} 配置。`;
  } catch (error) {
    message.value = getErrorMessage(error, '保存 AI Provider 配置失败，请稍后重试。');
  } finally {
    isSaving.value = false;
  }
};

const testConnection = async () => {
  isTesting.value = true;
  message.value = null;
  testResult.value = null;
  try {
    testResult.value = await testAiProviderConnection({
      provider: selectedProvider.value,
      baseUrl: form.baseUrl.trim(),
      model: form.model.trim(),
      ...(form.apiKey.trim() ? { apiKey: form.apiKey.trim() } : {}),
    });
    message.value = testResult.value.success
      ? `${providerLabels[selectedProvider.value]} 连接测试成功。`
      : getErrorMessage(testResult.value.message, 'AI Provider 连接测试失败，请检查配置。');
  } catch (error) {
    message.value = getErrorMessage(error, 'AI Provider 连接测试失败，请检查配置。');
  } finally {
    isTesting.value = false;
  }
};

watch(selectedProvider, () => {
  testResult.value = null;
  void loadSetting();
});

onMounted(() => {
  void loadSetting();
});
</script>

<template>
  <div class="page-shell teacher-settings-page">
    <section class="settings-hero-card content-card">
      <div class="settings-hero-main">
        <span class="settings-eyebrow">个人配置中心</span>
        <h2>{{ authStore.currentUser?.name ?? '未登录' }}</h2>
        <p class="muted-text">
          管理教师端个人偏好、AI Provider 连接参数与按钮显示策略。配置保存后将用于 AI 出题审核链路。
        </p>
      </div>
      <div class="settings-hero-side">
        <StatusTag label="教师空间" tone="info" />
        <AppActionButton
          class="icon-action-button"
          icon="←"
          title="返回 AI 出题审核"
          to="/teacher/ai-questions"
        >
          AI 出题审核
        </AppActionButton>
      </div>
    </section>

    <div class="settings-layout">
      <aside class="content-card settings-preference-card">
        <div class="section-title settings-section-title">
          <div>
            <h2>界面偏好</h2>
            <p class="muted-text">控制教师端通用按钮在各页面中的显示方式。</p>
          </div>
        </div>

        <div class="preference-list">
          <article class="preference-item">
            <div>
              <strong>按钮文字</strong>
              <span>{{
                appStore.actionButtonMode === 'expanded'
                  ? '默认展开，显示完整操作文字'
                  : '已收起，仅保留图标与悬浮提示'
              }}</span>
            </div>
            <AppActionButton
              class="icon-action-button"
              :icon="appStore.actionButtonMode === 'expanded' ? '🏷️' : '👁️'"
              :title="actionButtonModeTitle"
              @click="toggleActionButtonMode"
            >
              {{ actionButtonModeTitle }}
            </AppActionButton>
          </article>
          <article class="preference-item">
            <div>
              <strong>按钮字重</strong>
              <span>{{
                appStore.actionButtonWeight === 'bold' ? '当前为加粗按钮文字' : '当前为常规按钮文字'
              }}</span>
            </div>
            <AppActionButton
              class="icon-action-button"
              :icon="appStore.actionButtonWeight === 'bold' ? '𝐁' : 'B'"
              :title="actionButtonWeightTitle"
              @click="toggleActionButtonWeight"
            >
              {{ actionButtonWeightTitle }}
            </AppActionButton>
          </article>
        </div>
      </aside>

      <section class="content-card provider-settings-card">
        <div class="section-title provider-settings-title">
          <div>
            <h2>模型连接配置</h2>
            <p class="muted-text">
              配置个人 AI 服务地址、模型与 API Key。AI 出题审核页只选择 Provider，不维护连接参数。
            </p>
          </div>
          <StatusTag
            :label="setting?.configured ? '已配置个人 Key' : '未配置个人 Key'"
            :tone="setting?.configured ? 'success' : 'warning'"
          />
        </div>

        <div class="provider-config-shell">
          <aside class="provider-rail" aria-label="AI Provider 类型">
            <button
              v-for="option in providerOptions"
              :key="option.value"
              type="button"
              :class="[
                'provider-choice-card',
                { 'provider-choice-card--active': option.value === selectedProvider },
              ]"
              :disabled="isLoading || isSaving || isTesting"
              @click="selectedProvider = option.value"
            >
              <span class="provider-choice-icon">{{ option.icon }}</span>
              <span class="provider-choice-text">
                <strong>{{ option.label }}</strong>
                <small>{{ option.description }}</small>
              </span>
              <span v-if="option.value === selectedProvider" class="provider-choice-check">✓</span>
            </button>
          </aside>

          <div class="provider-form-panel">
            <div class="provider-current-row">
              <div>
                <span class="muted-text">当前 Key</span>
                <strong>{{ keyStatusText }}</strong>
              </div>
              <div>
                <span class="muted-text">当前模型</span>
                <strong>{{ setting?.model || providerDefaults[selectedProvider].model }}</strong>
              </div>
              <div>
                <span class="muted-text">更新时间</span>
                <strong>{{ setting?.updatedAt || '尚未保存个人配置' }}</strong>
              </div>
            </div>

            <div class="provider-settings-grid">
              <AppFormControl
                v-model="form.baseUrl"
                class="form-field form-field--full"
                label="服务器地址 Base URL"
                type="url"
                autocomplete="off"
                placeholder="https://api.openai.com/v1"
                hint="例如 Kimi 可填写 https://api.moonshot.cn/v1。"
                :disabled="isLoading || isSaving || isTesting"
              />

              <AppFormControl
                v-model="form.model"
                class="form-field"
                label="模型名称"
                type="text"
                autocomplete="off"
                placeholder="gpt-4.1-mini / kimi-k2.6"
                :disabled="isLoading || isSaving || isTesting"
              />

              <AppFormControl
                v-model="form.apiKey"
                class="form-field"
                label="API Key"
                type="password"
                autocomplete="off"
                placeholder="留空表示沿用已保存 Key"
                :disabled="isLoading || isSaving || isTesting"
              />
            </div>

            <div class="provider-action-bar">
              <div class="provider-action-hint">
                <strong>{{ selectedOption.label }}</strong>
                <span>{{
                  message || '建议保存前先执行连接测试，确认服务地址、模型与 Key 可用。'
                }}</span>
              </div>
              <div class="inline-actions provider-actions">
                <AppActionButton
                  class="icon-action-button"
                  icon="🔌"
                  :disabled="isSaving || isLoading || isTesting"
                  title="测试连接"
                  @click="testConnection"
                >
                  {{ isTesting ? '测试中...' : '测试连接' }}
                </AppActionButton>
                <AppActionButton
                  class="icon-action-button"
                  icon="↺"
                  :disabled="isSaving || isLoading || isTesting"
                  title="恢复默认"
                  @click="resetToDefault"
                >
                  恢复默认
                </AppActionButton>
                <AppActionButton
                  class="icon-action-button"
                  icon="💾"
                  variant="primary"
                  :disabled="isSaving || isLoading || isTesting"
                  :title="isSaving ? '保存中...' : `保存 ${selectedOption.label} 配置`"
                  @click="saveSetting"
                >
                  {{ isSaving ? '保存中...' : '保存配置' }}
                </AppActionButton>
              </div>
            </div>

            <div
              v-if="testResult"
              :class="[
                'provider-test-result',
                testResult.success
                  ? 'provider-test-result--success'
                  : 'provider-test-result--danger',
              ]"
            >
              <div class="test-result-head">
                <StatusTag
                  :label="testResult.success ? '连接正常' : '连接失败'"
                  :tone="testResult.success ? 'success' : 'danger'"
                />
                <span class="muted-text">耗时 {{ testResult.latencyMs ?? 0 }} ms</span>
              </div>
              <p>{{ testResultMessage }}</p>
              <dl>
                <div>
                  <dt>服务器地址</dt>
                  <dd>{{ testResult.baseUrl || form.baseUrl || '未指定' }}</dd>
                </div>
                <div>
                  <dt>模型</dt>
                  <dd>{{ testResult.model || form.model || '未指定' }}</dd>
                </div>
                <div v-if="testResult.responsePreview">
                  <dt>模型响应</dt>
                  <dd>{{ testResult.responsePreview }}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.teacher-settings-page {
  display: grid;
  gap: 20px;
}

.settings-hero-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 24px;
  overflow: hidden;
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--mm-color-primary) 8%, transparent),
      transparent 46%
    ),
    var(--mm-color-card);
}

.settings-hero-main {
  min-width: 0;
}

.settings-eyebrow {
  color: var(--mm-color-primary);
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.04em;
}

.settings-hero-card h2,
.provider-settings-title h2,
.settings-section-title h2 {
  margin: 4px 0 0;
  color: var(--mm-color-text-primary);
  font-size: 1rem;
  line-height: 1.35;
}

.settings-hero-card p,
.provider-settings-title p,
.settings-section-title p {
  max-width: 720px;
  margin-top: 6px;
}

.settings-hero-side {
  display: inline-flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
}

/* Override global .content-card + .content-card margin inside the two-column settings grid,
   otherwise the right card is pushed down and card tops are not aligned. */
.settings-layout > .content-card + .content-card {
  margin-top: 0;
}

.settings-layout {
  display: grid;
  grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.settings-preference-card {
  display: grid;
  gap: 16px;
  position: sticky;
  top: 76px;
}

.preference-list {
  display: grid;
  gap: 12px;
}

.preference-item {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--mm-color-border-subtle);
  border-radius: var(--radius-sm);
  background: var(--mm-color-bg);
}

.preference-item strong,
.preference-item span {
  display: block;
}

.preference-item strong {
  color: var(--mm-color-text-primary);
  font-size: var(--font-size-sm);
}

.preference-item span {
  margin-top: 4px;
  color: var(--mm-color-text-secondary);
  font-size: var(--font-size-xs);
  line-height: 1.55;
}

.preference-item .app-action-button {
  justify-self: start;
}

.provider-settings-card {
  display: grid;
  gap: 18px;
  min-width: 0;
}

.provider-settings-title {
  padding-bottom: 14px;
  border-bottom: 1px solid var(--mm-color-border-subtle);
}

.provider-config-shell {
  display: grid;
  grid-template-columns: minmax(220px, 260px) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.provider-rail {
  display: grid;
  gap: 10px;
}

.provider-choice-card {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) 20px;
  gap: 10px;
  align-items: center;
  width: 100%;
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--mm-color-border-subtle);
  border-radius: var(--radius-sm);
  background: var(--mm-color-bg);
  color: var(--mm-color-text);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.16s ease,
    background 0.16s ease,
    box-shadow 0.16s ease,
    transform 0.16s ease;
}

.provider-choice-card:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--mm-color-primary) 34%, var(--mm-color-border));
  background: color-mix(in srgb, var(--mm-color-primary) 4%, var(--mm-color-card));
}

.provider-choice-card:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.provider-choice-card--active {
  border-color: color-mix(in srgb, var(--mm-color-primary) 58%, var(--mm-color-border));
  background: color-mix(in srgb, var(--mm-color-primary) 8%, var(--mm-color-card));
  box-shadow:
    inset 3px 0 0 var(--mm-color-primary),
    0 10px 24px rgb(15 23 42 / 5%);
}

.provider-choice-icon {
  display: inline-grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--mm-color-primary) 12%, var(--mm-color-card));
  color: var(--mm-color-primary);
  font-size: 0.94rem;
  font-weight: 800;
}

.provider-choice-text {
  min-width: 0;
}

.provider-choice-text strong,
.provider-choice-text small {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.provider-choice-text strong {
  color: var(--mm-color-text-primary);
  font-size: var(--font-size-sm);
  line-height: 1.35;
  white-space: nowrap;
}

.provider-choice-text small {
  margin-top: 3px;
  color: var(--mm-color-text-secondary);
  font-size: var(--font-size-xs);
  line-height: 1.45;
}

.provider-choice-check {
  color: var(--mm-color-primary);
  font-weight: 800;
  text-align: right;
}

.provider-form-panel {
  display: grid;
  min-width: 0;
  gap: 16px;
}

.provider-current-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.provider-current-row > div {
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 13px 14px;
  border: 1px solid var(--mm-color-border-subtle);
  border-radius: var(--radius-sm);
  background: linear-gradient(180deg, var(--mm-color-card), var(--mm-color-bg));
}

.provider-current-row strong {
  overflow: hidden;
  color: var(--mm-color-text-primary);
  font-size: var(--font-size-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.provider-settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--mm-color-border-subtle);
  border-radius: var(--radius-sm);
  background: var(--mm-color-bg);
}

.form-field--full {
  grid-column: 1 / -1;
}

.field-help {
  margin-top: 6px;
  color: var(--mm-color-text-secondary);
  font-size: var(--font-size-xs);
}

.provider-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid var(--mm-color-border-subtle);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--mm-color-primary) 4%, var(--mm-color-card));
}

.provider-action-hint {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.provider-action-hint strong {
  color: var(--mm-color-text-primary);
  font-size: var(--font-size-sm);
}

.provider-action-hint span {
  color: var(--mm-color-text-secondary);
  font-size: var(--font-size-xs);
  line-height: 1.5;
}

.provider-actions {
  flex: 0 0 auto;
  justify-content: flex-end;
}

.provider-test-result {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--mm-color-border);
  border-radius: var(--radius-sm);
  background: var(--mm-color-bg);
}

.provider-test-result--success {
  border-color: color-mix(in srgb, var(--mm-color-success) 34%, var(--mm-color-border));
  background: color-mix(in srgb, var(--mm-color-success) 8%, var(--mm-color-card));
}

.provider-test-result--danger {
  border-color: color-mix(in srgb, var(--mm-color-danger) 30%, var(--mm-color-border));
  background: color-mix(in srgb, var(--mm-color-danger) 7%, var(--mm-color-card));
}

.test-result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.provider-test-result p {
  margin: 0;
  color: var(--mm-color-text);
  line-height: 1.6;
}

.provider-test-result dl {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.provider-test-result dt {
  color: var(--mm-color-text-secondary);
  font-size: var(--font-size-xs);
}

.provider-test-result dd {
  margin: 4px 0 0;
  overflow: hidden;
  color: var(--mm-color-text-primary);
  font-size: var(--font-size-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1100px) {
  .settings-layout,
  .provider-config-shell {
    grid-template-columns: 1fr;
  }

  .settings-preference-card {
    position: static;
  }

  .provider-rail {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .settings-hero-card,
  .provider-action-bar {
    align-items: flex-start;
    flex-direction: column;
  }

  .settings-hero-side,
  .provider-actions {
    justify-content: flex-start;
  }

  .provider-rail,
  .provider-current-row,
  .provider-settings-grid,
  .provider-test-result dl {
    grid-template-columns: 1fr;
  }
}
</style>
