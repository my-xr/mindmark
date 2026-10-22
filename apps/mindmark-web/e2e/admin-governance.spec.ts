import { expect, test, type Page } from '@playwright/test';

const adminUsername = process.env.MINDMARK_ADMIN_USERNAME ?? 'teacher@mindmark.local';
const adminPassword = process.env.MINDMARK_ADMIN_PASSWORD ?? 'dev-password';

type RuntimeIssue = { type: 'pageerror' | 'console.error' | 'api'; message: string };

async function installRuntimeGuards(page: Page, issues: RuntimeIssue[]) {
  page.on('pageerror', (error) => issues.push({ type: 'pageerror', message: error.message }));
  page.on('console', (message) => {
    if (message.type() !== 'error') {
      return;
    }
    const text = message.text();
    if (
      /favicon|ResizeObserver loop|net::ERR_ABORTED|Failed to load resource: the server responded with a status of 404/i.test(
        text,
      )
    ) {
      return;
    }
    issues.push({ type: 'console.error', message: text });
  });
  page.on('response', (response) => {
    if (response.url().includes('/api/') && response.status() >= 500) {
      issues.push({ type: 'api', message: `${response.status()} ${response.url()}` });
    }
  });
}

async function loginAsAdmin(page: Page) {
  await page.goto('/auth/login');
  await page.locator('input[autocomplete="username"]').fill(adminUsername);
  await page.locator('input[autocomplete="current-password"]').fill(adminPassword);
  await page.locator('form.auth-login-form button[type="submit"]').click();
  await expect(page).toHaveURL(/\/(teacher|admin)\//);
  await expect(page.locator('.portal-layout')).toBeVisible();
}

async function waitForAdminReady(page: Page) {
  await expect(page.locator('.portal-layout')).toBeVisible();
  await expect(page.locator('.portal-content')).toBeVisible();
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
  await expect(page.locator('.state-card--error')).toHaveCount(0);
  await expect(page.locator('.portal-content')).not.toContainText(
    /MM-\d{3}-\d{3}|Internal server error|Unhandled/i,
  );
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 4,
  );
  expect(overflow, `${label} should not create body-level horizontal overflow`).toBe(false);
}

async function visibleActionAudit(page: Page) {
  return page.locator('.portal-content button, .portal-content a').evaluateAll((nodes) =>
    nodes
      .filter((node) => {
        const element = node as HTMLElement;
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.visibility !== 'hidden' &&
          style.display !== 'none'
        );
      })
      .map((node) => {
        const element = node as HTMLElement;
        return {
          text: element.innerText.trim(),
          ariaLabel: element.getAttribute('aria-label') ?? '',
          title: element.getAttribute('title') ?? '',
          disabled:
            (element as HTMLButtonElement).disabled ||
            element.getAttribute('aria-disabled') === 'true',
        };
      }),
  );
}

async function createCourseAndClassFromAdminPage(page: Page, runId: string) {
  const courseCode = `E2E-ADM-${runId}`;
  const courseName = `Admin Acceptance Course ${runId}`;
  const classCode = `E2E-ADM-CLS-${runId}`;
  const className = `Admin Acceptance Class ${runId}`;

  await page.goto('/admin/classes');
  await waitForAdminReady(page);

  await page.getByTestId('admin-course-code').fill(courseCode);
  await page.getByTestId('admin-course-name').fill(courseName);
  await page.getByTestId('admin-course-description').fill('Created by admin E2E acceptance.');
  await page.getByTestId('admin-course-status').selectOption('ACTIVE');
  await page.getByTestId('admin-course-submit').click();

  const courseRow = page.getByTestId('admin-course-row').filter({ hasText: courseCode }).first();
  await expect(courseRow).toBeVisible({ timeout: 15_000 });

  const courseOption = page
    .getByTestId('admin-class-course')
    .locator('option')
    .filter({ hasText: courseCode })
    .first();
  await expect(courseOption).toHaveCount(1, { timeout: 10_000 });
  const courseId = await courseOption.getAttribute('value');
  expect(courseId, 'created course should be available in class course select').toBeTruthy();

  await page.getByTestId('admin-class-course').selectOption(courseId!);
  await page.getByTestId('admin-class-code').fill(classCode);
  await page.getByTestId('admin-class-name').fill(className);
  await page.getByTestId('admin-class-grade').fill('2026');
  await page.getByTestId('admin-class-major').fill('Software Engineering');
  await page.getByTestId('admin-class-status').selectOption('ACTIVE');
  await page.getByTestId('admin-class-submit').click();

  const classRow = page.getByTestId('admin-class-row').filter({ hasText: classCode }).first();
  await expect(classRow).toBeVisible({ timeout: 15_000 });

  return { courseCode, courseName, classCode, className, courseId };
}

