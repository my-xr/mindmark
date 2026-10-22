import {
  apiDownloadBlob,
  apiGet,
  apiPost,
  type PageResponse,
  useMockApi,
} from '@/services/api/httpClient';
import { listExamScoreSummaries, listGradingTasks } from '@/services/gradingService';
import type { ExamScoreSummary, GradingTask, QuestionGrade } from '@/types/grading';
import type {
  AiLectureDraft,
  ExamReviewReport,
  KnowledgeWeakness,
  LectureDraftStatus,
  LectureDraftTask,
  QuestionPerformance,
  ReviewArtifact,
  ReviewArtifactType,
  ReviewInsightLevel,
  ScoreBand,
  StudentLayerInsight,
} from '@/types/review';

const mockDelay = <T>(data: T, timeout = 220) =>
  new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(data), timeout);
  });

let lectureDraftOverrides: Record<string, AiLectureDraft> = {};
let lectureDraftTaskOverrides: Record<string, LectureDraftTask> = {};
let artifactOverrides: Record<string, ReviewArtifact> = {};

const nowText = () => new Date().toISOString();

const round1 = (value: number) => Math.round(value * 10) / 10;
const percent = (value: number) => Math.round(value * 100);
const clampRate = (value: number) => Math.max(0, Math.min(100, value));

const getGradeScore = (grade: QuestionGrade) =>
  grade.finalScore ?? grade.aiSuggestedScore ?? grade.autoScore ?? 0;

const getTaskScore = (task: GradingTask) =>
  task.questionGrades.reduce((total, grade) => total + getGradeScore(grade), 0);

const deriveKnowledgePoint = (title: string) => {
  if (title.includes('HTTP')) {
    return 'HTTP 协议';
  }
  if (title.includes('RESTful') || title.includes('URI')) {
    return '接口设计';
  }
  if (title.includes('Vue')) {
    return 'Vue 3';
  }
  if (title.includes('数据库') || title.toLowerCase().includes('sql')) {
    return '数据库基础';
  }

  return 'JavaScript 基础';
};

const toLevel = (scoreRate: number): ReviewInsightLevel => {
  if (scoreRate >= 80) {
    return 'GOOD';
  }
  return scoreRate >= 60 ? 'WARNING' : 'RISK';
};

const toKnowledgeSuggestion = (knowledgePoint: string, scoreRate: number) => {
  if (scoreRate >= 80) {
    return `${knowledgePoint}整体掌握较好，讲评中可快速回顾并给出迁移题。`;
  }
  if (scoreRate >= 60) {
    return `${knowledgePoint}存在局部失分，建议结合典型错题补充步骤拆解。`;
  }

  return `${knowledgePoint}是本次重点薄弱项，建议安排概念澄清、例题拆解和课后巩固。`;
};

const buildScoreBands = (tasks: GradingTask[], totalScore: number): ScoreBand[] => {
  const bands = [
    { label: '0-59%', min: 0, max: 0.6 },
    { label: '60-74%', min: 0.6, max: 0.75 },
    { label: '75-89%', min: 0.75, max: 0.9 },
    { label: '90-100%', min: 0.9, max: 1.01 },
  ];

  return bands.map((band) => {
    const count = tasks.filter((task) => {
      const rate = totalScore ? getTaskScore(task) / totalScore : 0;
      return rate >= band.min && rate < band.max;
    }).length;

    return {
      label: band.label,
      count,
      ratio: tasks.length ? percent(count / tasks.length) : 0,
    };
  });
};

