<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import AppActionButton from '@/components/common/AppActionButton.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import EnterprisePagination from '@/components/common/EnterprisePagination.vue';
import ErrorState from '@/components/common/ErrorState.vue';
import OperationNotice from '@/components/common/OperationNotice.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { SCORE_PUBLISH_STATUS_META } from '@/constants/status';
import {
  listExamScoreSummariesPage,
  listScoreReportsByExamPage,
  publishExamScores,
} from '@/services/gradingService';
import type { ExamScoreSummary, ScoreBandSummary, StudentScoreReport } from '@/types/grading';
import { requestUserConfirmation } from '@/utils/confirmAction';
import { getErrorMessage } from '@/utils/errorMessage';

const router = useRouter();

const summaries = ref<ExamScoreSummary[]>([]);
const reports = ref<StudentScoreReport[]>([]);
const selectedExamId = ref('');
const loading = ref(false);
const reportsLoading = ref(false);
const errorMessage = ref<string | null>(null);
const publishing = ref(false);
const operationMessage = ref('');
const summaryTotal = ref(0);
const reportTotal = ref(0);
const summaryPagination = reactive({ page: 1, pageSize: 8 });
const reportPagination = reactive({ page: 1, pageSize: 10 });
const pagedSummaries = computed(() => summaries.value);
const pagedReports = computed(() => reports.value);

const selectedSummary = computed(
  () => summaries.value.find((summary) => summary.examId === selectedExamId.value) ?? null,
);

const canPublish = computed(() => {
  const summary = selectedSummary.value;

  return Boolean(
    summary &&
    summary.reviewedCount > 0 &&
    summary.reviewedCount >= summary.submittedCount &&
    summary.publishStatus !== 'PUBLISHED',
  );
});

const publishButtonTitle = computed(() => {
  if (publishing.value) {
    return '发布中...';
  }

  if (selectedSummary.value?.publishStatus === 'PUBLISHED') {
    return '成绩已发布';
  }

  if (!canPublish.value) {
    return '需完成全部已提交答卷复核后发布';
  }

  return '发布成绩';
});

const loadReports = async () => {
  if (!selectedExamId.value) {
    reports.value = [];
    reportTotal.value = 0;
    return;
  }

  reportsLoading.value = true;
  try {
    const response = await listScoreReportsByExamPage(selectedExamId.value, {
      page: reportPagination.page,
      pageSize: reportPagination.pageSize,
    });
    reports.value = response.items;
    reportTotal.value = response.total;
    reportPagination.page = response.page;
    reportPagination.pageSize = response.pageSize;
  } finally {
    reportsLoading.value = false;
  }
};

const loadSummaries = async () => {
  const response = await listExamScoreSummariesPage({
    page: summaryPagination.page,
    pageSize: summaryPagination.pageSize,
  });
  summaries.value = response.items;
  summaryTotal.value = response.total;
  summaryPagination.page = response.page;
  summaryPagination.pageSize = response.pageSize;
  selectedExamId.value = summaries.value.some((summary) => summary.examId === selectedExamId.value)
    ? selectedExamId.value
    : '';
};

