const fs = require('fs');
const path = 'apps/mindmark-web/src/views/teacher/AiQuestionsView.vue';
const content = String.raw`<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';

import EmptyState from '@/components/common/EmptyState.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import QuestionPreviewCard from '@/components/question/QuestionPreviewCard.vue';
import { DIFFICULTY_META, QUESTION_TYPE_META } from '@/constants/question';
import { useMockApi } from '@/services/api/httpClient';
import {
  generateAiQuestions,
  getAiProviderSetting,
  listAiQuestionDrafts,
  reviewAiQuestion,
  saveAiProviderSetting,
  type AiProvider,
  type AiProviderSetting,
} from '@/services/aiQuestionService';
import { listVisibleCourses } from '@/services/academicService';
import type { Course } from '@/types/academic';
import type {
  AiQuestionDraft,
  AiQuestionGenerateRequest,
  AiReviewStatus,
  Difficulty,
  QuestionType,
} from '@/types/question';

const typeOptions = Object.entries(QUESTION_TYPE_META).map(([value, meta]) => ({
  value: value as QuestionType,
  label: meta.label,
}));
const difficultyOptions = Object.entries(DIFFICULTY_META).map(([value, meta]) => ({
  value: value as Difficulty,
  label: meta.label,
}));
const providerOptions: Array<{ value: AiProvider; label: string; description: string }> = [
  { value: 'OPENAI', label: 'OpenAI', description: '兼容 OpenAI Chat Completions 协议' },
  { value: 'ANTHROPIC', label: 'Anthropic', description: 'Claude Messages API' },
];

const form = reactive<AiQuestionGenerateRequest>({
  courseId: '',
  provider: 'OPENAI',
  subject: '',
  knowledgePoint: 'Vue 组件通信',
  type: 'SINGLE_CHOICE',
  difficulty: 'MEDIUM',
  count: 3,
  requirement: '题干清晰，选项区分度高，解析简明且必须使用中文。',
});

const courses = ref<Course[]>([]);
const selectedCourse = computed(
  () => courses.value.find((course) => course.id === form.courseId) ?? null,
);
const selectedProvider = computed(() => form.provider ?? 'OPENAI');
const selectedProviderOption = computed(
  () => providerOptions.find((option) => option.value === selectedProvider.value) ?? providerOptions[0],
);
const drafts = ref<AiQuestionDraft[]>([]);
const isLoading = ref(false);
const isGenerating = ref(false);
const reviewingId = ref<string | null>(null);
const isGenerateCollapsed = ref(false);
const providerSetting = ref<AiProviderSetting | null>(null);
const providerApiKey = ref('');
const providerSaving = ref(false);
const providerMessage = ref<string | null>(null);

const syncSubjectFromCourse = () => {
  form.subject = selectedCourse.value?.name ?? '';
};

const loadCourses = async () => {
  courses.value = await listVisibleCourses();
  form.courseId =
    courses.value.find((course) => course.id === 'course-frontend-001')?.id ??
    courses.value[0]?.id ??
    '';
  syncSubjectFromCourse();
};

const loadDrafts = async () => {
  isLoading.value = true;
  try {
    drafts.value = await listAiQuestionDrafts();
  } finally {
    isLoading.value = false;
  }
};

const loadProviderSetting = async () => {
  providerSetting.value = await getAiProviderSetting(selectedProvider.value);
};

const saveProvider = async () => {
  if (!providerApiKey.value.trim()) {
    providerMessage.value = `请先输入 ${selectedProviderOption.value.label} API Key。`;
    return;
  }

  providerSaving.value = true;
  providerMessage.value = null;
  try {
    providerSetting.value = await saveAiProviderSetting(
      selectedProvider.value,
      providerApiKey.value.trim(),
    );
    providerApiKey.value = '';
    providerMessage.value = `已保存当前教师的 ${selectedProviderOption.value.label} API Key。`;
  } catch (error) {
    providerMessage.value = error instanceof Error ? error.message : '保存 API Key 失败。';
  } finally {
    providerSaving.value = false;
  }
};

const generate = async () => {
  if (!form.courseId) {
    return;
  }

  syncSubjectFromCourse();
  isGenerating.value = true;
  try {
    await generateAiQuestions({ ...form, count: Number(form.count) });
    await loadDrafts();
  } finally {
    isGenerating.value = false;
  }
};

const review = async (draft: AiQuestionDraft, status: AiReviewStatus) => {
  reviewingId.value = draft.id;
  try {
    await reviewAiQuestion(draft.id, status);
    await loadDrafts();
  } finally {
    reviewingId.value = null;
  }
};

const canReview = (draft: AiQuestionDraft) => draft.reviewStatus === 'PENDING';

watch(
  () => form.courseId,
  () => {
    syncSubjectFromCourse();
  },
);

watch(
  () => form.provider,
  () => {
    providerApiKey.value = '';
    providerMessage.value = null;
    void loadProviderSetting();
  },
);

onMounted(() => {
  void loadCourses();
  void loadDrafts();
  void loadProviderSetting();
});
</script>

<template>
  <div>
    <PageHeader
      title="AI 出题审核"
      description="通过 LangGraph 编排 OpenAI / Anthropic 生成中文题目，教师审核后进入题库。"
    >
      <template #actions>
        <RouterLink class="secondary-button" to="/teacher/questions">返回题库管理</RouterLink>
      </template>
    </PageHeader>

    <section class="content-card ai-review-notice">
      <StatusTag
        :label="useMockApi ? 'Mock 模式' : '真实接口模式'"
        :tone="useMockApi ? 'warning' : 'success'"
      />
      <p>真实接口模式下，生成题目会以“AI / 待审核”状态写入题库；审核通过后才可组卷使用。</p>
    </section>

    <section class="content-card ai-provider-card">
      <div class="section-title">
        <div>
          <h2>AI Provider 配置</h2>
          <p class="muted-text">
            每位教师可选择 OpenAI 或 Anthropic 并保存个人 API Key；后端加密存储，未配置时才使用全局环境变量兜底。
          </p>
        </div>
        <StatusTag
          :label="providerSetting?.configured ? '已配置教师 Key' : '使用全局兜底'"
          :tone="providerSetting?.configured ? 'success' : 'warning'"
        />
      </div>
      <div class="provider-setting-row">
        <label class="form-field provider-setting-form-field">
          <span>Provider</span>
          <select v-model="form.provider" class="select-input" :disabled="providerSaving">
            <option v-for="option in providerOptions" :key="option.value" :value="option.value">
              {{ option.label }} · {{ option.description }}
            </option>
          </select>
        </label>
        <div class="provider-setting-item">
          <span class="muted-text">当前配置</span>
          <strong>{{ providerSetting?.keyPreview || '未配置个人 Key' }}</strong>
        </div>
        <label class="form-field provider-setting-form-field">
          <span>新的 API Key</span>
          <input
            v-model.trim="providerApiKey"
            class="text-input"
            type="password"
            autocomplete="off"
            placeholder="sk-... / sk-ant-..."
            :disabled="providerSaving"
          />
        </label>
      </div>
      <div class="inline-actions">
        <button
          class="primary-button"
          type="button"
          :disabled="providerSaving"
          @click="saveProvider"
        >
          {{ providerSaving ? '保存中...' : `保存 ${selectedProviderOption.label} Key` }}
        </button>
        <span v-if="providerMessage" class="muted-text">{{ providerMessage }}</span>
      </div>
    </section>

    <section class="filter-card filter-card--compact ai-generate-form">
      <div class="section-title">
        <div>
          <h2>生成题目</h2>
          <p class="muted-text">选择课程、Provider、知识点、题型、难度与数量，生成内容强制要求中文。</p>
        </div>
        <div class="section-actions">
          <button
            class="secondary-button filter-toggle-button"
            type="button"
            :aria-expanded="!isGenerateCollapsed"
            @click="isGenerateCollapsed = !isGenerateCollapsed"
          >
            {{ isGenerateCollapsed ? '展开全部' : '收起到一行' }}
          </button>
          <button
            class="primary-button"
            type="button"
            :disabled="isGenerating || !form.courseId"
            @click="generate"
          >
            {{ isGenerating ? '生成中...' : useMockApi ? '生成 Mock 题目' : `用 ${selectedProviderOption.label} 生成` }}
          </button>
        </div>
      </div>

      <div
        :class="[
          'filter-grid',
          'collapsible-filter-body',
          { 'collapsible-filter-body--single-row': isGenerateCollapsed },
        ]"
      >
        <label class="form-field">
          <span>课程</span>
          <select v-model="form.courseId" class="select-input">
            <option value="" disabled>请选择课程</option>
            <option v-for="course in courses" :key="course.id" :value="course.id">
              {{ course.name }}
            </option>
          </select>
        </label>
        <label class="form-field">
          <span>Provider</span>
          <select v-model="form.provider" class="select-input">
            <option v-for="option in providerOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
        <label class="form-field">
          <span>知识点</span>
          <input v-model.trim="form.knowledgePoint" class="text-input" type="text" />
        </label>
        <label class="form-field">
          <span>题型</span>
          <select v-model="form.type" class="select-input">
            <option v-for="option in typeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
        <label class="form-field">
          <span>难度</span>
          <select v-model="form.difficulty" class="select-input">
            <option v-for="option in difficultyOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
        <label class="form-field">
          <span>数量</span>
          <input v-model.number="form.count" class="text-input" type="number" min="1" max="5" />
        </label>
        <label class="form-field form-field--full">
          <span>补充要求</span>
          <textarea v-model.trim="form.requirement" class="textarea-input" rows="3" />
        </label>
      </div>
    </section>

    <section class="ai-draft-list">
      <div class="section-title">
        <div>
          <h2>待审核题目</h2>
          <p class="muted-text">{{ drafts.length }} 道 AI 生成题目等待教师审核。</p>
        </div>
      </div>

      <p v-if="isLoading" class="muted-text loading-text">正在加载 AI 草稿...</p>
      <EmptyState
        v-else-if="!drafts.length"
        title="暂无 AI 草稿"
        description="请先配置生成条件并创建题目。"
      />

      <article v-for="draft in drafts" v-else :key="draft.id" class="ai-draft-item">
        <QuestionPreviewCard :item="draft" show-ai-meta />
        <div class="inline-actions ai-review-actions">
          <button
            class="primary-button"
            type="button"
            :disabled="!canReview(draft) || reviewingId === draft.id"
            @click="review(draft, 'ACCEPTED')"
          >
            通过
          </button>
          <button
            class="secondary-button"
            type="button"
            :disabled="!canReview(draft) || reviewingId === draft.id"
            @click="review(draft, 'EDITED_ACCEPTED')"
          >
            编辑后通过
          </button>
          <button
            class="secondary-button danger-button"
            type="button"
            :disabled="!canReview(draft) || reviewingId === draft.id"
            @click="review(draft, 'REJECTED')"
          >
            驳回
          </button>
          <button
            class="secondary-button"
            type="button"
            :disabled="isGenerating || !form.courseId"
            @click="generate"
          >
            重新生成
          </button>
        </div>
      </article>
    </section>
  </div>
</template>
`;
fs.writeFileSync(path, content, 'utf8');