const buildQuestionPerformances = (tasks: GradingTask[]): QuestionPerformance[] => {
  const bucket = new Map<
    string,
    {
      order: number;
      title: string;
      maxScore: number;
      score: number;
      count: number;
      riskCount: number;
    }
  >();

  tasks.forEach((task) => {
    task.questionGrades.forEach((grade) => {
      const current = bucket.get(grade.questionId) ?? {
        order: grade.order,
        title: grade.title,
        maxScore: grade.maxScore,
        score: 0,
        count: 0,
        riskCount: 0,
      };
      bucket.set(grade.questionId, {
        ...current,
        score: current.score + getGradeScore(grade),
        count: current.count + 1,
        riskCount: current.riskCount + (grade.riskLabel ? 1 : 0),
      });
    });
  });

  return Array.from(bucket.entries())
    .map(([questionId, value]) => {
      const averageScore = value.count ? round1(value.score / value.count) : 0;
      const scoreRate = value.maxScore ? clampRate(percent(averageScore / value.maxScore)) : 0;
      const weaknessTags = [
        ...(scoreRate < 60 ? ['得分率偏低'] : []),
        ...(scoreRate >= 60 && scoreRate < 80 ? ['步骤或表达需巩固'] : []),
        ...(value.riskCount > 0 ? ['存在 AI 风险提示'] : []),
      ];

      return {
        questionId,
        order: value.order,
        title: value.title,
        maxScore: value.maxScore,
        averageScore,
        scoreRate,
        weaknessTags,
      };
    })
    .sort((left, right) => left.order - right.order);
};

const buildKnowledgeWeaknesses = (tasks: GradingTask[]): KnowledgeWeakness[] => {
  const bucket = new Map<string, { score: number; total: number }>();

  tasks.forEach((task) => {
    task.questionGrades.forEach((grade) => {
      const knowledgePoint = deriveKnowledgePoint(grade.title);
      const current = bucket.get(knowledgePoint) ?? { score: 0, total: 0 };
      bucket.set(knowledgePoint, {
        score: current.score + getGradeScore(grade),
        total: current.total + grade.maxScore,
      });
    });
  });

  return Array.from(bucket.entries())
    .map(([knowledgePoint, value]) => {
      const scoreRate = value.total ? clampRate(percent(value.score / value.total)) : 0;
      const level = toLevel(scoreRate);
      return {
        knowledgePoint,
        scoreRate,
        level,
        suggestion: toKnowledgeSuggestion(knowledgePoint, scoreRate),
      };
    })
    .sort((left, right) => left.scoreRate - right.scoreRate);
};

const buildStudentLayerInsights = (
  tasks: GradingTask[],
  totalScore: number,
): StudentLayerInsight[] => {
  const layers = [
    { layer: '优秀层', min: 0.9, max: 1.01, suggestion: '安排拓展题和表达规范示范。' },
    { layer: '稳定层', min: 0.75, max: 0.9, suggestion: '以易错题复盘和限时练习巩固稳定得分。' },
    {
      layer: '待巩固层',
      min: 0.6,
      max: 0.75,
      suggestion: '补齐关键概念和解题步骤，优先提升中档题得分。',
    },
    { layer: '风险层', min: 0, max: 0.6, suggestion: '需要课后跟进、错因面谈和基础题重练。' },
  ];

  return layers.map((layer) => ({
    layer: layer.layer,
    count: tasks.filter((task) => {
      const scoreRate = totalScore ? getTaskScore(task) / totalScore : 0;
      return scoreRate >= layer.min && scoreRate < layer.max;
    }).length,
    suggestion: layer.suggestion,
  }));
};

const toReportBase = (report: ExamReviewReport): Omit<ExamReviewReport, 'lectureDraft'> => ({
  examId: report.examId,
  examTitle: report.examTitle,
  courseName: report.courseName,
  totalScore: report.totalScore,
  averageScore: report.averageScore,
  passRate: report.passRate,
  submittedCount: report.submittedCount,
  reviewedCount: report.reviewedCount,
  scoreBands: report.scoreBands.map((item) => ({ ...item })),
  questionPerformances: report.questionPerformances.map((item) => ({
    ...item,
    weaknessTags: [...item.weaknessTags],
  })),
  knowledgeWeaknesses: report.knowledgeWeaknesses.map((item) => ({ ...item })),
  studentLayerInsights: report.studentLayerInsights.map((item) => ({ ...item })),
  artifacts: report.artifacts?.map((item) => ({ ...item })) ?? [],
});

