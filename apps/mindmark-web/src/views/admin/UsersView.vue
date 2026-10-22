<script setup lang="ts">
import AppActionButton from '@/components/common/AppActionButton.vue';
import { computed, onMounted, ref } from 'vue';

import AdminAssignmentSection from '@/components/admin/AdminAssignmentSection.vue';
import AdminAuditSection from '@/components/admin/AdminAuditSection.vue';
import AdminGovernanceMetrics from '@/components/admin/AdminGovernanceMetrics.vue';
import AdminGovernanceTabs from '@/components/admin/AdminGovernanceTabs.vue';
import AdminUserSection from '@/components/admin/AdminUserSection.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import { listVisibleClasses } from '@/services/academicService';
import type { AdminUser, ClassAssignment } from '@/services/adminAccountService';
import {
  deleteUserClassAssignment,
  listAdminUsers,
  listAuditLogs,
  listUserClassAssignments,
  unlockAdminUser,
  updateAdminUserRoles,
  updateAdminUserStatus,
  upsertUserClassAssignment,
} from '@/services/adminAccountService';
import type { TeachingClass } from '@/types/academic';
import type { RoleCode, UserStatus } from '@/types/user';
import { getErrorMessage } from '@/utils/errorMessage';
import {
  ASSIGNMENT_ROLE_OPTIONS,
  ROLE_OPTIONS,
  STATUS_OPTIONS,
  statusLabel,
  type AdminAssignmentForm,
  type AdminAuditFilters,
  type AdminTab,
  type AdminUserFilters,
} from '@/utils/adminGovernance';

const activeTab = ref<AdminTab>('users');
const loading = ref(false);
const auditLoading = ref(false);
const assignmentLoading = ref(false);
const operationMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

const users = ref<AdminUser[]>([]);
const totalUsers = ref(0);
const userFilters = ref<AdminUserFilters>({
  keyword: '',
  role: '',
  status: '',
});

const selectedUser = ref<AdminUser | null>(null);
const selectedRoles = ref<RoleCode[]>([]);
const assignments = ref<ClassAssignment[]>([]);
const classes = ref<TeachingClass[]>([]);
const assignmentForm = ref<AdminAssignmentForm>({
  classId: '',
  assignmentRole: ASSIGNMENT_ROLE_OPTIONS[1],
});

const auditLogs = ref([] as Awaited<ReturnType<typeof listAuditLogs>>['items']);
const totalAuditLogs = ref(0);
const auditFilters = ref<AdminAuditFilters>({
  actorId: '',
  targetUserId: '',
  action: '',
  result: '',
});

const lockedUserCount = computed(
  () =>
    users.value.filter((user) => user.lockedUntil && new Date(user.lockedUntil) > new Date())
      .length,
);
const disabledUserCount = computed(
  () => users.value.filter((user) => user.status === 'DISABLED').length,
);
const forcedChangeCount = computed(
  () => users.value.filter((user) => user.mustChangePassword).length,
);

const loadClasses = async () => {
  try {
    classes.value = await listVisibleClasses();
    assignmentForm.value.classId = assignmentForm.value.classId || classes.value[0]?.id || '';
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '班级列表加载失败');
  }
};

const loadUsers = async () => {
  loading.value = true;
  errorMessage.value = null;
  try {
    const page = await listAdminUsers({ ...userFilters.value, page: 1, pageSize: 50 });
    users.value = page.items;
    totalUsers.value = page.total;
    if (!selectedUser.value && page.items.length > 0) {
      await selectUser(page.items[0]);
    } else if (selectedUser.value) {
      const refreshed = page.items.find((user) => user.id === selectedUser.value?.id) ?? null;
      selectedUser.value = refreshed;
      selectedRoles.value = refreshed ? [...refreshed.roles] : [];
      if (!refreshed) {
        assignments.value = [];
      }
    }
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '用户列表加载失败');
  } finally {
    loading.value = false;
  }
};

const loadAssignments = async (userId: string) => {
  assignmentLoading.value = true;
  try {
    assignments.value = await listUserClassAssignments(userId);
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '班级授权加载失败');
  } finally {
    assignmentLoading.value = false;
  }
};

const loadSelectedUserAssignments = async () => {
  if (selectedUser.value) {
    await loadAssignments(selectedUser.value.id);
  }
};

const loadAudits = async () => {
  auditLoading.value = true;
  errorMessage.value = null;
  try {
    const page = await listAuditLogs({ ...auditFilters.value, page: 1, pageSize: 50 });
    auditLogs.value = page.items;
    totalAuditLogs.value = page.total;
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '审计日志加载失败');
  } finally {
    auditLoading.value = false;
  }
};

const selectUser = async (user: AdminUser) => {
  selectedUser.value = user;
  selectedRoles.value = [...user.roles];
  activeTab.value = 'assignments';
  await loadAssignments(user.id);
};

const replaceUser = (user: AdminUser) => {
  users.value = users.value.map((item) => (item.id === user.id ? user : item));
  if (selectedUser.value?.id === user.id) {
    selectedUser.value = user;
    selectedRoles.value = [...user.roles];
  }
};

