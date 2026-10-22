import { mockExams } from '@/mock/paperExamMock';
import { apiGet, apiPost, apiPut, type PageResponse, useMockApi } from '@/services/api/httpClient';
import { getPaperById, getStudentPaperByExamId } from '@/services/paperService';
import type {
  AnswerSheet,
  AnswerSheetStatus,
  Exam,
  ExamCreateRequest,
  ExamStatus,
  StudentAnswer,
  StudentExamStatus,
  StudentExamSummary,
} from '@/types/exam';
import type { Paper } from '@/types/paper';

interface ExamResponse {
  id: string;
  title: string;
  paperId: string;
  paperTitle: string;
  classIds: string[];
  startAt: string;
  endAt: string;
  durationMinutes: number;
  totalScore: number | string;
  status: string;
  participantCount?: number;
  submittedCount?: number;
  createdBy: string;
  updatedAt: string;
}

interface StudentExamResponse extends ExamResponse {
  answerSheetId: string;
  answerStatus: string;
  answerVersion: number;
}

interface AnswerItemResponse {
  questionId: string;
  answer: string | string[];
}

interface AnswerSheetResponse {
  id: string;
  examId: string;
  studentId: string;
  status: string;
  answers: AnswerItemResponse[];
  startedAt?: string | null;
  submittedAt?: string | null;
  version: number;
}

const answerSheetIdByExamId = new Map<string, string>();
const answerSheetVersionByExamId = new Map<string, number>();

const mockDelay = <T>(data: T, timeout = 280) =>
  new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(data), timeout);
  });

let exams: Exam[] = mockExams.map((exam) => ({ ...exam }));
let answerSheets: AnswerSheet[] = [
  {
    id: 'sheet-exam-001-current',
    examId: 'exam-001',
    studentId: 'student-current',
    status: 'SUBMITTED',
    startedAt: '2026-07-17 14:03',
    submittedAt: '2026-07-17 15:21',
    answers: [
      { questionId: 'Q-1001', type: 'SINGLE_CHOICE', answer: 'B' },
      { questionId: 'Q-1002', type: 'MULTIPLE_CHOICE', answer: ['A', 'C'] },
      {
        questionId: 'Q-1006',
        type: 'PROGRAMMING',
        answer:
          'function debounce(fn, delay) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; }',
      },
    ],
  },
  {
    id: 'sheet-exam-001-002',
    examId: 'exam-001',
    studentId: 'student-002',
    status: 'SUBMITTED',
    startedAt: '2026-07-17 14:02',
    submittedAt: '2026-07-17 15:18',
    answers: [
      { questionId: 'Q-1001', type: 'SINGLE_CHOICE', answer: 'A' },
      { questionId: 'Q-1002', type: 'MULTIPLE_CHOICE', answer: ['A'] },
      { questionId: 'Q-1003', type: 'TRUE_FALSE', answer: 'False' },
      {
        questionId: 'Q-1005',
        type: 'SHORT_ANSWER',
        answer: 'URI is an API address. GET and POST can operate data.',
      },
    ],
  },
];
let examSequence = 100;

const cloneExam = (exam: Exam): Exam => ({ ...exam, paper: { ...exam.paper } });

const cloneAnswerSheet = (sheet: AnswerSheet): AnswerSheet => ({
  ...sheet,
  answers: sheet.answers.map((answer) => ({
    ...answer,
    answer: Array.isArray(answer.answer) ? [...answer.answer] : answer.answer,
  })),
});

