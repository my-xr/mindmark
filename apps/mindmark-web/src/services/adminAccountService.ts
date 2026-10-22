import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
  useMockApi,
} from '@/services/api/httpClient';
import type { PageResponse } from '@/services/api/httpClient';
import type { RoleCode, UserStatus } from '@/types/user';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  username: string;
  roles: RoleCode[];
  status: UserStatus;
  mustChangePassword: boolean;
  failedLoginCount: number;
  lockedUntil?: string | null;
  accountSource: string;
  studentId?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserQuery {
  keyword?: string;
  role?: RoleCode | '';
  status?: UserStatus | '';
  page?: number;
  pageSize?: number;
}

export type AssignmentRole = 'OWNER' | 'ASSISTANT';

export interface ClassAssignment {
  id: string;
  userId: string;
  classId: string;
  assignmentRole: AssignmentRole;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  targetUserId?: string | null;
  result: string;
  detail?: string | null;
  createdAt: string;
}

export interface AuditLogQuery {
  actorId?: string;
  targetUserId?: string;
  action?: string;
  result?: string;
  page?: number;
  pageSize?: number;
}

const now = new Date().toISOString();

const mockUsers: AdminUser[] = [
  {
    id: 'u-teacher-001',
    name: 'MindMark Demo Teacher',
    email: 'teacher@mindmark.local',
    username: 'teacher@mindmark.local',
    roles: ['ADMIN', 'TEACHER', 'TA', 'STUDENT'],
    status: 'ACTIVE',
    mustChangePassword: false,
    failedLoginCount: 0,
    lockedUntil: null,
    accountSource: 'SYSTEM_SEED',
    studentId: null,
    lastLoginAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'u-student-001',
    name: 'MindMark Demo Student',
    email: 'student001@mindmark.local',
    username: '202601345678',
    roles: ['STUDENT'],
    status: 'ACTIVE',
    mustChangePassword: true,
    failedLoginCount: 1,
    lockedUntil: null,
    accountSource: 'SYSTEM_SEED',
    studentId: 'student-001',
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  },
];

let mockAssignments: ClassAssignment[] = [
  {
    id: 'tca-demo-teacher-class-demo-001',
    userId: 'u-teacher-001',
    classId: 'class-demo-001',
    assignmentRole: 'OWNER',
    createdAt: now,
  },
];

let mockAuditLogs: AuditLog[] = [
  {
    id: 'audit-demo-001',
    actorId: 'u-teacher-001',
    action: 'LOGIN',
    targetUserId: 'u-teacher-001',
    result: 'SUCCESS',
    detail: 'Sa-Token login success',
    createdAt: now,
  },
  {
    id: 'audit-demo-002',
    actorId: 'u-teacher-001',
    action: 'ADMIN_UPSERT_CLASS_ASSIGNMENT',
    targetUserId: 'u-teacher-001',
    result: 'SUCCESS',
    detail: 'classId=class-demo-001, role null -> OWNER',
    createdAt: now,
  },
];

export async function listAdminUsers(query: AdminUserQuery): Promise<PageResponse<AdminUser>> {
  if (!useMockApi) {
    return apiGet<PageResponse<AdminUser>>('/v1/admin/users', cleanQuery(query));
  }

  const keyword = query.keyword?.trim().toLowerCase();
  const filtered = mockUsers.filter((user) => {
    const keywordMatched = keyword
      ? [user.id, user.name, user.email, user.username].some((value) =>
          value.toLowerCase().includes(keyword),
        )
      : true;
    const roleMatched = query.role ? user.roles.includes(query.role) : true;
    const statusMatched = query.status ? user.status === query.status : true;
    return keywordMatched && roleMatched && statusMatched;
  });

  return Promise.resolve({
    items: filtered,
    total: filtered.length,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 20,
  });
}

export async function updateAdminUserStatus(
  userId: string,
  status: UserStatus,
): Promise<AdminUser> {
  if (!useMockApi) {
    return apiPatch<AdminUser, { status: UserStatus }>(`/v1/admin/users/${userId}/status`, {
      status,
    });
  }

  const updated = updateMockUser(userId, { status, lockedUntil: null, failedLoginCount: 0 });
  appendMockAudit('ADMIN_UPDATE_USER_STATUS', userId, 'SUCCESS', `status -> ${status}`);
  return Promise.resolve(updated);
}

