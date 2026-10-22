const fs = require('fs');
const path = 'apps/mindmark-web/src/components/review/LectureDraftCard.vue';
const content = `<script setup lang="ts">
import { computed } from 'vue';

import PageSection from '@/components/common/PageSection.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { LECTURE_DRAFT_STATUS_META } from '@/constants/status';
import type { ExamReviewReport, LectureDraftTask, ReviewArtifactType } from '@/types/review';

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
</script>

<template>
  <PageSection
    class="lecture-draft-card"
    title="AI \u8bb2\u8bc4\u7a3f"
    description="AI \u5185\u5bb9\u4ec5\u4f9b\u6559\u5e08\u53c2\u8003\uff0c\u786e\u8ba4\u524d\u5fc5\u987b\u4eba\u5de5\u6838\u5bf9\u6570\u636e\u3001\u63aa\u8f9e\u548c\u6559\u5b66\u5efa\u8bae\u3002"
  >
    <template #actions>
      <div class="lecture-actions">
        <button
          class="secondary-button"
          type="button"
          :disabled="generating"
          @click="emit('regenerate')"
        >
          {{ generating ? '\u751f\u6210\u4e2d...' : '\u91cd\u65b0\u751f\u6210\u8bb2\u8bc4\u7a3f' }}
        </button>
        <button
          class="secondary-button"
          type="button"
          :disabled="!!exportingType"
          @click="emit('exportArtifact', 'LECTURE_DRAFT_MARKDOWN')"
        >
          {{ exportingType === 'LECTURE_DRAFT_MARKDOWN' ? '\u5bfc\u51fa\u4e2d...' : '\u5bfc\u51fa\u8bb2\u8bc4\u7a3f' }}
        </button>
        <button class="primary-button" type="button" :disabled="approving" @click="emit('approve')">
          {{ approving ? '\u786e\u8ba4\u4e2d...' : '\u786e\u8ba4\u8bb2\u8bc4\u7a3f' }}
        </button>
      </div>
    </template>

    <div class="lecture-meta-row">
      <StatusTag
        :label="LECTURE_DRAFT_STATUS_META[report.lectureDraft.status].label"
        :tone="LECTURE_DRAFT_STATUS_META[report.lectureDraft.status].tone"
      />
      <span>Provider {{ report.lectureDraft.provider ?? '-' }}</span>
      <span>\u7f6e\u4fe1\u5ea6 {{ Math.round(report.lectureDraft.confidence * 100) }}%</span>
      <span>\u751f\u6210\u65f6\u95f4 {{ report.lectureDraft.generatedAt }}</span>
      <span v-if="report.lectureDraft.approvedAt"
        >\u786e\u8ba4\u65f6\u95f4 {{ report.lectureDraft.approvedAt }}</span
      >
    </div>

    <p v-if="generationTask" class="muted-text">
      AI task {{ generationTask.id }}: {{ generationTask.status }}
      <span v-if="generationTask.errorMessage"> - {{ generationTask.errorMessage }}</span>
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
      <h3>\u5efa\u8bae\u8bb2\u8bc4\u63d0\u7eb2</h3>
      <ol>
        <li v-for="item in report.lectureDraft.outline" :key="item">{{ item }}</li>
      </ol>
    </div>

    <label class="form-field form-field--full">
      \u6559\u5e08\u53ef\u7f16\u8f91\u8bb2\u8bc4\u7a3f
      <textarea v-model="editableContent" class="textarea-input lecture-textarea" rows="12" />
    </label>
  </PageSection>
</template>
`;
fs.writeFileSync(path, content, 'utf8');
