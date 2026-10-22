<script setup lang="ts">
import { ref, watch } from 'vue';

import type { StatusTone } from '@/constants/status';

interface OperationNoticeProps {
  title: string;
  description?: string;
  tone?: StatusTone;
  closable?: boolean;
}

const props = withDefaults(defineProps<OperationNoticeProps>(), {
  description: '',
  tone: 'info',
  closable: true,
});

const visible = ref(true);

watch(
  () => [props.title, props.description, props.tone],
  () => {
    visible.value = true;
  },
);
</script>

<template>
  <div v-if="visible" :class="['operation-notice', `operation-notice--${tone}`]" role="status">
    <span class="operation-notice__body">
      <strong>{{ title }}</strong>
      <p v-if="description">{{ description }}</p>
    </span>
    <button
      v-if="closable"
      class="operation-notice__close"
      type="button"
      aria-label="关闭提示"
      @click="visible = false"
    >
      ×
    </button>
  </div>
</template>