export async function updateAdminUserRoles(userId: string, roles: RoleCode[]): Promise<AdminUser> {
  if (!useMockApi) {
    return apiPut<AdminUser, { roles: RoleCode[] }>(`/v1/admin/users/${userId}/roles`, { roles });
  }

  const updated = updateMockUser(userId, { roles: [...roles] });
  appendMockAudit('ADMIN_UPDATE_USER_ROLES', userId, 'SUCCESS', `roles -> ${roles.join(',')}`);
  return Promise.resolve(updated);
}

export async function unlockAdminUser(userId: string): Promise<AdminUser> {
  if (!useMockApi) {
    return apiPost<AdminUser>(`/v1/admin/users/${userId}/unlock`);
  }

  const updated = updateMockUser(userId, { failedLoginCount: 0, lockedUntil: null });
  appendMockAudit('ADMIN_UNLOCK_USER', userId, 'SUCCESS', 'failed login counter cleared');
  return Promise.resolve(updated);
}

export async function listUserClassAssignments(userId: string): Promise<ClassAssignment[]> {
  if (!useMockApi) {
    return apiGet<ClassAssignment[]>(`/v1/admin/users/${userId}/class-assignments`);
  }

  return Promise.resolve(mockAssignments.filter((assignment) => assignment.userId === userId));
}

export async function upsertUserClassAssignment(
  userId: string,
  classId: string,
  assignmentRole: AssignmentRole,
): Promise<ClassAssignment> {
  if (!useMockApi) {
    return apiPost<ClassAssignment, { classId: string; assignmentRole: AssignmentRole }>(
      `/v1/admin/users/${userId}/class-assignments`,
      { classId, assignmentRole },
    );
  }

  const existing = mockAssignments.find(
    (assignment) => assignment.userId === userId && assignment.classId === classId,
  );
  if (existing) {
    existing.assignmentRole = assignmentRole;
    appendMockAudit('ADMIN_UPSERT_CLASS_ASSIGNMENT', userId, 'SUCCESS', classId);
    return Promise.resolve({ ...existing });
  }

  const created: ClassAssignment = {
    id: `tca-mock-${Date.now()}`,
    userId,
    classId,
    assignmentRole,
    createdAt: new Date().toISOString(),
  };
  mockAssignments = [created, ...mockAssignments];
  appendMockAudit('ADMIN_UPSERT_CLASS_ASSIGNMENT', userId, 'SUCCESS', classId);
  return Promise.resolve(created);
}

export async function deleteUserClassAssignment(
  userId: string,
  assignmentId: string,
): Promise<boolean> {
  if (!useMockApi) {
    return apiDelete<boolean>(`/v1/admin/users/${userId}/class-assignments/${assignmentId}`);
  }

  mockAssignments = mockAssignments.filter((assignment) => assignment.id !== assignmentId);
  appendMockAudit('ADMIN_DELETE_CLASS_ASSIGNMENT', userId, 'SUCCESS', assignmentId);
  return Promise.resolve(true);
}

export async function listAuditLogs(query: AuditLogQuery): Promise<PageResponse<AuditLog>> {
  if (!useMockApi) {
    return apiGet<PageResponse<AuditLog>>('/v1/admin/audit-logs', cleanQuery(query));
  }

  const filtered = mockAuditLogs.filter((log) => {
    const actorMatched = query.actorId ? log.actorId.includes(query.actorId) : true;
    const targetMatched = query.targetUserId
      ? (log.targetUserId ?? '').includes(query.targetUserId)
      : true;
    const actionMatched = query.action
      ? log.action.toLowerCase().includes(query.action.toLowerCase())
      : true;
    const resultMatched = query.result ? log.result === query.result : true;
    return actorMatched && targetMatched && actionMatched && resultMatched;
  });

  return Promise.resolve({
    items: filtered,
    total: filtered.length,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 20,
  });
}

function updateMockUser(userId: string, patch: Partial<AdminUser>) {
  const user = mockUsers.find((item) => item.id === userId);
  if (!user) {
    throw new Error('User not found');
  }
  Object.assign(user, patch, { updatedAt: new Date().toISOString() });
  return { ...user, roles: [...user.roles] };
}

function appendMockAudit(action: string, targetUserId: string, result: string, detail: string) {
  mockAuditLogs = [
    {
      id: `audit-mock-${Date.now()}`,
      actorId: 'u-teacher-001',
      action,
      targetUserId,
      result,
      detail,
      createdAt: new Date().toISOString(),
    },
    ...mockAuditLogs,
  ];
}

function cleanQuery(query: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(query).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  );
}
