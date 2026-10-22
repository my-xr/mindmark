<script setup lang="ts">
import { computed } from 'vue';

interface SummaryStat {
  label: string;
  value: string | number;
}

interface SummaryStripProps {
  eyebrow?: string;
  title: string;
  description?: string;
  stats?: SummaryStat[];
}

const props = withDefaults(defineProps<SummaryStripProps>(), {
  eyebrow: '',
  description: '',
  stats: () => [],
});

const normalizedStats = computed(() => props.stats ?? []);
</script>

<template>
  <div class="summary-strip">
    <div class="summary-strip__main">
      <span v-if="eyebrow" class="eyebrow-text">{{ eyebrow }}</span>
      <strong>{{ title }}</strong>
      <p v-if="description">{{ description }}</p>
      <slot />
    </div>
    <div v-if="normalizedStats.length" class="summary-strip__stats">
      <span v-for="stat in normalizedStats" :key="stat.label">
        <small>{{ stat.label }}</small>
        <strong>{{ stat.value }}</strong>
      </span>
    </div>
    <div v-if="$slots.actions" class="summary-strip__actions">
      <slot name="actions" />
    </div>
  </div>
</template>
