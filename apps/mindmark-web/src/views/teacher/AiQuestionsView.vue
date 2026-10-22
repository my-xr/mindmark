<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';

import AppActionButton from '@/components/common/AppActionButton.vue';
import AppFormControl from '@/components/common/AppFormControl.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import EnterprisePagination from '@/components/common/EnterprisePagination.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import QuestionPreviewCard from '@/components/question/QuestionPreviewCard.vue';
import { DIFFICULTY_META, QUESTION_TYPE_META } from '@/constants/question';
import { useMockApi } from '@/services/api/httpClient';
import {
  createAiQuestionGenerationTask,
  generateAiQuestions,
  listAiQuestionDraftsPage,
  listAiQuestionGenerationTasks,
  reviewAiQuestion,
  waitAiQuestionGenerationTask,
  type AiProvider,
  type AiQuestionDraftFilterStatus,
  type AiQuestionGenerationTask,
  type AiQuestionGenerationTaskListItem,
} from '@/services/aiQuestionService';
import { listVisibleCourses } from '@/services/academicService';
import { getErrorMessage } from '@/utils/errorMessage';
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

const draftStatusOptions: Array<{ value: AiQuestionDraftFilterStatus; label: string }> = [
  { value: 'PENDING_REVIEW', label: '待审核' },
  { value: 'REJECTED', label: '已驳回' },
  { value: 'ALL', label: '全部 AI 题' },
];

const providerSelectOptions = providerOptions.map((option) => ({
  label: option.label,
  value: option.value,
}));

const taskStatusMeta: Record<
  AiQuestionGenerationTask['status'],
  { label: string; tone: 'success' | 'danger' | 'warning' | 'info' }
> = {
  PENDING: { label: '排队中', tone: 'warning' },
  RUNNING: { label: '生成中', tone: 'info' },
  SUCCEEDED: { label: '已完成', tone: 'success' },
  FAILED: { label: '失败', tone: 'danger' },
};

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

const courseSelectOptions = computed(() => [
  { disabled: true, label: '请选择课程', value: '' },
  ...courses.value.map((course) => ({ label: course.name, value: course.id })),
]);
const selectedProvider = computed(() => form.provider ?? 'OPENAI');
const selectedProviderOption = computed(
  () =>
    providerOptions.find((option) => option.value === selectedProvider.value) ?? providerOptions[0],
);
const drafts = ref<AiQuestionDraft[]>([]);
const isLoading = ref(false);
const isGenerating = ref(false);
const generateMessage = ref<string | null>(null);
const generateMessageTone = ref<'success' | 'danger' | 'info'>('info');
const currentTask = ref<AiQuestionGenerationTask | null>(null);
const taskHistory = ref<AiQuestionGenerationTaskListItem[]>([]);
const taskHistoryLoading = ref(false);
const taskPagination = reactive({ page: 1, pageSize: 5, total: 0 });
const reviewingId = ref<string | null>(null);
const isGenerateCollapsed = ref(false);
const draftStatus = ref<AiQuestionDraftFilterStatus>('PENDING_REVIEW');
const draftPagination = reactive({ page: 1, pageSize: 5, total: 0 });
const taskStatusText = computed(() => {
  if (!currentTask.value) {
    return null;
  }
  const statusMap: Record<AiQuestionGenerationTask['status'], string> = {
    PENDING: '任务已提交，等待调度',
    RUNNING: '模型生成中，完成后将自动写入待审核题库',
    SUCCEEDED: `生成完成：${currentTask.value.generatedCount ?? 0} 道题已进入待审核`,
    FAILED: getErrorMessage(currentTask.value.errorMessage, '生成失败，请检查 Provider 配置。'),
  };
  return statusMap[currentTask.value.status];
});

