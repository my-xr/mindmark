<script setup lang="ts">
import type { AdminTab } from '@/utils/adminGovernance';

defineProps<{
  activeTab: AdminTab;
}>();

const emit = defineEmits<{
  'update:activeTab': [value: AdminTab];
}>();

const setTab = (tab: AdminTab) => emit('update:activeTab', tab);
</script>

<template>
  <nav class="admin-tabs" aria-label="账号治理导航">
    <button
      data-testid="admin-tab-users"
      :class="{ active: activeTab === 'users' }"
      type="button"
      @click="setTab('users')"
    >
      用户账号
    </button>
    <button
      data-testid="admin-tab-assignments"
      :class="{ active: activeTab === 'assignments' }"
      type="button"
      @click="setTab('assignments')"
    >
      教师/助教班级授权
    </button>
    <button
      data-testid="admin-tab-audits"
      :class="{ active: activeTab === 'audits' }"
      type="button"
      @click="setTab('audits')"
    >
      安全审计
    </button>
  </nav>
</template>
