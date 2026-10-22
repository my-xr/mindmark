import { expect, test, type Page } from '@playwright/test';

const teacherUsername = process.env.MINDMARK_TEACHER_USERNAME ?? 'teacher@mindmark.local';
const teacherPassword = process.env.MINDMARK_TEACHER_PASSWORD ?? 'dev-password';

const teacherPages = [
  { name: '教师工作台', path: '/teacher/dashboard', minActions: 2 },
  { name: '题库管理', path: '/teacher/questions', minActions: 4 },
  { name: 'AI 出题审核', path: '/teacher/ai-questions', minActions: 4 },
  { name: '试卷与组卷', path: '/teacher/papers', minActions: 3 },
  { name: '考试管理', path: '/teacher/exams', minActions: 3 },
  { name: '学生名单与账号', path: '/teacher/students', minActions: 2 },
  { name: '批改中心', path: '/teacher/grading', minActions: 1 },
  { name: '成绩中心', path: '/teacher/scores', minActions: 1 },
  { name: '考试复盘与 AI 讲评', path: '/teacher/reviews', minActions: 1 },
  { name: '个人配置', path: '/teacher/settings', minActions: 3 },
];

async function loginAsTeacher(page: Page) {
  await page.goto('/auth/login');
  await page.locator('input[autocomplete="username"]').fill(teacherUsername);
  await page.locator('input[autocomplete="current-password"]').fill(teacherPassword);
  await page.locator('form.auth-login-form button[type="submit"]').click();
  await expect(page).toHaveURL(/\/teacher\/dashboard/);
  await expect(page.locator('.portal-layout')).toBeVisible();
}

async function waitForTeacherPageReady(page: Page) {
  await expect(page.locator('.portal-layout')).toBeVisible();
  await expect(page.locator('.portal-content')).toBeVisible();
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
}

async function installRuntimeGuards(page: Page, runtimeErrors: string[]) {
  page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() !== 'error') {
      return;
    }
    const text = message.text();
    if (/favicon|ResizeObserver loop|net::ERR_ABORTED/i.test(text)) {
      return;
    }
    runtimeErrors.push(`console.error: ${text}`);
  });
}

test.describe('教师端页面级巡检', () => {
  test.beforeEach(async ({ page }) => {
    const runtimeErrors: string[] = [];
    await installRuntimeGuards(page, runtimeErrors);
    await loginAsTeacher(page);
    test
      .info()
      .annotations.push({ type: 'runtimeErrors', description: JSON.stringify(runtimeErrors) });
  });

  for (const pageCase of teacherPages) {
    test(`${pageCase.name} 页面可加载且按钮具备可访问名称`, async ({ page }) => {
      const runtimeErrors: string[] = [];
      await installRuntimeGuards(page, runtimeErrors);
      await page.goto(pageCase.path);
      await waitForTeacherPageReady(page);

      await expect(page.locator('.portal-menu-item.active')).toHaveCount(1);
      await expect(page.locator('.state-card--error')).toHaveCount(0);
      await expect(page.locator('.portal-content')).not.toContainText(/MM-500-001|Unhandled/i);

      const actionAudit = await page
        .locator('.portal-content button, .portal-content a')
        .evaluateAll((nodes) =>
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
                tag: element.tagName.toLowerCase(),
                text: element.innerText.trim(),
                ariaLabel: element.getAttribute('aria-label') ?? '',
                title: element.getAttribute('title') ?? '',
                disabled:
                  (element as HTMLButtonElement).disabled ||
                  element.getAttribute('aria-disabled') === 'true',
                className: element.className.toString(),
              };
            }),
        );

      expect(
        actionAudit.length,
        `${pageCase.name} should expose enough visible actions`,
      ).toBeGreaterThanOrEqual(pageCase.minActions);
      const namelessActions = actionAudit.filter(
        (item) => !item.text && !item.ariaLabel && !item.title,
      );
      expect(
        namelessActions,
        `${pageCase.name} has visible actions without accessible names`,
      ).toEqual([]);

      const hasHorizontalBodyOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 4,
      );
      expect(
        hasHorizontalBodyOverflow,
        `${pageCase.name} should not create body-level horizontal overflow`,
      ).toBe(false);
      expect(runtimeErrors, `${pageCase.name} should not emit runtime errors`).toEqual([]);
    });
  }
});

