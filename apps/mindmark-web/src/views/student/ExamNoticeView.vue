<script setup lang="ts">
import AppActionButton from '@/components/common/AppActionButton.vue';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import EmptyState from '@/components/common/EmptyState.vue';
import ErrorState from '@/components/common/ErrorState.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { EXAM_STATUS_META } from '@/constants/status';
import { getExamById } from '@/services/examService';
import type { Exam } from '@/types/exam';
import { getErrorMessage } from '@/utils/errorMessage';
import { getExamTimingInfo } from '@/utils/examTime';

const route = useRoute();
const exam = ref<Exam | null>(null);
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const nowMs = ref(Date.now());
const refreshedBoundaryKeys = new Set<string>();
let timer: number | undefined;

const examId = computed(() => String(route.params.id));
const timing = computed(() =>
  getExamTimingInfo(
    exam.value?.startAt ?? exam.value?.startTime,
    exam.value?.endAt ?? exam.value?.endTime,
    nowMs.value,
  ),
);
const canEnter = computed(() => {
  if (!exam.value) {
    return false;
  }

  if (
    exam.value.status === 'ENDED' ||
    exam.value.status === 'GRADED' ||
    exam.value.status === 'PUBLISHED'
  ) {
    return false;
  }

  return exam.value.status === 'IN_PROGRESS' || timing.value.phase === 'IN_WINDOW';
});

const enterButtonText = computed(() => {
  if (!exam.value) {
    return '考试暂不可进入';
  }
  if (timing.value.phase === 'BEFORE_START') {
    return '未到开考时间';
  }
  if (timing.value.phase === 'ENDED' || exam.value.status === 'ENDED') {
    return '考试已结束';
  }

  return '进入答题';
});

const loadExam = async () => {
  loading.value = true;
  errorMessage.value = null;
  try {
    exam.value = (await getExamById(examId.value, { student: true })) ?? null;
  } catch (error) {
    exam.value = null;
    errorMessage.value = getErrorMessage(error, '考试须知加载失败，请稍后重试。');
  } finally {
    loading.value = false;
  }
};

const maybeRefreshOnTimeBoundary = () => {
  if (!exam.value || loading.value) {
    return;
  }

  const info = timing.value;
  if (Number.isNaN(info.startMs) || Number.isNaN(info.endMs)) {
    return;
  }

  const startKey = `${exam.value.id}:${exam.value.startAt ?? exam.value.startTime}:start`;
  const endKey = `${exam.value.id}:${exam.value.endAt ?? exam.value.endTime}:end`;

  if (nowMs.value >= info.startMs && !refreshedBoundaryKeys.has(startKey)) {
    refreshedBoundaryKeys.add(startKey);
    void loadExam();
    return;
  }

  if (nowMs.value >= info.endMs && !refreshedBoundaryKeys.has(endKey)) {
    refreshedBoundaryKeys.add(endKey);
    void loadExam();
  }
};

onMounted(() => {
  void loadExam();
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
  <div class="page-shell exam-notice-page">
    <PageHeader title="考试须知" description="进入答题前请确认考试安排、试卷信息与考试规则。">
      <template #actions>
        <AppActionButton to="/student/exams" icon="↩️">返回考试中心</AppActionButton>
      </template>
    </PageHeader>

    <p v-if="loading && !exam" class="muted-text loading-text">正在加载考试须知...</p>
    <ErrorState v-else-if="errorMessage" title="加载失败" :description="errorMessage">
      <AppActionButton @click="loadExam">重试</AppActionButton>
    </ErrorState>
    <EmptyState v-else-if="!exam" title="考试不存在" description="请返回考试中心重新选择考试。" />
    <section v-else class="content-card exam-notice-card">
      <div class="section-title exam-notice-title-row">
        <div>
          <h2>{{ exam.title }}</h2>
          <p class="muted-text">{{ exam.courseName }} · {{ exam.paper.title }}</p>
        </div>
        <StatusTag
          :label="EXAM_STATUS_META[exam.status].label"
          :tone="EXAM_STATUS_META[exam.status].tone"
        />
      </div>

      <div class="paper-summary-grid">
        <div class="metric-card compact-metric">
          <span>考试时长</span>
          <strong>{{ exam.durationMinutes }} 分钟</strong>
        </div>
        <div class="metric-card compact-metric">
          <span>试卷满分</span>
          <strong>{{ exam.paper.totalScore }} 分</strong>
        </div>
        <div class="metric-card compact-metric">
          <span>题目数量</span>
          <strong>{{ exam.paper.questions.length }} 题</strong>
        </div>
      </div>

      <div class="exam-notice-guidance-grid">
        <div
          class="exam-notice-timing"
          :class="`exam-notice-timing--${timing.phase.toLowerCase().replace('_', '-')}`"
        >
          <span>考试入口</span>
          <strong>{{ timing.helperText }}</strong>
          <small v-if="timing.phase === 'BEFORE_START'"
            >到点后系统会自动刷新状态并启用进入按钮。</small
          >
          <small v-else-if="timing.phase === 'IN_WINDOW'"
            >请确认考试规则后进入答题，答题过程会自动保存草稿。</small
          >
          <small v-else>如已提交答卷，请等待教师批改或成绩发布。</small>
        </div>

        <section class="exam-notice-fullscreen-card" aria-labelledby="exam-fullscreen-title">
          <div class="exam-notice-fullscreen-icon" aria-hidden="true">⛶</div>
          <div class="exam-notice-fullscreen-content">
            <div class="exam-notice-fullscreen-heading">
              <span>重要要求</span>
              <strong id="exam-fullscreen-title">必须全屏作答</strong>
            </div>
            <p>进入答题页后，请点击“进入全屏答题”，确认进入全屏后才能填写答案。</p>
            <ul>
              <li>考试期间请保持浏览器全屏，避免遮挡试题和答题卡。</li>
              <li>退出全屏、切屏或窗口失焦会被记录，多次异常可能触发自动交卷。</li>
            </ul>
          </div>
        </section>
      </div>

      <h2>答题与监考规则</h2>
      <ul class="notice-list">
        <li>请在规定时间内完成答题，未到开始时间无法进入答题页。</li>
        <li>单选、判断题请选择一个答案；多选题可选择多个答案。</li>
        <li>填空、简答与编程题请按题目要求输入答案。</li>
        <li>系统会保存答题草稿；提交后进入批改流程，请勿重复登录或离开考试页面。</li>
      </ul>

      <div class="exam-notice-actions">
        <AppActionButton
          v-if="canEnter"
          variant="primary"
          icon="📝"
          :to="`/student/exams/${exam.id}/take`"
        >
          进入答题
        </AppActionButton>
        <AppActionButton v-else disabled icon="⏱️">{{ enterButtonText }}</AppActionButton>
      </div>
    </section>
  </div>
</template>
