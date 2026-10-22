import { expect, test } from '@playwright/test';

test.describe('三类登录入口', () => {
  test('管理员、教师、学生使用独立登录页面', async ({ page }) => {
    const portals = [
      {
        path: '/auth/entry/8b7f2d4c91e6a3f0c5d8b1e7',
        heading: '进入系统管理后台',
        label: '管理员账号',
      },
      {
        path: '/auth/entry/3e9a6c1f74b8d205a7c4f0e2',
        heading: '进入教师工作台',
        label: '教师账号',
      },
      {
        path: '/auth/entry/6d2c8a5f1b9e4d70c3a6f8e1',
        heading: '进入学生考试中心',
        label: '学号 / 学生账号',
      },
    ];

    for (const portal of portals) {
      await page.goto(portal.path);
      await expect(page).toHaveURL(new RegExp(`${portal.path}$`));
      await expect(page.getByRole('heading', { name: portal.heading })).toBeVisible();
      await expect(page.getByText(portal.label, { exact: true })).toBeVisible();
      await expect(page.locator('.auth-portal-switcher')).toHaveCount(0);
      await expect(page.getByRole('button', { name: new RegExp(`登录`) })).toBeVisible();
    }
  });

  test('旧登录地址兼容跳转到教师登录页', async ({ page }) => {
    await page.goto('/auth/login');

    await expect(page).toHaveURL(/\/auth\/entry\/3e9a6c1f74b8d205a7c4f0e2$/);
    await expect(page.getByRole('heading', { name: '进入教师工作台' })).toBeVisible();
  });

  test('未登录访问不同业务端跳转到对应登录页', async ({ page }) => {
    const targets = [
      {
        path: '/admin/users',
        loginPath: '/auth/entry/8b7f2d4c91e6a3f0c5d8b1e7',
      },
      {
        path: '/teacher/dashboard',
        loginPath: '/auth/entry/3e9a6c1f74b8d205a7c4f0e2',
      },
      {
        path: '/student/exams',
        loginPath: '/auth/entry/6d2c8a5f1b9e4d70c3a6f8e1',
      },
    ];

    for (const target of targets) {
      await page.goto(target.path);
      await expect(page).toHaveURL(new RegExp(`${target.loginPath}\\?redirect=`));
    }
  });
});
