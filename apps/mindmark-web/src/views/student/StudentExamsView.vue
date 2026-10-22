<script setup lang="ts">
import AppActionButton from '@/components/common/AppActionButton.vue';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import EmptyState from '@/components/common/EmptyState.vue';
import ErrorState from '@/components/common/ErrorState.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { STUDENT_EXAM_STATUS_META } from '@/constants/status';
import { listStudentExams } from '@/services/examService';
import type { StudentExamStatus, StudentExamSummary } from '@/types/exam';
import { getErrorMessage } from '@/utils/errorMessage';
import { getExamTimingInfo, parseExamDateTime } from '@/utils/examTime';

const exams = ref<StudentExamSummary[]>([]);
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const nowMs = ref(Date.now());
const refreshedBoundaryKeys = new Set<string>();
let timer: number | undefined;

const loadExams = async () => {
  loading.value = true;
  errorMessage.value = null;

  try {
    exams.value = await listStudentExams();
  } catch (error) {
    exams.value = [];
    errorMessage.value = getErrorMessage(error, '考试安排加载失败，请稍后重试。');
  } finally {
    loading.value = false;
  }
};

const statusPriority: Record<StudentExamStatus, number> = {
  AVAILABLE: 1,
  NOT_STARTED: 2,
  SUBMITTED: 3,
  GRADED: 4,
  ENDED: 5,
  ABSENT: 6,
};

const sortedExams = computed(() =>
  [...exams.value].sort((a, b) => {
    const statusDiff = statusPriority[resolvedStatus(a)] - statusPriority[resolvedStatus(b)];
    if (statusDiff !== 0) {
      return statusDiff;
    }

    return parseExamDateTime(a.startAt) - parseExamDateTime(b.startAt);
  }),
);

const timingOf = (exam: StudentExamSummary) =>
  getExamTimingInfo(exam.startAt, exam.endAt, nowMs.value);

const resolvedStatus = (exam: StudentExamSummary): StudentExamStatus => {
  if (exam.status === 'SUBMITTED' || exam.status === 'GRADED' || exam.status === 'ABSENT') {
    return exam.status;
  }

  const timing = timingOf(exam);
  if (timing.phase === 'IN_WINDOW') {
    return 'AVAILABLE';
  }
  if (timing.phase === 'ENDED') {
    return 'ENDED';
  }

  return exam.status;
};

const actionText = (exam: StudentExamSummary) => {
  const status = resolvedStatus(exam);
  if (status === 'SUBMITTED') {
    return '查看提交状态';
  }

  if (status === 'AVAILABLE') {
    return '阅读须知';
  }

  if (status === 'ENDED') {
    return '查看状态';
  }

  if (status === 'GRADED') {
    return '查看成绩';
  }

  return '查看安排';
};

const helperText = (exam: StudentExamSummary) => {
  if (exam.status === 'SUBMITTED') {
    return '答卷已提交，等待教师批改或成绩发布。';
  }
  if (exam.status === 'GRADED') {
    return '成绩已发布，可前往成绩中心查看反馈。';
  }
  if (exam.status === 'ABSENT') {
    return '系统记录为缺考，如有疑问请联系任课教师。';
  }

  return timingOf(exam).helperText;
};

const maybeRefreshOnTimeBoundary = () => {
  if (loading.value || exams.value.length === 0) {
    return;
  }

  const shouldRefresh = exams.value.some((exam) => {
    const timing = timingOf(exam);
    if (Number.isNaN(timing.startMs) || Number.isNaN(timing.endMs)) {
      return false;
    }

    const startKey = `${exam.id}:${exam.startAt}:start`;
    const endKey = `${exam.id}:${exam.endAt}:end`;

    if (nowMs.value >= timing.startMs && !refreshedBoundaryKeys.has(startKey)) {
      refreshedBoundaryKeys.add(startKey);
      return true;
    }

    if (nowMs.value >= timing.endMs && !refreshedBoundaryKeys.has(endKey)) {
      refreshedBoundaryKeys.add(endKey);
      return true;
    }

    return false;
  });

  if (shouldRefresh) {
    void loadExams();
  }
};

onMounted(() => {
  void loadExams();
  timer = window.setInterval(() => {
    nowMs.value = Date.now();
    maybeRefreshOnTimeBoundary();
  }, 1000);
});

onBeforeUnmount(() => {
  if (timer) {
    window.clearInterval(timer);
  }
});
</script>

<template>
  <div class="page-shell student-exams-page">
    <PageHeader
      title="学生考试中心"
      description="查看考试时间窗口、阅读考试须知，并在开放后进入在线答题。"
    />

    <p v-if="loading && exams.length === 0" class="muted-text loading-text">正在加载考试安排...</p>
    <ErrorState v-else-if="errorMessage" title="加载失败" :description="errorMessage">
      <AppActionButton @click="loadExams">重试</AppActionButton>
    </ErrorState>
    <EmptyState
      v-else-if="exams.length === 0"
      title="暂无考试安排"
      description="当前账号还没有可查看的考试，请等待教师发布考试。"
    />
    <section v-else class="exam-card-list student-exam-list-polished">
      <article v-for="exam in sortedExams" :key="exam.id" class="content-card student-exam-card">
        <div class="student-exam-main">
          <div class="tag-list">
            <StatusTag
              :label="STUDENT_EXAM_STATUS_META[resolvedStatus(exam)].label"
              :tone="STUDENT_EXAM_STATUS_META[resolvedStatus(exam)].tone"
            />
            <span class="soft-tag">{{ exam.courseName }}</span>
          </div>
          <h2>{{ exam.title }}</h2>
          <div class="student-exam-meta-grid">
            <span>开始 {{ exam.startTime }}</span>
            <span>结束 {{ exam.endTime }}</span>
            <span>考试时长 {{ exam.durationMinutes }} 分钟</span>
            <span>试卷满分 {{ exam.totalScore }} 分</span>
            <span v-if="exam.submittedAt">已提交 {{ exam.submittedAt }}</span>
          </div>
        </div>
        <div class="student-exam-side">
          <div
            class="student-exam-countdown"
            :class="`student-exam-countdown--${resolvedStatus(exam).toLowerCase().replace('_', '-')}`"
          >
            <span class="student-exam-countdown__label">状态提醒</span>
            <strong>{{ helperText(exam) }}</strong>
          </div>
          <AppActionButton variant="primary" icon="📋" :to="`/student/exams/${exam.id}/notice`">
            {{ actionText(exam) }}
          </AppActionButton>
        </div>
      </article>
    </section>
  </div>
</template>
