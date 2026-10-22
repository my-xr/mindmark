import type { RoleCode } from '@/types/user';

const PORTAL_HOME: Record<RoleCode, string> = {
  ADMIN: '/admin/users',
  TEACHER: '/teacher/dashboard',
  TA: '/teacher/dashboard',
  STUDENT: '/student/exams',
};

const PORTAL_LOGIN = {
  admin: '/auth/entry/8b7f2d4c91e6a3f0c5d8b1e7',
  teacher: '/auth/entry/3e9a6c1f74b8d205a7c4f0e2',
  student: '/auth/entry/6d2c8a5f1b9e4d70c3a6f8e1',
} as const;

const PORTAL_PREFIX: Record<RoleCode, string> = {
  ADMIN: '/admin',
  TEACHER: '/teacher',
  TA: '/teacher',
  STUDENT: '/student',
};

export function getLoginPathForRoles(roles: RoleCode[] = []): string {
  if (roles.includes('ADMIN')) {
    return PORTAL_LOGIN.admin;
  }

  if (roles.includes('TEACHER') || roles.includes('TA')) {
    return PORTAL_LOGIN.teacher;
  }

  if (roles.includes('STUDENT')) {
    return PORTAL_LOGIN.student;
  }

  return PORTAL_LOGIN.teacher;
}

export function getLoginPathForTarget(targetPath: string): string {
  if (targetPath.startsWith('/admin')) {
    return PORTAL_LOGIN.admin;
  }

  if (targetPath.startsWith('/student')) {
    return PORTAL_LOGIN.student;
  }

  return PORTAL_LOGIN.teacher;
}

export function isLoginPath(path: string): boolean {
  return (
    path === '/auth/login' ||
    path === PORTAL_LOGIN.admin ||
    path === PORTAL_LOGIN.teacher ||
    path === PORTAL_LOGIN.student
  );
}

export function getRoleHomePath(roles: RoleCode[] = []): string {
  if (roles.includes('TEACHER') || roles.includes('TA')) {
    return PORTAL_HOME.TEACHER;
  }

  if (roles.includes('STUDENT')) {
    return PORTAL_HOME.STUDENT;
  }

  if (roles.includes('ADMIN')) {
    return PORTAL_HOME.ADMIN;
  }

  return PORTAL_LOGIN.teacher;
}

export function normalizePostAuthRedirect(candidate: unknown, roles: RoleCode[] = []): string {
  const fallback = getRoleHomePath(roles);
  if (typeof candidate !== 'string') {
    return fallback;
  }

  const redirect = candidate.trim();
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) {
    return fallback;
  }

  const pathOnly = redirect.split(/[?#]/, 1)[0] || '/';
  if (pathOnly.startsWith('/auth') || pathOnly.startsWith('/error')) {
    return fallback;
  }

  const allowedPrefixes = roles.map((role) => PORTAL_PREFIX[role]);
  const canAccessRedirect = allowedPrefixes.some(
    (prefix) => pathOnly === prefix || pathOnly.startsWith(`${prefix}/`),
  );

  return canAccessRedirect ? redirect : fallback;
}
