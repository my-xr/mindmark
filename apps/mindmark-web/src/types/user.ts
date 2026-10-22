export type RoleCode = 'ADMIN' | 'TEACHER' | 'TA' | 'STUDENT';

export type UserStatus = 'ACTIVE' | 'DISABLED';

export type PortalCode = 'teacher' | 'student' | 'admin' | 'auth' | 'error';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  roles: RoleCode[];
  status: UserStatus;
  studentId?: string;
  mustChangePassword?: boolean;
}
