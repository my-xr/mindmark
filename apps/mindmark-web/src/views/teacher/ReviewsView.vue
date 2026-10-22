<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';

import AppActionButton from '@/components/common/AppActionButton.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import EnterprisePagination from '@/components/common/EnterprisePagination.vue';
import OperationNotice from '@/components/common/OperationNotice.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import SummaryStrip from '@/components/common/SummaryStrip.vue';
import LectureDraftCard from '@/components/review/LectureDraftCard.vue';
import ReviewAnalysisSections from '@/components/review/ReviewAnalysisSections.vue';
import ReviewArtifactList from '@/components/review/ReviewArtifactList.vue';
import { listExamSecurityEventsPage } from '@/services/examSecurityAuditService';
import {
  approveLectureDraft,
  createLectureDraftTask,
  downloadReviewArtifactFile,
  exportReviewArtifact,
  getLectureDraftTask,
  getReviewArtifactDownload,
  listExamReviewReportsPage,
} from '@/services/reviewService';
import type { ExamSecurityEvent } from '@/types/audit';
import type {
  AiLectureDraft,
  ExamReviewReport,
  LectureDraftTask,
  ReviewArtifactType,
} from '@/types/review';
import { requestUserConfirmation } from '@/utils/confirmAction';
import { getErrorMessage } from '@/utils/errorMessage';

const reports = ref<ExamReviewReport[]>([]);
const selectedExamId = ref('');
const lectureContent = ref('');
const loading = ref(false);
const generating = ref(false);
const approving = ref(false);
const exportingType = ref<ReviewArtifactType | ''>('');
const downloadingArtifactId = ref('');
const generationTask = ref<LectureDraftTask | null>(null);
const operationMessage = ref('');
const errorMessage = ref('');
const securityEvents = ref<ExamSecurityEvent[]>([]);
const securityLoading = ref(false);
const securityError = ref('');
const reportPagination = reactive({ page: 1, pageSize: 8, total: 0 });
const securityEventPagination = reactive({ page: 1, pageSize: 10, total: 0 });
let generationPollTimer: number | undefined;

const selectedReport = computed(
  () => reports.value.find((report) => report.examId === selectedExamId.value) ?? null,
);

const weakKnowledgeCount = computed(
  () =>
    selectedReport.value?.knowledgeWeaknesses.filter((item) => item.level !== 'GOOD').length ?? 0,
);

const weakKnowledgeCountFor = (report: ExamReviewReport) =>
  report.knowledgeWeaknesses.filter((item) => item.level !== 'GOOD').length;

const securitySummary = computed(() => {
  const highRiskCount = securityEvents.value.filter((event) => event.severity === 'HIGH').length;
  const mediumRiskCount = securityEvents.value.filter(
    (event) => event.severity === 'MEDIUM',
  ).length;
  const affectedStudents = new Set(securityEvents.value.map((event) => event.studentId)).size;

  return [
    { label: '安全事件', value: securityEventPagination.total },
    { label: '高风险', value: highRiskCount },
    { label: '中风险', value: mediumRiskCount },
    { label: '涉及学生', value: affectedStudents },
  ];
});

const currentLectureContent = computed(() => {
  const draft = selectedReport.value?.lectureDraft;
  return draft?.teacherEditedContent || draft?.content || '';
});

const syncLectureContent = () => {
  lectureContent.value = currentLectureContent.value;
};

const updateLectureDraft = (draft: AiLectureDraft) => {
  reports.value = reports.value.map((report) =>
    report.examId === draft.examId ? { ...report, lectureDraft: draft } : report,
  );
  syncLectureContent();
};

const stopGenerationPolling = () => {
  if (generationPollTimer) {
    window.clearTimeout(generationPollTimer);
    generationPollTimer = undefined;
  }
};

