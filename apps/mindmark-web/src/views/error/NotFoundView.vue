<script setup lang="ts">
import AppActionButton from '@/components/common/AppActionButton.vue';
import ErrorState from '@/components/common/ErrorState.vue';
</script>

<template>
  <ErrorState title="页面不存在" description="你访问的页面不存在或已被移动。">
    <AppActionButton variant="primary" to="/teacher/dashboard">返回工作台</AppActionButton>
  </ErrorState>
</template>
