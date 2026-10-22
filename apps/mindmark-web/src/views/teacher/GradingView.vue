<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import { getErrorMessage } from '@/utils/errorMessage';

import AppActionButton from '@/components/common/AppActionButton.vue';
import AppFormControl from '@/components/common/AppFormControl.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import EnterprisePagination from '@/components/common/EnterprisePagination.vue';
import ErrorState from '@/components/common/ErrorState.vue';
import OperationNotice from '@/components/common/OperationNotice.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import GradingQuestionReviewCard from '@/components/review/GradingQuestionReviewCard.vue';
import { GRADING_TASK_STATUS_META } from '@/constants/status';
import {
  autoGradeTask,
  batchAutoGradeTasks,
  batchConfirmSystemScores,
  confirmSystemScore,
  enqueueAiGradingJob,
  getLatestAiGradingJob,
  listGradingTaskAllItems,
  listGradingTaskItemsPage,
  listGradingTasksPage,
  reviewGradingTask,
} from '@/services/gradingService';
import { listExamsPage } from '@/services/examService';
import { requestUserConfirmation } from '@/utils/confirmAction';
import type { Exam } from '@/types/exam';
import type {
  GradingAiJob,
  GradingScoreOverride,
  GradingTask,
  QuestionGrade,
  ScoreBandKey,
} from '@/types/grading';

const route = useRoute();

const tasks = ref<GradingTask[]>([]);
const questionGrades = ref<QuestionGrade[]>([]);
const selectedTaskId = ref('');
const loading = ref(false);
const questionsLoading = ref(false);
const examOptionsLoading = ref(false);
const errorMessage = ref<string | null>(null);
const reviewing = ref(false);
const batchOperating = ref(false);
const autoGradingTaskId = ref('');
const confirmingTaskId = ref('');
const aiGradingTaskId = ref('');
const currentAiJob = ref<GradingAiJob | null>(null);
let aiJobPollingTimer: number | undefined;
const operationMessage = ref('');
const selectedCourseName = ref('');
const selectedExamId = ref('');
const selectedScoreBand = ref<'' | ScoreBandKey>('');
const exams = ref<Exam[]>([]);
const tasksTotal = ref(0);
const questionTotal = ref(0);
const scoreOverrides = ref<Record<string, number>>({});
const taskPagination = reactive({ page: 1, pageSize: 8 });
const questionPagination = reactive({ page: 1, pageSize: 10 });
const pagedTasks = computed(() => tasks.value);
const pagedQuestionGrades = computed(() => questionGrades.value);
const AI_JOB_ACTIVE_STATUSES = new Set(['PENDING', 'RUNNING']);
const AI_JOB_STATUS_LABEL: Record<GradingAiJob['status'], string> = {
  PENDING: '等待 AI 主观题评分',
  RUNNING: 'AI 主观题评分中',
  SUCCEEDED: 'AI 主观题评分已完成',
  SKIPPED: 'AI 评分已跳过，保留系统基线分',
  FAILED: 'AI 评分失败，保留系统基线分',
};

const scoreBandOptions: Array<{ value: ScoreBandKey; label: string }> = [
  { value: 'FAILED', label: '不及格' },
  { value: 'S60_69', label: '60-69' },
  { value: 'S70_79', label: '70-79' },
  { value: 'S80_89', label: '80-89' },
  { value: 'S90_100', label: '90-100' },
];
const hasActiveTaskFilter = computed(() =>
  Boolean(selectedCourseName.value || selectedExamId.value || selectedScoreBand.value),
);
const courseOptions = computed(() =>
  Array.from(new Set(exams.value.map((exam) => exam.courseName).filter(Boolean))).sort(),
);
const examOptions = computed(() =>
  exams.value.filter(
    (exam) => !selectedCourseName.value || exam.courseName === selectedCourseName.value,
  ),
);
const courseFilterOptions = computed(() => [
  { label: '全部科目', value: '' },
  ...courseOptions.value.map((courseName) => ({ label: courseName, value: courseName })),
]);
const examFilterOptions = computed(() => [
  { label: '全部考试', value: '' },
  ...examOptions.value.map((exam) => ({ label: exam.title, value: exam.id })),
]);
const scoreBandFilterOptions = computed(() => [
  { label: '全部分数段', value: '' },
  ...scoreBandOptions,
]);
const activeFilterSummary = computed(() => {
  const parts: string[] = [];
  if (selectedCourseName.value) {
    parts.push(selectedCourseName.value);
  }
  if (selectedExamId.value) {
    parts.push(exams.value.find((exam) => exam.id === selectedExamId.value)?.title ?? '指定考试');
  }
  if (selectedScoreBand.value) {
    parts.push(
      scoreBandOptions.find((band) => band.value === selectedScoreBand.value)?.label ?? '指定分段',
    );
  }

  return parts.length ? parts.join(' / ') : '全部科目与考试';
});

