<script setup lang="ts">
import AppActionButton from '@/components/common/AppActionButton.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import EnterprisePagination from '@/components/common/EnterprisePagination.vue';
import PageSection from '@/components/common/PageSection.vue';
import type { ExamReviewReport } from '@/types/review';

defineProps<{
  reports: ExamReviewReport[];
  selectedExamId: string;
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
}>();

const emit = defineEmits<{
  refresh: [];
  select: [examId: string];
  pageChange: [page: number, pageSize: number];
}>();

const handleReportPaginationChange = (page: number, pageSize: number) => {
  emit('pageChange', page, pageSize);
};
</script>

<template>
  <aside class="list-panel review-report-selector">
    <PageSection
      class="review-selector-card"
      title="考试列表"
      description="选择已提交或已批改的考试进行复盘。"
    >
      <template #actions>
        <AppActionButton
          class="icon-action-button"
          icon="↻"
          :disabled="loading"
          :title="loading ? '刷新中...' : '刷新复盘数据'"
          @click="emit('refresh')"
        >
          {{ loading ? '刷新中...' : '刷新' }}
        </AppActionButton>
      </template>
      <EmptyState
        v-if="!loading && reports.length === 0"
        title="暂无复盘数据"
        description="请先完成考试提交与批改。"
      />
      <div class="review-report-list">
        <button
          v-for="report in reports"
          :key="report.examId"
          type="button"
          :class="['list-card', { 'list-card--active': report.examId === selectedExamId }]"
          :title="`${report.examTitle} · ${report.courseName}`"
          @click="emit('select', report.examId)"
        >
          <strong>{{ report.examTitle }}</strong>
          <span>{{ report.courseName }}</span>
          <span>{{ report.reviewedCount }}/{{ report.submittedCount }} 已批改</span>
        </button>
      </div>
      <EnterprisePagination
        v-if="total > pageSize"
        class="section-pagination review-report-pagination"
        :current="page"
        :page-size="pageSize"
        :total="total"
        :page-size-options="['8', '16', '32']"
        :disabled="loading"
        @change="handleReportPaginationChange"
      />
    </PageSection>
  </aside>
</template>

<style scoped>
.review-report-selector {
  min-width: 0;
  max-width: 100%;
}

.review-report-list {
  display: grid;
  gap: var(--space-2);
  min-width: 0;
  max-width: 100%;
}

.list-card {
  display: grid;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  gap: 3px;
  padding: 10px 12px;
  overflow: hidden;
  border: 1px solid var(--mm-color-border-subtle);
  border-radius: var(--radius-sm);
  background: var(--mm-color-card);
  color: var(--mm-color-text);
  text-align: left;
  cursor: pointer;
}

.list-card strong,
.list-card span {
  display: block;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-card strong {
  font-size: var(--font-size-sm);
  font-weight: 650;
  line-height: 1.45;
}

.list-card span {
  color: var(--mm-color-text-secondary);
  font-size: var(--font-size-xs);
  line-height: 1.45;
}

.review-report-pagination {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.review-report-pagination :deep(.ant-pagination) {
  justify-content: flex-start;
}

.review-report-pagination :deep(.ant-pagination-total-text) {
  flex-basis: 100%;
  margin-inline-end: 0;
}

.review-report-pagination :deep(.ant-pagination-options-quick-jumper) {
  display: none;
}
</style>
