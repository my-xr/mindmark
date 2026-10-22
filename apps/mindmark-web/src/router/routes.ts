import type { RouteRecordRaw } from 'vue-router';

import { getLoginPathForTarget } from '@/app/authRedirect';

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/teacher/dashboard',
  },
  {
    path: '/auth',
    component: () => import('@/layouts/BlankLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'Login',
        redirect: (to) => ({
          path: getLoginPathForTarget(
            typeof to.query.redirect === 'string' ? to.query.redirect : '/teacher',
          ),
          query: to.query,
        }),
        meta: { title: '登录', portal: 'auth' },
      },
      {
        path: 'entry/8b7f2d4c91e6a3f0c5d8b1e7',
        name: 'AdminLogin',
        component: () => import('@/views/auth/AdminLoginView.vue'),
        meta: { title: '管理员登录', portal: 'auth' },
      },
      {
        path: 'entry/3e9a6c1f74b8d205a7c4f0e2',
        name: 'TeacherLogin',
        component: () => import('@/views/auth/TeacherLoginView.vue'),
        meta: { title: '教师登录', portal: 'auth' },
      },
      {
        path: 'entry/6d2c8a5f1b9e4d70c3a6f8e1',
        name: 'StudentLogin',
        component: () => import('@/views/auth/StudentLoginView.vue'),
        meta: { title: '学生登录', portal: 'auth' },
      },
      {
        path: 'change-password',
        name: 'ChangePassword',
        component: () => import('@/views/auth/ChangePasswordView.vue'),
        meta: { title: '首次修改密码', portal: 'auth', requiresAuth: true },
      },
    ],
  },
  {
    path: '/teacher',
    component: () => import('@/layouts/TeacherLayout.vue'),
    meta: { title: '教师端', portal: 'teacher', requiresAuth: true, roles: ['TEACHER', 'TA'] },
    children: [
      {
        path: 'dashboard',
        name: 'TeacherDashboard',
        component: () => import('@/views/teacher/DashboardView.vue'),
        meta: {
          title: '教师工作台',
          portal: 'teacher',
          requiresAuth: true,
          roles: ['TEACHER', 'TA'],
          menuKey: 'dashboard',
        },
      },
      {
        path: 'questions',
        name: 'QuestionBank',
        component: () => import('@/views/teacher/QuestionBankView.vue'),
        meta: {
          title: '题库管理',
          portal: 'teacher',
          requiresAuth: true,
          roles: ['TEACHER', 'TA'],
          menuKey: 'questions',
        },
      },
      {
        path: 'ai-questions',
        name: 'AiQuestions',
        component: () => import('@/views/teacher/AiQuestionsView.vue'),
        meta: {
          title: 'AI 出题审核',
          portal: 'teacher',
          requiresAuth: true,
          roles: ['TEACHER', 'TA'],
          menuKey: 'ai-questions',
        },
      },
      {
        path: 'papers',
        name: 'Papers',
        component: () => import('@/views/teacher/PapersView.vue'),
        meta: {
          title: '试卷与组卷',
          portal: 'teacher',
          requiresAuth: true,
          roles: ['TEACHER'],
          menuKey: 'papers',
        },
      },
      {
        path: 'papers/:paperId',
        name: 'PaperEditor',
        component: () => import('@/views/teacher/PapersView.vue'),
        meta: {
          title: '试卷编辑',
          portal: 'teacher',
          requiresAuth: true,
          roles: ['TEACHER'],
          menuKey: 'papers',
        },
      },
      {
        path: 'exams',
        name: 'Exams',
        component: () => import('@/views/teacher/ExamsView.vue'),
        meta: {
          title: '考试管理',
          portal: 'teacher',
          requiresAuth: true,
          roles: ['TEACHER', 'TA'],
          menuKey: 'exams',
        },
      },
      {
        path: 'students',
        name: 'StudentRoster',
        component: () => import('@/views/teacher/StudentRosterView.vue'),
        meta: {
          title: '学生名单与账号',
          portal: 'teacher',
          requiresAuth: true,
          roles: ['TEACHER', 'TA'],
          menuKey: 'students',
        },
      },
      {
        path: 'grading',
        name: 'Grading',
        component: () => import('@/views/teacher/GradingView.vue'),
        meta: {
          title: '批改中心',
          portal: 'teacher',
          requiresAuth: true,
          roles: ['TEACHER', 'TA'],
          menuKey: 'grading',
        },
      },
      {
        path: 'scores',
        name: 'Scores',
        component: () => import('@/views/teacher/ScoresView.vue'),
        meta: {
          title: '成绩中心',
          portal: 'teacher',
          requiresAuth: true,
          roles: ['TEACHER'],
          menuKey: 'scores',
        },
      },
      {
        path: 'reviews',
        name: 'Reviews',
        component: () => import('@/views/teacher/ReviewsView.vue'),
        meta: {
          title: '复盘分析',
          portal: 'teacher',
          requiresAuth: true,
          roles: ['TEACHER'],
          menuKey: 'reviews',
        },
      },
      {
        path: 'settings',
        name: 'TeacherSettings',
        component: () => import('@/views/teacher/TeacherSettingsView.vue'),
        meta: {
          title: '个人配置',
          portal: 'teacher',
          requiresAuth: true,
          roles: ['TEACHER', 'TA'],
          menuKey: 'settings',
        },
      },
    ],
  },
  {
    path: '/student',
    component: () => import('@/layouts/StudentLayout.vue'),
    meta: { title: '学生端', portal: 'student', requiresAuth: true, roles: ['STUDENT'] },
    children: [
      {
        path: 'exams',
        name: 'StudentExams',
        component: () => import('@/views/student/StudentExamsView.vue'),
        meta: {
          title: '学生考试中心',
          portal: 'student',
          requiresAuth: true,
          roles: ['STUDENT'],
          menuKey: 'student-exams',
        },
      },
      {
        path: 'exams/:id/notice',
        name: 'ExamNotice',
        component: () => import('@/views/student/ExamNoticeView.vue'),
        meta: { title: '考试须知', portal: 'student', requiresAuth: true, roles: ['STUDENT'] },
      },
      {
        path: 'exams/:id/take',
        name: 'ExamTaking',
        component: () => import('@/views/student/ExamTakingView.vue'),
        meta: { title: '在线答题', portal: 'student', requiresAuth: true, roles: ['STUDENT'] },
      },
      {
        path: 'scores',
        name: 'StudentScores',
        component: () => import('@/views/student/StudentScoresView.vue'),
        meta: {
          title: '成绩反馈',
          portal: 'student',
          requiresAuth: true,
          roles: ['STUDENT'],
          menuKey: 'student-scores',
        },
      },
    ],
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { title: '管理后台', portal: 'admin', requiresAuth: true, roles: ['ADMIN'] },
    children: [
      {
        path: 'classes',
        name: 'AdminClasses',
        component: () => import('@/views/admin/ClassesView.vue'),
        meta: {
          title: '课程与班级',
          portal: 'admin',
          requiresAuth: true,
          roles: ['ADMIN'],
          menuKey: 'admin-classes',
        },
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/UsersView.vue'),
        meta: {
          title: '用户与角色',
          portal: 'admin',
          requiresAuth: true,
          roles: ['ADMIN'],
          menuKey: 'admin-users',
        },
      },
    ],
  },
  {
    path: '/error',
    component: () => import('@/layouts/BlankLayout.vue'),
    children: [
      {
        path: '403',
        name: 'Forbidden',
        component: () => import('@/views/error/ForbiddenView.vue'),
        meta: { title: '无权限', portal: 'error' },
      },
      {
        path: '404',
        name: 'NotFound',
        component: () => import('@/views/error/NotFoundView.vue'),
        meta: { title: '页面不存在', portal: 'error' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/error/404',
  },
];
