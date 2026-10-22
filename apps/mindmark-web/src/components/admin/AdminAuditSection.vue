<script setup lang="ts">
import AppActionButton from '@/components/common/AppActionButton.vue';
import { ref } from 'vue';

import StatusTag from '@/components/common/StatusTag.vue';
import type { AuditLog } from '@/services/adminAccountService';
import { formatDateTime, type AdminAuditFilters } from '@/utils/adminGovernance';

defineProps<{
  auditLogs: AuditLog[];
  totalAuditLogs: number;
  filters: AdminAuditFilters;
  auditLoading: boolean;
}>();

const emit = defineEmits<{
  'update:filters': [value: AdminAuditFilters];
  query: [];
}>();

const isFilterCollapsed = ref(true);

const updateFilter = <Key extends keyof AdminAuditFilters>(
  filters: AdminAuditFilters,
  key: Key,
  value: AdminAuditFilters[Key],
) => {
  emit('update:filters', { ...filters, [key]: value });
};

const handleInput = (filters: AdminAuditFilters, key: keyof AdminAuditFilters, event: Event) => {
  updateFilter(filters, key, (event.target as HTMLInputElement).value.trim());
};
</script>

<template>
  <section class="content-card admin-section-card" data-testid="admin-audits-section">
    <div class="section-title">
      <h2>安全审计可视化</h2>
      <div class="section-actions">
        <AppActionButton
          class="filter-toggle-button"
          data-testid="admin-audit-filter-toggle"
          :aria-expanded="!isFilterCollapsed"
          @click="isFilterCollapsed = !isFilterCollapsed"
        >
          {{ isFilterCollapsed ? '展开全部' : '收起到一行' }}
        </AppActionButton>
        <AppActionButton
          data-testid="admin-audit-query"
          :disabled="auditLoading"
          @click="emit('query')"
        >
          查询
        </AppActionButton>
      </div>
    </div>
    <div
      :class="[
        'admin-filter-grid',
        'audit-filter-grid',
        'collapsible-filter-body',
        { 'collapsible-filter-body--single-row': isFilterCollapsed },
      ]"
    >
      <label class="form-field">
        操作人 ID
        <input
          data-testid="admin-audit-actor"
          :value="filters.actorId"
          class="text-input"
          placeholder="u-teacher-001"
          @input="handleInput(filters, 'actorId', $event)"
        />
      </label>
      <label class="form-field">
        目标用户 ID
        <input
          data-testid="admin-audit-target"
          :value="filters.targetUserId"
          class="text-input"
          placeholder="u-student-001"
          @input="handleInput(filters, 'targetUserId', $event)"
        />
      </label>
      <label class="form-field">
        动作
        <input
          data-testid="admin-audit-action"
          :value="filters.action"
          class="text-input"
          placeholder="LOGIN / ADMIN_"
          @input="handleInput(filters, 'action', $event)"
        />
      </label>
      <label class="form-field">
        结果
        <select
          data-testid="admin-audit-result"
          :value="filters.result"
          class="text-input"
          @change="handleInput(filters, 'result', $event)"
        >
          <option value="">全部</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILED">FAILED</option>
        </select>
      </label>
    </div>

    <p class="audit-summary">
      共匹配 {{ totalAuditLogs }} 条审计日志，按创建时间倒序展示最近 50 条。
    </p>
    <div class="audit-timeline">
      <article
        v-for="log in auditLogs"
        :key="log.id"
        class="audit-item"
        data-testid="admin-audit-row"
      >
        <div>
          <StatusTag :label="log.result" :tone="log.result === 'SUCCESS' ? 'success' : 'danger'" />
          <strong>{{ log.action }}</strong>
          <p>{{ log.detail || '无详情' }}</p>
        </div>
        <aside>
          <span>{{ formatDateTime(log.createdAt) }}</span>
          <small>actor: {{ log.actorId }}</small>
          <small>target: {{ log.targetUserId || '-' }}</small>
        </aside>
      </article>
      <div v-if="auditLogs.length === 0" class="admin-table-empty">暂无匹配审计日志。</div>
    </div>
  </section>
</template>