const nowText = () => {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, '0');

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
    now.getHours(),
  )}:${pad(now.getMinutes())}`;
};

const toTimeRange = (exam: Exam) => `${exam.startTime} - ${exam.endTime}`;

const getSubmittedSheet = (examId: string) =>
  answerSheets.find((sheet) => sheet.examId === examId && sheet.status === 'SUBMITTED');

const toStudentStatus = (exam: Exam): StudentExamStatus => {
  if (exam.status === 'GRADED' || exam.status === 'PUBLISHED') {
    return 'GRADED';
  }

  if (getSubmittedSheet(exam.id)) {
    return 'SUBMITTED';
  }

  if (exam.status === 'IN_PROGRESS') {
    return 'AVAILABLE';
  }
  if (exam.status === 'ENDED' || exam.status === 'GRADING') {
    return 'ENDED';
  }

  return 'NOT_STARTED';
};

const formatLocalDateTime = (date: Date) => {
  const pad = (part: number) => part.toString().padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

const normalizeDateTime = (value: string) => {
  const trimmed = value.trim();
  const normalized = trimmed.replace(' ', 'T');
  const timestamp = Date.parse(normalized);

  if (!Number.isNaN(timestamp)) {
    return formatLocalDateTime(new Date(timestamp));
  }

  return trimmed.replace('T', ' ').replace(/:00(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/, '');
};

const toOffsetDateTime = (value: string) => {
  const normalized = value.trim().replace(' ', 'T');
  const withSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)
    ? `${normalized}:00`
    : normalized;

  return /(?:Z|[+-]\d{2}:?\d{2})$/.test(withSeconds) ? withSeconds : `${withSeconds}+08:00`;
};

const mapExamStatus = (status: string): ExamStatus => {
  if (status === 'ONGOING') {
    return 'IN_PROGRESS';
  }
  if (status === 'ENDED') {
    return 'ENDED';
  }
  if (status === 'SCORES_PUBLISHED') {
    return 'PUBLISHED';
  }

  return status as ExamStatus;
};

const mapAnswerSheetStatus = (status: string): AnswerSheetStatus => {
  if (status === 'ABSENT') {
    return 'ABSENT';
  }
  if (status === 'SUBMITTED' || status === 'GRADING' || status === 'GRADED') {
    return 'SUBMITTED';
  }

  return 'IN_PROGRESS';
};

const mapStudentStatus = (answerStatus: string, examStatus: string): StudentExamStatus => {
  if (answerStatus === 'ABSENT') {
    return 'ABSENT';
  }
  if (answerStatus === 'GRADED' || examStatus === 'SCORES_PUBLISHED') {
    return 'GRADED';
  }
  if (answerStatus === 'SUBMITTED') {
    return 'SUBMITTED';
  }
  if (
    examStatus === 'ONGOING' &&
    (answerStatus === 'IN_PROGRESS' || answerStatus === 'NOT_STARTED')
  ) {
    return 'AVAILABLE';
  }
  if (examStatus === 'ENDED' || examStatus === 'GRADING') {
    return 'ENDED';
  }

  return 'NOT_STARTED';
};

const minimalPaper = (response: ExamResponse): Paper => ({
  id: response.paperId,
  title: response.paperTitle,
  courseId: 'UNKNOWN',
  courseName: response.paperTitle,
  description: '',
  durationMinutes: response.durationMinutes,
  totalScore: Number(response.totalScore),
  status: 'PUBLISHED',
  questions: [],
  createdBy: response.createdBy,
  updatedAt: response.updatedAt,
});

const toExam = async (response: ExamResponse, student = false): Promise<Exam> => {
  const fallbackPaper = minimalPaper(response);
  let paper = fallbackPaper;

  if (student) {
    // Scheduled/ended exams expose their schedule through the exam endpoint,
    // but question content is released only during the server-controlled
    // answer window.
    if (response.status === 'ONGOING') {
      try {
        paper = (await getStudentPaperByExamId(response.id)) ?? fallbackPaper;
      } catch (error) {
        console.warn('Unable to load the current student exam paper.', error);
      }
    }
  } else {
    paper = (await getPaperById(response.paperId)) ?? fallbackPaper;
  }
  const classNames = response.classIds.length > 0 ? response.classIds : ['class-frontend-1'];

  return {
    id: response.id,
    title: response.title,
    courseName: paper.courseName,
    paperId: response.paperId,
    paper,
    classNames,
    startAt: response.startAt,
    endAt: response.endAt,
    startTime: normalizeDateTime(response.startAt),
    endTime: normalizeDateTime(response.endAt),
    durationMinutes: response.durationMinutes,
    status: mapExamStatus(response.status),
    participantCount: response.participantCount ?? Math.max(1, classNames.length),
    submittedCount: response.submittedCount ?? 0,
    createdBy: response.createdBy,
  };
};

const toAnswerSheet = async (response: AnswerSheetResponse): Promise<AnswerSheet> => {
  answerSheetIdByExamId.set(response.examId, response.id);
  answerSheetVersionByExamId.set(response.examId, response.version);
  const exam = await getExamById(response.examId, { student: true });
  const answers = response.answers.map((answer) => {
    const question = exam?.paper.questions.find(
      (item) => item.questionId === answer.questionId,
    )?.question;

    return {
      questionId: answer.questionId,
      type: question?.type ?? 'SHORT_ANSWER',
      answer: answer.answer,
    };
  });

  return {
    id: response.id,
    examId: response.examId,
    studentId: response.studentId,
    status: mapAnswerSheetStatus(response.status),
    answers,
    version: response.version,
    ...(response.startedAt ? { startedAt: normalizeDateTime(response.startedAt) } : {}),
    ...(response.submittedAt ? { submittedAt: normalizeDateTime(response.submittedAt) } : {}),
  };
};

const resolveRealAnswerSheetId = async (examId: string) => {
  const cachedId = answerSheetIdByExamId.get(examId);

  if (cachedId) {
    return cachedId;
  }

  await listStudentExams();
  const resolvedId = answerSheetIdByExamId.get(examId);

  if (!resolvedId) {
    throw new Error('当前学生没有该考试答卷，请确认考试已包含当前登录学生所在班级。');
  }

  return resolvedId;
};

export async function listExams(): Promise<Exam[]> {
  const page = await listExamsPage(1, 100);

  return page.items;
}

export async function listExamsPage(page = 1, pageSize = 20): Promise<PageResponse<Exam>> {
  if (!useMockApi) {
    const response = await apiGet<PageResponse<ExamResponse>>('/v1/exams', { page, pageSize });
    const items = await Promise.all(response.items.map((item) => toExam(item)));

    return {
      ...response,
      items,
    };
  }

  const safePage = Math.max(Number(page) || 1, 1);
  const safePageSize = Math.min(Math.max(Number(pageSize) || 20, 1), 100);
  const start = (safePage - 1) * safePageSize;

  return mockDelay({
    items: exams.slice(start, start + safePageSize).map(cloneExam),
    total: exams.length,
    page: safePage,
    pageSize: safePageSize,
  });
}

export async function getExamById(
  id: string,
  options: { student?: boolean } = {},
): Promise<Exam | undefined> {
  if (!useMockApi) {
    try {
      const response = await apiGet<ExamResponse>(`/v1/exams/${id}`);

      return toExam(response, options.student === true);
    } catch (error) {
      console.warn(error);

      return undefined;
    }
  }

  const exam = exams.find((item) => item.id === id);

  return mockDelay(exam ? cloneExam(exam) : undefined);
}

export async function updateExamStatus(id: string, status: ExamStatus): Promise<Exam | undefined> {
  if (!useMockApi) {
    console.warn(
      `Exam status update is frontend-only before backend status transitions land: ${id} -> ${status}`,
    );

    return getExamById(id);
  }

  exams = exams.map((exam) => (exam.id === id ? { ...exam, status } : exam));

  return getExamById(id);
}

export async function createExam(request: ExamCreateRequest): Promise<Exam[]> {
  if (!useMockApi) {
    const paper = await getPaperById(request.paperId);
    await apiPost<
      ExamResponse,
      {
        title: string;
        paperId: string;
        classIds: string[];
        startAt: string;
        endAt: string;
        durationMinutes?: number;
      }
    >('/v1/exams', {
      title: request.title,
      paperId: request.paperId,
      classIds: request.classIds,
      startAt: toOffsetDateTime(request.startTime),
      endAt: toOffsetDateTime(request.endTime),
      ...(paper ? { durationMinutes: paper.durationMinutes } : {}),
    });

    return listExams();
  }

  const paper = await getPaperById(request.paperId);

  if (!paper) {
    return listExams();
  }

  examSequence += 1;
  const exam: Exam = {
    id: `exam-${examSequence}`,
    title: request.title,
    courseName: paper.courseName,
    paperId: paper.id,
    paper,
    classNames: request.classNames ?? request.classIds,
    startAt: request.startTime,
    endAt: request.endTime,
    startTime: request.startTime,
    endTime: request.endTime,
    durationMinutes: paper.durationMinutes,
    status: 'SCHEDULED',
    participantCount: Math.max(1, request.classIds.length),
    submittedCount: 0,
    createdBy: 'Current teacher',
  };

  exams = [exam, ...exams];

  return listExams();
}

export async function listStudentExams(): Promise<StudentExamSummary[]> {
  if (!useMockApi) {
    const responses = await apiGet<StudentExamResponse[]>('/v1/student/exams');

    responses.forEach((response) => {
      answerSheetIdByExamId.set(response.id, response.answerSheetId);
      answerSheetVersionByExamId.set(response.id, response.answerVersion);
    });

    return responses.map((response) => ({
      id: response.id,
      title: response.title,
      courseName: response.paperTitle,
      timeRange: `${normalizeDateTime(response.startAt)} - ${normalizeDateTime(response.endAt)}`,
      startAt: response.startAt,
      endAt: response.endAt,
      startTime: normalizeDateTime(response.startAt),
      endTime: normalizeDateTime(response.endAt),
      durationMinutes: response.durationMinutes,
      totalScore: Number(response.totalScore),
      status: mapStudentStatus(response.answerStatus, response.status),
    }));
  }

  const summaries = exams.map((exam) => {
    const submittedSheet = getSubmittedSheet(exam.id);
    const baseSummary = {
      id: exam.id,
      title: exam.title,
      courseName: exam.courseName,
      timeRange: toTimeRange(exam),
      startAt: exam.startAt ?? exam.startTime,
      endAt: exam.endAt ?? exam.endTime,
      startTime: exam.startTime,
      endTime: exam.endTime,
      durationMinutes: exam.durationMinutes,
      totalScore: exam.paper.totalScore,
      status: toStudentStatus(exam),
    };

    return submittedSheet?.submittedAt
      ? { ...baseSummary, submittedAt: submittedSheet.submittedAt }
      : baseSummary;
  });

  return mockDelay(summaries);
}

export async function listSubmittedAnswerSheets(): Promise<AnswerSheet[]> {
  if (!useMockApi) {
    const studentExams = await listStudentExams();
    const submittedSheets = await Promise.all(
      studentExams
        .filter((exam) => exam.status === 'SUBMITTED' || exam.status === 'GRADED')
        .map(async (exam) => {
          const answerSheetId = answerSheetIdByExamId.get(exam.id);

          return answerSheetId
            ? toAnswerSheet(await apiGet<AnswerSheetResponse>(`/v1/answer-sheets/${answerSheetId}`))
            : undefined;
        }),
    );

    return submittedSheets.filter((sheet): sheet is AnswerSheet => Boolean(sheet));
  }

  return mockDelay(
    answerSheets
      .filter((sheet) => sheet.status === 'SUBMITTED')
      .map((sheet) => cloneAnswerSheet(sheet)),
    120,
  );
}

export async function startAnswerSheet(examId: string): Promise<AnswerSheet> {
  if (!useMockApi) {
    const answerSheetId = await resolveRealAnswerSheetId(examId);

    return toAnswerSheet(await apiGet<AnswerSheetResponse>(`/v1/answer-sheets/${answerSheetId}`));
  }

  const existing = answerSheets.find(
    (sheet) =>
      sheet.examId === examId &&
      sheet.studentId === 'student-current' &&
      sheet.status !== 'SUBMITTED',
  );

  if (existing) {
    return mockDelay(cloneAnswerSheet(existing));
  }

  const sheet: AnswerSheet = {
    id: `sheet-${examId}-${Date.now()}`,
    examId,
    studentId: 'student-current',
    status: 'IN_PROGRESS',
    answers: [],
    startedAt: nowText(),
    version: 0,
  };

  answerSheets = [sheet, ...answerSheets];

  return mockDelay(cloneAnswerSheet(sheet));
}

export async function saveAnswerDraft(
  examId: string,
  answers: StudentAnswer[],
): Promise<AnswerSheet> {
  if (!useMockApi) {
    const answerSheetId = await resolveRealAnswerSheetId(examId);
    const expectedVersion = answerSheetVersionByExamId.get(examId);
    const response = await apiPut<
      AnswerSheetResponse,
      {
        answers: { questionId: string; answer: string | string[] }[];
        clientSavedAt: string;
        expectedVersion?: number;
      }
    >(`/v1/answer-sheets/${answerSheetId}/draft`, {
      answers: answers.map((answer) => ({ questionId: answer.questionId, answer: answer.answer })),
      clientSavedAt: new Date().toISOString(),
      ...(expectedVersion === undefined ? {} : { expectedVersion }),
    });

    return toAnswerSheet(response);
  }

  const sheet = await startAnswerSheet(examId);
  const updated: AnswerSheet = {
    ...sheet,
    answers,
    status: 'IN_PROGRESS',
    version: (sheet.version ?? 0) + 1,
  };
  answerSheets = answerSheets.map((item) => (item.id === sheet.id ? updated : item));

  return mockDelay(cloneAnswerSheet(updated), 160);
}

export async function submitAnswerSheet(
  examId: string,
  answers: StudentAnswer[],
): Promise<AnswerSheet> {
  if (!useMockApi) {
    let answerSheetId = await resolveRealAnswerSheetId(examId);
    try {
      const draft = await saveAnswerDraft(examId, answers);
      answerSheetId = draft.id;
    } catch (error) {
      console.warn(
        'Draft save before submit failed, submit current server-side sheet directly.',
        error,
      );
    }
    const response = await apiPost<AnswerSheetResponse>(
      `/v1/answer-sheets/${answerSheetId}/submit`,
    );

    return toAnswerSheet(response);
  }

  const sheet = await startAnswerSheet(examId);
  const updated: AnswerSheet = {
    ...sheet,
    answers,
    status: 'SUBMITTED',
    submittedAt: nowText(),
    version: (sheet.version ?? 0) + 1,
  };

  answerSheets = answerSheets.map((item) => (item.id === sheet.id ? updated : item));
  exams = exams.map((exam) =>
    exam.id === examId
      ? {
          ...exam,
          status: 'GRADING',
          submittedCount: Math.min(exam.participantCount, exam.submittedCount + 1),
        }
      : exam,
  );

  return mockDelay(cloneAnswerSheet(updated));
}
