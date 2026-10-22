<script setup lang="ts">
import type { StatusTone } from '@/constants/status';

interface StatusTagProps {
  label: string;
  tone?: StatusTone;
}

withDefaults(defineProps<StatusTagProps>(), {
  tone: 'default',
});
</script>

<template>
  <span :class="['status-tag', `status-tag--${tone}`]">{{ label }}</span>
</template>
