const fs = require('fs');
let p = 'apps/mindmark-web/src/router/routes.ts';
let s = fs.readFileSync(p, 'utf8');
if (!s.includes("name: 'AdminClasses'")) {
  s = s.replace(`      {
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
      },`, `      {
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
      },`);
}
fs.writeFileSync(p, s, 'utf8');

p = 'apps/mindmark-web/src/constants/menu.ts';
s = fs.readFileSync(p, 'utf8');
if (!s.includes("key: 'admin-classes'")) {
  s = s.replace(`export const ADMIN_MENU_ITEMS: AppMenuItem[] = [
  {
    key: 'admin-users',`, `export const ADMIN_MENU_ITEMS: AppMenuItem[] = [
  {
    key: 'admin-classes',
    label: '课程与班级',
    path: '/admin/classes',
    portal: 'admin',
    roles: ['ADMIN'],
  },
  {
    key: 'admin-users',`);
}
fs.writeFileSync(p, s, 'utf8');