const loadSecurityEvents = async (examId: string) => {
  if (!examId) {
    securityEvents.value = [];
    securityError.value = '';
    securityEventPagination.total = 0;
    return;
  }

  securityLoading.value = true;
  securityError.value = '';
  try {
    const page = await listExamSecurityEventsPage(
      examId,
      securityEventPagination.page,
      securityEventPagination.pageSize,
    );
    securityEvents.value = page.items;
    securityEventPagination.total = page.total;
    securityEventPagination.page = page.page;
    securityEventPagination.pageSize = page.pageSize;
  } catch (error) {
    securityEvents.value = [];
    securityError.value = getErrorMessage(error, '考试安全审计加载失败，请稍后重试。');
    securityEventPagination.total = 0;
  } finally {
    securityLoading.value = false;
  }
};

const handleSecurityEventPaginationChange = (page: number, pageSize: number) => {
  securityEventPagination.page = page;
  securityEventPagination.pageSize = pageSize;
  if (selectedExamId.value) {
    void loadSecurityEvents(selectedExamId.value);
  }
};

const loadReports = async () => {
  const page = await listExamReviewReportsPage(reportPagination.page, reportPagination.pageSize);
  reports.value = page.items;
  reportPagination.total = page.total;
  reportPagination.page = page.page;
  reportPagination.pageSize = page.pageSize;
  selectedExamId.value = page.items.some((report) => report.examId === selectedExamId.value)
    ? selectedExamId.value
    : '';
};

const handleReportPaginationChange = (page: number, pageSize: number) => {
  reportPagination.page = page;
  reportPagination.pageSize = pageSize;
  selectedExamId.value = '';
  securityEvents.value = [];
  securityEventPagination.page = 1;
  securityEventPagination.total = 0;
  operationMessage.value = '';
  void loadData();
};

const backToReviewList = () => {
  stopGenerationPolling();
  selectedExamId.value = '';
  lectureContent.value = '';
  generationTask.value = null;
  generating.value = false;
  securityEvents.value = [];
  securityEventPagination.page = 1;
  securityEventPagination.total = 0;
  operationMessage.value = '';
  errorMessage.value = '';
};

const handleGenerationTask = async (task: LectureDraftTask) => {
  generationTask.value = task;
  if (task.status === 'SUCCEEDED') {
    stopGenerationPolling();
    generating.value = false;
    if (task.draft) {
      updateLectureDraft(task.draft);
    }
    operationMessage.value = `AI 讲评稿已生成：${task.provider ?? task.draft?.provider ?? 'provider'}`;
    await loadData();
    return;
  }

  if (task.status === 'FAILED') {
    stopGenerationPolling();
    generating.value = false;
    errorMessage.value = getErrorMessage(task.errorMessage, 'AI 讲评稿生成失败，请稍后重试。');
    return;
  }

  generationPollTimer = window.setTimeout(async () => {
    if (!generationTask.value) {
      return;
    }

    try {
      const latestTask = await getLectureDraftTask(generationTask.value.id);
      if (latestTask) {
        await handleGenerationTask(latestTask);
      }
    } catch (error) {
      stopGenerationPolling();
      generating.value = false;
      errorMessage.value = getErrorMessage(error, 'AI 任务轮询失败，请稍后重试。');
    }
  }, 1500);
};

const loadData = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    await loadReports();
    syncLectureContent();
    await loadSecurityEvents(selectedExamId.value);
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '复盘数据加载失败，请稍后重试。');
  } finally {
    loading.value = false;
  }
};

const selectReport = async (examId: string) => {
  stopGenerationPolling();
  generationTask.value = null;
  generating.value = false;
  selectedExamId.value = examId;
  securityEventPagination.page = 1;
  syncLectureContent();
  operationMessage.value = '';
  errorMessage.value = '';
  await loadSecurityEvents(examId);
};

