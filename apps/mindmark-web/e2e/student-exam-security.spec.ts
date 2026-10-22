import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const apiBaseUrl = process.env.MINDMARK_API_BASE_URL ?? 'http://localhost:8080';
const teacherUsername = process.env.MINDMARK_TEACHER_USERNAME ?? 'teacher@mindmark.local';
const teacherPassword = process.env.MINDMARK_TEACHER_PASSWORD ?? 'dev-password';

interface PageEnvelope<T> {
  items?: T[];
}

function unwrapItems<T>(value: T[] | PageEnvelope<T> | null | undefined): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  return value?.items ?? [];
}
interface ApiEnvelope<T> {
  code: string;
  message: string;
  data: T;
  timestamp: string;
}

interface LoginResponse {
  token: string;
  mustChangePassword: boolean;
}

interface CourseResponse {
  id: string;
  name: string;
}

interface ClassResponse {
  id: string;
  name: string;
}

interface RosterImportResponse {
  createdCount: number;
  skippedCount: number;
}

interface QuestionResponse {
  id: string;
}

interface PaperResponse {
  id: string;
  status: string;
}

interface ExamResponse {
  id: string;
  title: string;
  status: string;
}

interface StudentExamResponse {
  id: string;
  answerSheetId: string;
  answerStatus: string;
}

interface ExamSecurityEventResponse {
  id: string;
  examId: string;
  eventType: string;
  message?: string | null;
}

interface GradingTaskResponse {
  id: string;
  answerSheetId: string;
  status: string;
}

interface PublishScoreResponse {
  examId: string;
  publishedCount: number;
}

interface StudentScoreReportResponse {
  id: string;
  examId: string;
  examTitle: string;
  status: string;
}

interface SeedData {
  runId: string;
  teacherToken: string;
  course: CourseResponse;
  classInfo: ClassResponse;
  studentNo: string;
  initialPassword: string;
  newPassword: string;
  exam: ExamResponse;
  answerSheetId?: string;
}

const data: Partial<SeedData> = {};

function requireSeed(): SeedData {
  if (
    !data.runId ||
    !data.teacherToken ||
    !data.course ||
    !data.classInfo ||
    !data.studentNo ||
    !data.initialPassword ||
    !data.newPassword ||
    !data.exam
  ) {
    throw new Error('Student E2E seed data is not ready.');
  }

  return data as SeedData;
}

