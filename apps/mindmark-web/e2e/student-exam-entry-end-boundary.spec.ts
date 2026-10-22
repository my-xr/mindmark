import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const apiBaseUrl = process.env.MINDMARK_API_BASE_URL ?? 'http://localhost:8080';
const teacherUsername = process.env.MINDMARK_TEACHER_USERNAME ?? 'teacher@mindmark.local';
const teacherPassword = process.env.MINDMARK_TEACHER_PASSWORD ?? 'dev-password';

interface ApiEnvelope<T> {
  code: string;
  message: string;
  data: T;
}

interface LoginResponse {
  token: string;
  mustChangePassword: boolean;
}

interface CourseResponse {
  id: string;
}

interface ClassResponse {
  id: string;
  name: string;
}

interface QuestionResponse {
  id: string;
}

interface PaperResponse {
  id: string;
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
  status: string;
}

interface SeedData {
  runId: string;
  teacherToken: string;
  classId: string;
  paperId: string;
  studentNo: string;
  studentPassword: string;
  futureExam: ExamResponse;
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

async function createExam(
  request: APIRequestContext,
  seed: SeedData,
  title: string,
  startAt: Date,
  endAt: Date,
  durationMinutes = 1,
) {
  return mindmarkApi<ExamResponse>(
    request,
    'POST',
    '/api/v1/exams',
    {
      title,
      paperId: seed.paperId,
      classIds: [seed.classId],
      startAt: toIsoOffset(startAt),
      endAt: toIsoOffset(endAt),
      durationMinutes,
    },
    seed.teacherToken,
  );
}

async function prepareSeed(request: APIRequestContext): Promise<SeedData> {
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
      code: `ST-BOUND-${runId}`,
      name: `学生边界验收课程 ${runId}`,
      description: '学生考试进入与结束边界 E2E 造数',
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
      code: `ST-BOUND-CLS-${runId}`,
      name: `学生边界验收班级 ${runId}`,
      grade: '2026',
      major: '软件工程',
      status: 'ACTIVE',
    },
    teacherToken,
  );

  const question = await mindmarkApi<QuestionResponse>(
    request,
    'POST',
    '/api/v1/questions',
    {
      courseId: course.id,
      title: `学生考试进入与结束边界验收题 ${runId}`,
      type: 'SINGLE_CHOICE',
      difficulty: 'EASY',
      knowledgePoints: ['考试时间边界'],
      score: 100,
      answer: 'A',
      analysis: '用于验证未开始不可答题、结束边界自动交卷。',
      options: [
        { key: 'A', content: '后端按时间窗口控制答题' },
        { key: 'B', content: '学生任何时间都能答题' },
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
      title: `学生边界验收 100 分试卷 ${runId}`,
      courseId: course.id,
      description: '100 分单题试卷，用于学生端边界验收',
      durationMinutes: 1,
    },
    teacherToken,
  );
  await mindmarkApi<PaperResponse>(
    request,
    'POST',
    `/api/v1/papers/${paper.id}/questions`,
    { questionId: question.id, score: 100 },
    teacherToken,
  );
  await mindmarkApi<PaperResponse>(
    request,
    'PATCH',
    `/api/v1/papers/${paper.id}/status`,
    { status: 'READY' },
    teacherToken,
  );

  const studentNo = `2026${runId.slice(-8)}`;
  const initialPassword = studentNo.slice(-6);
  const studentPassword = `Boundary${runId.slice(-8)}`;
  await mindmarkApi(
    request,
    'POST',
    `/api/v1/classes/${classInfo.id}/students/import`,
    {
      className: classInfo.name,
      students: [
        {
          studentNo,
          name: `边界验收学生 ${runId.slice(-6)}`,
          email: `${studentNo}@student.mindmark.local`,
          className: classInfo.name,
          grade: '2026',
          major: '软件工程',
        },
      ],
    },
    teacherToken,
  );

  let studentLogin = await loginByApi(request, studentNo, initialPassword);
  if (studentLogin.mustChangePassword) {
    await mindmarkApi(
      request,
      'POST',
      '/api/v1/auth/change-password',
      { oldPassword: initialPassword, newPassword: studentPassword },
      studentLogin.token,
    );
    studentLogin = await loginByApi(request, studentNo, studentPassword);
  }

  const now = new Date();
  const partialSeed = {
    runId,
    teacherToken,
    classId: classInfo.id,
    paperId: paper.id,
    studentNo,
    studentPassword,
  } as SeedData;
  const futureExam = await createExam(
    request,
    partialSeed,
    `未开始禁止进入答题验收 ${runId}`,
    new Date(now.getTime() + 5 * 60_000),
    new Date(now.getTime() + 11 * 60_000),
    5,
  );

  return { ...partialSeed, futureExam };
}

