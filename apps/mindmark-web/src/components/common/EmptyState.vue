<script setup lang="ts">
interface EmptyStateProps {
  title: string;
  description?: string;
}

defineProps<EmptyStateProps>();
</script>

<template>
  <div class="state-card">
    <div class="state-card-icon">∅</div>
    <h3>{{ title }}</h3>
    <p v-if="description">{{ description }}</p>
    <slot />
  </div>
</template>