const taskStatusTone = computed<'success' | 'danger' | 'info'>(() => {
  if (currentTask.value?.status === 'SUCCEEDED') {
    return 'success';
  }
  if (currentTask.value?.status === 'FAILED') {
    return 'danger';
  }
  return 'info';
});

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
    const page = await listAiQuestionDraftsPage(
      draftStatus.value,
      draftPagination.page,
      draftPagination.pageSize,
    );
    drafts.value = page.items;
    draftPagination.total = page.total;
    draftPagination.page = page.page;
    draftPagination.pageSize = page.pageSize;
  } finally {
    isLoading.value = false;
  }
};

const reloadDraftsWithPageCorrection = async () => {
  await loadDrafts();
  if (drafts.value.length === 0 && draftPagination.page > 1) {
    draftPagination.page -= 1;
    await loadDrafts();
  }
};

const loadTaskHistory = async () => {
  taskHistoryLoading.value = true;
  try {
    const page = await listAiQuestionGenerationTasks(taskPagination.page, taskPagination.pageSize);
    taskHistory.value = page.items;
    taskPagination.total = page.total;
    taskPagination.page = page.page;
    taskPagination.pageSize = page.pageSize;
  } finally {
    taskHistoryLoading.value = false;
  }
};

const handleTaskPaginationChange = (page: number, pageSize: number) => {
  taskPagination.page = page;
  taskPagination.pageSize = pageSize;
  void loadTaskHistory();
};

const handleDraftPaginationChange = (page: number, pageSize: number) => {
  draftPagination.page = page;
  draftPagination.pageSize = pageSize;
  void loadDrafts();
};

const generate = async () => {
  if (!form.courseId) {
    return;
  }

  syncSubjectFromCourse();
  isGenerating.value = true;
  currentTask.value = null;
  generateMessage.value = null;
  generateMessageTone.value = 'info';
  try {
    if (useMockApi) {
      await generateAiQuestions({ ...form, count: Number(form.count) });
    } else {
      const task = await createAiQuestionGenerationTask({ ...form, count: Number(form.count) });
      currentTask.value = task;
      generateMessageTone.value = 'info';
      generateMessage.value = `任务 ${task.id.slice(-8)} 已提交，正在等待模型生成...`;
      await waitAiQuestionGenerationTask(task.id, (nextTask) => {
        currentTask.value = nextTask;
        generateMessageTone.value = taskStatusTone.value;
        generateMessage.value = taskStatusText.value;
      });
    }
    draftPagination.page = 1;
    await loadDrafts();
    await loadTaskHistory();
    generateMessageTone.value = 'success';
    generateMessage.value =
      currentTask.value?.status === 'SUCCEEDED'
        ? taskStatusText.value
        : '题目已生成并写入待审核列表。';
  } catch (error) {
    generateMessageTone.value = 'danger';
    generateMessage.value = getErrorMessage(error, 'AI 题目生成失败，请检查 Provider 配置。');
  } finally {
    isGenerating.value = false;
  }
};
const review = async (draft: AiQuestionDraft, status: AiReviewStatus) => {
  reviewingId.value = draft.id;
  generateMessage.value = null;
  try {
    await reviewAiQuestion(draft.id, status);
    await reloadDraftsWithPageCorrection();
    await loadTaskHistory();
    generateMessageTone.value = 'success';
    generateMessage.value =
      status === 'REJECTED'
        ? '题目已驳回，可在题库管理中二次编辑后重新提交审核。'
        : '题目审核已通过并进入可用题库。';
  } catch (error) {
    generateMessageTone.value = 'danger';
    generateMessage.value = getErrorMessage(error, 'AI 题目审核失败，请刷新后重试。');
  } finally {
    reviewingId.value = null;
  }
};

const canReview = (draft: AiQuestionDraft) => draft.reviewStatus === 'PENDING';

watch(draftStatus, () => {
  draftPagination.page = 1;
  void loadDrafts();
});

watch(
  () => form.courseId,
  () => {
    syncSubjectFromCourse();
  },
);

onMounted(() => {
  void loadCourses();
  void loadDrafts();
  void loadTaskHistory();
});
</script>

