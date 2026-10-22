<script setup lang="ts">
import AppActionButton from '@/components/common/AppActionButton.vue';
import ErrorState from '@/components/common/ErrorState.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import type { AdminUser, AssignmentRole, ClassAssignment } from '@/services/adminAccountService';
import type { TeachingClass } from '@/types/academic';
import type { RoleCode } from '@/types/user';
import {
  assignmentRoleLabel,
  ASSIGNMENT_ROLE_OPTIONS,
  formatDateTime,
  ROLE_OPTIONS,
  roleLabel,
  type AdminAssignmentForm,
} from '@/utils/adminGovernance';

defineProps<{
  selectedUser: AdminUser | null;
  selectedRoles: RoleCode[];
  assignmentForm: AdminAssignmentForm;
  assignments: ClassAssignment[];
  classes: TeachingClass[];
  assignmentLoading: boolean;
}>();

const emit = defineEmits<{
  refresh: [];
  'toggle-role': [role: RoleCode, checked: boolean];
  'save-roles': [];
  'update:assignment-form': [value: AdminAssignmentForm];
  upsert: [];
  delete: [assignment: ClassAssignment];
}>();

const updateForm = <Key extends keyof AdminAssignmentForm>(
  form: AdminAssignmentForm,
  key: Key,
  value: AdminAssignmentForm[Key],
) => {
  emit('update:assignment-form', { ...form, [key]: value });
};

const handleClassChange = (form: AdminAssignmentForm, event: Event) => {
  updateForm(form, 'classId', (event.target as HTMLSelectElement).value);
};

const handleAssignmentRoleChange = (form: AdminAssignmentForm, event: Event) => {
  updateForm(form, 'assignmentRole', (event.target as HTMLSelectElement).value as AssignmentRole);
};

const classLabel = (classes: TeachingClass[], classId: string) => {
  const teachingClass = classes.find((item) => item.id === classId);
  return teachingClass ? teachingClass.name + ' / ' + teachingClass.code : classId;
};
</script>

<template>
  <section class="content-card admin-section-card" data-testid="admin-assignments-section">
    <div class="section-title">
      <h2>教师 / 助教班级授权</h2>
      <AppActionButton
        data-testid="admin-assignments-refresh"
        :disabled="!selectedUser || assignmentLoading"
        @click="emit('refresh')"
      >
        刷新授权
      </AppActionButton>
    </div>

    <div v-if="selectedUser" class="assignment-layout">
      <aside class="assignment-user-card">
        <strong>{{ selectedUser.name }}</strong>
        <small>{{ selectedUser.id }}</small>
        <div class="tag-row">
          <StatusTag
            v-for="role in selectedUser.roles"
            :key="role"
            :label="roleLabel(role)"
            tone="info"
          />
        </div>
        <div class="role-editor">
          <label v-for="role in ROLE_OPTIONS" :key="role">
            <input
              data-testid="admin-role-checkbox"
              type="checkbox"
              :checked="selectedRoles.includes(role)"
              @change="emit('toggle-role', role, ($event.target as HTMLInputElement).checked)"
            />
            {{ roleLabel(role) }}
          </label>
          <AppActionButton
            variant="primary"
            data-testid="admin-save-roles"
            @click="emit('save-roles')"
          >
            Save roles
          </AppActionButton>
        </div>
      </aside>

      <div class="assignment-main">
        <div class="assignment-form">
          <label class="form-field">
            教学班
            <select
              data-testid="admin-assignment-class"
              :value="assignmentForm.classId"
              class="text-input"
              @change="handleClassChange(assignmentForm, $event)"
            >
              <option value="">请选择教学班</option>
              <option
                v-for="teachingClass in classes"
                :key="teachingClass.id"
                :value="teachingClass.id"
              >
                {{ teachingClass.name }} / {{ teachingClass.code }}
              </option>
            </select>
          </label>
          <label class="form-field">
            授权角色
            <select
              data-testid="admin-assignment-role"
              :value="assignmentForm.assignmentRole"
              class="text-input"
              @change="handleAssignmentRoleChange(assignmentForm, $event)"
            >
              <option v-for="role in ASSIGNMENT_ROLE_OPTIONS" :key="role" :value="role">
                {{ assignmentRoleLabel(role) }}
              </option>
            </select>
          </label>
          <AppActionButton
            variant="primary"
            data-testid="admin-assignment-save"
            @click="emit('upsert')"
          >
            Save assignment
          </AppActionButton>
        </div>

        <div class="assignment-table">
          <div class="assignment-row assignment-row--head">
            <span>班级 ID</span>
            <span>授权角色</span>
            <span>创建时间</span>
            <span>操作</span>
          </div>
          <div
            v-for="assignment in assignments"
            :key="assignment.id"
            class="assignment-row"
            data-testid="admin-assignment-row"
          >
            <span>{{ classLabel(classes, assignment.classId) }}</span>
            <span>
              <StatusTag
                :label="assignmentRoleLabel(assignment.assignmentRole)"
                :tone="assignment.assignmentRole === 'OWNER' ? 'success' : 'info'"
              />
            </span>
            <span>{{ formatDateTime(assignment.createdAt) }}</span>
            <span>
              <AppActionButton
                variant="danger"
                data-testid="admin-assignment-delete"
                @click="emit('delete', assignment)"
              >
                移除
              </AppActionButton>
            </span>
          </div>
          <div v-if="assignments.length === 0" class="admin-table-empty">
            当前用户暂无班级授权。
          </div>
        </div>
      </div>
    </div>
    <ErrorState
      v-else
      title="未选择用户"
      description="请先在用户账号列表选择需要授权的教师或助教账号。"
    />
  </section>
</template>
