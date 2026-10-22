import type { AssignmentRole } from '@/services/adminAccountService';
import type { RoleCode, UserStatus } from '@/types/user';

export type AdminTab = 'users' | 'assignments' | 'audits';

export interface AdminUserFilters {
  keyword: string;
  role: RoleCode | '';
  status: UserStatus | '';
}

export interface AdminAuditFilters {
  actorId: string;
  targetUserId: string;
  action: string;
  result: string;
}

export interface AdminAssignmentForm {
  classId: string;
  assignmentRole: AssignmentRole;
}

export const ROLE_OPTIONS: RoleCode[] = ['ADMIN', 'TEACHER', 'TA', 'STUDENT'];
export const STATUS_OPTIONS: UserStatus[] = ['ACTIVE', 'DISABLED'];
export const ASSIGNMENT_ROLE_OPTIONS: AssignmentRole[] = ['OWNER', 'ASSISTANT'];

export const roleLabel = (role: RoleCode) =>
  ({ ADMIN: '管理员', TEACHER: '教师', TA: '助教', STUDENT: '学生' })[role];

export const statusLabel = (status: UserStatus) => (status === 'ACTIVE' ? '启用' : '禁用');

export const assignmentRoleLabel = (role: AssignmentRole) =>
  role === 'OWNER' ? '主讲/负责人' : '助教/协同';

export const formatDateTime = (value?: string | null) => {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
};
