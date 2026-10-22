<script setup lang="ts">
import AppActionButton from '@/components/common/AppActionButton.vue';
import PageSection from '@/components/common/PageSection.vue';
import type { ReviewArtifact, ReviewArtifactType } from '@/types/review';

defineProps<{
  artifacts: ReviewArtifact[];
  downloadingArtifactId: string;
}>();

const emit = defineEmits<{
  download: [artifactId: string];
}>();

const artifactTypeLabel = (artifactType: ReviewArtifactType) => {
  const map: Record<ReviewArtifactType, string> = {
    REVIEW_REPORT_MARKDOWN: '复盘报告',
    LECTURE_DRAFT_MARKDOWN: 'AI 讲评稿',
    SCORE_SUMMARY_CSV: '成绩汇总 CSV',
  };

  return map[artifactType];
};
</script>

<template>
  <PageSection
    v-if="artifacts.length"
    class="review-artifact-card"
    title="已生成产物"
    description="导出文件已上传到对象存储，可下载留档。"
  >
    <div class="question-performance-list review-artifact-list">
      <article v-for="artifact in artifacts" :key="artifact.id">
        <div>
          <strong>{{ artifact.fileName }}</strong>
          <p>{{ artifactTypeLabel(artifact.artifactType) }} · {{ artifact.sizeBytes }} bytes</p>
        </div>
        <div class="artifact-actions">
          <span>{{ artifact.createdAt }}</span>
          <AppActionButton
            icon="⇩"
            :disabled="downloadingArtifactId === artifact.id"
            @click="emit('download', artifact.id)"
          >
            {{ downloadingArtifactId === artifact.id ? '下载中...' : '下载' }}
          </AppActionButton>
        </div>
      </article>
    </div>
  </PageSection>
</template>
