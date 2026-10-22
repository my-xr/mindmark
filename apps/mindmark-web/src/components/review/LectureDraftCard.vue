<script setup lang="ts">
import { computed } from 'vue';

import AppActionButton from '@/components/common/AppActionButton.vue';
import PageSection from '@/components/common/PageSection.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { LECTURE_DRAFT_STATUS_META } from '@/constants/status';
import type { ExamReviewReport, LectureDraftTask, ReviewArtifactType } from '@/types/review';
import { getErrorMessage } from '@/utils/errorMessage';

const props = defineProps<{
  report: ExamReviewReport;
  generationTask: LectureDraftTask | null;
  lectureContent: string;
  generating: boolean;
  exportingType: ReviewArtifactType | '';
  approving: boolean;
}>();

const emit = defineEmits<{
  'update:lectureContent': [content: string];
  regenerate: [];
  exportArtifact: [artifactType: ReviewArtifactType];
  approve: [];
}>();

const editableContent = computed({
  get: () => props.lectureContent,
  set: (value: string) => emit('update:lectureContent', value),
});

const taskStatusLabels: Record<LectureDraftTask['status'], string> = {
  PENDING: '排队中',
  RUNNING: '生成中',
  SUCCEEDED: '已完成',
  FAILED: '失败',
};
</script>

<template>
  <PageSection
    class="lecture-draft-card"
    title="AI 讲评稿"
    description="AI 内容仅供教师参考，确认前必须人工核对数据、措辞和教学建议。"
  >
    <template #actions>
      <div class="lecture-actions">
        <AppActionButton icon="↻" :disabled="generating" @click="emit('regenerate')">
          {{ generating ? '生成中...' : '重新生成讲评稿' }}
        </AppActionButton>
        <AppActionButton
          icon="⇩"
          :disabled="!!exportingType"
          @click="emit('exportArtifact', 'LECTURE_DRAFT_MARKDOWN')"
        >
          {{ exportingType === 'LECTURE_DRAFT_MARKDOWN' ? '导出中...' : '导出讲评稿' }}
        </AppActionButton>
        <AppActionButton icon="✓" variant="primary" :disabled="approving" @click="emit('approve')">
          {{ approving ? '确认中...' : '确认讲评稿' }}
        </AppActionButton>
      </div>
    </template>

    <div class="lecture-meta-row">
      <StatusTag
        :label="LECTURE_DRAFT_STATUS_META[report.lectureDraft.status].label"
        :tone="LECTURE_DRAFT_STATUS_META[report.lectureDraft.status].tone"
      />
      <span>Provider {{ report.lectureDraft.provider ?? '-' }}</span>
      <span>置信度 {{ Math.round(report.lectureDraft.confidence * 100) }}%</span>
      <span>生成时间 {{ report.lectureDraft.generatedAt }}</span>
      <span v-if="report.lectureDraft.approvedAt"
        >确认时间 {{ report.lectureDraft.approvedAt }}</span
      >
    </div>

    <p v-if="generationTask" class="muted-text">
      AI 任务 {{ generationTask.id }}：{{ taskStatusLabels[generationTask.status] }}
      <span v-if="generationTask.errorMessage">
        -
        {{ getErrorMessage(generationTask.errorMessage, 'AI 讲评稿生成失败，请稍后重试。') }}
      </span>
    </p>

    <div class="lecture-risk-row">
      <StatusTag
        v-for="label in report.lectureDraft.riskLabels"
        :key="label"
        :label="label"
        tone="warning"
      />
    </div>

    <div class="lecture-outline">
      <h3>建议讲评提纲</h3>
      <ol>
        <li v-for="item in report.lectureDraft.outline" :key="item">{{ item }}</li>
      </ol>
    </div>

    <label class="form-field form-field--full">
      教师可编辑讲评稿
      <textarea v-model="editableContent" class="textarea-input lecture-textarea" rows="12" />
    </label>
  </PageSection>
</template>