async function loginAsStudent(page: Page, username: string, password: string) {
  await page.goto('/student/exams');
  const visibleState = await Promise.race([
    page
      .locator('form.auth-login-form')
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => 'login' as const),
    page
      .locator('.student-layout')
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => 'student' as const),
  ]).catch(() => 'timeout' as const);

  if (visibleState === 'login') {
    await page.locator('input[autocomplete="username"]').fill(username);
    await page.locator('input[autocomplete="current-password"]').fill(password);
    await page.locator('form.auth-login-form button[type="submit"]').click();
  }

  await expect(page).toHaveURL(/\/student\/exams/);
  await expect(page.locator('.student-layout')).toBeVisible();
}

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

async function enterFullscreenForE2E(page: Page) {
  await page.getByRole('button', { name: '进入全屏答题' }).click();
  await expect(page.getByRole('button', { name: '已进入全屏' })).toBeVisible();
}

async function answerCurrentQuestion(page: Page) {
  const questionPanel = page.locator('.taking-question-panel');
  const firstOption = questionPanel.locator('.option-item').first();
  await expect(firstOption).toBeVisible();
  await firstOption.click();
}

test.describe('学生端考试进入与结束边界 E2E', () => {
  test('未开始禁止作答，进行中考试到结束时间自动交卷', async ({ page, request }) => {
    test.setTimeout(90_000);
    await mindmarkApi<{ status: string }>(request, 'GET', '/api/v1/system/health');
    const seed = await prepareSeed(request);
    const runtimeErrors: string[] = [];
    page.on('pageerror', (error) => runtimeErrors.push(error.message));
    page.on('console', (message) => {
      if (
        message.type() === 'error' &&
        !/favicon|ResizeObserver loop|net::ERR_ABORTED|Failed to load resource/i.test(
          message.text(),
        )
      ) {
        runtimeErrors.push(message.text());
      }
    });
    await installFullscreenHarness(page);

    await loginAsStudent(page, seed.studentNo, seed.studentPassword);
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);

    const futureCard = page
      .locator('.student-exam-card')
      .filter({ hasText: seed.futureExam.title });
    await expect(futureCard).toContainText('未开始');
    await futureCard.getByRole('link').click();
    await expect(page.locator('.exam-notice-timing')).toContainText('距离考试开始还有');
    await expect(page.getByRole('button', { name: /未到开考时间/ })).toBeDisabled();

    await page.goto(`/student/exams/${seed.futureExam.id}/take`);
    await expect(page.getByText('当前不可答题')).toBeVisible();
    await expect(page.getByRole('button', { name: '保存草稿' })).toBeDisabled();
    await expect(page.getByRole('button', { name: '确认交卷' })).toBeDisabled();

    const now = new Date();
    const endingExam = await createExam(
      request,
      seed,
      `结束边界自动交卷验收 ${seed.runId}`,
      new Date(now.getTime() - 70_000),
      // 自动交卷边界测试不应与页面首屏加载竞争，给真实接口和浏览器渲染留出稳定窗口。
      new Date(now.getTime() + 45_000),
      1,
    );
    expect(endingExam.status).toBe('ONGOING');

    await page.goto(`/student/exams/${endingExam.id}/notice`);
    await expect(page.getByRole('heading', { name: '考试须知' })).toBeVisible();
    await expect(page.locator('.exam-notice-fullscreen-card')).toContainText('必须全屏作答');
    await page.getByRole('link', { name: /进入答题/ }).click();
    await expect(page).toHaveURL(new RegExp(`/student/exams/${endingExam.id}/take`));
    await expect(page.locator('.exam-timer-chip strong')).toHaveText(/\d{2}:\d{2}/);

    await enterFullscreenForE2E(page);
    await answerCurrentQuestion(page);

    await expect(page.getByText('答卷已提交')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('考试时间已到，系统已自动交卷')).toBeVisible();

    const studentLogin = await loginByApi(request, seed.studentNo, seed.studentPassword);
    const studentExams = await mindmarkApi<StudentExamResponse[]>(
      request,
      'GET',
      '/api/v1/student/exams',
      undefined,
      studentLogin.token,
    );
    const submittedExam = studentExams.find((exam) => exam.id === endingExam.id);
    expect(submittedExam?.answerStatus).toBe('SUBMITTED');
    expect(runtimeErrors).toEqual([]);
  });
});