const selectedTask = computed(
  () => tasks.value.find((task) => task.id === selectedTaskId.value) ?? null,
);
const selectedAiJob = computed(() =>
  currentAiJob.value?.gradingTaskId === selectedTask.value?.id ? currentAiJob.value : null,
);
const selectedAiJobActive = computed(() =>
  selectedAiJob.value ? AI_JOB_ACTIVE_STATUSES.has(selectedAiJob.value.status) : false,
);
const selectedAiJobSummary = computed(() => {
  const job = selectedAiJob.value;
  if (!job) {
    return '';
  }
  const progress =
    job.subjectiveItemCount > 0 ? ` · ${job.processedItemCount}/${job.subjectiveItemCount} 题` : '';
  const provider = job.provider && job.model ? ` · ${job.provider}/${job.model}` : '';
  const duration = job.durationMs ? ` · 耗时 ${formatDuration(job.durationMs)}` : '';
  const summary = job.resultSummary ? ` · ${job.resultSummary}` : '';
  const error = job.errorMessage
    ? ` · ${getErrorMessage(job.errorMessage, 'AI 自动评分失败，请稍后重试。')}`
    : '';

  return `${AI_JOB_STATUS_LABEL[job.status]}${progress}${provider}${duration}${summary}${error}`;
});
const pendingCount = computed(
  () => tasks.value.filter((task) => task.status !== 'REVIEWED').length,
);
const reviewedCount = computed(
  () => tasks.value.filter((task) => task.status === 'REVIEWED').length,
);
const failedCount = computed(() => tasks.value.filter((task) => task.failed).length);
const averageProgress = computed(() => {
  if (tasks.value.length === 0) {
    return 0;
  }

  return Math.round((reviewedCount.value / tasks.value.length) * 100);
});

const formatDuration = (durationMs: number) =>
  durationMs >= 1000 ? `${(durationMs / 1000).toFixed(1)}s` : `${durationMs}ms`;

const gradeScoreValue = (grade: QuestionGrade) =>
  scoreOverrides.value[grade.questionId] ??
  grade.finalScore ??
  grade.aiSuggestedScore ??
  grade.autoScore ??
  0;

const scoreValue = (task: GradingTask, questionId: string) => {
  const override = scoreOverrides.value[questionId];
  if (override !== undefined) {
    return override;
  }

  const grade =
    questionGrades.value.find((item) => item.questionId === questionId) ??
    task.questionGrades.find((item) => item.questionId === questionId);

  return grade?.finalScore ?? grade?.aiSuggestedScore ?? grade?.autoScore ?? 0;
};

const updateScore = (questionId: string, inputScore: number) => {
  const grade = questionGrades.value.find((item) => item.questionId === questionId);
  const safeScore = Math.max(0, Math.min(grade?.maxScore ?? Number.MAX_SAFE_INTEGER, inputScore));

  scoreOverrides.value = { ...scoreOverrides.value, [questionId]: safeScore };
  questionGrades.value = questionGrades.value.map((item) =>
    item.questionId === questionId ? { ...item, finalScore: safeScore } : item,
  );
};

