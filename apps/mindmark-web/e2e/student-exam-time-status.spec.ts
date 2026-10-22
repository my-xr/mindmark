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
  title: string;
  status: string;
  answerStatus: string;
  answerSheetId: string;
}

interface SeedData {
  runId: string;
  studentNo: string;
  studentPassword: string;
  futureExam: ExamResponse;
  ongoingExam: ExamResponse;
  endedExam: ExamResponse;
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
      code: `ST-TIME-${runId}`,
      name: `学生时间状态验收课程 ${runId}`,
      description: '学生考试时间状态真实验收造数',
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
      code: `ST-TIME-CLS-${runId}`,
      name: `学生时间状态验收班级 ${runId}`,
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
      title: `学生考试时间状态验收单选题 ${runId}`,
      type: 'SINGLE_CHOICE',
      difficulty: 'MEDIUM',
      knowledgePoints: ['考试时间状态'],
      score: 100,
      answer: 'A',
      analysis: '用于验证学生端未开始、进行中、已结束状态展示。',
      options: [
        { key: 'A', content: '按考试时间窗口控制入口' },
        { key: 'B', content: '永远允许进入考试' },
        { key: 'C', content: '未发布也显示可考试' },
        { key: 'D', content: '忽略学生班级范围' },
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
      title: `学生考试时间状态验收试卷 ${runId}`,
      courseId: course.id,
      description: '100 分单题试卷，仅用于时间状态验收',
      durationMinutes: 5,
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
  const studentPassword = `TimeE2e${runId.slice(-8)}`;
  await mindmarkApi(
    request,
    'POST',
    `/api/v1/classes/${classInfo.id}/students/import`,
    {
      className: classInfo.name,
      students: [
        {
          studentNo,
          name: `时间状态学生 ${runId}`,
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
  const futureExam = await mindmarkApi<ExamResponse>(
    request,
    'POST',
    '/api/v1/exams',
    {
      title: `未开始倒计时验收 ${runId}`,
      paperId: paper.id,
      classIds: [classInfo.id],
      startAt: toIsoOffset(new Date(now.getTime() + 20_000)),
      endAt: toIsoOffset(new Date(now.getTime() + 10 * 60_000)),
      durationMinutes: 5,
    },
    teacherToken,
  );
  const ongoingExam = await mindmarkApi<ExamResponse>(
    request,
    'POST',
    '/api/v1/exams',
    {
      title: `可进入状态验收 ${runId}`,
      paperId: paper.id,
      classIds: [classInfo.id],
      startAt: toIsoOffset(new Date(now.getTime() - 60_000)),
      endAt: toIsoOffset(new Date(now.getTime() + 10 * 60_000)),
      durationMinutes: 5,
    },
    teacherToken,
  );
  const endedExam = await mindmarkApi<ExamResponse>(
    request,
    'POST',
    '/api/v1/exams',
    {
      title: `已结束状态验收 ${runId}`,
      paperId: paper.id,
      classIds: [classInfo.id],
      startAt: toIsoOffset(new Date(now.getTime() - 10 * 60_000)),
      endAt: toIsoOffset(new Date(now.getTime() - 60_000)),
      durationMinutes: 5,
    },
    teacherToken,
  );

  const studentExams = await mindmarkApi<StudentExamResponse[]>(
    request,
    'GET',
    '/api/v1/student/exams',
    undefined,
    studentLogin.token,
  );
  const future = studentExams.find((exam) => exam.id === futureExam.id);
  const ongoing = studentExams.find((exam) => exam.id === ongoingExam.id);
  const ended = studentExams.find((exam) => exam.id === endedExam.id);
  expect(future?.status).toBe('SCHEDULED');
  expect(future?.answerStatus).toBe('NOT_STARTED');
  expect(ongoing?.status).toBe('ONGOING');
  expect(['NOT_STARTED', 'IN_PROGRESS']).toContain(ongoing?.answerStatus);
  expect(['ENDED', 'GRADING']).toContain(ended?.status);
  expect(['ABSENT', 'NOT_STARTED']).toContain(ended?.answerStatus);

  return { runId, studentNo, studentPassword, futureExam, ongoingExam, endedExam };
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

test.describe('学生考试时间状态真实验收', () => {
  test('考试列表和须知页按时间窗口展示状态并自动启用入口', async ({ page, request }) => {
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

    await loginAsStudent(page, seed.studentNo, seed.studentPassword);
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);

    const futureCard = page
      .locator('.student-exam-card')
      .filter({ hasText: seed.futureExam.title });
    const ongoingCard = page
      .locator('.student-exam-card')
      .filter({ hasText: seed.ongoingExam.title });
    const endedCard = page.locator('.student-exam-card').filter({ hasText: seed.endedExam.title });

    await expect(futureCard).toContainText('未开始');
    await expect(futureCard).toContainText('距离考试开始还有');
    await expect(ongoingCard).toContainText('可进入');
    await expect(ongoingCard).toContainText('考试进行中');
    await expect(endedCard).toContainText(/已结束|缺考/);

    await futureCard.getByRole('link').click();
    await expect(page).toHaveURL(new RegExp(`/student/exams/${seed.futureExam.id}/notice`));
    await expect(page.getByRole('heading', { name: '考试须知' })).toBeVisible();
    await expect(page.locator('.exam-notice-timing')).toContainText('距离考试开始还有');
    await expect(page.locator('.exam-notice-fullscreen-card')).toContainText('必须全屏作答');
    await expect(page.getByRole('button', { name: /未到开考时间/ })).toBeDisabled();

    await expect(page.getByRole('link', { name: /进入答题/ })).toBeVisible({ timeout: 35_000 });
    await expect(page.locator('.exam-notice-timing')).toContainText('考试进行中');
    expect(runtimeErrors).toEqual([]);
  });
});
