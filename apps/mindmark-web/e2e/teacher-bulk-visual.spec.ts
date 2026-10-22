import { expect, test, type Page } from '@playwright/test';

const teacherUsername = process.env.MINDMARK_TEACHER_USERNAME ?? 'teacher@mindmark.local';
const teacherPassword = process.env.MINDMARK_TEACHER_PASSWORD ?? 'dev-password';

const bulkVisualPages = [
  { name: '教师工作台', path: '/teacher/dashboard' },
  { name: '题库管理', path: '/teacher/questions', expectsPagination: true },
  { name: 'AI 出题审核', path: '/teacher/ai-questions' },
  { name: '试卷与组卷', path: '/teacher/papers', expectsPagination: true },
  { name: '考试管理', path: '/teacher/exams', expectsPagination: true },
  { name: '学生名单与账号', path: '/teacher/students', expectsPagination: true },
  { name: '批改中心', path: '/teacher/grading', expectsPagination: true },
  { name: '成绩中心', path: '/teacher/scores', expectsPagination: true },
  { name: '考试复盘与 AI 讲评', path: '/teacher/reviews', expectsPagination: true },
  { name: '个人配置', path: '/teacher/settings' },
];

async function loginAsTeacher(page: Page) {
  await page.goto('/auth/login');
  await page.locator('input[autocomplete="username"]').fill(teacherUsername);
  await page.locator('input[autocomplete="current-password"]').fill(teacherPassword);
  await page.locator('form.auth-login-form button[type="submit"]').click();
  await expect(page).toHaveURL(/\/teacher\/dashboard/);
  await expect(page.locator('.portal-layout')).toBeVisible();
}

async function waitForPageReady(page: Page) {
  await expect(page.locator('.portal-layout')).toBeVisible();
  await expect(page.locator('.portal-content')).toBeVisible();
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
}

async function assertNoRuntimeErrors(page: Page, runtimeErrors: string[], pageName: string) {
  await expect(page.locator('.state-card--error')).toHaveCount(0);
  await expect(page.locator('.portal-content')).not.toContainText(
    /MM-500-001|Internal server error|Unhandled|TypeError/i,
  );
  expect(runtimeErrors, `${pageName} should not emit console/page runtime errors`).toEqual([]);
}

async function assertNoHorizontalOverflow(page: Page, pageName: string) {
  const result = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const documentOverflow = document.documentElement.scrollWidth - viewportWidth;
    const selectors = [
      '.portal-content',
      '.page-shell',
      '.content-card',
      '.list-card',
      '.enterprise-question-table',
      '.ant-table-wrapper',
      '.paper-list-item',
      '.review-report-selector',
      '.review-security-event-item',
      '.grading-task-card',
      '.score-exam-card',
    ];
    const overflowingElements = selectors.flatMap((selector) =>
      Array.from(document.querySelectorAll<HTMLElement>(selector))
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) {
            return false;
          }
          return (
            rect.left < -4 ||
            rect.right > viewportWidth + 4 ||
            element.scrollWidth > element.clientWidth + 8
          );
        })
        .slice(0, 5)
        .map((element) => ({
          selector,
          className: element.className.toString(),
          rectWidth: Math.round(element.getBoundingClientRect().width),
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
        })),
    );
    return { viewportWidth, documentOverflow, overflowingElements };
  });

  expect(
    result.documentOverflow,
    `${pageName} should not create body-level horizontal overflow`,
  ).toBeLessThanOrEqual(4);
  expect(
    result.overflowingElements,
    `${pageName} cards/tables should stay within viewport`,
  ).toEqual([]);
}

async function assertTruncatedLongText(page: Page, pageName: string) {
  const longTextAudit = await page.evaluate(() => {
    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>(
        '.question-title-cell, .paper-question-title, .available-question-title, .table-title, .answer-preview, .review-report-title',
      ),
    ).filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && element.innerText.trim().length > 28;
    });

    return candidates.slice(0, 20).map((element) => {
      const style = window.getComputedStyle(element);
      return {
        text: element.innerText.trim().slice(0, 24),
        overflow: style.overflow,
        textOverflow: style.textOverflow,
        whiteSpace: style.whiteSpace,
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      };
    });
  });

  for (const item of longTextAudit) {
    expect(
      item.textOverflow === 'ellipsis' ||
        item.overflow === 'hidden' ||
        item.whiteSpace !== 'nowrap',
      `${pageName} long text should be truncated or allowed to wrap: ${item.text}`,
    ).toBeTruthy();
  }
}

async function firstVisiblePagination(page: Page) {
  return page
    .locator(
      '.enterprise-pagination:visible, .ant-table-pagination:visible, .ant-pagination:visible',
    )
    .first();
}

async function exerciseFirstPagination(page: Page) {
  const nextButton = page
    .locator(
      [
        '.enterprise-pagination .ant-pagination-next:not(.ant-pagination-disabled) button',
        '.ant-table-pagination .ant-pagination-next:not(.ant-pagination-disabled) button',
        '.ant-pagination .ant-pagination-next:not(.ant-pagination-disabled) button',
      ].join(', '),
    )
    .first();
  if ((await nextButton.count()) === 0) {
    return false;
  }
  await nextButton.scrollIntoViewIfNeeded();
  await nextButton.click();
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
  return true;
}

test.describe('教师端真实浏览器视觉验收与批量数据巡检', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  for (const pageCase of bulkVisualPages) {
    test(`${pageCase.name}：批量数据下布局不溢出且分页交互稳定`, async ({ page }, testInfo) => {
      const runtimeErrors: string[] = [];
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

      await page.goto(pageCase.path);
      await waitForPageReady(page);

      if (pageCase.path === '/teacher/students') {
        const classSelect = page.getByLabel('教学班');
        const bulkClassOption = classSelect
          .locator('option')
          .filter({ hasText: /批量体验验收班级/ })
          .first();
        if ((await bulkClassOption.count()) > 0) {
          const bulkClassId = await bulkClassOption.getAttribute('value');
          if (bulkClassId) {
            await classSelect.selectOption(bulkClassId);
            await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
          }
        }
      }

      await assertNoRuntimeErrors(page, runtimeErrors, pageCase.name);
      await assertNoHorizontalOverflow(page, pageCase.name);
      await assertTruncatedLongText(page, pageCase.name);

      if (pageCase.expectsPagination) {
        await expect(await firstVisiblePagination(page)).toBeVisible({ timeout: 10_000 });
        const clicked = await exerciseFirstPagination(page);
        if (clicked) {
          await assertNoRuntimeErrors(page, runtimeErrors, `${pageCase.name} pagination`);
          await assertNoHorizontalOverflow(page, `${pageCase.name} pagination`);
        }
      }

      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach(`${pageCase.name}-bulk-visual.png`, {
        body: screenshot,
        contentType: 'image/png',
      });
    });
  }
});
