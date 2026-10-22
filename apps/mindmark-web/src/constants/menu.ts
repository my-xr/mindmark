import type { PortalCode, RoleCode } from '@/types/user';

export interface AppMenuItem {
  key: string;
  label: string;
  icon?: string;
  path: string;
  portal: PortalCode;
  roles: RoleCode[];
}

export const TEACHER_MENU_ITEMS: AppMenuItem[] = [
  {
    key: 'dashboard',
    label: '教师工作台',
    icon: '🧭',
    path: '/teacher/dashboard',
    portal: 'teacher',
    roles: ['TEACHER', 'TA'],
  },
  {
    key: 'questions',
    label: '题库管理',
    icon: '📚',
    path: '/teacher/questions',
    portal: 'teacher',
    roles: ['TEACHER', 'TA'],
  },
  {
    key: 'ai-questions',
    label: 'AI 出题审核',
    icon: '✨',
    path: '/teacher/ai-questions',
    portal: 'teacher',
    roles: ['TEACHER', 'TA'],
  },
  {
    key: 'papers',
    label: '试卷与组卷',
    icon: '🧾',
    path: '/teacher/papers',
    portal: 'teacher',
    roles: ['TEACHER'],
  },
  {
    key: 'exams',
    label: '考试管理',
    icon: '⏱️',
    path: '/teacher/exams',
    portal: 'teacher',
    roles: ['TEACHER', 'TA'],
  },
  {
    key: 'students',
    label: '学生名单',
    icon: '👥',
    path: '/teacher/students',
    portal: 'teacher',
    roles: ['TEACHER', 'TA'],
  },
  {
    key: 'grading',
    label: '批改中心',
    icon: '✅',
    path: '/teacher/grading',
    portal: 'teacher',
    roles: ['TEACHER', 'TA'],
  },
  {
    key: 'scores',
    label: '成绩中心',
    icon: '📊',
    path: '/teacher/scores',
    portal: 'teacher',
    roles: ['TEACHER'],
  },
  {
    key: 'reviews',
    label: '复盘分析',
    icon: '🔎',
    path: '/teacher/reviews',
    portal: 'teacher',
    roles: ['TEACHER'],
  },
  {
    key: 'settings',
    label: '个人配置',
    icon: '⚙️',
    path: '/teacher/settings',
    portal: 'teacher',
    roles: ['TEACHER', 'TA'],
  },
];

export const STUDENT_MENU_ITEMS: AppMenuItem[] = [
  {
    key: 'student-exams',
    label: '考试中心',
    icon: '📝',
    path: '/student/exams',
    portal: 'student',
    roles: ['STUDENT'],
  },
  {
    key: 'student-scores',
    label: '成绩反馈',
    icon: '📈',
    path: '/student/scores',
    portal: 'student',
    roles: ['STUDENT'],
  },
];

export const ADMIN_MENU_ITEMS: AppMenuItem[] = [
  {
    key: 'admin-classes',
    label: '课程与班级',
    icon: '🏫',
    path: '/admin/classes',
    portal: 'admin',
    roles: ['ADMIN'],
  },
  {
    key: 'admin-users',
    label: '用户与角色',
    icon: '🛡️',
    path: '/admin/users',
    portal: 'admin',
    roles: ['ADMIN'],
  },
];
