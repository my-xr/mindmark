import { expect, test } from '@playwright/test';

const teacherUsername = process.env.MINDMARK_TEACHER_USERNAME ?? 'teacher@mindmark.local';
const teacherPassword = process.env.MINDMARK_TEACHER_PASSWORD ?? 'dev-password';

test('AI Provider 连接失败时展示中文可操作提示且不泄露 Key', async ({ page }) => {
  await page.goto('/auth/login');
  await page.locator('input[autocomplete="username"]').fill(teacherUsername);
  await page.locator('input[autocomplete="current-password"]').fill(teacherPassword);
  await page.locator('form.auth-login-form button[type="submit"]').click();
  await expect(page).toHaveURL(/\/teacher\/dashboard/);

  await page.goto('/teacher/settings');
  await expect(page.locator('.provider-settings-card')).toBeVisible();

  await page.getByLabel('服务器地址 Base URL').fill('http://127.0.0.1:1/v1');
  await page.getByLabel('模型名称').fill('test-model');
  await page.getByLabel('API Key').fill('not-a-real-key');
  await page.getByRole('button', { name: '测试连接' }).click();

  const result = page.locator('.provider-test-result--danger');
  await expect(result).toBeVisible({ timeout: 20_000 });
  await expect(result).toContainText('AI 服务请求失败');
  await expect(result).not.toContainText(
    /AI provider request failed|Internal server error|not-a-real-key/i,
  );
});
