<script setup lang="ts">
interface ErrorStateProps {
  title?: string;
  description?: string;
}

withDefaults(defineProps<ErrorStateProps>(), {
  title: '页面加载失败',
  description: '请稍后重试，或联系管理员。',
});
</script>

<template>
  <div class="state-card state-card--error">
    <div class="state-card-icon">!</div>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <slot />
  </div>
</template>
