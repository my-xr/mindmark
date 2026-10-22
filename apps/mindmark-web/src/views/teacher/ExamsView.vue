<script setup lang="ts">
import AppActionButton from '@/components/common/AppActionButton.vue';
import EnterprisePagination from '@/components/common/EnterprisePagination.vue';
import { computed, onMounted, reactive, ref } from 'vue';

import { getErrorMessage } from '@/utils/errorMessage';

import ErrorState from '@/components/common/ErrorState.vue';
import OperationNotice from '@/components/common/OperationNotice.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { EXAM_STATUS_META, PAPER_STATUS_META } from '@/constants/status';
import { useClientPagination } from '@/composables/useClientPagination';
import { listVisibleClasses } from '@/services/academicService';
import { createExam, listExamsPage } from '@/services/examService';
import { listPapers } from '@/services/paperService';
import type { TeachingClass } from '@/types/academic';
import type { Exam, ExamCreateRequest } from '@/types/exam';
import type { Paper } from '@/types/paper';

interface ExamFormState {
  title: string;
  paperId: string;
  classIds: string[];
  startTime: string;
  endTime: string;
}

const pad = (value: number) => value.toString().padStart(2, '0');
const toDatetimeLocalValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;

const roundToNextMinutes = (date: Date, intervalMinutes = 10) => {
  const next = new Date(date);
  const minutes = next.getMinutes();
  const rounded = Math.ceil(minutes / intervalMinutes) * intervalMinutes;
  next.setMinutes(rounded, 0, 0);

  return next;
};

const createDefaultForm = (): ExamFormState => {
  const start = roundToNextMinutes(new Date(Date.now() + 30 * 60 * 1000));
  const end = new Date(start.getTime() + 90 * 60 * 1000);

  return {
    title: '前端工程化阶段测验',
    paperId: '',
    classIds: [],
    startTime: toDatetimeLocalValue(start),
    endTime: toDatetimeLocalValue(end),
  };
};

const exams = ref<Exam[]>([]);
const papers = ref<Paper[]>([]);
const classes = ref<TeachingClass[]>([]);
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const formErrorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const creating = ref(false);
const form = reactive<ExamFormState>(createDefaultForm());

const readyPapers = computed(() =>
  papers.value.filter((paper) => paper.status === 'READY' || paper.status === 'PUBLISHED'),
);
const selectedPaper = computed(
  () => papers.value.find((paper) => paper.id === form.paperId) ?? null,
);
const selectedClassNames = computed(() =>
  form.classIds
    .map((classId) => classes.value.find((teachingClass) => teachingClass.id === classId)?.name)
    .filter((name): name is string => Boolean(name)),
);
const durationMinutes = computed(() => {
  const start = new Date(form.startTime).getTime();
  const end = new Date(form.endTime).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return 0;
  }

  return Math.round((end - start) / 60000);
});
const durationHint = computed(() => {
  if (!durationMinutes.value) {
    return '请检查考试开始和结束时间';
  }

  const hours = Math.floor(durationMinutes.value / 60);
  const minutes = durationMinutes.value % 60;

  if (!hours) {
    return `${minutes} 分钟`;
  }

  return minutes ? `${hours} 小时 ${minutes} 分钟` : `${hours} 小时`;
});
const validationMessage = computed(() => {
  if (!form.title.trim()) {
    return '请填写考试名称';
  }
  if (!form.paperId) {
    return '请选择已准备或已发布的试卷';
  }
  if (!selectedPaper.value || !['READY', 'PUBLISHED'].includes(selectedPaper.value.status)) {
    return '当前试卷状态不可创建考试';
  }
  if (!form.classIds.length) {
    return '请选择至少一个参考班级';
  }
  if (!form.startTime || !form.endTime || durationMinutes.value <= 0) {
    return '结束时间必须晚于开始时间';
  }

  return '';
});
const canCreate = computed(() => !validationMessage.value);
const examPagination = reactive({ page: 1, pageSize: 6, total: 0 });
const {
  pagination: classPagination,
  items: pagedClasses,
  clampPage: clampClassPage,
  handleChange: handleClassPaginationChange,
} = useClientPagination(() => classes.value, 8);
const examStatusSummary = computed(() => [
  { label: '全部考试', value: examPagination.total },
  { label: '待开始', value: exams.value.filter((exam) => exam.status === 'SCHEDULED').length },
  { label: '进行中', value: exams.value.filter((exam) => exam.status === 'IN_PROGRESS').length },
  {
    label: '待批改',
    value: exams.value.filter((exam) => exam.status === 'ENDED' || exam.status === 'GRADING')
      .length,
  },
]);

