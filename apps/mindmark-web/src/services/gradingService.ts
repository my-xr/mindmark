import {
  getExamById,
  listExams,
  listSubmittedAnswerSheets,
  updateExamStatus,
} from '@/services/examService';
import { apiGet, apiPost, useMockApi, type PageResponse } from '@/services/api/httpClient';
import type { AnswerSheet, Exam, StudentAnswer } from '@/types/exam';
import type {
  ExamScoreSummary,
  GradingAiJob,
  GradingScoreOverride,
  ScoreBandKey,
  ScoreBandSummary,
  GradingTask,
  KnowledgeFeedback,
  QuestionGrade,
  StudentScoreReport,
} from '@/types/grading';
import type { PaperQuestion } from '@/types/paper';
import type { QuestionType } from '@/types/question';

type BackendAnswerValue = string | string[] | number | boolean | Record<string, unknown> | null;

interface BackendGradingItem {
  id: string;
  questionId: string;
  questionTitle: string;
  questionType: QuestionType;
  maxScore: number | string;
  autoScore?: number | string | null;
  finalScore?: number | string | null;
  objective: boolean;
  correct?: boolean | null;
  aiConfidence?: number | string | null;
  needsReview?: boolean | null;
  comment?: string | null;
  gradingSource?: string | null;
  aiProvider?: string | null;
  aiModel?: string | null;
  aiRubricVersion?: string | null;
  aiRawScore?: number | string | null;
  teacherOverrideReason?: string | null;
  scoreDiff?: number | string | null;
  studentAnswer?: BackendAnswerValue;
}

interface BackendGradingTask {
  id: string;
  examId: string;
  examTitle: string;
  answerSheetId: string;
  studentId: string;
  studentName: string;
  status: string;
  objectiveScore?: number | string | null;
  subjectiveScore?: number | string | null;
  aiScore?: number | string | null;
  finalScore?: number | string | null;
  passScore?: number | string | null;
  passed?: boolean | null;
  failed?: boolean | null;
  needsReview?: boolean | null;
  reviewReason?: string | null;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string | null;
  items: BackendGradingItem[];
}

interface BackendGradingAiJob {
  id: string;
  gradingTaskId: string;
  status: GradingAiJob['status'];
  teacherId: string;
  provider?: string | null;
  model?: string | null;
  subjectiveItemCount: number;
  processedItemCount: number;
  refreshedItemCount: number;
  errorMessage?: string | null;
  durationMs?: number | null;
  promptVersion?: string | null;
  requestId?: string | null;
  resultSummary?: string | null;
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  updatedAt: string;
}
interface BackendBatchGradingTaskOperationResponse {
  matchedCount: number;
  processedCount: number;
  skippedFailedCount: number;
  skippedPendingCount: number;
  skippedReviewedCount: number;
  message: string;
}

interface BackendScoreSummaryItem {
  gradingTaskId: string;
  answerSheetId: string;
  studentId: string;
  studentName: string;
  objectiveScore?: number | string | null;
  subjectiveScore?: number | string | null;
  finalScore: number | string;
  rank: number;
}

interface BackendScoreBandSummary {
  key: ScoreBandKey;
  label: string;
  minPercent?: number | null;
  maxPercent?: number | null;
  count: number;
}

interface BackendExamScoreSummary {
  examId: string;
  examTitle: string;
  totalScore: number | string;
  reviewedCount: number;
  submittedCount?: number;
  averageScore: number | string;
  highestScore: number | string;
  lowestScore: number | string;
  scoreBands?: BackendScoreBandSummary[];
  items: BackendScoreSummaryItem[];
}

interface BackendScoreReport {
  id: string;
  examId: string;
  examTitle: string;
  score: number | string;
  rank?: number | null;
  weakKnowledgePoints: string[];
  feedback: string;
  publishedAt?: string | null;
  courseName?: string | null;
  studentId?: string | null;
  studentName?: string | null;
  className?: string | null;
  totalScore?: number | string | null;
}

const toNumber = (value: number | string | null | undefined) => Number(value ?? 0);

const SCORE_BAND_DEFINITIONS: Array<{
  key: ScoreBandKey;
  label: string;
  minPercent?: number;
  maxPercent?: number;
}> = [
  { key: 'FAILED', label: '不及格', maxPercent: 59 },
  { key: 'S60_69', label: '60-69', minPercent: 60, maxPercent: 69 },
  { key: 'S70_79', label: '70-79', minPercent: 70, maxPercent: 79 },
  { key: 'S80_89', label: '80-89', minPercent: 80, maxPercent: 89 },
  { key: 'S90_100', label: '90-100', minPercent: 90, maxPercent: 100 },
];

const scorePercent = (score: number, totalScore: number) =>
  totalScore > 0 ? (score / totalScore) * 100 : 0;

