<script setup lang="ts">
interface PageHeaderProps {
  title: string;
  description?: string;
}

defineProps<PageHeaderProps>();
</script>

<template>
  <section class="page-header">
    <div>
      <h1>{{ title }}</h1>
      <p v-if="description">{{ description }}</p>
    </div>
    <div class="page-header-actions">
      <slot name="actions" />
    </div>
  </section>
</template>