const toRequestDateTime = (value: string) => value.replace('T', ' ');
const formatDateTimeText = (value: string) => value.replace('T', ' ');
const progressText = (exam: Exam) => `${exam.submittedCount}/${exam.participantCount}`;
const progressPercent = (exam: Exam) =>
  exam.participantCount ? Math.round((exam.submittedCount / exam.participantCount) * 100) : 0;

const loadExams = async () => {
  const page = await listExamsPage(examPagination.page, examPagination.pageSize);
  exams.value = page.items;
  examPagination.total = page.total;
  examPagination.page = page.page;
  examPagination.pageSize = page.pageSize;
};

const handleExamPaginationChange = (page: number, pageSize: number) => {
  examPagination.page = page;
  examPagination.pageSize = pageSize;
  void loadExams();
};

const isClassSelected = (classId: string) => form.classIds.includes(classId);

const toggleClassSelection = (classId: string) => {
  const index = form.classIds.indexOf(classId);
  if (index >= 0) {
    form.classIds.splice(index, 1);
    return;
  }
  form.classIds.push(classId);
};

const resetFormAfterCreate = () => {
  const next = createDefaultForm();
  form.title = next.title;
  form.startTime = next.startTime;
  form.endTime = next.endTime;
  form.paperId = readyPapers.value[0]?.id ?? '';
  form.classIds = classes.value[0]?.id ? [classes.value[0].id] : [];
};

