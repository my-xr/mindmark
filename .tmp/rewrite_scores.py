from pathlib import Path
content = """<script setup lang=\"ts\">
import { computed, onMounted, ref } from 'vue';

import AppActionButton from '@/components/common/AppActionButton.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import ErrorState from '@/components/common/ErrorState.vue';
import OperationNotice from '@/components/common/OperationNotice.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { SCORE_PUBLISH_STATUS_META } from '@/constants/status';
import {
  listExamScoreSummaries,
  listScoreReportsByExam,
  publishExamScores,
} from '@/services/gradingService';
import type { ExamScoreSummary, StudentScoreReport } from '@/types/grading';
import { requestUserConfirmation } from '@/utils/confirmAction';
import { getErrorMessage } from '@/utils/errorMessage';

const summaries = ref<ExamScoreSummary[]>([]);
const reports = ref<StudentScoreReport[]>([]);
const selectedExamId = ref('');
const loading = ref(false);
const reportsLoading = ref(false);
const errorMessage = ref<string | null>(null);
const publishing = ref(false);
const operationMessage = ref('');

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
    return;
  }

  reportsLoading.value = true;
  try {
    reports.value = await listScoreReportsByExam(selectedExamId.value);
  } finally {
    reportsLoading.value = false;
  }
};

const loadData = async () => {
  loading.value = true;
  errorMessage.value = null;

  try {
    summaries.value = await listExamScoreSummaries();
    selectedExamId.value = selectedExamId.value || summaries.value[0]?.examId || '';
    await loadReports();
  } catch (error) {
    summaries.value = [];
    reports.value = [];
    selectedExamId.value = '';
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
  await loadReports();
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
    summaries.value = await publishExamScores(selectedExamId.value);
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
  <div class=\"page-shell scores-page\">
    <OperationNotice
      v-if=\"operationMessage\"
      title=\"成绩发布完成\"
      :description=\"operationMessage\"
      tone=\"success\"
    />

    <p v-if=\"loading\" class=\"muted-text loading-text\">正在加载成绩数据...</p>
    <ErrorState v-else-if=\"errorMessage\" title=\"数据加载失败\" :description=\"errorMessage\">
      <AppActionButton class=\"icon-action-button\" icon=\"↻\" title=\"重试\" @click=\"loadData\">
        重试
      </AppActionButton>
    </ErrorState>
    <EmptyState
      v-else-if=\"summaries.length === 0\"
      title=\"暂无可发布成绩\"
      description=\"完成至少一份答卷复核后，成绩中心会生成发布前检查数据。\"
    />

    <main v-else class=\"score-layout\">
      <aside class=\"content-card score-exam-list\">
        <div class=\"section-title\">
          <div>
            <h2>考试成绩批次</h2>
            <p class=\"muted-text\">选择考试后查看统计与学生明细。</p>
          </div>
          <div class=\"section-actions\">
            <AppActionButton
              class=\"icon-action-button\"
              icon=\"✅\"
              title=\"返回批改中心\"
              to=\"/teacher/grading\"
            >
              批改中心
            </AppActionButton>
          </div>
        </div>

        <button
          v-for=\"summary in summaries\"
          :key=\"summary.examId\"
          :class=\"[
            'score-exam-button',
            { 'score-exam-button--active': summary.examId === selectedExamId },
          ]\"
          type=\"button\"
          @click=\"selectExam(summary.examId)\"
        >
          <span>
            <strong>{{ summary.examTitle }}</strong>
            <small>{{ summary.courseName }} · {{ summary.reviewedCount }}/{{ summary.submittedCount }} 已复核</small>
          </span>
          <StatusTag
            :label=\"SCORE_PUBLISH_STATUS_META[summary.publishStatus].label\"
            :tone=\"SCORE_PUBLISH_STATUS_META[summary.publishStatus].tone\"
          />
        </button>
      </aside>

      <section v-if=\"selectedSummary\" class=\"content-card score-detail-card\">
        <div class=\"section-title\">
          <div>
            <h2>{{ selectedSummary.examTitle }}</h2>
            <p class=\"muted-text\">
              提交 {{ selectedSummary.submittedCount }}/{{ selectedSummary.participantCount }} · 复核
              {{ selectedSummary.reviewedCount }} 份
              <span v-if=\"selectedSummary.publishedAt\"> · 发布于 {{ selectedSummary.publishedAt }}</span>
            </p>
          </div>
          <AppActionButton
            class=\"icon-action-button\"
            icon=\"📣\"
            variant=\"primary\"
            :disabled=\"!canPublish || publishing\"
            :title=\"publishButtonTitle\"
            @click=\"publishScores\"
          >
            {{ publishing ? '发布中...' : selectedSummary.publishStatus === 'PUBLISHED' ? '已发布' : '发布成绩' }}
          </AppActionButton>
        </div>

        <div class=\"score-summary-grid\">
          <article class=\"metric-card compact-metric\">
            <span>平均分</span>
            <strong>{{ selectedSummary.averageScore }}</strong>
          </article>
          <article class=\"metric-card compact-metric\">
            <span>最高分</span>
            <strong>{{ selectedSummary.highestScore }}</strong>
          </article>
          <article class=\"metric-card compact-metric\">
            <span>最低分</span>
            <strong>{{ selectedSummary.lowestScore }}</strong>
          </article>
          <article class=\"metric-card compact-metric\">
            <span>及格率</span>
            <strong>{{ selectedSummary.passRate }}%</strong>
          </article>
        </div>

        <p v-if=\"reportsLoading\" class=\"muted-text loading-text\">正在加载学生成绩...</p>
        <EmptyState
          v-else-if=\"reports.length === 0\"
          title=\"暂无学生成绩\"
          description=\"当前考试还没有可展示的学生成绩明细。\"
        />
        <div v-else class=\"score-report-table\">
          <div class=\"score-report-row score-report-row--head\">
            <span>学生</span>
            <span>班级</span>
            <span>分数</span>
            <span>排名</span>
            <span>状态</span>
          </div>
          <div v-for=\"report in reports\" :key=\"report.id\" class=\"score-report-row\">
            <span>
              <strong>{{ report.studentName }}</strong>
              <small>{{ report.studentId }}</small>
            </span>
            <span>{{ report.className }}</span>
            <span>{{ report.score ?? '待复核' }} / {{ report.totalScore }}</span>
            <span>{{ report.rank ?? '-' }}</span>
            <span>
              <StatusTag
                :label=\"SCORE_PUBLISH_STATUS_META[report.status].label\"
                :tone=\"SCORE_PUBLISH_STATUS_META[report.status].tone\"
              />
            </span>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
"""
Path('apps/mindmark-web/src/views/teacher/ScoresView.vue').write_text(content, encoding='utf-8')
