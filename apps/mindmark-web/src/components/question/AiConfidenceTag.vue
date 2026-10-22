<script setup lang="ts">
import { computed } from 'vue';

import StatusTag from '@/components/common/StatusTag.vue';
import type { StatusTone } from '@/constants/status';

interface AiConfidenceTagProps {
  confidence: number;
}

const props = defineProps<AiConfidenceTagProps>();

const confidenceMeta = computed<{ label: string; tone: StatusTone }>(() => {
  const percent = Math.round(props.confidence * 100);

  if (props.confidence >= 0.85) {
    return { label: `置信度 ${percent}%`, tone: 'success' };
  }

  if (props.confidence >= 0.7) {
    return { label: `置信度 ${percent}%`, tone: 'warning' };
  }

  return { label: `置信度 ${percent}%`, tone: 'danger' };
});
</script>

<template>
  <StatusTag :label="confidenceMeta.label" :tone="confidenceMeta.tone" />
</template>
