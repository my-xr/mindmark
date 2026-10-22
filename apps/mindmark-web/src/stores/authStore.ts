import { defineStore } from 'pinia';

import { mockCurrentUser } from '@/mock/currentUserMock';
import { useMockApi } from '@/services/api/httpClient';
import { clearAuthToken, readAuthToken, writeAuthToken } from '@/services/authStorage';
import { getErrorMessage } from '@/utils/errorMessage';
import {
  changePassword as requestChangePassword,
  getCurrentUser,
  login as requestLogin,
  logout as requestLogout,
} from '@/services/authService';
import type { CurrentUser, RoleCode } from '@/types/user';

interface AuthState {
  currentUser: CurrentUser | null;
  token: string | null;
  bootstrapped: boolean;
  bootstrapError: string | null;
  loginError: string | null;
  changePasswordError: string | null;
  loggingIn: boolean;
  changingPassword: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => {
    const initialToken = useMockApi ? 'mock-token' : readAuthToken();

    return {
      currentUser: useMockApi ? mockCurrentUser : null,
      token: initialToken,
      bootstrapped: useMockApi,
      bootstrapError: null,
      loginError: null,
      changePasswordError: null,
      loggingIn: false,
      changingPassword: false,
    };
  },
  getters: {
    isAuthenticated: (state) => Boolean(state.currentUser && state.token),
    roleCodes: (state): RoleCode[] => state.currentUser?.roles ?? [],
    studentId: (state): string => state.currentUser?.studentId ?? '',
    mustChangePassword: (state): boolean => Boolean(state.currentUser?.mustChangePassword),
  },
  actions: {
    async bootstrap() {
      if (this.bootstrapped) {
        return;
      }

      if (!this.token) {
        this.currentUser = null;
        this.bootstrapError = null;
        this.bootstrapped = true;
        return;
      }

      try {
        this.currentUser = await getCurrentUser();
        this.bootstrapError = null;
      } catch (error) {
        this.currentUser = null;
        this.token = null;
        clearAuthToken();
        this.bootstrapError = getErrorMessage(error, '获取当前用户失败，请重新登录。');
      } finally {
        this.bootstrapped = true;
      }
    },
    async login(username: string, password: string) {
      this.loggingIn = true;
      this.loginError = null;

      try {
        const result = await requestLogin({ username, password });
        this.currentUser = {
          ...result.user,
          mustChangePassword: result.mustChangePassword,
        };
        this.token = result.token;
        this.bootstrapped = true;
        writeAuthToken(result.token);
      } catch (error) {
        this.currentUser = null;
        this.token = null;
        clearAuthToken();
        this.loginError = getErrorMessage(error, '登录失败，请稍后重试。');
        throw error;
      } finally {
        this.loggingIn = false;
      }
    },
    async changePassword(oldPassword: string, newPassword: string) {
      this.changingPassword = true;
      this.changePasswordError = null;
      try {
        const result = await requestChangePassword(oldPassword, newPassword);
        if (this.currentUser) {
          this.currentUser = {
            ...this.currentUser,
            mustChangePassword: false,
          };
        }
        if (result.requiresRelogin) {
          this.clearSession();
        }
      } catch (error) {
        this.changePasswordError = getErrorMessage(error, '修改密码失败，请稍后重试。');
        throw error;
      } finally {
        this.changingPassword = false;
      }
    },
    clearSession() {
      this.currentUser = null;
      this.token = null;
      this.bootstrapped = true;
      clearAuthToken();
    },
    hasAnyRole(roles?: RoleCode[]) {
      if (!roles || roles.length === 0) {
        return true;
      }

      return roles.some((role) => this.roleCodes.includes(role));
    },
    async logout() {
      try {
        await requestLogout();
      } finally {
        this.clearSession();
      }
    },
  },
});