const handleUpdateStatus = async (user: AdminUser, status: UserStatus) => {
  operationMessage.value = null;
  errorMessage.value = null;
  try {
    const updated = await updateAdminUserStatus(user.id, status);
    replaceUser(updated);
    operationMessage.value = `${updated.name} 已${statusLabel(status)}`;
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '账号状态更新失败');
  }
};

const handleUnlock = async (user: AdminUser) => {
  operationMessage.value = null;
  errorMessage.value = null;
  try {
    const updated = await unlockAdminUser(user.id);
    replaceUser(updated);
    operationMessage.value = `${updated.name} 的临时锁定已解除`;
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '账号解锁失败');
  }
};

const handleRoleToggle = (role: RoleCode, checked: boolean) => {
  selectedRoles.value = checked
    ? Array.from(new Set([...selectedRoles.value, role]))
    : selectedRoles.value.filter((item) => item !== role);
};

const handleSaveRoles = async () => {
  if (!selectedUser.value) {
    return;
  }
  operationMessage.value = null;
  errorMessage.value = null;
  try {
    const updated = await updateAdminUserRoles(selectedUser.value.id, selectedRoles.value);
    replaceUser(updated);
    operationMessage.value = `${updated.name} 的角色已更新`;
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '角色保存失败');
  }
};

const handleUpsertAssignment = async () => {
  if (!selectedUser.value || !assignmentForm.value.classId) {
    errorMessage.value = '请选择用户并选择教学班';
    return;
  }
  operationMessage.value = null;
  errorMessage.value = null;
  try {
    await upsertUserClassAssignment(
      selectedUser.value.id,
      assignmentForm.value.classId,
      assignmentForm.value.assignmentRole,
    );
    operationMessage.value = `${selectedUser.value.name} 的班级授权已保存`;
    await loadAssignments(selectedUser.value.id);
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '班级授权保存失败');
  }
};

const handleDeleteAssignment = async (assignment: ClassAssignment) => {
  if (!selectedUser.value) {
    return;
  }
  operationMessage.value = null;
  errorMessage.value = null;
  try {
    await deleteUserClassAssignment(selectedUser.value.id, assignment.id);
    operationMessage.value = `${assignment.classId} 授权已移除`;
    await loadAssignments(selectedUser.value.id);
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '班级授权删除失败');
  }
};

onMounted(async () => {
  await Promise.all([loadClasses(), loadUsers(), loadAudits()]);
});
</script>

<template>
  <div class="page-shell admin-users-page">
    <PageHeader
      title="账号治理与安全审计"
      description="管理员统一治理教师、助教、学生账号状态、角色、班级授权，并追踪登录与治理审计日志。"
    >
      <template #actions>
        <AppActionButton data-testid="admin-users-refresh" :disabled="loading" @click="loadUsers">
          {{ loading ? '刷新中...' : '刷新账号' }}
        </AppActionButton>
        <AppActionButton
          variant="primary"
          data-testid="admin-audits-refresh-header"
          :disabled="auditLoading"
          @click="loadAudits"
        >
          {{ auditLoading ? '加载中...' : '刷新审计' }}
        </AppActionButton>
      </template>
    </PageHeader>

    <AdminGovernanceMetrics
      :total-users="totalUsers"
      :forced-change-count="forcedChangeCount"
      :locked-user-count="lockedUserCount"
      :disabled-user-count="disabledUserCount"
    />

    <p v-if="operationMessage" class="operation-notice operation-notice--success">
      {{ operationMessage }}
    </p>
    <p v-if="errorMessage" class="operation-notice operation-notice--danger">{{ errorMessage }}</p>

    <AdminGovernanceTabs v-model:active-tab="activeTab" />

    <AdminUserSection
      v-if="activeTab === 'users'"
      v-model:filters="userFilters"
      :users="users"
      :total-users="totalUsers"
      :loading="loading"
      :error-message="errorMessage"
      :role-options="ROLE_OPTIONS"
      :status-options="STATUS_OPTIONS"
      @query="loadUsers"
      @select="selectUser"
      @update-status="handleUpdateStatus"
      @unlock="handleUnlock"
    />

    <AdminAssignmentSection
      v-if="activeTab === 'assignments'"
      v-model:assignment-form="assignmentForm"
      :selected-user="selectedUser"
      :selected-roles="selectedRoles"
      :assignments="assignments"
      :classes="classes"
      :assignment-loading="assignmentLoading"
      @refresh="loadSelectedUserAssignments"
      @toggle-role="handleRoleToggle"
      @save-roles="handleSaveRoles"
      @upsert="handleUpsertAssignment"
      @delete="handleDeleteAssignment"
    />

    <AdminAuditSection
      v-if="activeTab === 'audits'"
      v-model:filters="auditFilters"
      :audit-logs="auditLogs"
      :total-audit-logs="totalAuditLogs"
      :audit-loading="auditLoading"
      @query="loadAudits"
    />
  </div>
</template>
