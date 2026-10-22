import { expect, test, type Page } from '@playwright/test';

const studentUsername = process.env.MINDMARK_STUDENT_USERNAME ?? '20260722120655';
const studentPassword = process.env.MINDMARK_STUDENT_PASSWORD ?? 'Mindmark123';
const visualExamId = process.env.MINDMARK_STUDENT_VISUAL_EXAM_ID ?? 'exam-visual-001';

async function installFullscreenHarness(page: Page) {
  await page.addInitScript(() => {
    let active = false;
    const notify = () => document.dispatchEvent(new Event('fullscreenchange'));

    Object.defineProperty(Document.prototype, 'fullscreenEnabled', {
      configurable: true,
      get: () => true,
    });
    Object.defineProperty(Document.prototype, 'fullscreenElement', {
      configurable: true,
      get: () => (active ? document.documentElement : null),
    });
    Object.defineProperty(Element.prototype, 'requestFullscreen', {
      configurable: true,
      value: async () => {
        active = true;
        notify();
      },
    });
    Object.defineProperty(Document.prototype, 'exitFullscreen', {
      configurable: true,
      value: async () => {
        active = false;
        notify();
      },
    });
  });
}

async function loginAsStudent(page: Page) {
  await page.goto(`/student/exams/${visualExamId}/take`);
  const loginForm = page.locator('form.auth-login-form');
  const shouldLogin = await loginForm
    .waitFor({ state: 'visible', timeout: 10_000 })
    .then(() => true)
    .catch(() => false);
  if (shouldLogin) {
    await page.locator('input[autocomplete="username"]').fill(studentUsername);
    await page.locator('input[autocomplete="current-password"]').fill(studentPassword);
    await loginForm.locator('button[type="submit"]').click();
  }
  await expect(page).toHaveURL(new RegExp(`/student/exams/${visualExamId}/take`));
  await expect(page.locator('.student-layout')).toBeVisible();
}