test.describe('admin portal E2E acceptance', () => {
  let issues: RuntimeIssue[];

  test.beforeEach(async ({ page }) => {
    issues = [];
    await installRuntimeGuards(page, issues);
    await loginAsAdmin(page);
  });

  test.afterEach(async () => {
    expect(issues).toEqual([]);
  });

  test('admin routing, navigation and layout are stable', async ({ page }) => {
    await page.goto('/admin/classes');
    await waitForAdminReady(page);
    await expect(page.locator('.portal-menu-item.active')).toHaveCount(1);
    await expect(page.getByTestId('admin-classes-refresh')).toBeVisible();
    await expectNoHorizontalOverflow(page, 'admin classes page');

    const toggle = page.locator('.sidebar-toggle-button');
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.locator('.portal-layout')).toBeVisible();
    await toggle.click();

    await page.goto('/admin/users');
    await waitForAdminReady(page);
    await expect(page.getByTestId('admin-tab-users')).toBeVisible();
    await expect(page.getByTestId('admin-tab-assignments')).toBeVisible();
    await expect(page.getByTestId('admin-tab-audits')).toBeVisible();
    await expectNoHorizontalOverflow(page, 'admin users page');
  });

  test('course and teaching class management can create and edit records', async ({ page }) => {
    const runId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const { courseCode, classCode } = await createCourseAndClassFromAdminPage(page, runId);

    const courseRow = page.getByTestId('admin-course-row').filter({ hasText: courseCode }).first();
    await courseRow.getByTestId('admin-course-edit').click();
    await page.getByTestId('admin-course-name').fill(`Admin Acceptance Course Updated ${runId}`);
    await page.getByTestId('admin-course-submit').click();
    await expect(courseRow).toContainText(`Updated ${runId}`, { timeout: 15_000 });

    const classRow = page.getByTestId('admin-class-row').filter({ hasText: classCode }).first();
    await classRow.getByTestId('admin-class-edit').click();
    await page.getByTestId('admin-class-major').fill('Computer Science');
    await page.getByTestId('admin-class-submit').click();
    await expect(classRow).toContainText('Computer Science', { timeout: 15_000 });

    await expectNoHorizontalOverflow(page, 'admin classes after edit');
  });

  test('user governance, role save, class assignment and audit query are usable', async ({
    page,
  }) => {
    const runId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const { classCode } = await createCourseAndClassFromAdminPage(page, runId);

    await page.goto('/admin/users');
    await waitForAdminReady(page);
    await page.getByTestId('admin-tab-users').click();
    await expect(page.getByTestId('admin-users-section')).toBeVisible();

    await page.getByTestId('admin-users-keyword').fill(adminUsername);
    await page.getByTestId('admin-users-query').click();
    const userRow = page.getByTestId('admin-user-row').filter({ hasText: adminUsername }).first();
    await expect(userRow).toBeVisible({ timeout: 15_000 });
    await userRow.getByTestId('admin-user-select').click();

    await expect(page.getByTestId('admin-assignments-section')).toBeVisible();
    await expect(page.getByTestId('admin-save-roles')).toBeEnabled();
    await page.getByTestId('admin-save-roles').click();

    const assignmentSelect = page.getByTestId('admin-assignment-class');
    const classOption = assignmentSelect.locator('option').filter({ hasText: classCode }).first();
    await expect(classOption).toHaveCount(1, { timeout: 10_000 });
    const classId = await classOption.getAttribute('value');
    expect(classId, 'E2E teaching class should be assignable').toBeTruthy();
    await assignmentSelect.selectOption(classId!);
    await page.getByTestId('admin-assignment-role').selectOption('ASSISTANT');
    await page.getByTestId('admin-assignment-save').click();

    const assignmentRow = page
      .getByTestId('admin-assignment-row')
      .filter({ hasText: classCode })
      .first();
    await expect(assignmentRow).toBeVisible({ timeout: 15_000 });
    await assignmentRow.getByTestId('admin-assignment-delete').click();
    await expect(assignmentRow).toHaveCount(0, { timeout: 15_000 });

    await page.getByTestId('admin-tab-audits').click();
    await expect(page.getByTestId('admin-audits-section')).toBeVisible();
    await page.getByTestId('admin-audit-action').fill('ADMIN_');
    await page.getByTestId('admin-audit-result').selectOption('SUCCESS');
    await page.getByTestId('admin-audit-query').click();
    await expect(page.locator('.audit-timeline')).toBeVisible();
    await expectNoHorizontalOverflow(page, 'admin audit page');
  });

  test('visible admin actions have accessible names and pages do not expose backend errors', async ({
    page,
  }) => {
    for (const path of ['/admin/classes', '/admin/users']) {
      await page.goto(path);
      await waitForAdminReady(page);
      const actions = await visibleActionAudit(page);
      expect(actions.length, `${path} should expose visible actions`).toBeGreaterThanOrEqual(4);
      expect(
        actions.filter((action) => !action.text && !action.ariaLabel && !action.title),
        `${path} has visible actions without accessible names`,
      ).toEqual([]);
      await expectNoHorizontalOverflow(page, path);
    }
  });
});