const isScoreInBand = (score: number, totalScore: number, key: ScoreBandKey) => {
  const percent = scorePercent(score, totalScore);

  switch (key) {
    case 'FAILED':
      return percent < 60;
    case 'S60_69':
      return percent >= 60 && percent < 70;
    case 'S70_79':
      return percent >= 70 && percent < 80;
    case 'S80_89':
      return percent >= 80 && percent < 90;
    case 'S90_100':
      return percent >= 90;
    default:
      return false;
  }
};

const buildScoreBandsFromScores = (scores: number[], totalScore: number): ScoreBandSummary[] =>
  SCORE_BAND_DEFINITIONS.map((band) => ({
    ...band,
    count: scores.filter((score) => isScoreInBand(score, totalScore, band.key)).length,
  }));

const mapBackendScoreBands = (
  scoreBands: BackendScoreBandSummary[] | undefined,
  scores: number[],
  totalScore: number,
): ScoreBandSummary[] =>
  scoreBands && scoreBands.length > 0
    ? scoreBands.map((band) => ({
        key: band.key,
        label: band.label,
        ...(band.minPercent !== null && band.minPercent !== undefined
          ? { minPercent: band.minPercent }
          : {}),
        ...(band.maxPercent !== null && band.maxPercent !== undefined
          ? { maxPercent: band.maxPercent }
          : {}),
        count: band.count,
      }))
    : buildScoreBandsFromScores(scores, totalScore);

const normalizeStudentAnswer = (value: BackendAnswerValue | undefined): string | string[] => {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
};

