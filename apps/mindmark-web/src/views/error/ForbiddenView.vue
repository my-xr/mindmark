<script setup lang="ts">
import AppActionButton from '@/components/common/AppActionButton.vue';
import ErrorState from '@/components/common/ErrorState.vue';
</script>

<template>
  <ErrorState title="无权限访问" description="当前用户没有访问该页面的权限。">
    <AppActionButton variant="primary" to="/teacher/dashboard">返回工作台</AppActionButton>
  </ErrorState>
</template>
