import type { CurrentUser } from '@/types/user';

export const mockCurrentUser: CurrentUser = {
  id: 'u-teacher-001',
  name: '丁老师',
  email: 'teacher@mindmark.local',
  roles: ['TEACHER', 'TA', 'ADMIN', 'STUDENT'],
  status: 'ACTIVE',
};