<template>
  <div class="page-shell ai-questions-page">
    <section class="filter-card filter-card--compact ai-generate-form">
      <div class="section-title">
        <div>
          <h2>生成题目</h2>
          <p class="muted-text">
            选择课程、Provider、知识点、题型、难度与数量，生成内容强制要求中文。
          </p>
        </div>
        <div class="section-actions">
          <AppActionButton
            class="icon-action-button"
            icon="⚙️"
            title="个人配置"
            to="/teacher/settings"
          >
            个人配置
          </AppActionButton>
          <AppActionButton
            class="icon-action-button"
            icon="📚"
            title="返回题库管理"
            to="/teacher/questions"
          >
            题库管理
          </AppActionButton>
          <AppActionButton
            class="icon-action-button"
            :icon="isGenerateCollapsed ? '🔎' : '↟'"
            :aria-expanded="!isGenerateCollapsed"
            @click="isGenerateCollapsed = !isGenerateCollapsed"
          >
            {{ isGenerateCollapsed ? '展开全部' : '收起到一行' }}
          </AppActionButton>
          <AppActionButton
            class="icon-action-button"
            icon="✨"
            variant="primary"
            :disabled="isGenerating || !form.courseId"
            :title="isGenerating ? '生成中...' : '生成题目'"
            @click="generate"
          >
            {{ isGenerating ? '生成中...' : `生成题目（${selectedProviderOption.label}）` }}
          </AppActionButton>
        </div>
      </div>

      <div
        v-if="generateMessage"
        :class="['generate-feedback', `generate-feedback--${generateMessageTone}`]"
      >
        {{ generateMessage }}
      </div>
      <div v-if="currentTask" class="task-progress-card">
        <div>
          <span class="eyebrow-text">异步任务</span>
          <strong>{{ taskStatusText }}</strong>
          <p class="muted-text">
            任务号：{{ currentTask.id }} · Provider：{{ currentTask.provider }}
          </p>
        </div>
        <StatusTag :label="currentTask.status" :tone="taskStatusTone" />
      </div>

      <div
        :class="[
          'filter-grid',
          'collapsible-filter-body',
          { 'collapsible-filter-body--single-row': isGenerateCollapsed },
        ]"
      >
        <AppFormControl
          v-model="form.courseId"
          class="form-field"
          control="select"
          label="课程"
          :options="courseSelectOptions"
        />
        <AppFormControl
          v-model="form.provider"
          class="form-field"
          control="select"
          label="Provider"
          :options="providerSelectOptions"
        />
        <AppFormControl
          v-model="form.knowledgePoint"
          class="form-field"
          label="知识点"
          type="text"
        />
        <AppFormControl
          v-model="form.type"
          class="form-field"
          control="select"
          label="题型"
          :options="typeOptions"
        />
        <AppFormControl
          v-model="form.difficulty"
          class="form-field"
          control="select"
          label="难度"
          :options="difficultyOptions"
        />
        <AppFormControl
          v-model="form.count"
          class="form-field"
          label="数量"
          type="number"
          min="1"
          max="5"
        />
        <AppFormControl
          v-model="form.requirement"
          class="form-field form-field--full"
          control="textarea"
          label="补充要求"
          rows="3"
        />
      </div>
    </section>

    <section class="ai-draft-list">
      <div class="section-title">
        <div>
          <h2>{{ draftStatus === 'PENDING_REVIEW' ? '待审核题目' : 'AI 题目审核池' }}</h2>
          <p class="muted-text">
            共 {{ draftPagination.total }} 道 AI
            题目；已驳回题可进入题库管理编辑，保存后会重新回到待审核。
          </p>
        </div>
        <div class="section-actions">
          <AppFormControl
            v-model="draftStatus"
            class="compact-select"
            control="select"
            hide-label
            label="AI 题目状态"
            :options="draftStatusOptions"
            aria-label="AI 题目状态"
          />
          <AppActionButton
            class="icon-action-button"
            icon="↻"
            :disabled="isLoading"
            :title="isLoading ? '刷新中...' : '刷新审核池'"
            @click="loadDrafts"
          >
            {{ isLoading ? '刷新中...' : '刷新' }}
          </AppActionButton>
          <AppActionButton
            class="icon-action-button"
            icon="✏️"
            title="编辑驳回题"
            to="/teacher/questions"
          >
            编辑驳回题
          </AppActionButton>
        </div>
      </div>

      <p v-if="isLoading" class="muted-text loading-text">正在加载 AI 草稿...</p>
      <EmptyState
        v-else-if="!draftPagination.total"
        title="暂无 AI 草稿"
        description="请先配置生成条件并创建题目。"
      />

      <article v-for="draft in drafts" v-else :key="draft.id" class="ai-draft-item">
        <QuestionPreviewCard :item="draft" show-ai-meta />
        <div class="inline-actions ai-review-actions">
          <AppActionButton
            class="icon-action-button"
            icon="✅"
            variant="primary"
            :disabled="!canReview(draft) || reviewingId === draft.id"
            title="通过审核"
            @click="review(draft, 'ACCEPTED')"
          >
            通过
          </AppActionButton>
          <AppActionButton
            class="icon-action-button"
            icon="✏️"
            title="编辑题目"
            :to="{
              path: '/teacher/questions',
              query: {
                edit: draft.id,
                keyword: draft.id,
                source: 'AI',
                status: draft.reviewStatus === 'REJECTED' ? 'REJECTED' : 'PENDING_REVIEW',
              },
            }"
          >
            编辑题目
          </AppActionButton>
          <AppActionButton
            class="icon-action-button"
            icon="↩"
            variant="danger"
            :disabled="!canReview(draft) || reviewingId === draft.id"
            title="驳回题目"
            @click="review(draft, 'REJECTED')"
          >
            驳回
          </AppActionButton>
          <AppActionButton
            class="icon-action-button"
            icon="✨"
            :disabled="isGenerating || !form.courseId"
            :title="isGenerating ? '生成中...' : '重新生成'"
            @click="generate"
          >
            {{ isGenerating ? '生成中...' : '重新生成' }}
          </AppActionButton>
        </div>
      </article>
      <EnterprisePagination
        v-if="!isLoading && draftPagination.total > draftPagination.pageSize"
        class="section-pagination ai-draft-pagination"
        :current="draftPagination.page"
        :page-size="draftPagination.pageSize"
        :total="draftPagination.total"
        :page-size-options="['5', '10', '20']"
        :disabled="isLoading"
        @change="handleDraftPaginationChange"
      />
    </section>

    <section class="content-card ai-task-history">
      <div class="section-title">
        <div>
          <h2>AI 出题任务历史</h2>
          <p class="muted-text">跟踪异步任务状态，便于确认多题生成是否真实落库。</p>
        </div>
        <AppActionButton
          class="icon-action-button"
          icon="↻"
          :disabled="taskHistoryLoading"
          title="刷新历史"
          @click="loadTaskHistory"
        >
          {{ taskHistoryLoading ? '刷新中...' : '刷新任务' }}
        </AppActionButton>
      </div>
      <p v-if="taskHistoryLoading && !taskHistory.length" class="muted-text loading-text">
        正在加载 AI 出题任务...
      </p>
      <EmptyState
        v-else-if="!taskHistory.length"
        title="暂无生成任务"
        description="提交生成题目后，任务状态、生成数量和失败原因会显示在这里。"
      />
      <template v-else>
        <div class="task-history-table">
          <div class="task-history-row task-history-row--head">
            <span>任务</span>
            <span>课程 / 知识点</span>
            <span>题型 / 难度</span>
            <span>数量</span>
            <span>状态</span>
          </div>
          <div v-for="task in taskHistory" :key="task.id" class="task-history-row">
            <span>
              <strong>{{ task.id.slice(-8) }}</strong>
              <small>{{ task.requestedAt }}</small>
            </span>
            <span>
              <strong>{{ task.courseName || task.courseId }}</strong>
              <small>{{ task.knowledgePoint || task.prompt || '未填写' }}</small>
            </span>
            <span>
              <strong>{{ task.questionType || '-' }}</strong>
              <small>{{ task.difficulty || '-' }}</small>
            </span>
            <span>{{ task.generatedCount ?? 0 }} / {{ task.count ?? '-' }}</span>
            <span>
              <StatusTag
                :label="taskStatusMeta[task.status].label"
                :tone="taskStatusMeta[task.status].tone"
              />
              <small v-if="task.errorMessage" class="task-error-text">{{
                getErrorMessage(task.errorMessage, '生成失败，请检查 Provider 配置。')
              }}</small>
            </span>
          </div>
        </div>
        <EnterprisePagination
          class="task-history-pagination"
          :current="taskPagination.page"
          :page-size="taskPagination.pageSize"
          :total="taskPagination.total"
          :page-size-options="['5', '10', '20']"
          :disabled="taskHistoryLoading"
          @change="handleTaskPaginationChange"
        />
      </template>
    </section>
  </div>