const loadQuestionGrades = async () => {
  const task = selectedTask.value;

  if (!task) {
    questionGrades.value = [];
    questionTotal.value = 0;
    return;
  }

  questionsLoading.value = true;
  questionGrades.value = [];
  try {
    const response = await listGradingTaskItemsPage(task, {
      page: questionPagination.page,
      pageSize: questionPagination.pageSize,
    });
    questionGrades.value = response.items.map((grade) => ({
      ...grade,
      ...(scoreOverrides.value[grade.questionId] !== undefined
        ? { finalScore: scoreOverrides.value[grade.questionId] }
        : {}),
    }));
    questionTotal.value = response.total;
    questionPagination.page = response.page;
    questionPagination.pageSize = response.pageSize;
  } catch (error) {
    questionTotal.value = 0;
    errorMessage.value = getErrorMessage(error, '答卷题目加载失败，请稍后重试');
  } finally {
    questionsLoading.value = false;
  }
};

const clearAiJobPolling = () => {
  if (aiJobPollingTimer !== undefined) {
    window.clearInterval(aiJobPollingTimer);
    aiJobPollingTimer = undefined;
  }
};

const loadLatestAiJob = async (silent = true) => {
  const task = selectedTask.value;
  if (!task) {
    currentAiJob.value = null;
    clearAiJobPolling();
    return;
  }

  try {
    const job = await getLatestAiGradingJob(task.id);
    currentAiJob.value = job;
    if (job && AI_JOB_ACTIVE_STATUSES.has(job.status)) {
      startAiJobPolling();
    } else {
      clearAiJobPolling();
    }
  } catch (error) {
    if (!silent) {
      errorMessage.value = getErrorMessage(error, 'AI 评分任务状态加载失败，请稍后重试');
    }
  }
};

const startAiJobPolling = () => {
  if (aiJobPollingTimer !== undefined) {
    return;
  }
  aiJobPollingTimer = window.setInterval(() => {
    void (async () => {
      const taskId = selectedTask.value?.id;
      if (!taskId) {
        clearAiJobPolling();
        return;
      }
      const beforeStatus = selectedAiJob.value?.status;
      await loadLatestAiJob(true);
      const afterJob = selectedAiJob.value;
      if (afterJob && !AI_JOB_ACTIVE_STATUSES.has(afterJob.status)) {
        clearAiJobPolling();
        if (beforeStatus === 'PENDING' || beforeStatus === 'RUNNING') {
          await loadTasks();
          await loadQuestionGrades();
          operationMessage.value =
            afterJob.status === 'SUCCEEDED'
              ? 'AI 主观题评分已刷新，教师可按系统默认分核对。'
              : 'AI 主观题评分未完成，已保留系统基线分，教师可继续核对。';
        }
      }
    })();
  }, 3500);
};

const loadExamOptions = async () => {
  examOptionsLoading.value = true;
  try {
    const response = await listExamsPage(1, 100);
    exams.value = response.items;
  } catch {
    exams.value = [];
  } finally {
    examOptionsLoading.value = false;
  }
};