function toIsoOffset(value: Date) {
  const pad = (number: number) => number.toString().padStart(2, '0');
  const timezoneOffsetMinutes = -value.getTimezoneOffset();
  const sign = timezoneOffsetMinutes >= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(timezoneOffsetMinutes);

  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(
    value.getHours(),
  )}:${pad(value.getMinutes())}:${pad(value.getSeconds())}${sign}${pad(
    Math.floor(absoluteOffset / 60),
  )}:${pad(absoluteOffset % 60)}`;
}

async function mindmarkApi<T>(
  request: APIRequestContext,
  method: string,
  path: string,
  body?: Record<string, unknown>,
  token?: string,
): Promise<T> {
  const response = await request.fetch(`${apiBaseUrl}${path}`, {
    method,
    data: body,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    timeout: 30_000,
  });
  const responseText = await response.text();

  expect(response.ok(), `${method} ${path} failed: ${response.status()} ${responseText}`).toBe(
    true,
  );

  const payload = JSON.parse(responseText) as ApiEnvelope<T>;
  expect(payload.code, `${method} ${path} failed: ${payload.message}`).toBe('0');

  return payload.data;
}

async function loginByApi(
  request: APIRequestContext,
  username: string,
  password: string,
): Promise<LoginResponse> {
  return mindmarkApi<LoginResponse>(request, 'POST', '/api/v1/auth/login', { username, password });
}

async function prepareStudentExamSeed(request: APIRequestContext) {
  const runId = `${Date.now()}${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')}`;
  const teacherLogin = await loginByApi(request, teacherUsername, teacherPassword);
  const teacherToken = teacherLogin.token;

  const course = await mindmarkApi<CourseResponse>(
    request,
    'POST',
    '/api/v1/admin/courses',
    {
      code: `E2E-STU-${runId}`,
      name: `学生端 E2E 课程 ${runId}`,
      description: '学生端考试 E2E 自动化验收造数',
      status: 'ACTIVE',
    },
    teacherToken,
  );

  const classInfo = await mindmarkApi<ClassResponse>(
    request,
    'POST',
    '/api/v1/admin/classes',
    {
      courseId: course.id,
      code: `E2E-STU-CLS-${runId}`,
      name: `学生端 E2E 班级 ${runId}`,
      grade: '2026',
      major: 'Software Engineering',
      status: 'ACTIVE',
    },
    teacherToken,
  );

  const studentNo = `2026${runId.slice(-8)}`;
  const initialPassword = studentNo.slice(-6);
  const newPassword = `E2ePass${runId.slice(-8)}`;
  const rosterImport = await mindmarkApi<RosterImportResponse>(
    request,
    'POST',
    `/api/v1/classes/${classInfo.id}/students/import`,
    {
      className: classInfo.name,
      students: [
        {
          studentNo,
          name: `学生端验收学生 ${runId.slice(-6)}`,
          email: `${studentNo}@student.mindmark.local`,
          className: classInfo.name,
          grade: '2026',
          major: 'Software Engineering',
        },
      ],
    },
    teacherToken,
  );
  expect(rosterImport.createdCount + rosterImport.skippedCount).toBeGreaterThanOrEqual(1);

  const question = await mindmarkApi<QuestionResponse>(
    request,
    'POST',
    '/api/v1/questions',
    {
      courseId: course.id,
      title: `学生端安全闭环验收题 ${runId}`,
      type: 'SINGLE_CHOICE',
      difficulty: 'MEDIUM',
      knowledgePoints: ['全屏作答与切屏审计'],
      score: 12,
      answer: 'A',
      analysis: '用于验证考试进入、草稿保存、全屏和安全审计链路。',
      options: [
        { key: 'A', content: '按考试时间窗口和全屏规则作答' },
        { key: 'B', content: '跳过考试时间直接交卷' },
        { key: 'C', content: '忽略切屏审计' },
        { key: 'D', content: '允许未授权账号查看答卷' },
      ],
      scoringPoints: [],
    },
    teacherToken,
  );

  const paper = await mindmarkApi<PaperResponse>(
    request,
    'POST',
    '/api/v1/papers',
    {
      title: `学生端安全闭环验收试卷 ${runId}`,
      courseId: course.id,
      description: '学生端真实接口安全闭环验收试卷',
      durationMinutes: 20,
    },
    teacherToken,
  );
  await mindmarkApi<PaperResponse>(
    request,
    'POST',
    `/api/v1/papers/${paper.id}/questions`,
    { questionId: question.id, score: 12 },
    teacherToken,
  );
  await mindmarkApi<PaperResponse>(
    request,
    'PATCH',
    `/api/v1/papers/${paper.id}/status`,
    { status: 'READY' },
    teacherToken,
  );

  const now = new Date();
  const exam = await mindmarkApi<ExamResponse>(
    request,
    'POST',
    '/api/v1/exams',
    {
      title: `学生端安全闭环 E2E ${runId}`,
      paperId: paper.id,
      classIds: [classInfo.id],
      startAt: toIsoOffset(new Date(now.getTime() - 60_000)),
      endAt: toIsoOffset(new Date(now.getTime() + 20 * 60_000)),
      durationMinutes: 20,
    },
    teacherToken,
  );
  expect(exam.status).toBe('ONGOING');

  Object.assign(data, {
    runId,
    teacherToken,
    course,
    classInfo,
    studentNo,
    initialPassword,
    newPassword,
    exam,
  });
}

async function resolveAnswerSheetId(request: APIRequestContext, seed: SeedData) {
  if (seed.answerSheetId) {
    return seed.answerSheetId;
  }

  const studentLogin = await loginByApi(request, seed.studentNo, seed.newPassword);
  const studentExamsPage = await mindmarkApi<
    StudentExamResponse[] | PageEnvelope<StudentExamResponse>
  >(request, 'GET', '/api/v1/student/exams', undefined, studentLogin.token);
  const studentExams = unwrapItems(studentExamsPage);
  const studentExam = studentExams.find((exam) => exam.id === seed.exam.id);
  expect(studentExam, 'created exam should appear in the student exam list').toBeTruthy();
  seed.answerSheetId = studentExam?.answerSheetId;

  return seed.answerSheetId ?? '';
}

async function loginAsStudent(
  page: Page,
  username: string,
  password: string,
  target = '/student/exams',
) {
  await page.goto(target);

  const visibleState = await Promise.race([
    page
      .locator('form.auth-login-form')
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => 'login'),
    page
      .locator('.student-layout')
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => 'student'),
  ]).catch(() => 'timeout');

  if (visibleState === 'login') {
    await page.locator('input[autocomplete="username"]').fill(username);
    await page.locator('input[autocomplete="current-password"]').fill(password);
    await page.locator('form.auth-login-form button[type="submit"]').click();
  }
}

async function waitForStudentPageReady(page: Page) {
  await expect(page.locator('.student-layout')).toBeVisible();
  await expect(page.locator('.student-content')).toBeVisible();
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
}