</template>

<style scoped>
.generate-feedback {
  margin: var(--space-3) 0;
  padding: var(--space-3);
  border: 1px solid var(--mm-color-border);
  border-radius: var(--radius-sm);
  background: var(--mm-color-bg);
  color: var(--mm-color-text);
}

.generate-feedback--success {
  border-color: color-mix(in srgb, var(--mm-color-success) 36%, var(--mm-color-border));
  background: color-mix(in srgb, var(--mm-color-success) 8%, var(--mm-color-card));
}

.generate-feedback--danger {
  border-color: color-mix(in srgb, var(--mm-color-danger) 34%, var(--mm-color-border));
  background: color-mix(in srgb, var(--mm-color-danger) 7%, var(--mm-color-card));
}

.task-progress-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin: var(--space-3) 0;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--mm-color-border);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--mm-color-primary) 5%, var(--mm-color-card));
}

.task-progress-card strong {
  display: block;
  margin-top: 2px;
  font-size: 0.88rem;
  color: var(--mm-color-text);
}

.compact-select {
  width: 128px;
  min-height: 32px;
}

.ai-task-history {
  margin-top: var(--space-4);
}

.task-history-table {
  display: grid;
  overflow: hidden;
  border: 1px solid var(--mm-color-border);
  border-radius: var(--radius-sm);
}