const nowText = () => {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, '0');

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
    now.getHours(),
  )}:${pad(now.getMinutes())}`;
};

const mockDelay = async <T>(value: T): Promise<T> =>
  new Promise((resolve) => {
    window.setTimeout(() => resolve(value), 120);
  });

const paginateArray = <T>(items: T[], page = 1, pageSize = 10): PageResponse<T> => {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / safePageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * safePageSize;

  return {
    items: items.slice(start, start + safePageSize),
    total: items.length,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
    hasPrevious: safePage > 1,
    hasNext: safePage < totalPages,
  };
};

const normalizeBackendDateTime = (value?: string | null) =>
  value ? value.replace('T', ' ').replace(/:00(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/, '') : nowText();

const mapBackendTaskStatus = (status: string) =>
  (status === 'AI_CHECKED' ? 'AI_GRADED' : status) as GradingTask['status'];

const toGradingAiJob = (job: BackendGradingAiJob | null | undefined): GradingAiJob | null =>
  job
    ? {
        id: job.id,
        gradingTaskId: job.gradingTaskId,
        status: job.status,
        teacherId: job.teacherId,
        provider: job.provider,
        model: job.model,
        subjectiveItemCount: job.subjectiveItemCount,
        processedItemCount: job.processedItemCount,
        refreshedItemCount: job.refreshedItemCount,
        errorMessage: job.errorMessage,
        ...(job.durationMs !== null && job.durationMs !== undefined
          ? { durationMs: job.durationMs }
          : {}),
        ...(job.promptVersion ? { promptVersion: job.promptVersion } : {}),
        ...(job.requestId ? { requestId: job.requestId } : {}),
        ...(job.resultSummary ? { resultSummary: job.resultSummary } : {}),
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        updatedAt: job.updatedAt,
      }
    : null;
const toQuestionGrade = (
  item: BackendGradingItem,
  taskStatus: GradingTask['status'],
  exam: Exam | undefined,
): QuestionGrade => {
  const paperQuestion = exam?.paper.questions.find(
    (question) => question.questionId === item.questionId,
  );
  const referenceAnswer = paperQuestion?.question.answer ?? '';
  const finalScore =
    item.finalScore === null || item.finalScore === undefined
      ? undefined
      : toNumber(item.finalScore);
  const autoScore =
    item.autoScore === null || item.autoScore === undefined ? undefined : toNumber(item.autoScore);
  const comment = item.comment ?? undefined;

  return {
    questionId: item.questionId,
    order: paperQuestion?.order ?? 0,
    title: item.questionTitle,
    type: item.questionType,
    maxScore: toNumber(item.maxScore),
    studentAnswer: normalizeStudentAnswer(item.studentAnswer),
    referenceAnswer,
    gradingMode: item.objective ? 'AUTO' : 'AI_ASSISTED',
    status:
      taskStatus === 'REVIEWED'
        ? 'REVIEWED'
        : autoScore !== undefined || finalScore !== undefined
          ? 'AI_GRADED'
          : taskStatus,
    ...(autoScore !== undefined ? { autoScore } : {}),
    ...(finalScore !== undefined ? { finalScore } : {}),
    ...(item.correct !== null && item.correct !== undefined ? { correct: item.correct } : {}),
    ...(item.aiConfidence !== null && item.aiConfidence !== undefined
      ? { aiConfidence: toNumber(item.aiConfidence) }
      : {}),
    ...(item.needsReview !== null && item.needsReview !== undefined
      ? { needsReview: item.needsReview }
      : {}),
    ...(!item.objective && taskStatus === 'AI_GRADED'
      ? { aiSuggestedScore: finalScore ?? autoScore ?? 0 }
      : {}),
    ...(comment ? { teacherComment: comment, aiComment: comment } : {}),
    ...(item.correct === false ? { riskLabel: '答案存在明显偏差' } : {}),
    ...(item.gradingSource ? { gradingSource: item.gradingSource } : {}),
    ...(item.aiProvider ? { aiProvider: item.aiProvider } : {}),
    ...(item.aiModel ? { aiModel: item.aiModel } : {}),
    ...(item.aiRubricVersion ? { aiRubricVersion: item.aiRubricVersion } : {}),
    ...(item.aiRawScore !== null && item.aiRawScore !== undefined
      ? { aiRawScore: toNumber(item.aiRawScore) }
      : {}),
    ...(item.teacherOverrideReason ? { teacherOverrideReason: item.teacherOverrideReason } : {}),
    ...(item.scoreDiff !== null && item.scoreDiff !== undefined
      ? { scoreDiff: toNumber(item.scoreDiff) }
      : {}),
  };
};

const toRealGradingTask = async (task: BackendGradingTask): Promise<GradingTask> => {
  const exam = await getExamById(task.examId);
  const status = mapBackendTaskStatus(task.status);
  const questionGrades = task.items.map((item) => toQuestionGrade(item, status, exam));
  const currentScore = toNumber(task.finalScore ?? task.aiScore ?? task.objectiveScore);

  return {
    id: task.id,
    examId: task.examId,
    examTitle: task.examTitle,
    courseName: exam?.courseName ?? task.examTitle,
    studentId: task.studentId,
    studentName: task.studentName,
    className: exam?.classNames[0] ?? '-',
    submittedAt: normalizeBackendDateTime(task.updatedAt),
    totalScore:
      exam?.paper.totalScore ?? questionGrades.reduce((total, grade) => total + grade.maxScore, 0),
    currentScore,
    passScore: toNumber(task.passScore ?? (exam?.paper.totalScore ?? 0) * 0.6),
    ...(task.passed !== null && task.passed !== undefined ? { passed: task.passed } : {}),
    ...(task.failed !== null && task.failed !== undefined ? { failed: task.failed } : {}),
    ...(task.needsReview !== null && task.needsReview !== undefined
      ? { needsReview: task.needsReview }
      : {}),
    ...(task.reviewReason ? { reviewReason: task.reviewReason } : {}),
    status,
    questionGrades,
    ...(task.reviewedAt ? { reviewedAt: normalizeBackendDateTime(task.reviewedAt) } : {}),
    ...(task.status === 'REVIEWED' ? { reviewer: '当前教师' } : {}),
  };
};

const getRealScoreSummary = async (examId: string): Promise<ExamScoreSummary> => {
  const [summary, exam] = await Promise.all([
    apiGet<BackendExamScoreSummary>(`/v1/exams/${examId}/scores`),
    getExamById(examId),
  ]);
  const scores = summary.items.map((item) => toNumber(item.finalScore));
  const totalScore = toNumber(summary.totalScore);
  const published = exam?.status === 'PUBLISHED';

  return {
    examId: summary.examId,
    examTitle: summary.examTitle,
    courseName: exam?.courseName ?? summary.examTitle,
    totalScore,
    participantCount: exam?.participantCount ?? summary.items.length,
    submittedCount: summary.submittedCount ?? summary.items.length,
    reviewedCount: summary.reviewedCount,
    averageScore: toNumber(summary.averageScore),
    highestScore: toNumber(summary.highestScore),
    lowestScore: toNumber(summary.lowestScore),
    passRate: scores.length
      ? Math.round(
          (scores.filter((score) => score >= totalScore * 0.6).length / scores.length) * 100,
        )
      : 0,
    publishStatus: published ? ('PUBLISHED' as const) : ('UNPUBLISHED' as const),
    scoreBands: mapBackendScoreBands(summary.scoreBands, scores, totalScore),
    ...(published ? { publishedAt: nowText() } : {}),
  };
};

const toRealReport = (
  item: BackendScoreSummaryItem,
  examId: string,
  examTitle: string,
  totalScore: number,
  exam: Exam | undefined,
): StudentScoreReport => ({
  id: item.gradingTaskId,
  examId,
  examTitle,
  courseName: exam?.courseName ?? examTitle,
  studentId: item.studentId,
  studentName: item.studentName,
  className: exam?.classNames[0] ?? '-',
  totalScore,
  score: toNumber(item.finalScore),
  rank: item.rank,
  status: exam?.status === 'PUBLISHED' ? 'PUBLISHED' : 'UNPUBLISHED',
  submittedAt: nowText(),
  knowledgeFeedback: [],
  questionResults: [],
});

const toRealStudentReport = (report: BackendScoreReport): StudentScoreReport => ({
  id: report.id,
  examId: report.examId,
  examTitle: report.examTitle,
  courseName: report.courseName ?? report.examTitle,
  studentId: report.studentId ?? '',
  studentName: report.studentName ?? '',
  className: report.className ?? '-',
  totalScore: toNumber(report.totalScore),
  score: toNumber(report.score),
  ...(report.rank !== null && report.rank !== undefined ? { rank: report.rank } : {}),
  status: 'PUBLISHED',
  submittedAt: normalizeBackendDateTime(report.publishedAt),
  ...(report.publishedAt ? { publishedAt: normalizeBackendDateTime(report.publishedAt) } : {}),
  teacherComment: report.feedback,
  knowledgeFeedback: report.weakKnowledgePoints.map((knowledgePoint) => ({
    knowledgePoint,
    scoreRate: 60,
    suggestion: '建议复习相关课程材料，并重做同类错题。',
  })),
  questionResults: [],
});

const studentProfiles: Record<string, { name: string; className: string }> = {
  'student-current': { name: 'Student Chen', className: 'Software 2401' },
  'student-001': { name: 'Student Alice', className: 'Software 2401' },
  'student-002': { name: 'Student Lin', className: 'Software 2402' },
};

let gradingTasks: GradingTask[] = [];
let publishedExams: Record<string, string> = {};

const cloneTask = (task: GradingTask): GradingTask => ({
  ...task,
  questionGrades: task.questionGrades.map((grade) => ({
    ...grade,
    studentAnswer: Array.isArray(grade.studentAnswer)
      ? [...grade.studentAnswer]
      : grade.studentAnswer,
    referenceAnswer: Array.isArray(grade.referenceAnswer)
      ? [...grade.referenceAnswer]
      : grade.referenceAnswer,
  })),
});

const toAnswerText = (answer: string | string[]) =>
  Array.isArray(answer) ? answer.join('、') : answer;

const normalizeAnswer = (answer: string | string[]) => {
  if (Array.isArray(answer)) {
    return [...answer].sort().join('|').toLowerCase();
  }

  return answer.trim().toLowerCase();
};

const isObjectiveType = (type: QuestionType) =>
  ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK'].includes(type);

const findStudentAnswer = (answers: StudentAnswer[], questionId: string) =>
  answers.find((answer) => answer.questionId === questionId)?.answer ?? '';

const buildObjectiveGrade = (
  item: PaperQuestion,
  studentAnswer: string | string[],
): QuestionGrade => {
  const isCorrect = normalizeAnswer(studentAnswer) === normalizeAnswer(item.question.answer);
  const autoScore = isCorrect ? item.score : 0;

  return {
    questionId: item.questionId,
    order: item.order,
    title: item.question.title,
    type: item.question.type,
    maxScore: item.score,
    studentAnswer,
    referenceAnswer: item.question.answer,
    gradingMode: 'AUTO',
    status: 'REVIEWED',
    autoScore,
    finalScore: autoScore,
    teacherComment: isCorrect ? '客观题自动判定正确。' : '客观题自动判定错误。',
  };
};

const buildAiAssistedGrade = (
  item: PaperQuestion,
  studentAnswer: string | string[],
): QuestionGrade => {
  const answerText = toAnswerText(studentAnswer).toLowerCase();
  const scoringPoints = item.question.scoringPoints;
  const hitScore = scoringPoints.reduce((score, point) => {
    const hit = point.keywords.some((keyword) => answerText.includes(keyword.toLowerCase()));

    return hit ? score + point.score : score;
  }, 0);
  const fallbackScore = Math.round(item.score * (answerText ? 0.55 : 0));
  const aiSuggestedScore = Math.min(
    item.score,
    scoringPoints.length > 0 ? hitScore : fallbackScore,
  );
  const hitRate = scoringPoints.length > 0 ? aiSuggestedScore / item.score : 0.55;
  const aiConfidence = Number(Math.min(0.92, 0.62 + hitRate * 0.26).toFixed(2));

  return {
    questionId: item.questionId,
    order: item.order,
    title: item.question.title,
    type: item.question.type,
    maxScore: item.score,
    studentAnswer,
    referenceAnswer: item.question.answer,
    gradingMode: 'AI_ASSISTED',
    status: 'AI_GRADED',
    aiSuggestedScore,
    aiConfidence,
    aiComment:
      aiSuggestedScore >= item.score * 0.8
        ? 'AI 预判答案覆盖了主要得分点，建议教师复核后确认。'
        : 'AI 认为答案存在缺漏，建议重点核对评分点。',
    ...(aiConfidence < 0.75 ? { riskLabel: 'AI 置信度较低' } : {}),
  };
};

const buildQuestionGrade = (item: PaperQuestion, sheet: AnswerSheet) => {
  const studentAnswer = findStudentAnswer(sheet.answers, item.questionId);

  return isObjectiveType(item.question.type)
    ? buildObjectiveGrade(item, studentAnswer)
    : buildAiAssistedGrade(item, studentAnswer);
};

const sumFinalScore = (grades: QuestionGrade[]) =>
  grades.reduce(
    (total, grade) => total + (grade.finalScore ?? grade.aiSuggestedScore ?? grade.autoScore ?? 0),
    0,
  );

const createTaskFromSheet = async (sheet: AnswerSheet): Promise<GradingTask | null> => {
  const exam = await getExamById(sheet.examId);

  if (!exam || !sheet.submittedAt) {
    return null;
  }

  const profile = studentProfiles[sheet.studentId] ?? {
    name: 'Unknown student',
    className: exam.classNames[0] ?? '-',
  };
  const questionGrades = exam.paper.questions.map((item) => buildQuestionGrade(item, sheet));
  const hasSubjective = questionGrades.some((grade) => grade.status !== 'REVIEWED');
  const currentScore = sumFinalScore(questionGrades);
  const passScore = Math.round(exam.paper.totalScore * 60) / 100;

  return {
    id: `grading-${sheet.id}`,
    examId: exam.id,
    examTitle: exam.title,
    courseName: exam.courseName,
    studentId: sheet.studentId,
    studentName: profile.name,
    className: profile.className,
    submittedAt: sheet.submittedAt,
    totalScore: exam.paper.totalScore,
    currentScore,
    passScore,
    passed: currentScore >= passScore,
    failed: currentScore < passScore,
    needsReview: currentScore < passScore || hasSubjective,
    ...(currentScore < passScore ? { reviewReason: '不及格答卷，需要教师重点复核后再确认。' } : {}),
    status: hasSubjective ? 'AI_GRADED' : 'REVIEWED',
    questionGrades,
  };
};

const syncSubmittedSheets = async () => {
  const sheets = await listSubmittedAnswerSheets();
  const existingIds = new Set(gradingTasks.map((task) => task.id));
  const nextTasks = await Promise.all(
    sheets
      .filter((sheet) => !existingIds.has(`grading-${sheet.id}`))
      .map((sheet) => createTaskFromSheet(sheet)),
  );

  gradingTasks = [
    ...gradingTasks,
    ...nextTasks.filter((task): task is GradingTask => Boolean(task)),
  ];
};

const buildKnowledgeFeedback = (task: GradingTask): KnowledgeFeedback[] => {
  const bucket = new Map<string, { score: number; total: number }>();

  task.questionGrades.forEach((grade) => {
    const scoreRate = grade.maxScore ? (grade.finalScore ?? 0) / grade.maxScore : 0;
    const key = grade.title.includes('HTTP')
      ? 'HTTP Protocol'
      : grade.title.includes('RESTful') || grade.title.includes('URI')
        ? 'API Design'
        : grade.title.includes('Vue')
          ? 'Vue 3'
          : 'JavaScript Basics';
    const current = bucket.get(key) ?? { score: 0, total: 0 };
    bucket.set(key, { score: current.score + scoreRate, total: current.total + 1 });
  });

  return Array.from(bucket.entries()).map(([knowledgePoint, value]) => {
    const scoreRate = Math.round((value.score / value.total) * 100);

    return {
      knowledgePoint,
      scoreRate,
      suggestion:
        scoreRate >= 80
          ? '掌握情况较好，建议保持当前练习节奏。'
          : '建议回看课堂材料，并完成同类错题训练。',
    };
  });
};

const toReport = (task: GradingTask, rank?: number): StudentScoreReport => {
  const publishedAt = publishedExams[task.examId];
  const isPublished = Boolean(publishedAt);
  const report: StudentScoreReport = {
    id: `score-${task.id}`,
    examId: task.examId,
    examTitle: task.examTitle,
    courseName: task.courseName,
    studentId: task.studentId,
    studentName: task.studentName,
    className: task.className,
    totalScore: task.totalScore,
    status: isPublished ? 'PUBLISHED' : 'UNPUBLISHED',
    submittedAt: task.submittedAt,
    knowledgeFeedback: [],
    questionResults: [],
  };

  if (isPublished && task.status === 'REVIEWED') {
    report.score = task.currentScore;
    if (rank !== undefined) {
      report.rank = rank;
    }
    report.reviewedAt = task.reviewedAt ?? task.submittedAt;
    report.publishedAt = publishedAt;
    report.teacherComment = '本次考试已完成复盘，请结合反馈进行订正。';
    report.knowledgeFeedback = buildKnowledgeFeedback(task);
    report.questionResults = task.questionGrades.map((grade) => ({
      questionId: grade.questionId,
      order: grade.order,
      title: grade.title,
      maxScore: grade.maxScore,
      finalScore: grade.finalScore ?? 0,
      ...(grade.teacherComment ? { teacherComment: grade.teacherComment } : {}),
    }));
  }

  return report;
};

export async function listGradingTasksPage(params: {
  page: number;
  pageSize: number;
  examId?: string;
  courseName?: string;
  scoreBand?: ScoreBandKey;
}): Promise<PageResponse<GradingTask>> {
  if (!useMockApi) {
    const response = await apiGet<PageResponse<BackendGradingTask>>('/v1/grading-tasks', params);
    const items = await Promise.all(response.items.map(toRealGradingTask));

    return { ...response, items };
  }

  await syncSubmittedSheets();
  let source = gradingTasks;
  if (params.courseName) {
    source = source.filter((task) => task.courseName === params.courseName);
  }
  if (params.examId) {
    source = source.filter((task) => task.examId === params.examId);
  }
  if (params.scoreBand) {
    source = source.filter((task) =>
      isScoreInBand(task.currentScore, task.totalScore, params.scoreBand as ScoreBandKey),
    );
  }

  return mockDelay(paginateArray(source.map(cloneTask), params.page, params.pageSize));
}

export async function listGradingTaskItemsPage(
  task: GradingTask,
  params: { page: number; pageSize: number },
): Promise<PageResponse<QuestionGrade>> {
  if (!useMockApi) {
    const [response, exam] = await Promise.all([
      apiGet<PageResponse<BackendGradingItem>>(`/v1/grading-tasks/${task.id}/items`, params),
      getExamById(task.examId),
    ]);
    const items = response.items.map((item) => toQuestionGrade(item, task.status, exam));

    return { ...response, items };
  }

  return mockDelay(
    paginateArray(
      task.questionGrades.map((grade) => ({ ...grade })),
      params.page,
      params.pageSize,
    ),
  );
}

export async function listGradingTaskAllItems(task: GradingTask): Promise<QuestionGrade[]> {
  const firstPage = await listGradingTaskItemsPage(task, { page: 1, pageSize: 100 });

  if (firstPage.items.length >= firstPage.total) {
    return firstPage.items;
  }

  const pages = [firstPage.items];
  const totalPages = Math.ceil(firstPage.total / firstPage.pageSize);
  for (let page = 2; page <= totalPages; page += 1) {
    const response = await listGradingTaskItemsPage(task, { page, pageSize: firstPage.pageSize });
    pages.push(response.items);
  }

  return pages.flat();
}

export async function listExamScoreSummariesPage(params: {
  page: number;
  pageSize: number;
}): Promise<PageResponse<ExamScoreSummary>> {
  if (!useMockApi) {
    const response = await apiGet<PageResponse<BackendExamScoreSummary>>(
      '/v1/score-summaries',
      params,
    );
    const items = await Promise.all(
      response.items.map(async (summary) => {
        const exam = await getExamById(summary.examId);
        const totalScore = toNumber(summary.totalScore);
        const scores = summary.items.map((item) => toNumber(item.finalScore));
        const published = exam?.status === 'PUBLISHED';

        return {
          examId: summary.examId,
          examTitle: summary.examTitle,
          courseName: exam?.courseName ?? summary.examTitle,
          totalScore,
          participantCount:
            exam?.participantCount ?? summary.submittedCount ?? summary.items.length,
          submittedCount: summary.submittedCount ?? summary.items.length,
          reviewedCount: summary.reviewedCount,
          averageScore: toNumber(summary.averageScore),
          highestScore: toNumber(summary.highestScore),
          lowestScore: toNumber(summary.lowestScore),
          passRate: scores.length
            ? Math.round(
                (scores.filter((score) => score >= totalScore * 0.6).length / scores.length) * 100,
              )
            : 0,
          publishStatus: published ? ('PUBLISHED' as const) : ('UNPUBLISHED' as const),
          scoreBands: mapBackendScoreBands(summary.scoreBands, scores, totalScore),
          ...(published ? { publishedAt: nowText() } : {}),
        };
      }),
    );

    return { ...response, items };
  }

  const summaries = await listExamScoreSummaries();

  return mockDelay(paginateArray(summaries, params.page, params.pageSize));
}

export async function listScoreReportsByExamPage(
  examId: string,
  params: { page: number; pageSize: number },
): Promise<PageResponse<StudentScoreReport>> {
  if (!useMockApi) {
    const [response, exam] = await Promise.all([
      apiGet<PageResponse<BackendScoreSummaryItem>>(`/v1/exams/${examId}/score-reports`, params),
      getExamById(examId),
    ]);
    const totalScore = exam?.paper.totalScore ?? 0;
    const examTitle = exam?.title ?? examId;
    const items = response.items.map((item) =>
      toRealReport(item, examId, examTitle, totalScore, exam),
    );

    return { ...response, items };
  }

  const reports = await listScoreReportsByExam(examId);

  return mockDelay(paginateArray(reports, params.page, params.pageSize));
}

export async function listGradingTasks(): Promise<GradingTask[]> {
  if (!useMockApi) {
    const tasks = await apiGet<BackendGradingTask[]>('/v1/grading-tasks');
    const detailedTasks = await Promise.all(
      tasks.map((task) => apiGet<BackendGradingTask>(`/v1/grading-tasks/${task.id}`)),
    );

    return Promise.all(detailedTasks.map(toRealGradingTask));
  }

  await syncSubmittedSheets();

  return mockDelay(gradingTasks.map(cloneTask));
}

export async function autoGradeTask(taskId: string): Promise<GradingTask> {
  if (!useMockApi) {
    const response = await apiPost<BackendGradingTask, Record<string, never>>(
      `/v1/grading-tasks/${taskId}/auto-grade`,
      {},
    );
    return toRealGradingTask(response);
  }

  await syncSubmittedSheets();
  const task = gradingTasks.find((item) => item.id === taskId);
  if (!task) {
    throw new Error('Grading task not found');
  }
  task.questionGrades = task.questionGrades.map((grade) => ({
    ...grade,
    finalScore: grade.finalScore ?? grade.aiSuggestedScore ?? grade.autoScore ?? 0,
    status: 'AI_GRADED',
  }));
  task.currentScore = sumFinalScore(task.questionGrades);
  task.status = 'AI_GRADED';
  return mockDelay(cloneTask(task));
}

export async function enqueueAiGradingJob(taskId: string): Promise<GradingAiJob | null> {
  if (!useMockApi) {
    const response = await apiPost<BackendGradingAiJob | null, Record<string, never>>(
      `/v1/grading-tasks/${taskId}/ai-grading-job`,
      {},
    );
    return toGradingAiJob(response);
  }

  return mockDelay({
    id: `MOCK-GAJ-${taskId}`,
    gradingTaskId: taskId,
    status: 'SUCCEEDED',
    teacherId: 'teacher-current',
    provider: 'MOCK',
    model: 'mock-grader',
    subjectiveItemCount: 0,
    processedItemCount: 0,
    refreshedItemCount: 0,
    createdAt: nowText(),
    updatedAt: nowText(),
  });
}

export async function getLatestAiGradingJob(taskId: string): Promise<GradingAiJob | null> {
  if (!useMockApi) {
    const response = await apiGet<BackendGradingAiJob | null>(
      `/v1/grading-tasks/${taskId}/ai-grading-job/latest`,
    );
    return toGradingAiJob(response);
  }

  return mockDelay(null);
}

export async function confirmSystemScore(
  taskId: string,
  includeFailed = false,
): Promise<GradingTask> {
  if (!useMockApi) {
    const response = await apiPost<BackendGradingTask, Record<string, never>>(
      `/v1/grading-tasks/${taskId}/confirm-system-score?includeFailed=${includeFailed}`,
      {},
    );
    return toRealGradingTask(response);
  }

  await syncSubmittedSheets();
  const task = gradingTasks.find((item) => item.id === taskId);
  if (!task) {
    throw new Error('Grading task not found');
  }
  task.status = 'REVIEWED';
  task.reviewedAt = nowText();
  task.reviewer = '当前教师';
  return mockDelay(cloneTask(task));
}

export async function batchAutoGradeTasks(params: {
  examId?: string;
  courseName?: string;
  scoreBand?: ScoreBandKey;
}): Promise<BackendBatchGradingTaskOperationResponse> {
  if (!useMockApi) {
    return apiPost<BackendBatchGradingTaskOperationResponse, typeof params>(
      '/v1/grading-tasks/batch-auto-grade',
      params,
    );
  }
  return mockDelay({
    matchedCount: gradingTasks.length,
    processedCount: gradingTasks.length,
    skippedFailedCount: 0,
    skippedPendingCount: 0,
    skippedReviewedCount: 0,
    message: '已完成当前筛选答卷的系统自动判分',
  });
}

export async function batchConfirmSystemScores(params: {
  examId?: string;
  courseName?: string;
  includeFailed?: boolean;
  onlyAutoGraded?: boolean;
  scoreBand?: ScoreBandKey;
}): Promise<BackendBatchGradingTaskOperationResponse> {
  if (!useMockApi) {
    return apiPost<BackendBatchGradingTaskOperationResponse, typeof params>(
      '/v1/grading-tasks/batch-confirm',
      params,
    );
  }
  return mockDelay({
    matchedCount: gradingTasks.length,
    processedCount: gradingTasks.length,
    skippedFailedCount: 0,
    skippedPendingCount: 0,
    skippedReviewedCount: 0,
    message: '已按系统默认分批量核对',
  });
}

export async function reviewGradingTask(
  taskId: string,
  overrides: GradingScoreOverride[],
): Promise<GradingTask | undefined> {
  if (!useMockApi) {
    let response: BackendGradingTask | undefined;

    for (const override of overrides) {
      response = await apiPost<BackendGradingTask, { finalScore: number; comment?: string }>(
        `/v1/grading-tasks/${taskId}/items/${override.questionId}/review`,
        {
          finalScore: override.finalScore,
          ...(override.teacherComment ? { comment: override.teacherComment } : {}),
        },
      );
    }

    const finalScore = overrides.reduce((total, item) => total + item.finalScore, 0);
    response = await apiPost<BackendGradingTask, { finalScore: number; comment: string }>(
      `/v1/grading-tasks/${taskId}/review`,
      {
        finalScore,
        comment: '教师复核完成',
      },
    );

    return toRealGradingTask(response);
  }

  await syncSubmittedSheets();

  const overrideMap = new Map(overrides.map((override) => [override.questionId, override]));
  let updatedTask: GradingTask | undefined;

  gradingTasks = gradingTasks.map((task) => {
    if (task.id !== taskId) {
      return task;
    }

    const questionGrades = task.questionGrades.map((grade) => {
      const override = overrideMap.get(grade.questionId);
      const fallbackScore = grade.finalScore ?? grade.aiSuggestedScore ?? grade.autoScore ?? 0;
      const finalScore = Math.max(
        0,
        Math.min(grade.maxScore, override?.finalScore ?? fallbackScore),
      );

      return {
        ...grade,
        finalScore,
        status: 'REVIEWED' as const,
        teacherComment: override?.teacherComment || grade.teacherComment || '教师已完成复核。',
      };
    });

    updatedTask = {
      ...task,
      questionGrades,
      currentScore: sumFinalScore(questionGrades),
      status: 'REVIEWED',
      reviewedAt: nowText(),
      reviewer: '当前教师',
    };

    return updatedTask;
  });

  if (updatedTask) {
    const examTasks = gradingTasks.filter((task) => task.examId === updatedTask?.examId);
    const allReviewed =
      examTasks.length > 0 && examTasks.every((task) => task.status === 'REVIEWED');

    if (allReviewed && !publishedExams[updatedTask.examId]) {
      await updateExamStatus(updatedTask.examId, 'GRADED');
    }
  }

  return mockDelay(updatedTask ? cloneTask(updatedTask) : undefined);
}

export async function listExamScoreSummaries(): Promise<ExamScoreSummary[]> {
  if (!useMockApi) {
    const realExams = await listExams();
    const summaries = await Promise.all(realExams.map((exam) => getRealScoreSummary(exam.id)));

    return summaries.filter((summary) => summary.submittedCount > 0 || summary.reviewedCount > 0);
  }

  await syncSubmittedSheets();
  const exams = await listExams();
  const summaries = exams
    .map((exam) => {
      const tasks = gradingTasks.filter((task) => task.examId === exam.id);
      const reviewedTasks = tasks.filter((task) => task.status === 'REVIEWED');
      const scores = reviewedTasks.map((task) => task.currentScore);
      const averageScore = scores.length
        ? Math.round((scores.reduce((total, score) => total + score, 0) / scores.length) * 10) / 10
        : 0;
      const publishedAt =
        publishedExams[exam.id] || (exam.status === 'PUBLISHED' ? nowText() : undefined);
      const summary: ExamScoreSummary = {
        examId: exam.id,
        examTitle: exam.title,
        courseName: exam.courseName,
        totalScore: exam.paper.totalScore,
        participantCount: exam.participantCount,
        submittedCount: Math.max(exam.submittedCount, tasks.length),
        reviewedCount: reviewedTasks.length,
        averageScore,
        highestScore: scores.length ? Math.max(...scores) : 0,
        lowestScore: scores.length ? Math.min(...scores) : 0,
        passRate: scores.length
          ? Math.round(
              (scores.filter((score) => score >= exam.paper.totalScore * 0.6).length /
                scores.length) *
                100,
            )
          : 0,
        publishStatus: publishedAt ? 'PUBLISHED' : 'UNPUBLISHED',
        scoreBands: buildScoreBandsFromScores(scores, exam.paper.totalScore),
      };

      if (publishedAt) {
        summary.publishedAt = publishedAt;
      }

      return summary;
    })
    .filter((summary) => summary.submittedCount > 0 || summary.reviewedCount > 0);

  return mockDelay(summaries);
}

export async function listScoreReportsByExam(examId: string): Promise<StudentScoreReport[]> {
  if (!useMockApi) {
    const summary = await apiGet<BackendExamScoreSummary>(`/v1/exams/${examId}/scores`);
    const totalScore = toNumber(summary.totalScore);

    const exam = await getExamById(examId);

    return summary.items.map((item) =>
      toRealReport(item, examId, summary.examTitle, totalScore, exam),
    );
  }

  await syncSubmittedSheets();
  const tasks = gradingTasks
    .filter((task) => task.examId === examId)
    .sort((left, right) => right.currentScore - left.currentScore);

  return mockDelay(tasks.map((task, index) => toReport(task, index + 1)));
}

export async function publishExamScores(examId: string): Promise<ExamScoreSummary[]> {
  if (!useMockApi) {
    await apiPost(`/v1/exams/${examId}/publish-scores`);

    return listExamScoreSummaries();
  }

  await syncSubmittedSheets();
  const hasReviewedTask = gradingTasks.some(
    (task) => task.examId === examId && task.status === 'REVIEWED',
  );

  if (hasReviewedTask) {
    publishedExams = { ...publishedExams, [examId]: nowText() };
    await updateExamStatus(examId, 'PUBLISHED');
  }

  return listExamScoreSummaries();
}

export async function listStudentScoreReports(
  studentId = 'student-current',
): Promise<StudentScoreReport[]> {
  if (!useMockApi) {
    const reports = await apiGet<BackendScoreReport[]>('/v1/student/score-reports');

    return reports.map(toRealStudentReport);
  }

  await syncSubmittedSheets();
  const tasks = gradingTasks
    .filter((task) => task.studentId === studentId)
    .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt));

  return mockDelay(tasks.map((task) => toReport(task)));
}