const loadTasks = async () => {
  loading.value = true;
  errorMessage.value = null;

  try {
    const response = await listGradingTasksPage({
      page: taskPagination.page,
      pageSize: taskPagination.pageSize,
      ...(selectedCourseName.value ? { courseName: selectedCourseName.value } : {}),
      ...(selectedExamId.value ? { examId: selectedExamId.value } : {}),
      ...(selectedScoreBand.value ? { scoreBand: selectedScoreBand.value } : {}),
    });
    tasks.value = response.items;
    tasksTotal.value = response.total;
    taskPagination.page = response.page;
    taskPagination.pageSize = response.pageSize;
    selectedTaskId.value = tasks.value.some((task) => task.id === selectedTaskId.value)
      ? selectedTaskId.value
      : '';
    if (selectedTaskId.value) {
      await loadQuestionGrades();
      await loadLatestAiJob(true);
    } else {
      questionGrades.value = [];
      questionTotal.value = 0;
      currentAiJob.value = null;
      clearAiJobPolling();
    }
  } catch (error) {
    tasks.value = [];
    questionGrades.value = [];
    tasksTotal.value = 0;
    questionTotal.value = 0;
    selectedTaskId.value = '';
    currentAiJob.value = null;
    clearAiJobPolling();
    errorMessage.value = getErrorMessage(error, '批改任务加载失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const submitReview = async () => {
  const task = selectedTask.value;

  if (!task) {
    return;
  }

  const confirmed = await requestUserConfirmation(
    `确认提交 ${task.studentName} 的批改复核结果吗？提交后将进入成绩统计。`,
  );

  if (!confirmed) {
    return;
  }

  reviewing.value = true;
  errorMessage.value = null;
  operationMessage.value = '';
  try {
    const allQuestionGrades = await listGradingTaskAllItems(task);
    const overrides: GradingScoreOverride[] = allQuestionGrades.map((grade) => ({
      questionId: grade.questionId,
      finalScore: gradeScoreValue(grade),
      ...(grade.teacherComment ? { teacherComment: grade.teacherComment } : {}),
    }));
    const updated = await reviewGradingTask(task.id, overrides);
    if (updated) {
      tasks.value = tasks.value.map((item) =>
        item.id === updated.id ? { ...updated, questionGrades: [] } : item,
      );
      scoreOverrides.value = {};
      await loadQuestionGrades();
      operationMessage.value = `${updated.studentName} 的答卷已完成复核，可进入成绩发布前检查。`;
    }
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '提交复核失败，请稍后重试');
  } finally {
    reviewing.value = false;
  }
};

const currentBatchParams = () => ({
  ...(selectedCourseName.value ? { courseName: selectedCourseName.value } : {}),
  ...(selectedExamId.value ? { examId: selectedExamId.value } : {}),
  ...(selectedScoreBand.value ? { scoreBand: selectedScoreBand.value } : {}),
});

const replaceTask = (updated: GradingTask) => {
  tasks.value = tasks.value.map((item) =>
    item.id === updated.id ? { ...updated, questionGrades: [] } : item,
  );
};

const handleAutoGradeTask = async () => {
  const task = selectedTask.value;
  if (!task) {
    return;
  }

  autoGradingTaskId.value = task.id;
  errorMessage.value = null;
  operationMessage.value = '';
  try {
    const updated = await autoGradeTask(task.id);
    replaceTask(updated);
    scoreOverrides.value = {};
    await loadQuestionGrades();
    await loadLatestAiJob(false);
    operationMessage.value = `${updated.studentName} 已完成规则/基线判分；如需强化简答、论述、案例或编程题评分，可单独启动 AI 批改。`;
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '系统自动判分失败，请稍后重试');
  } finally {
    autoGradingTaskId.value = '';
  }
};

const handleEnqueueAiGradingJob = async () => {
  const task = selectedTask.value;
  if (!task) {
    return;
  }

  aiGradingTaskId.value = task.id;
  errorMessage.value = null;
  operationMessage.value = '';
  try {
    const job = await enqueueAiGradingJob(task.id);
    currentAiJob.value = job;
    if (job && AI_JOB_ACTIVE_STATUSES.has(job.status)) {
      startAiJobPolling();
      operationMessage.value = 'AI 批改任务已提交，系统将自动刷新简答、论述、案例和编程题默认分。';
    } else if (job) {
      await loadQuestionGrades();
      operationMessage.value = selectedAiJobSummary.value || 'AI 批改任务已处理完成。';
    } else {
      operationMessage.value = '当前答卷暂无需要 AI 批改的主观题。';
    }
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      'AI 批改任务提交失败，请检查个人 AI Provider 配置后重试',
    );
  } finally {
    aiGradingTaskId.value = '';
  }
};