.task-history-row {
  display: grid;
  grid-template-columns: minmax(140px, 1.1fr) minmax(180px, 1.6fr) minmax(120px, 1fr) 80px minmax(
      120px,
      1fr
    );
  gap: var(--space-3);
  align-items: center;
  padding: 10px 12px;
  border-top: 1px solid var(--mm-color-border);
  background: var(--mm-color-card);
}

.task-history-row:first-child {
  border-top: 0;
}

.task-history-row--head {
  background: color-mix(in srgb, var(--mm-color-primary) 4%, var(--mm-color-card));
  color: var(--mm-color-text-secondary);
  font-size: 0.78rem;
  font-weight: 650;
}

.task-history-row span {
  min-width: 0;
}

.task-history-row strong,
.task-history-row small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-history-row strong {
  color: var(--mm-color-text-primary);
  font-size: 0.84rem;
  font-weight: 650;
}

.task-history-row small {
  margin-top: 2px;
  color: var(--mm-color-text-secondary);
  font-size: 0.76rem;
}

.task-error-text {
  color: var(--mm-color-danger) !important;
}

.task-history-pagination,
.ai-draft-pagination {
  margin-top: var(--space-3);
}

@media (max-width: 960px) {
  .task-history-row {
    grid-template-columns: 1fr;
  }
}
</style>