const loadData = async () => {
  loading.value = true;
  errorMessage.value = null;

  try {
    await loadSummaries();
    if (selectedExamId.value) {
      await loadReports();
    } else {
      reports.value = [];
      reportTotal.value = 0;
    }
  } catch (error) {
    summaries.value = [];
    reports.value = [];
    selectedExamId.value = '';
    summaryPagination.page = 1;
    reportPagination.page = 1;
    summaryTotal.value = 0;
    reportTotal.value = 0;
    errorMessage.value = getErrorMessage(error, '成绩数据加载失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const selectExam = async (examId: string) => {
  if (selectedExamId.value === examId) {
    return;
  }

  selectedExamId.value = examId;
  operationMessage.value = '';
  reportPagination.page = 1;
  await loadReports();
};

const handleSummaryPaginationChange = async (page: number, pageSize: number) => {
  summaryPagination.page = page;
  summaryPagination.pageSize = pageSize;
  operationMessage.value = '';
  selectedExamId.value = '';
  reports.value = [];
  reportTotal.value = 0;
  reportPagination.page = 1;
  await loadSummaries();
};

const handleReportPaginationChange = async (page: number, pageSize: number) => {
  reportPagination.page = page;
  reportPagination.pageSize = pageSize;
  await loadReports();
};

const backToScoreBatchList = () => {
  selectedExamId.value = '';
  reports.value = [];
  reportTotal.value = 0;
  reportPagination.page = 1;
  operationMessage.value = '';
};

const scoreBandClass = (band: ScoreBandSummary) => ({
  'score-band-card--danger': band.key === 'FAILED',
  'score-band-card--warning': band.key === 'S60_69',
  'score-band-card--neutral': band.key === 'S70_79',
  'score-band-card--success': band.key === 'S80_89',
  'score-band-card--excellent': band.key === 'S90_100',
});

const goToGradingBand = (band: ScoreBandSummary) => {
  if (!selectedExamId.value) {
    return;
  }

  void router.push({
    name: 'Grading',
    query: {
      examId: selectedExamId.value,
      scoreBand: band.key,
    },
  });
};

const publishScores = async () => {
  if (!selectedExamId.value || !canPublish.value || !selectedSummary.value) {
    return;
  }

  const confirmed = await requestUserConfirmation(
    `确认发布《${selectedSummary.value.examTitle}》成绩吗？发布后学生端将可以查看成绩与反馈。`,
  );

  if (!confirmed) {
    return;
  }

  publishing.value = true;
  errorMessage.value = null;
  try {
    await publishExamScores(selectedExamId.value);
    await loadSummaries();
    await loadReports();
    operationMessage.value = '成绩已发布，学生端现在可以查看成绩反馈。';
  } catch (error) {
    operationMessage.value = '';
    errorMessage.value = getErrorMessage(error, '成绩发布失败，请确认所有答卷已完成复核后再试');
  } finally {
    publishing.value = false;
  }
};

onMounted(() => {
  void loadData();
});
</script>

<template>
  <div class="page-shell scores-page">
    <OperationNotice
      v-if="operationMessage"
      title="成绩发布完成"
      :description="operationMessage"
      tone="success"
    />

    <p v-if="loading" class="muted-text loading-text">正在加载成绩数据...</p>
    <ErrorState v-else-if="errorMessage" title="数据加载失败" :description="errorMessage">
      <AppActionButton class="icon-action-button" icon="↻" title="重试" @click="loadData">
        重试
      </AppActionButton>
    </ErrorState>
    <EmptyState
      v-else-if="summaries.length === 0"
      title="暂无可发布成绩"
      description="完成至少一份答卷复核后，成绩中心会生成发布前检查数据。"
    />

    <main
      v-else
      :class="['score-layout', selectedSummary ? 'score-layout--detail' : 'score-layout--list']"
    >
      <section v-if="!selectedSummary" class="content-card score-exam-list score-exam-list--full">
        <div class="section-title">
          <div>
            <h2>考试成绩批次</h2>
            <p class="muted-text">选择考试后查看统计与学生明细。</p>
          </div>
          <div class="section-actions">
            <AppActionButton
              class="icon-action-button"
              icon="✅"
              title="返回批改中心"
              to="/teacher/grading"
            >
              批改中心
            </AppActionButton>
          </div>
        </div>

        <div class="score-exam-grid">
          <button
            v-for="summary in pagedSummaries"
            :key="summary.examId"
            class="score-exam-button"
            type="button"
            @click="selectExam(summary.examId)"
          >
            <span class="score-exam-button__main">
              <span class="score-exam-button__topline">
                <strong :title="summary.examTitle">{{ summary.examTitle }}</strong>
                <StatusTag
                  :label="SCORE_PUBLISH_STATUS_META[summary.publishStatus].label"
                  :tone="SCORE_PUBLISH_STATUS_META[summary.publishStatus].tone"
                />
              </span>
              <small :title="summary.courseName">{{ summary.courseName }}</small>
            </span>
            <span class="score-exam-button__stats">
              <span>提交 {{ summary.submittedCount }}/{{ summary.participantCount }}</span>
              <span>复核 {{ summary.reviewedCount }} 份</span>
              <span>均分 {{ summary.averageScore }}</span>
              <span>及格率 {{ summary.passRate }}%</span>
            </span>
          </button>
        </div>
        <EnterprisePagination
          v-if="summaryTotal > summaryPagination.pageSize"
          class="section-pagination"
          :current="summaryPagination.page"
          :page-size="summaryPagination.pageSize"
          :total="summaryTotal"
          :page-size-options="['8', '16', '32']"
          :disabled="loading || reportsLoading || publishing"
          @change="handleSummaryPaginationChange"
        />
      </section>

      <section
        v-if="selectedSummary"
        class="content-card score-detail-card score-detail-card--full"
      >
        <div class="section-title">
          <div>
            <h2>{{ selectedSummary.examTitle }}</h2>
            <p class="muted-text">
              提交 {{ selectedSummary.submittedCount }}/{{ selectedSummary.participantCount }} ·
              复核 {{ selectedSummary.reviewedCount }} 份
              <span v-if="selectedSummary.publishedAt">
                · 发布于 {{ selectedSummary.publishedAt }}</span
              >
            </p>
          </div>
          <div class="section-actions score-detail-actions">
            <AppActionButton
              class="icon-action-button"
              icon="←"
              title="返回考试成绩批次"
              @click="backToScoreBatchList"
            >
              返回批次
            </AppActionButton>
            <AppActionButton
              class="icon-action-button"
              icon="📣"
              variant="primary"
              :disabled="!canPublish || publishing"
              :title="publishButtonTitle"
              @click="publishScores"
            >
              {{
                publishing
                  ? '发布中...'
                  : selectedSummary.publishStatus === 'PUBLISHED'
                    ? '已发布'
                    : '发布成绩'
              }}
            </AppActionButton>
          </div>
        </div>

        <div class="score-summary-grid">
          <article class="metric-card compact-metric">
            <span>平均分</span>
            <strong>{{ selectedSummary.averageScore }}</strong>
          </article>
          <article class="metric-card compact-metric">
            <span>最高分</span>
            <strong>{{ selectedSummary.highestScore }}</strong>
          </article>
          <article class="metric-card compact-metric">
            <span>最低分</span>
            <strong>{{ selectedSummary.lowestScore }}</strong>
          </article>
          <article class="metric-card compact-metric">
            <span>及格率</span>
            <strong>{{ selectedSummary.passRate }}%</strong>
          </article>
        </div>

        <section class="score-band-section" aria-label="成绩分段统计">
          <div class="score-band-section__header">
            <div>
              <h3>成绩分布</h3>
              <p class="muted-text">按百分制折算统计，点击分段可跳转批改中心复核对应答卷。</p>
            </div>
          </div>
          <div class="score-band-grid">
            <button
              v-for="band in selectedSummary.scoreBands"
              :key="band.key"
              type="button"
              :class="['score-band-card', scoreBandClass(band)]"
              :title="`复核 ${band.label} 分段答卷`"
              @click="goToGradingBand(band)"
            >
              <span class="score-band-card__label">{{ band.label }}</span>
              <strong>{{ band.count }}</strong>
              <small>人 · 点击复核</small>
            </button>
          </div>
        </section>

        <p v-if="reportsLoading" class="muted-text loading-text">正在加载学生成绩...</p>
        <EmptyState
          v-else-if="reports.length === 0"
          title="暂无学生成绩"
          description="当前考试还没有可展示的学生成绩明细。"
        />
        <div v-else class="score-report-table">
          <div class="score-report-row score-report-row--head">
            <span>学生</span>
            <span>班级</span>
            <span>分数</span>
            <span>排名</span>
            <span>状态</span>
          </div>
          <div v-for="report in pagedReports" :key="report.id" class="score-report-row">
            <span>
              <strong>{{ report.studentName }}</strong>
              <small>{{ report.studentId }}</small>
            </span>
            <span>{{ report.className }}</span>
            <span>{{ report.score ?? '待复核' }} / {{ report.totalScore }}</span>
            <span>{{ report.rank ?? '-' }}</span>
            <span>
              <StatusTag
                :label="SCORE_PUBLISH_STATUS_META[report.status].label"
                :tone="SCORE_PUBLISH_STATUS_META[report.status].tone"
              />
            </span>
          </div>
        </div>
        <EnterprisePagination
          v-if="reportTotal > reportPagination.pageSize"
          class="section-pagination"
          :current="reportPagination.page"
          :page-size="reportPagination.pageSize"
          :total="reportTotal"
          :page-size-options="['10', '20', '50', '100']"
          :disabled="reportsLoading || publishing"
          @change="handleReportPaginationChange"
        />
      </section>
    </main>
  </div>
</template>