const regenerateDraft = async () => {
  if (!selectedReport.value) {
    return;
  }

  stopGenerationPolling();
  generating.value = true;
  generationTask.value = null;
  operationMessage.value = '';
  errorMessage.value = '';
  try {
    const task = await createLectureDraftTask(selectedReport.value.examId);
    operationMessage.value = 'AI 讲评稿任务已提交，页面将自动轮询状态。';
    await handleGenerationTask(task);
  } catch (error) {
    generating.value = false;
    errorMessage.value = getErrorMessage(error, 'AI 讲评稿生成失败，请稍后重试。');
  }
};

const approveDraft = async () => {
  if (!selectedReport.value) {
    return;
  }

  const confirmed = await requestUserConfirmation(
    '确认当前讲评稿已完成教师人工复核，并可作为本次考试讲评稿归档？',
  );
  if (!confirmed) {
    return;
  }

  approving.value = true;
  operationMessage.value = '';
  errorMessage.value = '';
  try {
    const draft = await approveLectureDraft(selectedReport.value.examId, lectureContent.value);
    if (draft) {
      updateLectureDraft(draft);
    }
    operationMessage.value = 'AI 讲评稿已确认并归档。';
    await loadData();
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '讲评稿确认失败，请稍后重试。');
  } finally {
    approving.value = false;
  }
};

const saveBlobAsFile = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const exportArtifact = async (artifactType: ReviewArtifactType) => {
  if (!selectedReport.value) {
    return;
  }

  exportingType.value = artifactType;
  operationMessage.value = '';
  errorMessage.value = '';
  try {
    const artifact = await exportReviewArtifact(selectedReport.value.examId, artifactType);
    const blob = await downloadReviewArtifactFile(artifact.id);
    saveBlobAsFile(blob, artifact.fileName);
    operationMessage.value = `导出产物已生成并下载：${artifact.fileName}`;
    await loadData();
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '导出产物失败，请稍后重试。');
  } finally {
    exportingType.value = '';
  }
};

const downloadArtifact = async (artifactId: string) => {
  downloadingArtifactId.value = artifactId;
  operationMessage.value = '';
  errorMessage.value = '';
  try {
    const artifact = await getReviewArtifactDownload(artifactId);
    const blob = await downloadReviewArtifactFile(artifactId);
    saveBlobAsFile(blob, artifact.fileName);
    operationMessage.value = `产物已下载：${artifact.fileName}`;
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '产物下载失败，请稍后重试。');
  } finally {
    downloadingArtifactId.value = '';
  }
};

onMounted(loadData);
onUnmounted(stopGenerationPolling);
</script>

