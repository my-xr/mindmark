import { mockExams, mockPapers } from '@/mock/paperExamMock';
import { mockQuestions } from '@/mock/questionMock';
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  type PageResponse,
  useMockApi,
} from '@/services/api/httpClient';
import type {
  CreatePaperRequest,
  Paper,
  PaperComposePreview,
  PaperComposeRequest,
  PaperComposeResult,
  PaperComposeStrategy,
  PaperAnswerKey,
  PaperQuestion,
  PaperStatus,
} from '@/types/paper';
import type { Question } from '@/types/question';

const mockDelay = <T>(data: T, timeout = 260) =>
  new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(data), timeout);
  });

let papers: Paper[] = mockPapers.map((paper) => ({
  ...paper,
  questions: [...paper.questions],
}));
const studentPaperCache = new Map<string, Paper>();

const nowText = () => {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, '0');

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
    now.getHours(),
  )}:${pad(now.getMinutes())}`;
};

const calculateTotalScore = (questions: PaperQuestion[]) =>
  questions.reduce((total, item) => total + item.score, 0);

const refreshPaper = (paper: Paper): Paper => ({
  ...paper,
  totalScore: calculateTotalScore(paper.questions),
  updatedAt: nowText(),
});

const clonePaper = (paper: Paper): Paper => ({
  ...paper,
  questions: paper.questions.map((question) => ({
    ...question,
    question: {
      ...question.question,
      options: question.question.options.map((option) => ({ ...option })),
      scoringPoints: question.question.scoringPoints.map((point) => ({
        ...point,
        keywords: [...point.keywords],
      })),
    },
  })),
});

const toScore = (value: number | string) => Number(value);

const ensureQuestionMatchesPaperCourse = (paper: Paper, question: Question) => {
  if (!question.courseId) {
    throw new Error('题目未绑定课程，不能加入试卷');
  }
  if (paper.courseId && paper.courseId !== question.courseId) {
    throw new Error('题目课程与试卷课程不一致，不能加入试卷');
  }
};

const normalizePaper = (paper: Paper): Paper => ({
  ...paper,
  totalScore: toScore(paper.totalScore),
  questions: paper.questions.map((item) => ({
    ...item,
    score: toScore(item.score),
    question: {
      ...item.question,
      score: toScore(item.question.score),
    },
  })),
});

export async function createPaper(request: CreatePaperRequest): Promise<Paper> {
  if (!useMockApi) {
    return normalizePaper(await apiPost<Paper, CreatePaperRequest>('/v1/papers', request));
  }

  const created: Paper = {
    id: `paper-mock-${Date.now()}`,
    title: request.title.trim(),
    courseId: request.courseId,
    courseName: request.courseId,
    description: request.description?.trim() ?? '',
    durationMinutes: Number(request.durationMinutes) || 90,
    totalScore: 0,
    status: 'DRAFT',
    questions: [],
    createdBy: 'current-teacher',
    updatedAt: nowText(),
  };
  papers = [created, ...papers];
  return mockDelay(clonePaper(created));
}

export async function deletePaper(paperId: string): Promise<void> {
  if (!useMockApi) {
    await apiDelete<boolean>(`/v1/papers/${paperId}`);
    return;
  }

  papers = papers.filter((paper) => paper.id !== paperId);
  await mockDelay(undefined);
}

export async function listPapers(): Promise<Paper[]> {
  const page = await listPapersPage(1, 100);

  return page.items;
}

export async function listPapersPage(page = 1, pageSize = 20): Promise<PageResponse<Paper>> {
  if (!useMockApi) {
    const response = await apiGet<PageResponse<Paper>>('/v1/papers', { page, pageSize });

    return {
      ...response,
      items: response.items.map(normalizePaper),
    };
  }

  const safePage = Math.max(Number(page) || 1, 1);
  const safePageSize = Math.min(Math.max(Number(pageSize) || 20, 1), 100);
  const start = (safePage - 1) * safePageSize;

  return mockDelay({
    items: papers.slice(start, start + safePageSize).map(clonePaper),
    total: papers.length,
    page: safePage,
    pageSize: safePageSize,
  });
}

const normalizePaperQuestion = (item: PaperQuestion): PaperQuestion => ({
  ...item,
  score: toScore(item.score),
  question: {
    ...item.question,
    score: toScore(item.question.score),
  },
});

export async function listPaperQuestionsPage(
  paperId: string,
  page = 1,
  pageSize = 10,
): Promise<PageResponse<PaperQuestion>> {
  if (!useMockApi) {
    const response = await apiGet<PageResponse<PaperQuestion>>(`/v1/papers/${paperId}/questions`, {
      page,
      pageSize,
    });

    return {
      ...response,
      items: response.items.map(normalizePaperQuestion),
    };
  }

  const safePage = Math.max(Number(page) || 1, 1);
  const safePageSize = Math.min(Math.max(Number(pageSize) || 10, 1), 100);
  const paper = papers.find((item) => item.id === paperId);
  const questions = paper?.questions ?? [];
  const start = (safePage - 1) * safePageSize;

  return mockDelay({
    items: questions.slice(start, start + safePageSize).map((item) => ({
      ...item,
      question: { ...item.question },
    })),
    total: questions.length,
    page: safePage,
    pageSize: safePageSize,
  });
}

export async function getPaperById(id: string): Promise<Paper | undefined> {
  if (!useMockApi) {
    try {
      return normalizePaper(await apiGet<Paper>(`/v1/papers/${id}`));
    } catch (error) {
      console.warn(error);

      return undefined;
    }
  }

  const paper = papers.find((item) => item.id === id);

  return mockDelay(paper ? clonePaper(paper) : undefined);
}

const shuffle = <T>(items: T[]): T[] => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

export async function getStudentPaperByExamId(examId: string): Promise<Paper | undefined> {
  if (!useMockApi) {
    return normalizePaper(await apiGet<Paper>(`/v1/student/exams/${examId}/paper`));
  }

  const cached = studentPaperCache.get(examId);
  if (cached) {
    return mockDelay(clonePaper(cached));
  }

  const exam = mockExams.find((item) => item.id === examId);
  if (!exam) {
    return mockDelay(undefined);
  }

  const randomized: Paper = {
    ...clonePaper(exam.paper),
    questions: exam.paper.questions.map((item) => {
      if (!['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(item.question.type)) {
        return item;
      }
      const options = shuffle(item.question.options).map((option, index) => ({
        ...option,
        key: String.fromCharCode(65 + index),
      }));
      return {
        ...item,
        question: {
          ...item.question,
          options,
        },
      };
    }),
  };
  studentPaperCache.set(examId, randomized);
  return mockDelay(clonePaper(randomized));
}

export async function getPaperAnswerKey(id: string): Promise<PaperAnswerKey> {
  if (!useMockApi) {
    const response = await apiGet<PaperAnswerKey>(`/v1/papers/${id}/answer-key`);
    return {
      ...response,
      totalScore: Number(response.totalScore),
      items: response.items.map((item) => ({
        ...item,
        score: Number(item.score),
        question: {
          ...item.question,
          score: Number(item.question.score),
          options: item.question.options ?? [],
          scoringPoints: item.question.scoringPoints ?? [],
          knowledgePoints: item.question.knowledgePoints ?? [],
        },
      })),
    };
  }

  const paper = papers.find((item) => item.id === id);
  if (!paper) {
    throw new Error('\u8bd5\u5377\u4e0d\u5b58\u5728\u6216\u5df2\u88ab\u5220\u9664');
  }
  return mockDelay({
    paperId: paper.id,
    title: paper.title,
    courseId: paper.courseId,
    courseName: paper.courseName,
    totalScore: paper.totalScore,
    generatedAt: paper.updatedAt,
    items: paper.questions.map((item) => ({
      ...item,
      question: { ...item.question },
    })),
  });
}

export async function addQuestionToPaper(paperId: string, question: Question): Promise<Paper[]> {
  if (!useMockApi) {
    await apiPost<Paper, { questionId: string; score: number }>(`/v1/papers/${paperId}/questions`, {
      questionId: question.id,
      score: question.score,
    });

    return listPapers();
  }

  papers = papers.map((paper) => {
    if (paper.id !== paperId || paper.questions.some((item) => item.questionId === question.id)) {
      return paper;
    }

    ensureQuestionMatchesPaperCourse(paper, question);

    const nextQuestion: PaperQuestion = {
      id: `PQ-${paper.id}-${question.id}`,
      questionId: question.id,
      order: paper.questions.length + 1,
      score: question.score,
      question,
    };

    return refreshPaper({ ...paper, questions: [...paper.questions, nextQuestion] });
  });

  return listPapers();
}

export async function removeQuestionFromPaper(
  paperId: string,
  questionId: string,
): Promise<Paper[]> {
  if (!useMockApi) {
    await apiDelete<Paper>(`/v1/papers/${paperId}/questions/${questionId}`);

    return listPapers();
  }

  papers = papers.map((paper) => {
    if (paper.id !== paperId) {
      return paper;
    }

    const questions = paper.questions
      .filter((item) => item.questionId !== questionId && item.id !== questionId)
      .map((item, index) => ({ ...item, order: index + 1 }));

    return refreshPaper({ ...paper, questions });
  });

  return listPapers();
}

const shuffleQuestions = (items: Question[]) => [...items].sort(() => Math.random() - 0.5);

const questionTypeLabelMap: Record<string, string> = {
  SINGLE_CHOICE: '单选题',
  MULTIPLE_CHOICE: '多选题',
  TRUE_FALSE: '判断题',
  FILL_BLANK: '填空题',
  SHORT_ANSWER: '简答题',
  PROGRAMMING: '编程题',
};

const difficultyLabelMap: Record<string, string> = {
  VERY_EASY: '很简单',
  EASY: '简单',
  MEDIUM: '中等',
  HARD: '困难',
  VERY_HARD: '很困难',
};

const buildDistribution = (
  items: PaperQuestion[],
  keyGetter: (item: PaperQuestion) => string[],
  labelGetter: (key: string) => string,
  totalScore: number,
) => {
  const map = new Map<string, { count: number; score: number }>();
  items.forEach((item) => {
    const keys = keyGetter(item);
    keys.forEach((key) => {
      const current = map.get(key) ?? { count: 0, score: 0 };
      current.count += 1;
      current.score += Number(item.score || 0);
      map.set(key, current);
    });
  });

  return [...map.entries()]
    .map(([key, value]) => ({
      key,
      label: labelGetter(key),
      count: value.count,
      score: Number(value.score.toFixed(1)),
      percentage: totalScore > 0 ? Number(((value.score / totalScore) * 100).toFixed(1)) : 0,
    }))
    .sort((left, right) => right.score - left.score);
};

const buildMockQualityReport = (items: PaperQuestion[], targetScore: number) => {
  const actualScore = Number(
    items.reduce((total, item) => total + Number(item.score || 0), 0).toFixed(1),
  );
  const knowledgePointCount = new Set(
    items.flatMap((item) => item.question.knowledgePoints ?? []).filter(Boolean),
  ).size;
  const typeDistribution = buildDistribution(
    items,
    (item) => [item.question.type],
    (key) => questionTypeLabelMap[key] ?? key,
    actualScore,
  );
  const difficultyDistribution = buildDistribution(
    items,
    (item) => [item.question.difficulty],
    (key) => difficultyLabelMap[key] ?? key,
    actualScore,
  );
  const chapterDistribution = buildDistribution(
    items,
    (item) => [
      item.question.chapterNo !== null && item.question.chapterNo !== undefined
        ? `? ${item.question.chapterNo} ?${item.question.chapterTitle ? ` ? ${item.question.chapterTitle}` : ''}`
        : (item.question.chapterTitle ?? '???'),
    ],
    (key) => key,
    actualScore,
  );
  const knowledgePointDistribution = buildDistribution(
    items,
    (item) => (item.question.knowledgePoints.length ? item.question.knowledgePoints : ['未标注']),
    (key) => key,
    actualScore,
  ).slice(0, 8);
  const highlights: string[] = [];
  const risks: string[] = [];
  if (actualScore === targetScore) {
    highlights.push('总分与目标分一致，满足基础分值要求。');
  } else {
    risks.push(`当前总分 ${actualScore} 分，与目标 ${targetScore} 分不一致。`);
  }
  if (typeDistribution.length >= 4) {
    highlights.push('题型覆盖较完整。');
  } else {
    risks.push('题型覆盖偏少，建议补充客观题与主观题。');
  }
  if (knowledgePointCount >= 5) {
    highlights.push(`知识点覆盖达到 ${knowledgePointCount} 个。`);
  } else {
    risks.push(`知识点覆盖仅 ${knowledgePointCount} 个，建议补充章节覆盖。`);
  }

  return {
    targetScore,
    actualScore,
    totalQuestionCount: items.length,
    knowledgePointCount,
    typeDistribution,
    difficultyDistribution,
    chapterDistribution,
    knowledgePointDistribution,
    highlights,
    risks,
  };
};

const buildMockAgentPlan = (
  strategy: PaperComposeStrategy,
  mode: PaperComposeRequest['mode'],
  report: ReturnType<typeof buildMockQualityReport>,
) => ({
  workflow: 'paper_compose_plan:mock(normalize_rules -> analyze_quality -> build_plan)',
  summary: `${strategy === 'AGENT' ? '智能均衡组卷' : '随机组卷'}计划已生成，写入方式为“${mode === 'REPLACE' ? '替换当前试题' : '追加到当前试题'}”。`,
  steps: ['读取组卷规则', '筛选当前课程 ACTIVE 题库', '校验库存与总分', '生成质量报告', '后端写入'],
  rationale: report.typeDistribution.map(
    (item) => `${item.label}：${item.count} 道 / ${item.score} 分`,
  ),
  recommendations: report.risks.length ? report.risks : ['建议发布前复核主观题评分点。'],
});

const runMockCompose = (
  paperId: string,
  request: PaperComposeRequest,
  strategy: PaperComposeStrategy,
): PaperComposeResult => {
  const paper = papers.find((item) => item.id === paperId);
  if (!paper) {
    throw new Error('试卷不存在');
  }

  const baseQuestions = request.mode === 'APPEND' ? [...paper.questions] : [];
  const selectedIds = new Set(baseQuestions.map((item) => item.questionId));
  const selectedQuestions: PaperQuestion[] = [];

  request.rules.forEach((rule) => {
    const candidates = mockQuestions.filter((question) => {
      const difficultyMatched =
        rule.difficulties.length === 0 || rule.difficulties.includes(question.difficulty);
      const knowledgeMatched =
        rule.knowledgePoints.length === 0 ||
        rule.knowledgePoints.some((point) => question.knowledgePoints.includes(point));
      const chapterNo = Number(question.chapterNo ?? 0);
      const chapterMatched =
        (rule.chapterIds.length === 0 || rule.chapterIds.includes(question.chapterId ?? '')) &&
        (rule.chapterFromNo === null ||
          rule.chapterFromNo === undefined ||
          chapterNo >= rule.chapterFromNo) &&
        (rule.chapterToNo === null ||
          rule.chapterToNo === undefined ||
          chapterNo <= rule.chapterToNo);

      return (
        question.courseId === paper.courseId &&
        question.status === 'ACTIVE' &&
        question.type === rule.type &&
        difficultyMatched &&
        knowledgeMatched &&
        chapterMatched &&
        !selectedIds.has(question.id)
      );
    });
    if (candidates.length < rule.count) {
      throw new Error(
        `${paper.courseName} 题库库存不足：${rule.type} 需要 ${rule.count} 道，可用 ${candidates.length} 道`,
      );
    }

    const picked = shuffleQuestions(candidates).slice(0, rule.count);
    picked.forEach((question) => {
      selectedIds.add(question.id);
      selectedQuestions.push({
        id: `PQ-${paper.id}-${question.id}`,
        questionId: question.id,
        order: baseQuestions.length + selectedQuestions.length + 1,
        score: rule.score,
        question: { ...question, score: rule.score },
      });
    });
  });

  const nextPaper = refreshPaper({
    ...paper,
    questions: [...baseQuestions, ...selectedQuestions].map((item, index) => ({
      ...item,
      order: index + 1,
    })),
  });
  papers = papers.map((item) => (item.id === paper.id ? nextPaper : item));

  const qualityReport = buildMockQualityReport(nextPaper.questions, request.targetScore);

  return {
    paper: clonePaper(nextPaper),
    addedCount: selectedQuestions.length,
    addedScore: selectedQuestions.reduce((total, item) => total + item.score, 0),
    targetScore: request.targetScore,
    actualScore: nextPaper.totalScore,
    mode: request.mode,
    strategy,
    gaps: [],
    warnings: [strategy === 'AGENT' ? '模拟智能组卷已完成。' : '模拟随机组卷已完成。'],
    qualityReport,
    agentPlan: buildMockAgentPlan(strategy, request.mode, qualityReport),
  };
};

export async function composePaperRandom(
  paperId: string,
  request: PaperComposeRequest,
): Promise<PaperComposeResult> {
  if (!useMockApi) {
    const response = await apiPost<PaperComposeResult, PaperComposeRequest>(
      `/v1/papers/${paperId}/compose/random`,
      request,
    );

    return { ...response, paper: normalizePaper(response.paper) };
  }

  return mockDelay(runMockCompose(paperId, request, 'RANDOM'));
}

export async function composePaperAgent(
  paperId: string,
  request: PaperComposeRequest,
): Promise<PaperComposeResult> {
  if (!useMockApi) {
    const response = await apiPost<PaperComposeResult, PaperComposeRequest>(
      `/v1/papers/${paperId}/compose/agent`,
      request,
    );

    return { ...response, paper: normalizePaper(response.paper) };
  }

  return mockDelay(runMockCompose(paperId, request, 'AGENT'));
}

const runMockComposePreview = (
  paperId: string,
  request: PaperComposeRequest,
  strategy: PaperComposeStrategy,
): PaperComposePreview => {
  const original = papers.find((item) => item.id === paperId);
  if (!original) {
    throw new Error('试卷不存在');
  }
  const snapshot = papers;
  const result = runMockCompose(paperId, request, strategy);
  papers = snapshot;
  const currentScore = request.mode === 'APPEND' ? original.totalScore : 0;

  return {
    paperId,
    mode: request.mode,
    strategy,
    targetScore: request.targetScore,
    currentScore,
    plannedAddedScore: result.addedScore,
    plannedFinalScore: currentScore + result.addedScore,
    plannedAddedCount: result.addedCount,
    ready: result.gaps.length === 0,
    gaps: result.gaps,
    warnings: result.warnings,
    qualityReport: result.qualityReport,
    agentPlan: result.agentPlan,
  };
};

export async function previewComposePaperRandom(
  paperId: string,
  request: PaperComposeRequest,
): Promise<PaperComposePreview> {
  if (!useMockApi) {
    return apiPost<PaperComposePreview, PaperComposeRequest>(
      `/v1/papers/${paperId}/compose/random/preview`,
      request,
    );
  }

  return mockDelay(runMockComposePreview(paperId, request, 'RANDOM'));
}

export async function previewComposePaperAgent(
  paperId: string,
  request: PaperComposeRequest,
): Promise<PaperComposePreview> {
  if (!useMockApi) {
    return apiPost<PaperComposePreview, PaperComposeRequest>(
      `/v1/papers/${paperId}/compose/agent/preview`,
      request,
    );
  }

  return mockDelay(runMockComposePreview(paperId, request, 'AGENT'));
}

export async function updatePaperStatus(paperId: string, status: PaperStatus): Promise<Paper[]> {
  if (!useMockApi) {
    await apiPatch<Paper, { status: PaperStatus }>(`/v1/papers/${paperId}/status`, { status });

    return listPapers();
  }

  papers = papers.map((paper) =>
    paper.id === paperId ? refreshPaper({ ...paper, status }) : paper,
  );

  return listPapers();
}
