<script setup lang="ts">
defineProps<{
  totalUsers: number;
  forcedChangeCount: number;
  lockedUserCount: number;
  disabledUserCount: number;
}>();
</script>

<template>
  <section class="metric-grid admin-governance-metrics">
    <article class="metric-card">
      <span>账号总数</span>
      <strong>{{ totalUsers }}</strong>
      <small>含管理员、教师、助教、学生</small>
    </article>
    <article class="metric-card">
      <span>待首次改密</span>
      <strong>{{ forcedChangeCount }}</strong>
      <small>学生导入与重置密码后进入强制改密</small>
    </article>
    <article class="metric-card">
      <span>临时锁定</span>
      <strong>{{ lockedUserCount }}</strong>
      <small>连续登录失败达到阈值后锁定</small>
    </article>
    <article class="metric-card">
      <span>已禁用</span>
      <strong>{{ disabledUserCount }}</strong>
      <small>禁用后会话立即失效</small>
    </article>
  </section>
</template>