const buildLectureOutline = (reportBase: Omit<ExamReviewReport, 'lectureDraft'>) => {
  const weakestKnowledge = reportBase.knowledgeWeaknesses[0]?.knowledgePoint ?? '核心知识点';
  const weakestQuestion = [...reportBase.questionPerformances].sort(
    (left, right) => left.scoreRate - right.scoreRate,
  )[0];

  return [
    `整体成绩分布：平均分 ${reportBase.averageScore}，及格率 ${reportBase.passRate}%`,
    `重点知识点：${weakestKnowledge}`,
    weakestQuestion
      ? `重点题目：第 ${weakestQuestion.order} 题，得分率 ${weakestQuestion.scoreRate}%`
      : '题目级数据待完善，先完成批改后再生成正式讲评',
    '分层练习：风险层补基础，稳定层练变式，优秀层做拓展',
  ];
};

const buildLectureContent = (reportBase: Omit<ExamReviewReport, 'lectureDraft'>) => {
  const weakestKnowledge = reportBase.knowledgeWeaknesses[0];
  const weakestQuestion = [...reportBase.questionPerformances].sort(
    (left, right) => left.scoreRate - right.scoreRate,
  )[0];

  return `# ${reportBase.examTitle} AI 讲评稿\n\n## 一、整体表现\n本次考试满分 ${reportBase.totalScore} 分，已提交 ${reportBase.submittedCount} 份，已批改 ${reportBase.reviewedCount} 份。平均分 ${reportBase.averageScore}，及格率 ${reportBase.passRate}%。\n\n## 二、重点薄弱点\n${weakestKnowledge ? `${weakestKnowledge.knowledgePoint} 得分率 ${weakestKnowledge.scoreRate}%。${weakestKnowledge.suggestion}` : '暂无知识点聚合数据。'}\n\n## 三、题目讲评建议\n${weakestQuestion ? `优先讲评第 ${weakestQuestion.order} 题「${weakestQuestion.title}」，得分率 ${weakestQuestion.scoreRate}%，关注：${weakestQuestion.weaknessTags.join('、') || '审题与表达规范'}。` : '暂无题目级批改数据。'}\n\n## 四、课后行动\n请学生完成错题订正；教师按优秀层、稳定层、待巩固层和风险层布置差异化任务，并在下一次练习中复测薄弱知识点。`;
};

const buildLectureDraft = (
  reportBase: Omit<ExamReviewReport, 'lectureDraft'>,
  status: LectureDraftStatus = 'DRAFT',
): AiLectureDraft => {
  const riskLabels = [
    ...(reportBase.reviewedCount < reportBase.submittedCount ? ['仍有未批改答卷'] : []),
    ...(reportBase.knowledgeWeaknesses.some((item) => item.level === 'RISK')
      ? ['存在高风险知识点']
      : []),
    'AI 内容需教师复核',
  ];

  return {
    id: `mock-draft-${reportBase.examId}-${Date.now()}`,
    examId: reportBase.examId,
    title: `${reportBase.examTitle} AI 讲评稿`,
    status,
    generatedAt: nowText(),
    provider: 'MOCK_LOCAL',
    confidence: reportBase.reviewedCount === reportBase.submittedCount ? 0.86 : 0.74,
    riskLabels,
    outline: buildLectureOutline(reportBase),
    content: buildLectureContent(reportBase),
  };
};

const cloneDraft = (draft: AiLectureDraft): AiLectureDraft => ({
  ...draft,
  outline: [...draft.outline],
  riskLabels: [...draft.riskLabels],
});

const cloneReport = (report: ExamReviewReport): ExamReviewReport => ({
  ...toReportBase(report),
  lectureDraft: cloneDraft(report.lectureDraft),
});