const handleConfirmSystemScore = async (includeFailed = false) => {
  const task = selectedTask.value;
  if (!task) {
    return;
  }

  const confirmText = includeFailed
    ? `确认将 ${task.studentName} 的不及格答卷按系统默认分核对通过吗？`
    : `确认将 ${task.studentName} 的答卷按系统默认分核对通过吗？`;
  const confirmed = await requestUserConfirmation(confirmText);
  if (!confirmed) {
    return;
  }

  confirmingTaskId.value = task.id;
  errorMessage.value = null;
  operationMessage.value = '';
  try {
    const updated = await confirmSystemScore(task.id, includeFailed);
    replaceTask(updated);
    scoreOverrides.value = {};
    await loadQuestionGrades();
    operationMessage.value = `${updated.studentName} 已按系统默认分完成教师核对。`;
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '核对系统默认分失败，请检查是否存在不及格复核限制');
  } finally {
    confirmingTaskId.value = '';
  }
};

const handleBatchAutoGrade = async () => {
  const confirmed = await requestUserConfirmation(
    `确认对「${activeFilterSummary.value}」范围内答卷执行系统自动判分吗？`,
  );
  if (!confirmed) {
    return;
  }

  batchOperating.value = true;
  errorMessage.value = null;
  operationMessage.value = '';
  try {
    const result = await batchAutoGradeTasks(currentBatchParams());
    operationMessage.value = `${result.message}：命中 ${result.matchedCount} 份，处理 ${result.processedCount} 份。`;
    await loadTasks();
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '批量自动判分失败，请稍后重试');
  } finally {
    batchOperating.value = false;
  }
};

const handleBatchConfirm = async (includeFailed = false) => {
  const tip = includeFailed
    ? '包含不及格答卷，确认后所有命中答卷都会进入复核完成状态。'
    : '默认跳过不及格答卷，需单独复核或二次确认。';
  const confirmed = await requestUserConfirmation(
    `确认一键核对「${activeFilterSummary.value}」范围内的系统默认分吗？${tip}`,
  );
  if (!confirmed) {
    return;
  }

  batchOperating.value = true;
  errorMessage.value = null;
  operationMessage.value = '';
  try {
    const result = await batchConfirmSystemScores({
      ...currentBatchParams(),
      includeFailed,
      onlyAutoGraded: false,
    });
    operationMessage.value = `${result.message}：命中 ${result.matchedCount} 份，核对 ${result.processedCount} 份，跳过不及格 ${result.skippedFailedCount} 份。`;
    await loadTasks();
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '批量核对失败，请稍后重试');
  } finally {
    batchOperating.value = false;
  }
};
const selectTask = async (taskId: string) => {
  if (selectedTaskId.value === taskId) {
    return;
  }

  selectedTaskId.value = taskId;
  questionPagination.page = 1;
  scoreOverrides.value = {};
  operationMessage.value = '';
  await loadQuestionGrades();
  await loadLatestAiJob(true);
};

const backToTaskList = () => {
  selectedTaskId.value = '';
  questionPagination.page = 1;
  questionGrades.value = [];
  questionTotal.value = 0;
  scoreOverrides.value = {};
  operationMessage.value = '';
  currentAiJob.value = null;
  clearAiJobPolling();
};

const resetTaskSelectionForFilter = () => {
  taskPagination.page = 1;
  questionPagination.page = 1;
  selectedTaskId.value = '';
  questionGrades.value = [];
  questionTotal.value = 0;
  scoreOverrides.value = {};
  operationMessage.value = '';
  currentAiJob.value = null;
  clearAiJobPolling();
};

const handleCourseFilterChange = async () => {
  if (selectedExamId.value && !examOptions.value.some((exam) => exam.id === selectedExamId.value)) {
    selectedExamId.value = '';
  }
  resetTaskSelectionForFilter();
  await loadTasks();
};

const handleExamFilterChange = async () => {
  resetTaskSelectionForFilter();
  await loadTasks();
};

const handleScoreBandFilterChange = async () => {
  resetTaskSelectionForFilter();
  await loadTasks();
};

const hydrateFiltersFromRoute = () => {
  selectedExamId.value = typeof route.query.examId === 'string' ? route.query.examId : '';
  const queryScoreBand = typeof route.query.scoreBand === 'string' ? route.query.scoreBand : '';
  selectedScoreBand.value = scoreBandOptions.some((band) => band.value === queryScoreBand)
    ? (queryScoreBand as ScoreBandKey)
    : '';
};

