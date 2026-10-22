const fs=require('fs');
let p='apps/mindmark-web/src/router/routes.ts'; let s=fs.readFileSync(p,'utf8');
s=s.replace(`      {
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
      },`, `      {
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
      },`);
fs.writeFileSync(p,s,'utf8');
p='apps/mindmark-web/src/constants/menu.ts'; s=fs.readFileSync(p,'utf8');
s=s.replace(`  {
    key: 'reviews',
    label: '复盘分析',
    icon: '🔎',
    path: '/teacher/reviews',
    portal: 'teacher',
    roles: ['TEACHER'],
  },`, `  {
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
  },`);
fs.writeFileSync(p,s,'utf8');
