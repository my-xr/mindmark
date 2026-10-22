<script setup lang="ts">
import AppActionButton from '@/components/common/AppActionButton.vue';
import { ref } from 'vue';

import ErrorState from '@/components/common/ErrorState.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import type { AdminUser } from '@/services/adminAccountService';
import type { RoleCode, UserStatus } from '@/types/user';
import {
  formatDateTime,
  roleLabel,
  statusLabel,
  type AdminUserFilters,
} from '@/utils/adminGovernance';

defineProps<{
  users: AdminUser[];
  totalUsers: number;
  filters: AdminUserFilters;
  loading: boolean;
  errorMessage: string | null;
  roleOptions: RoleCode[];
  statusOptions: UserStatus[];
}>();

const emit = defineEmits<{
  'update:filters': [value: AdminUserFilters];
  query: [];
  select: [user: AdminUser];
  'update-status': [user: AdminUser, status: UserStatus];
  unlock: [user: AdminUser];
}>();

const updateFilter = <Key extends keyof AdminUserFilters>(
  filters: AdminUserFilters,
  key: Key,
  value: AdminUserFilters[Key],
) => {
  emit('update:filters', { ...filters, [key]: value });
};

const handleKeywordInput = (filters: AdminUserFilters, event: Event) => {
  updateFilter(filters, 'keyword', (event.target as HTMLInputElement).value.trim());
};

const handleRoleChange = (filters: AdminUserFilters, event: Event) => {
  updateFilter(filters, 'role', (event.target as HTMLSelectElement).value as RoleCode | '');
};

const handleStatusChange = (filters: AdminUserFilters, event: Event) => {
  updateFilter(filters, 'status', (event.target as HTMLSelectElement).value as UserStatus | '');
};

const isFilterCollapsed = ref(true);

const isLocked = (user: AdminUser) =>
  Boolean(user.lockedUntil && new Date(user.lockedUntil) > new Date());
</script>

<template>
  <section class="content-card admin-section-card" data-testid="admin-users-section">
    <div class="section-title">
      <h2>用户账号治理</h2>
      <div class="section-actions">
        <AppActionButton
          class="filter-toggle-button"
          data-testid="admin-users-filter-toggle"
          :aria-expanded="!isFilterCollapsed"
          @click="isFilterCollapsed = !isFilterCollapsed"
        >
          {{ isFilterCollapsed ? '展开全部' : '收起到一行' }}
        </AppActionButton>
        <AppActionButton data-testid="admin-users-query" :disabled="loading" @click="emit('query')">
          查询
        </AppActionButton>
      </div>
    </div>
    <div
      :class="[
        'admin-filter-grid',
        'collapsible-filter-body',
        { 'collapsible-filter-body--single-row': isFilterCollapsed },
      ]"
    >
      <label class="form-field">
        关键词
        <input
          data-testid="admin-users-keyword"
          :value="filters.keyword"
          class="text-input"
          placeholder="姓名 / 邮箱 / 账号 / ID"
          @input="handleKeywordInput(filters, $event)"
        />
      </label>
      <label class="form-field">
        角色
        <select
          data-testid="admin-users-role"
          :value="filters.role"
          class="text-input"
          @change="handleRoleChange(filters, $event)"
        >
          <option value="">全部角色</option>
          <option v-for="role in roleOptions" :key="role" :value="role">
            {{ roleLabel(role) }}
          </option>
        </select>
      </label>
      <label class="form-field">
        状态
        <select
          data-testid="admin-users-status"
          :value="filters.status"
          class="text-input"
          @change="handleStatusChange(filters, $event)"
        >
          <option value="">全部状态</option>
          <option v-for="status in statusOptions" :key="status" :value="status">
            {{ statusLabel(status) }}
          </option>
        </select>
      </label>
    </div>

    <p class="audit-summary">共匹配 {{ totalUsers }} 个账号，当前展示最近 50 个。</p>

    <ErrorState
      v-if="errorMessage && users.length === 0"
      title="账号加载失败"
      :description="errorMessage"
    />
    <div v-else class="admin-user-table">
      <div class="admin-user-row admin-user-row--head">
        <span>用户</span>
        <span>角色</span>
        <span>状态</span>
        <span>安全信号</span>
        <span>最近登录</span>
        <span>操作</span>
      </div>
      <div v-for="user in users" :key="user.id" class="admin-user-row" data-testid="admin-user-row">
        <span>
          <strong>{{ user.name }}</strong>
          <small>{{ user.username }} · {{ user.email }}</small>
        </span>
        <span class="tag-row">
          <StatusTag v-for="role in user.roles" :key="role" :label="roleLabel(role)" tone="info" />
        </span>
        <span>
          <StatusTag
            :label="statusLabel(user.status)"
            :tone="user.status === 'ACTIVE' ? 'success' : 'danger'"
          />
        </span>
        <span class="security-signal">
          <StatusTag v-if="user.mustChangePassword" label="待改密" tone="warning" />
          <StatusTag v-if="isLocked(user)" label="已锁定" tone="danger" />
          <small>失败 {{ user.failedLoginCount }} 次</small>
        </span>
        <span>{{ formatDateTime(user.lastLoginAt) }}</span>
        <span class="admin-action-row">
          <AppActionButton data-testid="admin-user-select" @click="emit('select', user)">
            Select
          </AppActionButton>
          <AppActionButton
            v-if="user.status === 'ACTIVE'"
            variant="danger"
            data-testid="admin-user-disable"
            @click="emit('update-status', user, 'DISABLED')"
          >
            禁用
          </AppActionButton>
          <AppActionButton
            v-else
            data-testid="admin-user-enable"
            @click="emit('update-status', user, 'ACTIVE')"
          >
            启用
          </AppActionButton>
          <AppActionButton
            v-if="isLocked(user)"
            data-testid="admin-user-unlock"
            @click="emit('unlock', user)"
          >
            解锁
          </AppActionButton>
        </span>
      </div>
      <div v-if="users.length === 0" class="admin-table-empty">没有匹配的用户账号。</div>
    </div>
  </section>
</template>