const loadData = async () => {
  loading.value = true;
  errorMessage.value = null;

  try {
    const [paperResult, classResult] = await Promise.all([listPapers(), listVisibleClasses()]);
    await loadExams();
    papers.value = paperResult;
    classes.value = classResult;
    form.paperId = form.paperId || readyPapers.value[0]?.id || '';
    form.classIds = form.classIds.length
      ? form.classIds
      : classResult[0]?.id
        ? [classResult[0].id]
        : [];
    clampClassPage();
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '考试数据加载失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const submitCreateExam = async () => {
  successMessage.value = null;
  formErrorMessage.value = null;
  if (!canCreate.value) {
    formErrorMessage.value = validationMessage.value;
    return;
  }

  const request: ExamCreateRequest = {
    title: form.title.trim(),
    paperId: form.paperId,
    classIds: [...form.classIds],
    classNames: selectedClassNames.value.length ? selectedClassNames.value : [...form.classIds],
    startTime: toRequestDateTime(form.startTime),
    endTime: toRequestDateTime(form.endTime),
  };

  creating.value = true;
  formErrorMessage.value = null;
  try {
    await createExam(request);
    examPagination.page = 1;
    await loadExams();
    successMessage.value = '考试创建成功，学生可在考试时间窗口内进入答题。';
    resetFormAfterCreate();
  } catch (error) {
    formErrorMessage.value = getErrorMessage(error, '创建考试失败，请检查试卷、班级与时间窗口');
  } finally {
    creating.value = false;
  }
};

const primaryAction = (exam: Exam) => {
  if (exam.status === 'ENDED' || exam.status === 'GRADING' || exam.status === 'GRADED') {
    return { label: '进入批改', to: '/teacher/grading' };
  }
  if (exam.status === 'PUBLISHED') {
    return { label: '查看复盘', to: '/teacher/reviews' };
  }

  return { label: '学生入口', to: `/student/exams/${exam.id}/notice` };
};

onMounted(() => {
  void loadData();
});
</script>

<template>
  <div class="page-shell exams-page">
    <OperationNotice
      v-if="successMessage"
      title="考试创建成功"
      :description="successMessage"
      tone="success"
    />
    <OperationNotice
      v-if="formErrorMessage"
      title="请检查考试配置"
      :description="formErrorMessage"
      tone="danger"
    />

    <section class="content-card exam-create-card">
      <div class="section-title">
        <div>
          <h2>创建考试</h2>
          <p class="muted-text">按考试名称、试卷、时间窗口和参考班级一次性完成配置。</p>
        </div>
        <div class="section-actions">
          <AppActionButton
            class="icon-action-button"
            icon="🧩"
            title="返回组卷"
            to="/teacher/papers"
          >
            返回组卷
          </AppActionButton>
          <AppActionButton
            class="icon-action-button"
            icon="🗓️"
            variant="primary"
            :disabled="creating || !canCreate"
            :title="creating ? '创建中...' : '创建考试'"
            @click="submitCreateExam"
          >
            {{ creating ? '创建中...' : '创建考试' }}
          </AppActionButton>
          <small v-if="!canCreate" class="muted-text">{{ validationMessage }}</small>
        </div>
      </div>

      <div class="exam-create-layout">
        <div class="exam-create-form">
          <label class="form-field form-field--full">
            <span>考试名称</span>
            <input v-model.trim="form.title" class="text-input" type="text" />
          </label>

          <label class="form-field form-field--full">
            <span>选择试卷</span>
            <select v-model="form.paperId" class="select-input">
              <option value="" disabled>请选择已发布或已准备的试卷</option>
              <option v-for="paper in readyPapers" :key="paper.id" :value="paper.id">
                {{ paper.title }} · {{ paper.totalScore }} 分 · {{ paper.durationMinutes }} 分钟
              </option>
            </select>
          </label>

          <label class="form-field">
            <span>开始时间</span>
            <input
              v-model="form.startTime"
              class="text-input datetime-input"
              type="datetime-local"
            />
          </label>
          <label class="form-field">
            <span>结束时间</span>
            <input v-model="form.endTime" class="text-input datetime-input" type="datetime-local" />
          </label>

          <div class="form-field form-field--full">
            <span>参考班级</span>
            <div class="exam-class-picker" role="group" aria-label="选择参考班级">
              <button
                v-for="teachingClass in pagedClasses"
                :key="teachingClass.id"
                :class="[
                  'exam-class-option',
                  { 'exam-class-option--selected': isClassSelected(teachingClass.id) },
                ]"
                type="button"
                :aria-pressed="isClassSelected(teachingClass.id)"
                @click="toggleClassSelection(teachingClass.id)"
              >
                <strong>{{ teachingClass.name }}</strong>
                <span>{{ teachingClass.code }}</span>
                <small>{{ teachingClass.courseName || teachingClass.major || '未绑定课程' }}</small>
              </button>
            </div>
            <EnterprisePagination
              v-if="classes.length > 0"
              class="section-pagination exam-class-pagination"
              :current="classPagination.page"
              :page-size="classPagination.pageSize"
              :total="classes.length"
              :page-size-options="['8', '16', '32']"
              :disabled="loading"
              @change="handleClassPaginationChange"
            />
            <p v-if="classes.length === 0" class="muted-text">
              暂无可用教学班，请先由管理员创建班级并完成教师/助教授权。
            </p>
          </div>
        </div>

        <aside class="exam-create-preview">
          <span class="soft-tag">考试预览</span>
          <h3>{{ form.title || '未命名考试' }}</h3>
          <div class="exam-preview-list">
            <div>
              <small>考试时长</small>
              <strong>{{ durationHint }}</strong>
            </div>
            <div>
              <small>参考班级</small>
              <strong>{{ selectedClassNames.length }} 个班级</strong>
              <span>{{ selectedClassNames.join(' / ') || '暂未选择' }}</span>
            </div>
            <div v-if="selectedPaper">
              <small>关联试卷</small>
              <strong>{{ selectedPaper.title }}</strong>
              <span>
                {{ selectedPaper.courseName }} · {{ selectedPaper.questions.length }} 题 ·
                {{ selectedPaper.totalScore }} 分
              </span>
            </div>
          </div>
          <StatusTag
            v-if="selectedPaper"
            :label="PAPER_STATUS_META[selectedPaper.status].label"
            :tone="PAPER_STATUS_META[selectedPaper.status].tone"
          />
        </aside>
      </div>
    </section>

    <section class="content-card exam-list-card exam-list-card--modern">
      <div class="section-title">
        <div>
          <h2>考试列表</h2>
          <p class="muted-text">按考试状态、时间窗口和提交进度快速查看当前账号可管理的考试。</p>
        </div>
        <div class="section-actions">
          <AppActionButton
            class="icon-action-button"
            icon="↻"
            :disabled="loading"
            title="刷新考试列表"
            @click="loadData"
          >
            {{ loading ? '刷新中...' : '刷新列表' }}
          </AppActionButton>
        </div>
      </div>

      <div class="exam-list-summary">
        <div v-for="item in examStatusSummary" :key="item.label" class="exam-list-stat">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>

      <p v-if="loading" class="muted-text loading-text">正在加载考试...</p>
      <ErrorState v-else-if="errorMessage" title="数据加载失败" :description="errorMessage">
        <AppActionButton class="icon-action-button" icon="↻" title="重试" @click="loadData"
          >重试</AppActionButton
        >
      </ErrorState>
      <div v-else-if="exams.length === 0" class="exam-card-empty">
        暂无考试，请先选择试卷、时间和参考班级创建考试。
      </div>
      <div v-else class="exam-card-list">
        <article v-for="exam in exams" :key="exam.id" class="exam-card-item">
          <div class="exam-card-main">
            <div class="exam-card-title-row">
              <div>
                <h3>{{ exam.title }}</h3>
                <p>{{ exam.courseName }} · {{ exam.paper.title }}</p>
              </div>
              <StatusTag
                :label="EXAM_STATUS_META[exam.status].label"
                :tone="EXAM_STATUS_META[exam.status].tone"
              />
            </div>

            <div class="exam-card-meta-grid">
              <div>
                <small>考试时间</small>
                <strong>
                  {{ formatDateTimeText(exam.startTime) }} - {{ formatDateTimeText(exam.endTime) }}
                </strong>
              </div>
              <div>
                <small>参考班级</small>
                <strong>{{ exam.classNames.join(' / ') }}</strong>
              </div>
              <div>
                <small>考试时长</small>
                <strong>{{ exam.durationMinutes }} 分钟</strong>
              </div>
            </div>
          </div>

          <aside class="exam-card-side">
            <div class="exam-progress-header">
              <span>提交进度</span>
              <strong>{{ progressText(exam) }}</strong>
            </div>
            <div class="exam-progress-bar" aria-hidden="true">
              <span :style="{ width: `${progressPercent(exam)}%` }"></span>
            </div>
            <div class="exam-card-actions">
              <AppActionButton
                class="exam-entry-button"
                icon="↗"
                variant="primary"
                :to="primaryAction(exam).to"
              >
                {{ primaryAction(exam).label }}
              </AppActionButton>
              <AppActionButton
                class="exam-entry-button icon-action-button"
                icon="📈"
                to="/teacher/scores"
              >
                成绩中心
              </AppActionButton>
            </div>
          </aside>
        </article>
        <EnterprisePagination
          v-if="examPagination.total > examPagination.pageSize"
          class="section-pagination"
          :current="examPagination.page"
          :page-size="examPagination.pageSize"
          :total="examPagination.total"
          :page-size-options="['6', '12', '24']"
          :disabled="loading"
          @change="handleExamPaginationChange"
        />
      </div>
    </section>
  </div>
</template>