const buildReportFromSummary = (
  summary: ExamScoreSummary,
  tasks: GradingTask[],
): ExamReviewReport => {
  const examTasks = tasks.filter((task) => task.examId === summary.examId);
  const reviewedTasks = examTasks.filter((task) => task.status === 'REVIEWED');
  const base: Omit<ExamReviewReport, 'lectureDraft'> = {
    examId: summary.examId,
    examTitle: summary.examTitle,
    courseName: summary.courseName,
    totalScore: summary.totalScore,
    averageScore: summary.averageScore,
    passRate: summary.passRate,
    submittedCount: summary.submittedCount,
    reviewedCount: summary.reviewedCount,
    scoreBands: buildScoreBands(reviewedTasks, summary.totalScore),
    questionPerformances: buildQuestionPerformances(reviewedTasks),
    knowledgeWeaknesses: buildKnowledgeWeaknesses(reviewedTasks),
    studentLayerInsights: buildStudentLayerInsights(reviewedTasks, summary.totalScore),
    artifacts: Object.values(artifactOverrides).filter(
      (artifact) => artifact.examId === summary.examId,
    ),
  };

  return {
    ...base,
    lectureDraft: lectureDraftOverrides[summary.examId] ?? buildLectureDraft(base),
  };
};

const buildReports = async () => {
  const [summaries, tasks] = await Promise.all([listExamScoreSummaries(), listGradingTasks()]);
  return summaries.map((summary) => buildReportFromSummary(summary, tasks));
};

export async function listExamReviewReports(): Promise<ExamReviewReport[]> {
  const page = await listExamReviewReportsPage(1, 100);

  return page.items;
}

export async function listExamReviewReportsPage(
  page = 1,
  pageSize = 10,
): Promise<PageResponse<ExamReviewReport>> {
  if (!useMockApi) {
    return apiGet<PageResponse<ExamReviewReport>>('/v1/exams/reviews', { page, pageSize });
  }

  const safePage = Math.max(Number(page) || 1, 1);
  const safePageSize = Math.min(Math.max(Number(pageSize) || 10, 1), 100);
  const reports = await buildReports();
  const start = (safePage - 1) * safePageSize;

  return mockDelay({
    items: reports.slice(start, start + safePageSize).map(cloneReport),
    total: reports.length,
    page: safePage,
    pageSize: safePageSize,
  });
}

export async function getExamReviewReport(examId: string): Promise<ExamReviewReport | undefined> {
  if (!useMockApi) {
    return apiGet<ExamReviewReport>(`/v1/exams/${examId}/review`);
  }

  const reports = await buildReports();
  const report = reports.find((item) => item.examId === examId);
  return mockDelay(report ? cloneReport(report) : undefined);
}

export async function regenerateLectureDraft(examId: string): Promise<AiLectureDraft | undefined> {
  if (!useMockApi) {
    return apiPost<AiLectureDraft>(`/v1/exams/${examId}/lecture-draft/regenerate`);
  }

  const report = await getExamReviewReport(examId);
  if (!report) {
    return mockDelay(undefined);
  }

  const draft = buildLectureDraft(toReportBase(report), 'REVIEWING');
  lectureDraftOverrides = { ...lectureDraftOverrides, [examId]: draft };
  return mockDelay(cloneDraft(draft));
}