async function installRuntimeGuards(page: Page, runtimeErrors: string[]) {
  page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`));
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
    runtimeErrors.push(`console.error: ${text}`);
  });
}

async function installFullscreenHarness(page: Page) {
  await page.addInitScript(() => {
    let active = false;
    const notify = () => document.dispatchEvent(new Event('fullscreenchange'));
    const requestFullscreen = async () => {
      active = true;
      notify();
    };
    const exitFullscreen = async () => {
      active = false;
      notify();
    };

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
      value: requestFullscreen,
    });
    Object.defineProperty(Document.prototype, 'exitFullscreen', {
      configurable: true,
      value: exitFullscreen,
    });
  });
}

async function forceFullscreenStateForE2E(page: Page, active: boolean) {
  await page.evaluate((nextActive) => {
    Object.defineProperty(document, 'fullscreenEnabled', {
      configurable: true,
      get: () => true,
    });
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => (nextActive ? document.documentElement : null),
    });
    document.dispatchEvent(new Event('fullscreenchange'));
  }, active);
}

async function enterFullscreenForE2E(page: Page) {
  // 顶部状态栏和监考详情里都提供入口，验收固定点击顶部主操作，避免严格模式命中两个按钮。
  await page.locator('button.exam-fullscreen-action').click();
  const entered = await page
    .getByRole('button', { name: '已进入全屏' })
    .waitFor({ state: 'visible', timeout: 2_000 })
    .then(() => true)
    .catch(() => false);

  if (!entered) {
    await forceFullscreenStateForE2E(page, true);
  }
  await expect(page.getByRole('button', { name: '已进入全屏' })).toBeVisible();
}
async function leaveFullscreenForE2E(page: Page) {
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(300);
  await forceFullscreenStateForE2E(page, false);
}
async function answerCurrentQuestion(page: Page) {
  const questionPanel = page.locator('.taking-question-panel');
  const firstOption = questionPanel.locator('.option-item').first();
  if ((await firstOption.count()) > 0) {
    await firstOption.click();
    return;
  }

  const textInput = questionPanel.locator('input.answer-input').first();
  if ((await textInput.count()) > 0) {
    await textInput.fill('学生端 E2E 作答内容');
    return;
  }

  await questionPanel.locator('textarea.answer-textarea').first().fill('学生端 E2E 作答内容');
}

test.describe.serial('学生端考试 E2E 与安全闭环巡检', () => {
  test.beforeAll(async ({ request }) => {
    await mindmarkApi<{ status: string }>(request, 'GET', '/api/v1/system/health');
    await prepareStudentExamSeed(request);
  });

  test('首次登录必须修改密码，改密后进入学生考试中心', async ({ page }) => {
    const seed = requireSeed();
    const runtimeErrors: string[] = [];
    await installRuntimeGuards(page, runtimeErrors);

    await page.goto('/student/exams');
    // 学生入口使用不暴露角色语义的独立路径，不再依赖已废弃的 /auth/login 聚合入口。
    await expect(page).toHaveURL(/\/auth\/entry\/[a-z0-9]+/);
    await expect(page.locator('form.auth-login-form')).toBeVisible();
    await page.locator('input[autocomplete="username"]').fill(seed.studentNo);
    await page.locator('input[autocomplete="current-password"]').fill(seed.initialPassword);
    await page.locator('form.auth-login-form button[type="submit"]').click();

    await expect(page).toHaveURL(/\/auth\/change-password/);
    await expect(page.getByText('首次登录修改密码')).toBeVisible();
    await page.locator('input[autocomplete="current-password"]').fill(seed.initialPassword);
    await page.locator('input[autocomplete="new-password"]').first().fill(seed.newPassword);
    await page.locator('input[autocomplete="new-password"]').nth(1).fill(seed.newPassword);
    await page.getByRole('button', { name: '确认修改' }).click();

    await expect(page).toHaveURL(/\/student\/exams/);
    await waitForStudentPageReady(page);
    await expect(page.getByText('学生考试中心')).toBeVisible();
    expect(runtimeErrors).toEqual([]);
  });

  test('考试列表、须知、倒计时、全屏、防切屏审计、草稿和交卷链路可用', async ({
    page,
    request,
  }) => {
    const seed = requireSeed();
    seed.answerSheetId = await resolveAnswerSheetId(request, seed);
    const runtimeErrors: string[] = [];
    await installRuntimeGuards(page, runtimeErrors);
    await installFullscreenHarness(page);

    await loginAsStudent(page, seed.studentNo, seed.newPassword);
    await waitForStudentPageReady(page);

    const examCard = page
      .locator('.student-exam-card')
      .filter({ hasText: seed.exam.title })
      .first();
    await expect(examCard).toBeVisible();
    await examCard.getByRole('link').click();

    await expect(page).toHaveURL(new RegExp(`/student/exams/${seed.exam.id}/notice`));
    await expect(page.getByRole('heading', { name: '考试须知' })).toBeVisible();
    await expect(page.locator('.exam-notice-fullscreen-card')).toContainText('必须全屏作答');
    await expect(page.locator('body')).not.toContainText('前端 Mock 链路');
    await page.getByRole('link', { name: '进入答题' }).click();

    await expect(page).toHaveURL(new RegExp(`/student/exams/${seed.exam.id}/take`));
    await expect(page.getByText('考试监考')).toBeVisible();
    await expect(page.locator('.exam-timer-chip strong')).toHaveText(/\d{2}:\d{2}/);
    await expect(page.getByRole('button', { name: '保存草稿' })).toBeDisabled();
    await enterFullscreenForE2E(page);

    await answerCurrentQuestion(page);
    await page.getByRole('button', { name: '保存草稿' }).click();
    await expect(page.getByText('草稿已保存')).toBeVisible();

    await leaveFullscreenForE2E(page);
    await expect(page.locator('.proctor-event-list')).toContainText('退出全屏答题环境');
    await expect(page.getByRole('button', { name: '保存草稿' })).toBeDisabled();

    await expect
      .poll(
        async () => {
          const eventsPage = await mindmarkApi<
            ExamSecurityEventResponse[] | PageEnvelope<ExamSecurityEventResponse>
          >(
            request,
            'GET',
            `/api/v1/exams/${seed.exam.id}/security-events`,
            undefined,
            seed.teacherToken,
          );
          const events = unwrapItems(eventsPage);
          return events.some((event) => event.eventType === 'FULLSCREEN_EXIT');
        },
        { timeout: 10_000 },
      )
      .toBe(true);

    await enterFullscreenForE2E(page);
    await page.getByRole('button', { name: '确认交卷' }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /确\s*认/ })
      .click();

    await expect(page.getByText('答卷已提交')).toBeVisible();
    await expect(page.getByRole('link', { name: '返回考试中心' })).toBeVisible();
    expect(runtimeErrors).toEqual([]);
  });

  test('教师发布成绩后，学生成绩反馈页面展示真实成绩报告', async ({ page, request }) => {
    const seed = requireSeed();
    const answerSheetId = await resolveAnswerSheetId(request, seed);
    const gradingTaskId = `GT-${answerSheetId}`;

    await expect
      .poll(
        async () => {
          const tasksPage = await mindmarkApi<
            GradingTaskResponse[] | PageEnvelope<GradingTaskResponse>
          >(
            request,
            'GET',
            `/api/v1/grading-tasks?examId=${seed.exam.id}`,
            undefined,
            seed.teacherToken,
          );
          const tasks = unwrapItems(tasksPage);
          return tasks.some(
            (task) => task.id === gradingTaskId || task.answerSheetId === answerSheetId,
          );
        },
        { timeout: 10_000 },
      )
      .toBe(true);

    await mindmarkApi<GradingTaskResponse>(
      request,
      'POST',
      `/api/v1/grading-tasks/${gradingTaskId}/auto-grade`,
      undefined,
      seed.teacherToken,
    );
    await mindmarkApi<GradingTaskResponse>(
      request,
      'POST',
      `/api/v1/grading-tasks/${gradingTaskId}/review`,
      { finalScore: 12, comment: '学生端 E2E 教师复核完成。' },
      seed.teacherToken,
    );
    const published = await mindmarkApi<PublishScoreResponse>(
      request,
      'POST',
      `/api/v1/exams/${seed.exam.id}/publish-scores`,
      undefined,
      seed.teacherToken,
    );
    expect(published.publishedCount).toBeGreaterThanOrEqual(1);

    const studentLogin = await loginByApi(request, seed.studentNo, seed.newPassword);
    const reportsPage = await mindmarkApi<
      StudentScoreReportResponse[] | PageEnvelope<StudentScoreReportResponse>
    >(request, 'GET', '/api/v1/student/score-reports', undefined, studentLogin.token);
    const reports = unwrapItems(reportsPage);
    expect(reports.some((report) => report.examId === seed.exam.id)).toBe(true);

    const runtimeErrors: string[] = [];
    await installRuntimeGuards(page, runtimeErrors);
    await loginAsStudent(page, seed.studentNo, seed.newPassword, '/student/scores');
    await waitForStudentPageReady(page);

    await expect(page.getByRole('heading', { name: '成绩反馈' })).toBeVisible();
    await expect(page.getByRole('heading', { name: seed.exam.title })).toBeVisible();
    await expect(page.locator('.student-score-detail')).toContainText(/教师反馈|题目得分/);
    expect(runtimeErrors).toEqual([]);
  });
});