<template>
  <div class="page-shell review-page">
    <OperationNotice
      v-if="operationMessage"
      title="操作成功"
      :description="operationMessage"
      tone="success"
    />
    <OperationNotice
      v-if="errorMessage"
      title="操作失败"
      :description="errorMessage"
      tone="danger"
    />

    <main
      :class="[
        'two-column-layout review-page-layout',
        selectedReport ? 'review-page-layout--detail' : 'review-page-layout--list',
      ]"
    >
      <section
        v-if="!selectedReport"
        class="content-card review-report-list-card review-report-list-card--full"
      >
        <div class="section-title">
          <div>
            <h2>考试复盘列表</h2>
            <p class="muted-text">选择已完成批改的考试，进入复盘分析、AI 讲评稿与导出产物管理。</p>
          </div>
          <div class="section-actions">
            <AppActionButton
              class="icon-action-button"
              icon="↻"
              :disabled="loading"
              :title="loading ? '刷新中...' : '刷新复盘数据'"
              @click="loadData"
            >
              {{ loading ? '刷新中...' : '刷新' }}
            </AppActionButton>
          </div>
        </div>

        <EmptyState
          v-if="!loading && reports.length === 0"
          title="暂无复盘数据"
          description="请先完成考试提交、自动判分与教师复核。"
        />
        <div v-else class="review-report-grid">
          <button
            v-for="report in reports"
            :key="report.examId"
            class="review-report-card"
            type="button"
            :title="`${report.examTitle} · ${report.courseName}`"
            @click="selectReport(report.examId)"
          >
            <span class="review-report-card__main">
              <strong>{{ report.examTitle }}</strong>
              <small>{{ report.courseName }}</small>
            </span>
            <span class="review-report-card__stats">
              <span>总分 {{ report.totalScore }}</span>
              <span>均分 {{ report.averageScore }}</span>
              <span>及格率 {{ report.passRate }}%</span>
              <span>批改 {{ report.reviewedCount }}/{{ report.submittedCount }}</span>
            </span>
            <span class="review-report-card__meta">
              <StatusTag
                :label="weakKnowledgeCountFor(report) > 0 ? '需关注' : '表现稳定'"
                :tone="weakKnowledgeCountFor(report) > 0 ? 'warning' : 'success'"
              />
              <span>{{ report.artifacts?.length ?? 0 }} 个产物</span>
            </span>
          </button>
        </div>
        <EnterprisePagination
          v-if="reportPagination.total > reportPagination.pageSize"
          class="section-pagination"
          :current="reportPagination.page"
          :page-size="reportPagination.pageSize"
          :total="reportPagination.total"
          :page-size-options="['8', '16', '32']"
          :disabled="loading"
          @change="handleReportPaginationChange"
        />
      </section>

      <section
        v-if="selectedReport"
        class="detail-panel review-detail-panel review-detail-panel--full"
      >
        <SummaryStrip
          class="content-card review-current-card"
          eyebrow="当前复盘"
          :title="selectedReport.examTitle"
          :description="`${selectedReport.courseName} · ${selectedReport.reviewedCount}/${selectedReport.submittedCount} 已批改`"
          :stats="[
            { label: '产物', value: selectedReport.artifacts?.length ?? 0 },
            { label: '风险标签', value: selectedReport.lectureDraft.riskLabels.length },
            { label: '题目表现', value: selectedReport.questionPerformances.length },
          ]"
        >
          <template #actions>
            <AppActionButton
              class="icon-action-button"
              icon="←"
              title="返回复盘列表"
              @click="backToReviewList"
            >
              返回列表
            </AppActionButton>
          </template>
        </SummaryStrip>

        <ReviewAnalysisSections
          :report="selectedReport"
          :weak-knowledge-count="weakKnowledgeCount"
          :exporting-type="exportingType"
          @export-artifact="exportArtifact"
        />

        <section class="content-card review-security-card">
          <div class="section-title">
            <div>
              <h2>考试安全审计</h2>
              <p class="muted-text">按考试查看切屏、失焦、退出全屏与自动交卷等事件。</p>
            </div>
            <AppActionButton
              class="icon-action-button"
              icon="↻"
              :disabled="securityLoading || !selectedReport"
              title="刷新审计"
              @click="loadSecurityEvents(selectedReport.examId)"
            >
              {{ securityLoading ? '刷新中...' : '刷新审计' }}
            </AppActionButton>
          </div>

          <SummaryStrip
            class="review-security-summary"
            eyebrow="安全概览"
            title="考试安全风险"
            description="用于教师复盘与考试纪律核查。"
            :stats="securitySummary"
          />

          <OperationNotice
            v-if="securityError"
            title="安全审计加载失败"
            :description="securityError"
            tone="danger"
          />

          <EmptyState
            v-else-if="!securityLoading && securityEvents.length === 0"
            title="暂无安全事件"
            description="当前考试尚未收到切屏、失焦、退出全屏或自动交卷记录。"
          />

          <div v-else class="review-security-event-list">
            <article
              v-for="event in securityEvents"
              :key="event.id"
              class="review-security-event-item"
            >
              <div class="review-security-event-main">
                <div class="tag-list">
                  <StatusTag
                    :label="event.eventType"
                    :tone="
                      event.severity === 'HIGH'
                        ? 'danger'
                        : event.severity === 'MEDIUM'
                          ? 'warning'
                          : 'info'
                    "
                  />
                  <StatusTag
                    :label="event.severity"
                    :tone="
                      event.severity === 'HIGH'
                        ? 'danger'
                        : event.severity === 'MEDIUM'
                          ? 'warning'
                          : 'info'
                    "
                  />
                </div>
                <strong>{{ event.studentName }}</strong>
                <p class="muted-text">{{ event.message || '未提供附加说明' }}</p>
              </div>
              <div class="review-security-event-meta">
                <span>客户端：{{ event.clientOccurredAt || '-' }}</span>
                <span>服务端：{{ event.serverReceivedAt }}</span>
                <span>累计次数：{{ event.clientEventCount }}</span>
              </div>
            </article>
            <EnterprisePagination
              v-if="securityEventPagination.total > securityEventPagination.pageSize"
              class="section-pagination"
              :current="securityEventPagination.page"
              :page-size="securityEventPagination.pageSize"
              :total="securityEventPagination.total"
              :page-size-options="['10', '20', '50']"
              :disabled="securityLoading"
              @change="handleSecurityEventPaginationChange"
            />
          </div>
        </section>

        <LectureDraftCard
          v-model:lecture-content="lectureContent"
          :report="selectedReport"
          :generation-task="generationTask"
          :generating="generating"
          :exporting-type="exportingType"
          :approving="approving"
          @regenerate="regenerateDraft"
          @export-artifact="exportArtifact"
          @approve="approveDraft"
        />

        <ReviewArtifactList
          :artifacts="selectedReport.artifacts ?? []"
          :downloading-artifact-id="downloadingArtifactId"
          @download="downloadArtifact"
        />
      </section>
    </main>
  </div>
