import { mockCurrentUser } from '@/mock/currentUserMock';
import { apiGet, apiPost, useMockApi } from '@/services/api/httpClient';
import type { CurrentUser, RoleCode, UserStatus } from '@/types/user';

export interface LoginCredentials {
  username: string;
  password: string;
  userId?: string;
}

interface CurrentUserResponse {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  roles: RoleCode[];
  status: UserStatus;
  studentId?: string | null;
  mustChangePassword?: boolean;
}

interface LoginResponse {
  token: string;
  user: CurrentUserResponse;
  mustChangePassword: boolean;
}

interface LogoutResponse {
  success: boolean;
}

interface ChangePasswordResponse {
  success: boolean;
  mustChangePassword: boolean;
  requiresRelogin: boolean;
}

const normalizeCurrentUser = (response: CurrentUserResponse): CurrentUser => {
  const user: CurrentUser = {
    id: response.id,
    name: response.name,
    email: response.email,
    roles: response.roles,
    status: response.status,
    mustChangePassword: Boolean(response.mustChangePassword),
  };

  if (response.username) {
    user.username = response.username;
  }

  if (response.studentId) {
    user.studentId = response.studentId;
  }

  return user;
};

export async function login(
  credentials: LoginCredentials,
): Promise<{ token: string; user: CurrentUser; mustChangePassword: boolean }> {
  if (!useMockApi) {
    const response = await apiPost<LoginResponse, LoginCredentials>('/v1/auth/login', credentials);
    return {
      token: response.token,
      user: normalizeCurrentUser(response.user),
      mustChangePassword: response.mustChangePassword,
    };
  }

  return Promise.resolve({ token: 'mock-token', user: mockCurrentUser, mustChangePassword: false });
}

export async function changePassword(
  oldPassword: string,
  newPassword: string,
): Promise<{ success: boolean; requiresRelogin: boolean }> {
  if (!useMockApi) {
    const response = await apiPost<
      ChangePasswordResponse,
      { oldPassword: string; newPassword: string }
    >('/v1/auth/change-password', { oldPassword, newPassword });
    return {
      success: response.success,
      requiresRelogin: response.requiresRelogin,
    };
  }

  return Promise.resolve({ success: true, requiresRelogin: false });
}

export async function logout(): Promise<boolean> {
  if (!useMockApi) {
    const response = await apiPost<LogoutResponse>('/v1/auth/logout');
    return response.success;
  }

  return Promise.resolve(true);
}

export async function getCurrentUser(): Promise<CurrentUser> {
  if (!useMockApi) {
    return normalizeCurrentUser(await apiGet<CurrentUserResponse>('/v1/auth/me'));
  }

  return Promise.resolve(mockCurrentUser);
}
