<script setup lang="ts">
import AppActionButton from '@/components/common/AppActionButton.vue';
import { computed, onMounted, ref } from 'vue';

import { getErrorMessage } from '@/utils/errorMessage';

import EmptyState from '@/components/common/EmptyState.vue';
import ErrorState from '@/components/common/ErrorState.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { SCORE_PUBLISH_STATUS_META } from '@/constants/status';
import { listStudentScoreReports } from '@/services/gradingService';
import type { StudentScoreReport } from '@/types/grading';

const reports = ref<StudentScoreReport[]>([]);
const selectedReportId = ref('');
const loading = ref(false);
const errorMessage = ref<string | null>(null);

const selectedReport = computed(
  () =>
    reports.value.find((report) => report.id === selectedReportId.value) ??
    reports.value[0] ??
    null,
);

const loadReports = async () => {
  loading.value = true;
  errorMessage.value = null;

  try {
    reports.value = await listStudentScoreReports();
    selectedReportId.value = selectedReportId.value || reports.value[0]?.id || '';
  } catch (error) {
    reports.value = [];
    selectedReportId.value = '';
    errorMessage.value = getErrorMessage(error, '成绩反馈加载失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const scoreText = (report: StudentScoreReport) =>
  report.status === 'PUBLISHED' && typeof report.score === 'number'
    ? `${report.score}/${report.totalScore}`
    : '待发布';

onMounted(() => {
  void loadReports();
});
</script>

<template>
  <div class="page-shell student-scores-page">
    <PageHeader title="成绩反馈" description="查看已发布成绩、题目得分与知识点复盘建议。" />

    <p v-if="loading" class="muted-text loading-text">正在加载成绩反馈...</p>
    <ErrorState v-else-if="errorMessage" title="数据加载失败" :description="errorMessage">
      <AppActionButton @click="loadReports">重试</AppActionButton>
    </ErrorState>
    <EmptyState
      v-else-if="reports.length === 0"
      title="暂无成绩记录"
      description="提交考试并等待教师发布成绩后，可在这里查看反馈。"
    />

    <main v-else class="student-score-layout">
      <aside class="student-score-list">
        <button
          v-for="report in reports"
          :key="report.id"
          :class="[
            'content-card',
            'student-score-card',
            { 'student-score-card--active': report.id === selectedReport?.id },
          ]"
          type="button"
          @click="selectedReportId = report.id"
        >
          <span>
            <StatusTag
              :label="SCORE_PUBLISH_STATUS_META[report.status].label"
              :tone="SCORE_PUBLISH_STATUS_META[report.status].tone"
            />
            <strong>{{ report.examTitle }}</strong>
            <small>{{ report.courseName }} · 提交于 {{ report.submittedAt }}</small>
          </span>
          <b>{{ scoreText(report) }}</b>
        </button>
      </aside>

      <section v-if="selectedReport" class="content-card student-score-detail">
        <div class="section-title">
          <div>
            <h2>{{ selectedReport.examTitle }}</h2>
            <p class="muted-text">
              {{ selectedReport.courseName }} · {{ selectedReport.className }}
              <span v-if="selectedReport.publishedAt">
                · 发布于 {{ selectedReport.publishedAt }}</span
              >
            </p>
          </div>
          <div class="student-score-value">{{ scoreText(selectedReport) }}</div>
        </div>

        <EmptyState
          v-if="selectedReport.status !== 'PUBLISHED'"
          title="成绩尚未发布"
          description="教师完成发布前检查后，本页面会展示分数、题目明细与复盘建议。"
        />

        <template v-else>
          <section class="preview-section">
            <h4>教师反馈</h4>
            <p>{{ selectedReport.teacherComment }}</p>
          </section>

          <section class="preview-section">
            <h4>知识点建议</h4>
            <div class="knowledge-feedback-list">
              <article v-for="item in selectedReport.knowledgeFeedback" :key="item.knowledgePoint">
                <strong>{{ item.knowledgePoint }}</strong>
                <span>{{ item.scoreRate }}%</span>
                <p>{{ item.suggestion }} <small>AI 建议仅供参考</small></p>
              </article>
            </div>
          </section>

          <section class="preview-section">
            <h4>题目得分</h4>
            <div class="question-feedback-list">
              <article v-for="item in selectedReport.questionResults" :key="item.questionId">
                <div>
                  <strong>第 {{ item.order }} 题</strong>
                  <p>{{ item.title }}</p>
                  <small>{{ item.teacherComment }}</small>
                </div>
                <span>{{ item.finalScore }}/{{ item.maxScore }}</span>
              </article>
            </div>
          </section>
        </template>
      </section>
    </main>
  </div>
</template>
