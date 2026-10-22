import { expect, test, type Page } from '@playwright/test';

async function loginAsTeacher(page: Page) {
  await page.goto('/auth/login');
  await page.locator('input[autocomplete="username"]').fill('teacher@mindmark.local');
  await page.locator('input[autocomplete="current-password"]').fill('dev-password');
  await page.locator('form.auth-login-form button[type="submit"]').click();
  await expect(page).toHaveURL(/\/teacher\/dashboard/);
  await expect(page.locator('.portal-layout')).toBeVisible();
}

test.describe('认证页关键交互验收', () => {
  test('退出登录需要二次确认，取消后仍停留在当前页面', async ({ page }) => {
    await loginAsTeacher(page);

    await page.getByRole('button', { name: '退出', exact: true }).click();
    await expect(page.getByText('确认退出登录？')).toBeVisible();
    await expect(page.getByText('退出后需要重新登录才能继续使用系统。')).toBeVisible();

    await page.getByRole('button', { name: '继续使用', exact: true }).click();
    await expect(page.locator('.portal-layout')).toBeVisible();
    await expect(page).toHaveURL(/\/teacher\/dashboard/);

    await page.getByRole('button', { name: '退出', exact: true }).click();
    await page.getByRole('button', { name: '退出登录', exact: true }).click();
    await expect(page).toHaveURL(/\/auth\/entry\/3e9a6c1f74b8d205a7c4f0e2/);
    await expect(page.locator('form.auth-login-form')).toBeVisible();
  });

  test('修改密码页面展示真实密码规则并拦截不合规密码', async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto('/auth/change-password');
    await expect(page.locator('.password-policy-card')).toBeVisible();
    await expect(page.locator('.password-policy-card')).toContainText('至少 8 个字符');
    await expect(page.locator('.password-policy-card')).toContainText('同时包含字母');
    await expect(page.locator('.password-policy-card')).toContainText('同时包含数字');
    await expect(page.locator('.password-policy-card')).toContainText('不能与当前密码相同');

    await page.locator('input[autocomplete="current-password"]').fill('dev-password');
    await page.locator('input[autocomplete="new-password"]').first().fill('abc');
    await page.locator('input[autocomplete="new-password"]').last().fill('abc');
    await page.getByRole('button', { name: '确认修改', exact: true }).click();

    await expect(page.locator('.operation-notice--danger')).toContainText(
      '新密码至少需要 8 个字符',
    );
    await expect(page).toHaveURL(/\/auth\/change-password/);
  });
});
