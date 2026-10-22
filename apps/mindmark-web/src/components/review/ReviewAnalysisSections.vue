<script setup lang="ts">
import AppActionButton from '@/components/common/AppActionButton.vue';
import PageSection from '@/components/common/PageSection.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { REVIEW_INSIGHT_LEVEL_META } from '@/constants/status';
import type { ExamReviewReport, ReviewArtifactType } from '@/types/review';

defineProps<{
  report: ExamReviewReport;
  weakKnowledgeCount: number;
  exportingType: ReviewArtifactType | '';
}>();

const emit = defineEmits<{
  exportArtifact: [artifactType: ReviewArtifactType];
}>();
</script>

<template>
  <section class="content-card metric-grid review-summary-metrics">
    <article>
      <span>平均分</span>
      <strong>{{ report.averageScore }}</strong>
    </article>
    <article>
      <span>及格率</span>
      <strong>{{ report.passRate }}%</strong>
    </article>
    <article>
      <span>已批改/已提交</span>
      <strong>{{ report.reviewedCount }}/{{ report.submittedCount }}</strong>
    </article>
    <article>
      <span>薄弱点</span>
      <strong>{{ weakKnowledgeCount }}</strong>
    </article>
  </section>

  <PageSection
    class="review-analysis-card"
    title="成绩分布与薄弱点"
    description="用于判断课堂讲评重点和分层作业方向。"
  >
    <template #actions>
      <div class="lecture-actions">
        <AppActionButton
          icon="⇩"
          :disabled="!!exportingType"
          @click="emit('exportArtifact', 'REVIEW_REPORT_MARKDOWN')"
        >
          {{ exportingType === 'REVIEW_REPORT_MARKDOWN' ? '导出中...' : '导出复盘报告' }}
        </AppActionButton>
        <AppActionButton
          icon="⇩"
          :disabled="!!exportingType"
          @click="emit('exportArtifact', 'SCORE_SUMMARY_CSV')"
        >
          {{ exportingType === 'SCORE_SUMMARY_CSV' ? '导出中...' : '导出成绩 CSV' }}
        </AppActionButton>
      </div>
    </template>

    <div class="score-band-list">
      <article v-for="band in report.scoreBands" :key="band.label">
        <strong>{{ band.label }}</strong>
        <span>{{ band.count }} 人 / {{ band.ratio }}%</span>
      </article>
    </div>

    <div class="knowledge-diagnosis-list">
      <article v-for="item in report.knowledgeWeaknesses" :key="item.knowledgePoint">
        <div>
          <strong>{{ item.knowledgePoint }}</strong>
          <p>{{ item.suggestion }}</p>
        </div>
        <div class="knowledge-diagnosis-meta">
          <StatusTag
            :label="REVIEW_INSIGHT_LEVEL_META[item.level].label"
            :tone="REVIEW_INSIGHT_LEVEL_META[item.level].tone"
          />
          <span>{{ item.scoreRate }}%</span>
        </div>
      </article>
    </div>
  </PageSection>

  <PageSection
    class="review-question-card"
    title="题目表现"
    description="低得分率题目应优先进入讲评。"
  >
    <div class="question-performance-list">
      <article v-for="item in report.questionPerformances" :key="item.questionId">
        <div>
          <strong>第 {{ item.order }} 题：{{ item.title }}</strong>
          <p>{{ item.weaknessTags.join('、') || '暂无明显风险' }}</p>
        </div>
        <span>{{ item.averageScore }}/{{ item.maxScore }} · {{ item.scoreRate }}%</span>
      </article>
    </div>
  </PageSection>
</template>