</template>

<style scoped>
.review-page {
  display: grid;
  gap: 20px;
}

.review-page-layout {
  align-items: start;
}

.review-detail-panel {
  display: grid;
  gap: 20px;
  min-width: 0;
}

:deep(.review-selector-card) {
  position: sticky;
  top: var(--space-4);
}

:deep(.review-report-selector .list-card) {
  border-radius: var(--radius-sm);
  transition:
    border-color 0.16s ease,
    background 0.16s ease,
    transform 0.16s ease;
}

:deep(.review-report-selector .list-card:hover) {
  transform: translateY(-1px);
}

:deep(.review-report-selector .list-card--active) {
  border-color: color-mix(in srgb, var(--mm-color-primary) 48%, var(--mm-color-border));
  background: color-mix(in srgb, var(--mm-color-primary) 7%, var(--mm-color-card));
  box-shadow: inset 3px 0 0 var(--mm-color-primary);
}

:deep(.review-summary-metrics) {
  grid-template-columns: repeat(4, minmax(120px, 1fr));
}

.review-security-card {
  display: grid;
  gap: 20px;
}

.review-security-summary {
  border: 1px solid var(--mm-color-border-subtle);
  border-radius: var(--radius-sm);
  background: var(--mm-color-bg);
}

.review-security-event-list {
  display: grid;
  gap: var(--space-3);
}

.review-security-event-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 0.42fr);
  gap: 20px;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--mm-color-border-subtle);
  border-radius: var(--radius-sm);
  background: var(--mm-color-bg);
}

.review-security-event-main {
  display: grid;
  gap: var(--space-2);
  min-width: 0;
}

.review-security-event-main strong {
  color: var(--mm-color-text);
  font-size: 0.9rem;
}

.review-security-event-main p {
  margin: 0;
}

.review-security-event-meta {
  display: grid;
  align-content: center;
  gap: 4px;
  color: var(--mm-color-text-secondary);
  font-size: var(--font-size-xs);
  text-align: right;
}

@media (max-width: 1100px) {
  .review-security-event-item {
    grid-template-columns: 1fr;
  }

  .review-security-event-meta {
    text-align: left;
  }

  :deep(.review-summary-metrics) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
