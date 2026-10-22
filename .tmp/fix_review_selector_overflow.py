from pathlib import Path
p = Path('D:/vc/MindMark/apps/mindmark-web/src/components/review/ReviewReportSelector.vue')
s = p.read_text(encoding='utf-8-sig')
s = s.replace('''      <button
        v-for="report in pagedReports"
        :key="report.examId"
        type="button"
        :class="['list-card', { 'list-card--active': report.examId === selectedExamId }]"
        @click="emit('select', report.examId)"
      >
        <strong>{{ report.examTitle }}</strong>
        <span>{{ report.courseName }}</span>
        <span>{{ report.reviewedCount }}/{{ report.submittedCount }} 已批改</span>
      </button>
      <EnterprisePagination
''', '''      <div class="review-report-list">
        <button
          v-for="report in pagedReports"
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
''')
s = s.replace('class="section-pagination"', 'class="section-pagination review-report-pagination"')
if '<style scoped>' not in s:
    s += '''

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
'''
p.write_text(s, encoding='utf-8', newline='\n')