test.describe('教师端关键按钮轻量点击巡检', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test('左侧导航可折叠并保持页面可用', async ({ page }) => {
    const layout = page.locator('.portal-layout');
    await expect(layout).not.toHaveClass(/portal-layout--collapsed/);
    await page.locator('.sidebar-toggle-button').click();
    await expect(layout).toHaveClass(/portal-layout--collapsed/);
    await page.locator('.sidebar-toggle-button').click();
    await expect(layout).not.toHaveClass(/portal-layout--collapsed/);
  });

  test('题库管理：企业级表格、抽屉查看编辑与加入试卷入口可打开关闭', async ({ page }) => {
    await page.goto('/teacher/questions');
    await waitForTeacherPageReady(page);

    const filterToggle = page
      .getByRole('button', { name: /收起到一行|展开全部|展开筛选|收起筛选/ })
      .first();
    await filterToggle.click();
    await filterToggle.click();

    await expect(page.locator('.enterprise-question-table')).toBeVisible();
    await expect(page.locator('.enterprise-question-table th', { hasText: '课程' })).toBeVisible();
    await expect(
      page.locator('.enterprise-question-table th', { hasText: '知识点' }),
    ).toBeVisible();
    await expect(page.locator('.enterprise-question-table th', { hasText: '题型' })).toBeVisible();
    await expect(page.locator('.enterprise-question-table th', { hasText: '难度' })).toBeVisible();
    await expect(page.locator('.enterprise-question-table th', { hasText: '来源' })).toBeVisible();
    await expect(page.locator('.enterprise-question-table th', { hasText: '状态' })).toBeVisible();
    await expect(
      page.locator('.enterprise-question-table th', { hasText: '更新时间' }),
    ).toBeVisible();
    await expect(page.locator('.enterprise-question-table th', { hasText: '操作' })).toBeVisible();

    await page.getByRole('button', { name: '新增题目' }).click();
    await expect(page.locator('.question-detail-drawer')).toBeVisible();
    await expect(page.getByText('创建标准化题目资源')).toBeVisible();
    await page.locator('.question-detail-drawer').getByRole('button', { name: '取消' }).click();
    await expect(page.locator('.question-detail-drawer')).not.toBeVisible();

    const firstQuestionRow = page.locator('.enterprise-question-row').first();
    if ((await firstQuestionRow.count()) === 0) {
      return;
    }

    await firstQuestionRow.click();
    await expect(page.locator('.question-detail-drawer')).toBeVisible();
    await expect(page.getByText('题目详情')).toBeVisible();
    await page
      .locator('.question-detail-drawer')
      .getByRole('button', { name: /编\s*辑/ })
      .click();
    await expect(page.getByText('维护题目内容与答案解析')).toBeVisible();
    await page.locator('.question-detail-drawer').getByRole('button', { name: '取消' }).click();
    await expect(page.getByText('题目详情')).toBeVisible();
    await page.locator('.question-detail-drawer').getByRole('button', { name: 'Close' }).click();
    await expect(page.locator('.question-detail-drawer')).not.toBeVisible();

    await page
      .locator('label.form-field')
      .filter({ hasText: /^状态/ })
      .locator('select')
      .selectOption('ACTIVE');
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
    const firstActiveQuestionRow = page.locator('.enterprise-question-row').first();
    if ((await firstActiveQuestionRow.count()) === 0) {
      return;
    }

    await firstActiveQuestionRow.getByRole('button', { name: '组卷' }).click();
    await expect(page.locator('.question-compose-drawer')).toBeVisible();
    await page.locator('.question-compose-drawer').getByRole('button', { name: 'Close' }).click();
    await expect(page.locator('.question-compose-drawer')).not.toBeVisible();
  });
  test('AI 出题审核：生成模块折叠、任务历史刷新与个人配置入口可用', async ({ page }) => {
    await page.goto('/teacher/ai-questions');
    await waitForTeacherPageReady(page);

    const generateToggle = page
      .getByRole('button', { name: /收起到一行|展开全部|展开生成|收起生成/ })
      .first();
    await generateToggle.click();
    await generateToggle.click();
    await page.getByRole('button', { name: /刷新任务/ }).click();
    await page.getByRole('main').getByRole('link', { name: '个人配置' }).click();
    await expect(page).toHaveURL(/\/teacher\/settings/);
  });

  test('试卷与组卷、考试管理、成绩中心核心按钮不触发运行时错误', async ({ page }) => {
    const runtimeErrors: string[] = [];
    await installRuntimeGuards(page, runtimeErrors);

    await page.goto('/teacher/papers');
    await waitForTeacherPageReady(page);
    const firstPaper = page.locator('.paper-list-item').first();
    if ((await firstPaper.count()) > 0) {
      await firstPaper.click();
    }

    await page.goto('/teacher/exams');
    await waitForTeacherPageReady(page);
    const firstClassButton = page.locator('.class-option').first();
    if ((await firstClassButton.count()) > 0) {
      await firstClassButton.click();
    }

    await page.goto('/teacher/scores');
    await waitForTeacherPageReady(page);
    const firstScoreCard = page.locator('.score-exam-card').first();
    if ((await firstScoreCard.count()) > 0) {
      await firstScoreCard.click();
    }

    expect(runtimeErrors).toEqual([]);
  });
});