test.describe('学生答题页真实视觉验收', () => {
  test('答题页首屏聚焦试题与答题卡，顶部监考信息紧凑可折叠', async ({ page }, testInfo) => {
    const runtimeErrors: string[] = [];
    page.on('pageerror', (error) => runtimeErrors.push(error.message));
    page.on('console', (message) => {
      if (
        message.type() === 'error' &&
        !/favicon|ResizeObserver loop|net::ERR_ABORTED|Failed to load resource: the server responded with a status of 404/i.test(
          message.text(),
        )
      ) {
        runtimeErrors.push(message.text());
      }
    });

    await installFullscreenHarness(page);
    await loginAsStudent(page);
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);

    await expect(page.locator('.exam-taking-topbar')).toBeVisible();
    await expect(page.locator('.exam-taking-topbar--focused')).toBeVisible();
    await expect(page.locator('.student-header')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '返回考试中心' })).toBeVisible();
    await expect(page.locator('.exam-taking-heading-zone')).toContainText('学生答题页视觉验收考试');
    await expect(page.locator('.exam-return-center-action')).toHaveAttribute(
      'title',
      '返回考试中心',
    );
    await expect(page.locator('.exam-taking-eyebrow')).toHaveCount(0);
    await expect(page.locator('.exam-timer-chip span')).toHaveCount(0);
    await expect(page.locator('.exam-timer-chip strong')).toHaveText(/\d{2}:\d{2}/);
    await expect(page.locator('.exam-guard-details')).toContainText('考试监考');
    await expect(page.locator('.exam-fullscreen-gate')).toBeVisible();
    await expect(page.locator('.exam-fullscreen-lock-overlay')).toBeVisible();
    await expect(page.locator('.exam-fullscreen-lock-overlay')).toContainText('请进入全屏答题');
    await page
      .locator('.exam-fullscreen-lock-overlay')
      .getByRole('button', {
        name: '进入全屏答题',
      })
      .click();
    await expect(page.locator('.exam-fullscreen-lock-overlay')).toBeHidden();
    await expect(page.locator('.taking-question-panel')).toBeVisible();
    await expect(page.locator('.answer-card-panel')).toBeVisible();
    await expect(page.locator('.exam-save-state')).toBeVisible();
    await expect(page.locator('.question-mark-button')).toBeVisible();
    await expect(page.locator('.answer-card-type-group')).toHaveCount(6);
    await expect(page.locator('.answer-card-panel')).toContainText('\u5355\u9009\u9898');
    await expect(page.locator('.answer-card-panel')).toContainText('\u591a\u9009\u9898');
    await expect(page.locator('.answer-card-panel')).toContainText('\u5224\u65ad\u9898');
    await expect(page.locator('.answer-card-panel')).toContainText('\u586b\u7a7a\u9898');
    await expect(page.locator('.answer-card-panel')).toContainText('\u7b80\u7b54\u9898');
    await expect(page.locator('.answer-card-panel')).toContainText('\u7f16\u7a0b\u9898');
    await expect(page.locator('.question-number-grid button').first()).toBeVisible();

    const layout = await page.evaluate(() => {
      const viewportHeight = window.innerHeight;
      const viewportWidth = document.documentElement.clientWidth;
      const question = document
        .querySelector<HTMLElement>('.taking-question-panel')
        ?.getBoundingClientRect();
      const answerCard = document
        .querySelector<HTMLElement>('.answer-card-panel')
        ?.getBoundingClientRect();
      const topbar = document
        .querySelector<HTMLElement>('.exam-taking-topbar')
        ?.getBoundingClientRect();
      const orderOf = (selector: string) =>
        getComputedStyle(document.querySelector<HTMLElement>(selector) as HTMLElement).order;
      return {
        documentOverflow: document.documentElement.scrollWidth - viewportWidth,
        topbarLeft: topbar?.left ?? 9999,
        topbarRight: topbar?.right ?? -9999,
        topbarHeight: topbar?.height ?? 0,
        viewportWidth,
        topbarBottom: topbar?.bottom ?? 9999,
        timerRight:
          document.querySelector<HTMLElement>('.exam-timer-chip')?.getBoundingClientRect().right ??
          0,
        saveStateWidth:
          document.querySelector<HTMLElement>('.exam-save-state')?.getBoundingClientRect().width ??
          0,
        saveStateHeight:
          document.querySelector<HTMLElement>('.exam-save-state')?.getBoundingClientRect().height ??
          0,
        timerWidth:
          document.querySelector<HTMLElement>('.exam-timer-chip')?.getBoundingClientRect().width ??
          0,
        timerHeight:
          document.querySelector<HTMLElement>('.exam-timer-chip')?.getBoundingClientRect().height ??
          0,
        controlOrder: {
          fullscreen: orderOf('.exam-fullscreen-action'),
          save: orderOf('.exam-save-state'),
          guard: orderOf('.exam-guard-details'),
          timer: orderOf('.exam-timer-chip'),
        },
        controlRight:
          document.querySelector<HTMLElement>('.exam-taking-control-zone')?.getBoundingClientRect()
            .right ?? 0,
        questionTop: question?.top ?? 9999,
        answerCardTop: answerCard?.top ?? 9999,
        questionVisibleInFirstScreen: Boolean(question && question.top < viewportHeight * 0.42),
        answerCardVisibleInFirstScreen: Boolean(
          answerCard && answerCard.top < viewportHeight * 0.42,
        ),
      };
    });

    expect(layout.documentOverflow).toBeLessThanOrEqual(4);
    expect(Math.abs(layout.topbarLeft)).toBeLessThanOrEqual(1);
    expect(Math.abs(layout.topbarRight - layout.viewportWidth)).toBeLessThanOrEqual(1);
    expect(Math.abs(layout.topbarHeight - 56)).toBeLessThanOrEqual(1);
    expect(layout.timerRight).toBeGreaterThanOrEqual(layout.controlRight - 2);
    expect(layout.controlOrder).toEqual({
      fullscreen: '1',
      save: '2',
      guard: '3',
      timer: '4',
    });
    expect(Math.abs(layout.saveStateWidth - layout.timerWidth)).toBeLessThanOrEqual(1);
    expect(Math.abs(layout.saveStateHeight - layout.timerHeight)).toBeLessThanOrEqual(1);
    expect(layout.questionVisibleInFirstScreen).toBeTruthy();
    expect(layout.answerCardVisibleInFirstScreen).toBeTruthy();
    expect(layout.questionTop).toBeGreaterThanOrEqual(layout.topbarBottom - 8);
    expect(layout.answerCardTop).toBeGreaterThanOrEqual(layout.topbarBottom - 8);
    expect(runtimeErrors).toEqual([]);

    const markButton = page.locator('.question-mark-button');
    await markButton.click();
    await expect(markButton).toHaveClass(/question-mark-button--active/);
    await expect(page.locator('.question-number-grid button.marked')).toHaveCount(1);

    const collapseButton = page.locator('.answer-card-collapse');
    await collapseButton.click();
    await expect(page.locator('.answer-card-type-groups')).toBeHidden();
    await expect(collapseButton).toHaveAttribute('aria-expanded', 'false');
    await collapseButton.click();
    await expect(page.locator('.answer-card-type-groups')).toBeVisible();
    await expect(collapseButton).toHaveAttribute('aria-expanded', 'true');
    const submitButton = page.getByRole('button', { name: '确认交卷' });
    await expect(submitButton).toBeVisible();
    const answerCardBottoms = await page.evaluate(() => {
      const panel = document.querySelector<HTMLElement>('.answer-card-panel');
      const button = document.querySelector<HTMLElement>('.answer-card-submit-action');

      return {
        panelBottom: panel?.getBoundingClientRect().bottom ?? 0,
        buttonBottom: button?.getBoundingClientRect().bottom ?? Number.MAX_SAFE_INTEGER,
      };
    });
    expect(answerCardBottoms.buttonBottom).toBeLessThanOrEqual(answerCardBottoms.panelBottom + 1);

    await page.locator('.exam-guard-details summary').click();
    await expect(page.locator('.exam-guard-panel')).toBeVisible();

    const screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach('student-taking-visual.png', {
      body: screenshot,
      contentType: 'image/png',
    });
  });
});