const clearTaskFilters = async () => {
  selectedCourseName.value = '';
  selectedExamId.value = '';
  selectedScoreBand.value = '';
  resetTaskSelectionForFilter();
  await loadTasks();
};

const handleTaskPaginationChange = async (page: number, pageSize: number) => {
  taskPagination.page = page;
  taskPagination.pageSize = pageSize;
  questionPagination.page = 1;
  scoreOverrides.value = {};
  operationMessage.value = '';
  await loadTasks();
};

const handleQuestionPaginationChange = async (page: number, pageSize: number) => {
  questionPagination.page = page;
  questionPagination.pageSize = pageSize;
  await loadQuestionGrades();
};

onMounted(() => {
  hydrateFiltersFromRoute();
  void Promise.all([loadExamOptions(), loadTasks()]);
});

onBeforeUnmount(() => {
  clearAiJobPolling();
});
</script>

<template>
  <div class="page-shell grading-page">
    <OperationNotice
      v-if="operationMessage"
      title="操作已完成"
      :description="operationMessage"
      tone="success"
    />

    <section class="metric-grid grading-metrics">
      <article class="metric-card">
        <span>待复核答卷</span>
        <strong>{{ pendingCount }}</strong>
        <small>AI 已预批或等待教师确认</small>
      </article>
      <article class="metric-card">
        <span>已完成复核</span>
        <strong>{{ reviewedCount }}</strong>
        <small>可进入发布前检查</small>
      </article>
      <article class="metric-card">
        <span>复核进度</span>
        <strong>{{ averageProgress }}%</strong>
        <small>按真实批改任务实时计算</small>
      </article>
      <article class="metric-card">
        <span>不及格复核</span>
        <strong>{{ failedCount }}</strong>
        <small>不及格答卷默认跳过批量确认，需重点复核</small>
      </article>
    </section>

    <p v-if="loading" class="muted-text loading-text">正在加载批改任务...</p>
    <ErrorState v-else-if="errorMessage" title="数据加载失败" :description="errorMessage">
      <AppActionButton class="icon-action-button" icon="↻" title="重试" @click="loadTasks"
        >重试</AppActionButton
      >
    </ErrorState>
    <main
      v-else
      :class="['grading-layout', selectedTask ? 'grading-layout--detail' : 'grading-layout--list']"
    >
      <section v-if="!selectedTask" class="content-card grading-task-list grading-task-list--full">
        <div class="section-title">
          <div>
            <h2>答卷队列</h2>
            <p class="muted-text">按提交时间进入批改任务池。</p>
          </div>
          <div class="section-actions grading-batch-actions">
            <AppActionButton
              class="icon-action-button"
              icon="🤖"
              size="sm"
              title="批量自动判分"
              :loading="batchOperating"
              :disabled="batchOperating || tasksTotal === 0"
              @click="handleBatchAutoGrade"
            >
              批量判分
            </AppActionButton>
            <AppActionButton
              class="icon-action-button"
              icon="✅"
              size="sm"
              title="一键核对通过"
              :loading="batchOperating"
              :disabled="batchOperating || tasksTotal === 0"
              @click="handleBatchConfirm(false)"
            >
              一键核对
            </AppActionButton>
            <AppActionButton
              class="icon-action-button"
              icon="⚠️"
              size="sm"
              variant="danger"
              title="一键复核不及格"
              :loading="batchOperating"
              :disabled="batchOperating || tasksTotal === 0 || failedCount === 0"
              @click="handleBatchConfirm(true)"
            >
              复核不及格
            </AppActionButton>
            <AppActionButton
              class="icon-action-button"
              icon="📊"
              size="sm"
              title="进入成绩中心"
              to="/teacher/scores"
            >
              成绩中心
            </AppActionButton>
          </div>
        </div>

        <div class="grading-queue-filters" aria-label="答卷队列筛选">
          <AppFormControl
            v-model="selectedCourseName"
            control="select"
            label="科目"
            :options="courseFilterOptions"
            :disabled="loading || examOptionsLoading"
            @change="handleCourseFilterChange"
          />
          <AppFormControl
            v-model="selectedExamId"
            control="select"
            label="考试"
            :options="examFilterOptions"
            :disabled="loading || examOptionsLoading"
            @change="handleExamFilterChange"
          />

          <AppFormControl
            v-model="selectedScoreBand"
            control="select"
            label="分数段"
            :options="scoreBandFilterOptions"
            :disabled="loading"
            @change="handleScoreBandFilterChange"
          />
          <AppActionButton
            class="icon-action-button grading-filter-clear"
            icon="↺"
            title="清空筛选"
            :disabled="loading || !hasActiveTaskFilter"
            @click="clearTaskFilters"
          >
            清空
          </AppActionButton>
        </div>
        <p class="grading-filter-summary muted-text" :title="activeFilterSummary">
          {{ activeFilterSummary }} · 共 {{ tasksTotal }} 份答卷
        </p>

        <EmptyState
          v-if="tasks.length === 0"
          :title="hasActiveTaskFilter ? '当前筛选下暂无答卷' : '暂无待批改答卷'"
          :description="
            hasActiveTaskFilter
              ? '可切换科目或考试查看其他答卷。'
              : '学生提交答卷后会自动进入批改中心。'
          "
        />
        <div v-else class="grading-task-grid">
          <button
            v-for="task in pagedTasks"
            :key="task.id"
            class="grading-task-button"
            type="button"
            @click="selectTask(task.id)"
          >
            <span class="grading-task-main">
              <span class="grading-task-topline">
                <strong class="grading-task-student" :title="task.studentName">
                  {{ task.studentName }}
                </strong>
                <StatusTag
                  class="grading-task-status"
                  :label="GRADING_TASK_STATUS_META[task.status].label"
                  :tone="GRADING_TASK_STATUS_META[task.status].tone"
                />
              </span>
              <small
                class="grading-task-meta"
                :title="`${task.examTitle} · ${task.className} · ${task.submittedAt}`"
              >
                <span class="grading-task-exam">{{ task.examTitle }}</span>
                <span class="grading-task-meta-line">
                  <span class="grading-task-class">{{ task.className }}</span>
                  <time>{{ task.submittedAt }}</time>
                </span>
              </small>
            </span>
            <span class="grading-task-side">
              <span class="grading-task-score">
                {{ task.currentScore }}/{{ task.totalScore }} 分
              </span>
              <span v-if="task.failed" class="soft-tag soft-tag--danger">不及格复核</span>
              <span v-else-if="task.needsReview" class="soft-tag soft-tag--warning">建议抽查</span>
              <span v-else class="soft-tag soft-tag--success">系统分可核对</span>
            </span>
          </button>
        </div>
        <EnterprisePagination
          v-if="tasksTotal > taskPagination.pageSize"
          class="section-pagination"
          :current="taskPagination.page"
          :page-size="taskPagination.pageSize"
          :total="tasksTotal"
          :page-size-options="['8', '16', '32']"
          :disabled="loading"
          @change="handleTaskPaginationChange"
        />
      </section>

      <section
        v-if="selectedTask"
        class="content-card grading-detail-card grading-detail-card--full"
      >
        <div class="section-title">
          <div>
            <h2>{{ selectedTask.examTitle }}</h2>
            <p class="muted-text">
              {{ selectedTask.studentName }} · {{ selectedTask.className }} · 当前建议总分
              {{ selectedTask.currentScore }}/{{ selectedTask.totalScore }}
            </p>
          </div>
          <div class="section-actions grading-detail-actions">
            <AppActionButton
              class="icon-action-button"
              icon="←"
              size="sm"
              title="返回答卷队列"
              @click="backToTaskList"
            >
              返回队列
            </AppActionButton>
            <AppActionButton
              class="icon-action-button"
              icon="🤖"
              size="sm"
              title="规则/基线判分"
              :loading="autoGradingTaskId === selectedTask.id"
              :disabled="
                reviewing ||
                confirmingTaskId === selectedTask.id ||
                selectedTask.status === 'REVIEWED'
              "
              @click="handleAutoGradeTask"
            >
              规则判分
            </AppActionButton>
            <AppActionButton
              class="icon-action-button"
              icon="🧠"
              size="sm"
              title="AI 批改简答、论述、案例和编程题"
              :loading="aiGradingTaskId === selectedTask.id"
              :disabled="
                reviewing ||
                confirmingTaskId === selectedTask.id ||
                autoGradingTaskId === selectedTask.id ||
                selectedAiJobActive ||
                selectedTask.status === 'REVIEWED'
              "
              @click="handleEnqueueAiGradingJob"
            >
              AI 批改
            </AppActionButton>
            <AppActionButton
              class="icon-action-button"
              icon="✅"
              size="sm"
              variant="primary"
              :loading="confirmingTaskId === selectedTask.id"
              :disabled="
                reviewing ||
                autoGradingTaskId === selectedTask.id ||
                selectedTask.status === 'REVIEWED'
              "
              title="按系统默认分核对通过"
              @click="handleConfirmSystemScore(false)"
            >
              核对通过
            </AppActionButton>
            <AppActionButton
              v-if="selectedTask.failed && selectedTask.status !== 'REVIEWED'"
              class="icon-action-button"
              icon="⚠️"
              size="sm"
              variant="danger"
              :loading="confirmingTaskId === selectedTask.id"
              :disabled="
                reviewing ||
                autoGradingTaskId === selectedTask.id ||
                aiGradingTaskId === selectedTask.id
              "
              title="确认不及格答卷"
              @click="handleConfirmSystemScore(true)"
            >
              不及格确认
            </AppActionButton>
            <AppActionButton
              class="icon-action-button"
              icon="✍️"
              size="sm"
              :loading="reviewing"
              :disabled="reviewing || selectedTask.status === 'REVIEWED'"
              :title="selectedTask.status === 'REVIEWED' ? '已复核' : '人工调整后提交复核'"
              @click="submitReview"
            >
              {{ selectedTask.status === 'REVIEWED' ? '已复核' : '提交复核' }}
            </AppActionButton>
          </div>
        </div>

        <div
          v-if="selectedAiJob"
          :class="[
            'ai-grading-job-banner',
            {
              'ai-grading-job-banner--active': selectedAiJobActive,
              'ai-grading-job-banner--warning':
                selectedAiJob.status === 'SKIPPED' || selectedAiJob.status === 'FAILED',
            },
          ]"
        >
          <span class="ai-grading-job-icon">🤖</span>
          <div>
            <strong>{{ AI_JOB_STATUS_LABEL[selectedAiJob.status] }}</strong>
            <p>{{ selectedAiJobSummary }}</p>
          </div>
        </div>

        <div class="grading-review-summary">
          <span>系统分：{{ selectedTask.currentScore }}/{{ selectedTask.totalScore }}</span>
          <span>及格线：{{ selectedTask.passScore }}</span>
          <span v-if="selectedTask.failed" class="danger-text">未达及格线，需不及格复核</span>
          <span v-else-if="selectedTask.needsReview" class="warning-text">存在建议抽查题目</span>
          <span v-if="selectedTask.reviewReason" class="muted-text">{{
            selectedTask.reviewReason
          }}</span>
        </div>
        <div class="answer-review-list">
          <GradingQuestionReviewCard
            v-for="grade in pagedQuestionGrades"
            :key="grade.questionId"
            :grade="grade"
            :score="scoreValue(selectedTask, grade.questionId)"
            :disabled="reviewing || selectedTask.status === 'REVIEWED'"
            @update-score="updateScore"
          />
          <EnterprisePagination
            v-if="questionTotal > questionPagination.pageSize"
            class="section-pagination"
            :current="questionPagination.page"
            :page-size="questionPagination.pageSize"
            :total="questionTotal"
            :page-size-options="['10', '20', '50']"
            :disabled="reviewing || questionsLoading"
            @change="handleQuestionPaginationChange"
          />
        </div>
      </section>
    </main>
  </div>
</template>