export async function createLectureDraftTask(examId: string): Promise<LectureDraftTask> {
  if (!useMockApi) {
    return apiPost<LectureDraftTask>(`/v1/exams/${examId}/lecture-draft/tasks`);
  }

  const now = new Date().toISOString();
  const taskId = `mock-lecture-task-${examId}-${Date.now()}`;
  const task: LectureDraftTask = {
    id: taskId,
    examId,
    status: 'PENDING',
    requestedAt: now,
    updatedAt: now,
  };
  lectureDraftTaskOverrides = { ...lectureDraftTaskOverrides, [taskId]: task };

  window.setTimeout(async () => {
    const report = await getExamReviewReport(examId);
    if (!report) {
      lectureDraftTaskOverrides = {
        ...lectureDraftTaskOverrides,
        [taskId]: {
          ...task,
          status: 'FAILED',
          errorMessage: 'Report not found',
          updatedAt: new Date().toISOString(),
        },
      };
      return;
    }

    const draft = buildLectureDraft(toReportBase(report), 'REVIEWING');
    lectureDraftOverrides = { ...lectureDraftOverrides, [examId]: draft };
    lectureDraftTaskOverrides = {
      ...lectureDraftTaskOverrides,
      [taskId]: {
        ...task,
        status: 'SUCCEEDED',
        provider: draft.provider ?? null,
        draftId: draft.id,
        draft,
        startedAt: now,
        finishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }, 600);

  return mockDelay(task);
}

export async function getLectureDraftTask(taskId: string): Promise<LectureDraftTask | undefined> {
  if (!useMockApi) {
    return apiGet<LectureDraftTask>(`/v1/lecture-draft-tasks/${taskId}`);
  }

  const task = lectureDraftTaskOverrides[taskId];
  return mockDelay(
    task ? { ...task, draft: task.draft ? cloneDraft(task.draft) : null } : undefined,
    120,
  );
}

export async function approveLectureDraft(
  examId: string,
  teacherEditedContent?: string,
): Promise<AiLectureDraft | undefined> {
  if (!useMockApi) {
    return apiPost<AiLectureDraft, { teacherEditedContent?: string }>(
      `/v1/exams/${examId}/lecture-draft/approve`,
      teacherEditedContent ? { teacherEditedContent } : {},
    );
  }

  const report = await getExamReviewReport(examId);
  if (!report) {
    return mockDelay(undefined);
  }

  const approvedDraft: AiLectureDraft = {
    ...report.lectureDraft,
    status: 'APPROVED',
    approvedAt: nowText(),
    ...(teacherEditedContent ? { teacherEditedContent } : {}),
  };
  lectureDraftOverrides = { ...lectureDraftOverrides, [examId]: approvedDraft };
  return mockDelay(cloneDraft(approvedDraft));
}

export async function exportReviewArtifact(
  examId: string,
  artifactType: ReviewArtifactType,
): Promise<ReviewArtifact> {
  if (!useMockApi) {
    return apiPost<ReviewArtifact, { artifactType: ReviewArtifactType }>(
      `/v1/exams/${examId}/review-artifacts`,
      { artifactType },
    );
  }

  const report = await getExamReviewReport(examId);
  const fileExtension = artifactType === 'SCORE_SUMMARY_CSV' ? 'csv' : 'md';
  const now = new Date().toISOString();
  const artifact: ReviewArtifact = {
    id: `mock-artifact-${examId}-${artifactType}-${Date.now()}`,
    examId,
    artifactType,
    fileName: `${report?.examTitle ?? examId}-${artifactType}.${fileExtension}`,
    objectKey: `mock/reviews/${examId}/${artifactType}.${fileExtension}`,
    contentType:
      artifactType === 'SCORE_SUMMARY_CSV'
        ? 'text/csv; charset=utf-8'
        : 'text/markdown; charset=utf-8',
    sizeBytes: 1024,
    checksumSha256: 'mock-checksum',
    createdAt: now,
    downloadUrl: '#',
  };
  artifactOverrides = { ...artifactOverrides, [artifact.id]: artifact };
  return mockDelay({ ...artifact });
}

export async function getReviewArtifactDownload(artifactId: string): Promise<ReviewArtifact> {
  if (!useMockApi) {
    return apiGet<ReviewArtifact>(`/v1/review-artifacts/${artifactId}/download`);
  }

  const artifact = artifactOverrides[artifactId] ?? {
    id: artifactId,
    examId: 'mock-exam',
    artifactType: 'REVIEW_REPORT_MARKDOWN' as ReviewArtifactType,
    fileName: `${artifactId}.md`,
    objectKey: `mock/reviews/${artifactId}.md`,
    contentType: 'text/markdown; charset=utf-8',
    sizeBytes: 1024,
    checksumSha256: 'mock-checksum',
    createdAt: new Date().toISOString(),
    downloadUrl: '#',
  };

  return mockDelay({ ...artifact });
}

export async function downloadReviewArtifactFile(artifactId: string): Promise<Blob> {
  if (!useMockApi) {
    return apiDownloadBlob(`/v1/review-artifacts/${artifactId}/file`);
  }

  return mockDelay(
    new Blob([`# ${artifactId}\n\nMock review artifact.`], { type: 'text/markdown;charset=utf-8' }),
    120,
  );
}
