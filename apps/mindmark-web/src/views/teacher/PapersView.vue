<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { listVisibleCourses } from '@/services/academicService';
import { getErrorMessage } from '@/utils/errorMessage';

import AppActionButton from '@/components/common/AppActionButton.vue';
import AppChoiceChips from '@/components/common/AppChoiceChips.vue';
import AppFormControl from '@/components/common/AppFormControl.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import EnterprisePagination from '@/components/common/EnterprisePagination.vue';
import ErrorState from '@/components/common/ErrorState.vue';
import OperationNotice from '@/components/common/OperationNotice.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import DifficultyTag from '@/components/question/DifficultyTag.vue';
import QuestionTypeTag from '@/components/question/QuestionTypeTag.vue';
import { PAPER_STATUS_META } from '@/constants/status';
import {
  addQuestionToPaper,
  createPaper,
  deletePaper,
  composePaperAgent,
  composePaperRandom,
  getPaperAnswerKey,
  getPaperById,
  listPaperQuestionsPage,
  listPapersPage,
  previewComposePaperAgent,
  previewComposePaperRandom,
  removeQuestionFromPaper,
  updatePaperStatus,
} from '@/services/paperService';
import { listQuestionsPage } from '@/services/questionService';
import { requestUserConfirmation } from '@/utils/confirmAction';
import type {
  Paper,
  PaperAnswerKey,
  PaperComposeMode,
  PaperComposePreview,
  PaperComposeRequest,
  PaperComposeRule,
  PaperQuestion,
  CreatePaperRequest,
} from '@/types/paper';
import type { Course } from '@/types/academic';
import type { Difficulty, Question, QuestionQuery, QuestionType } from '@/types/question';

interface ComposeRuleForm extends PaperComposeRule {
  knowledgeText: string;
}

const route = useRoute();
const router = useRouter();
const routePaperId = computed(() =>
  typeof route.params.paperId === 'string' ? route.params.paperId : '',
);
const isPaperEditor = computed(() => Boolean(routePaperId.value));

const courses = ref<Course[]>([]);
const papers = ref<Paper[]>([]);
const selectedPaperDetail = ref<Paper | null>(null);
const paperQuestions = ref<PaperQuestion[]>([]);
const questionPool = ref<Question[]>([]);
const selectedPaperId = ref('');
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const operating = ref(false);
const operationMessage = ref('');
const composePanelOpen = ref(true);
const composeMode = ref<PaperComposeMode>('REPLACE');
const composeTargetScore = ref(100);
const composeChapterFromNo = ref<number | null>(null);
const composeChapterToNo = ref<number | null>(null);
const composePreview = ref<PaperComposePreview | null>(null);
const composePreviewLoading = ref(false);
const answerKey = ref<PaperAnswerKey | null>(null);
const answerKeyOpen = ref(false);
const answerKeyLoading = ref(false);
const createPaperPanelOpen = ref(false);
const createPaperForm = reactive<CreatePaperRequest>({
  title: '',
  courseId: '',
  description: '',
  durationMinutes: 90,
});

const availableQuestionFilters = reactive<{
  keyword: string;
  type: QuestionType | 'ALL';
  difficulty: Difficulty | 'ALL';
}>({
  keyword: '',
  type: 'ALL',
  difficulty: 'ALL',
});

const questionTypeOptions: Array<{ label: string; value: QuestionType; scoreHint: string }> = [
  { label: '单选', value: 'SINGLE_CHOICE', scoreHint: '0.5-1 分' },
  { label: '多选', value: 'MULTIPLE_CHOICE', scoreHint: '1-2 分' },
  { label: '判断', value: 'TRUE_FALSE', scoreHint: '1 分' },
  { label: '填空', value: 'FILL_BLANK', scoreHint: '1 分' },
  { label: '简答', value: 'SHORT_ANSWER', scoreHint: '5 分' },
  { label: '论述', value: 'ESSAY', scoreHint: '8-12 分' },
  { label: '案例', value: 'CASE_ANALYSIS', scoreHint: '8-12 分' },
  { label: '编程', value: 'PROGRAMMING', scoreHint: '10 分' },
];

const difficultyOptions: Array<{ label: string; value: Difficulty }> = [
  { label: '1 易', value: 'VERY_EASY' },
  { label: '2 较易', value: 'EASY' },
  { label: '3 中', value: 'MEDIUM' },
  { label: '4 较难', value: 'HARD' },
  { label: '5 难', value: 'VERY_HARD' },
];

const composeModeOptions: Array<{ label: string; value: PaperComposeMode }> = [
  { label: '替换当前试题', value: 'REPLACE' },
  { label: '追加到当前试题', value: 'APPEND' },
];

const createPaperCourseOptions = computed(() => [
  { disabled: true, label: '请选择课程', value: '' },
  ...courses.value.map((course) => ({
    label: `${course.name}（${course.code}）`,
    value: course.id,
  })),
]);

const availableQuestionTypeOptions = computed(() => [
  { label: '全部题型', value: 'ALL' },
  ...questionTypeOptions.map((option) => ({ label: option.label, value: option.value })),
]);

const availableQuestionDifficultyOptions = computed(() => [
  { label: '全部难度', value: 'ALL' },
  ...difficultyOptions,
]);

const createDefaultComposeRules = (): ComposeRuleForm[] => [
  {
    type: 'SINGLE_CHOICE',
    count: 20,
    score: 1,
    chapterIds: [],
    chapterFromNo: null,
    chapterToNo: null,
    difficulties: ['EASY', 'MEDIUM'],
    knowledgePoints: [],
    knowledgeText: '',
  },
  {
    type: 'MULTIPLE_CHOICE',
    count: 10,
    score: 2,
    chapterIds: [],
    chapterFromNo: null,
    chapterToNo: null,
    difficulties: ['MEDIUM', 'HARD'],
    knowledgePoints: [],
    knowledgeText: '',
  },
  {
    type: 'TRUE_FALSE',
    count: 10,
    score: 1,
    chapterIds: [],
    chapterFromNo: null,
    chapterToNo: null,
    difficulties: ['VERY_EASY', 'EASY', 'MEDIUM'],
    knowledgePoints: [],
    knowledgeText: '',
  },
  {
    type: 'FILL_BLANK',
    count: 10,
    score: 1,
    chapterIds: [],
    chapterFromNo: null,
    chapterToNo: null,
    difficulties: ['EASY', 'MEDIUM'],
    knowledgePoints: [],
    knowledgeText: '',
  },
  {
    type: 'SHORT_ANSWER',
    count: 4,
    score: 5,
    chapterIds: [],
    chapterFromNo: null,
    chapterToNo: null,
    difficulties: ['MEDIUM', 'HARD'],
    knowledgePoints: [],
    knowledgeText: '',
  },
  {
    type: 'PROGRAMMING',
    count: 2,
    score: 10,
    chapterIds: [],
    chapterFromNo: null,
    chapterToNo: null,
    difficulties: ['HARD', 'VERY_HARD'],
    knowledgePoints: [],
    knowledgeText: '',
  },
];

const composeRules = reactive<ComposeRuleForm[]>(createDefaultComposeRules());

const resetCreatePaperForm = () => {
  createPaperForm.title = '';
  createPaperForm.courseId = courses.value[0]?.id ?? '';
  createPaperForm.description = '';
  createPaperForm.durationMinutes = 90;
};

const loadCourses = async () => {
  courses.value = await listVisibleCourses();
  if (!createPaperForm.courseId && courses.value.length > 0) {
    createPaperForm.courseId = courses.value[0].id;
  }
};

const openCreatePaperPanel = () => {
  if (!createPaperForm.courseId && courses.value.length > 0) {
    createPaperForm.courseId = courses.value[0].id;
  }
  createPaperPanelOpen.value = true;
};

const cancelCreatePaper = () => {
  createPaperPanelOpen.value = false;
  resetCreatePaperForm();
};

const submitCreatePaper = async () => {
  if (!createPaperForm.title.trim() || !createPaperForm.courseId) {
    errorMessage.value = '请填写试卷名称并选择课程。';
    return;
  }

  operating.value = true;
  errorMessage.value = null;
  try {
    const created = await createPaper({
      title: createPaperForm.title.trim(),
      courseId: createPaperForm.courseId,
      description: createPaperForm.description?.trim() || null,
      durationMinutes: Number(createPaperForm.durationMinutes) || 90,
    });
    selectedPaperId.value = created.id;
    paperPagination.page = 1;
    paperQuestionPagination.page = 1;
    availableQuestionPagination.page = 1;
    createPaperPanelOpen.value = false;
    resetCreatePaperForm();
    await loadPapers();
    selectedPaperId.value = created.id;
    await loadSelectedPaperRelated();
    operationMessage.value = '试卷已创建，可直接使用 100 分模板进行随机组卷或智能组卷。';
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '试卷创建失败，请检查课程与名称后重试');
  } finally {
    operating.value = false;
  }
};

const selectedPaper = computed(
  () =>
    selectedPaperDetail.value ??
    papers.value.find((paper) => paper.id === selectedPaperId.value) ??
    null,
);

const selectedPaperTypeCount = computed(
  () => new Set(selectedPaper.value?.questions.map((item) => item.question.type) ?? []).size,
);

const selectedPaperQuestions = computed(() => paperQuestions.value);
const availableQuestions = computed(() => questionPool.value);

const formatReferenceAnswer = (answer: unknown) => {
  if (Array.isArray(answer)) {
    return answer.join('\u3001');
  }
  if (answer && typeof answer === 'object') {
    return JSON.stringify(answer, null, 2);
  }
  return answer === null || answer === undefined || answer === ''
    ? '\u672a\u914d\u7f6e'
    : String(answer);
};

const loadAnswerKey = async () => {
  if (!selectedPaper.value) {
    return;
  }
  answerKeyLoading.value = true;
  errorMessage.value = null;
  try {
    answerKey.value = await getPaperAnswerKey(selectedPaper.value.id);
    answerKeyOpen.value = true;
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      '\u53c2\u8003\u7b54\u6848\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5',
    );
  } finally {
    answerKeyLoading.value = false;
  }
};
const isPaperDeleteDisabled = (paper: Paper) =>
  paper.status === 'PUBLISHED' || paper.status === 'ARCHIVED';
const hasAvailableQuestionFilter = computed(
  () =>
    Boolean(availableQuestionFilters.keyword.trim()) ||
    availableQuestionFilters.type !== 'ALL' ||
    availableQuestionFilters.difficulty !== 'ALL',
);
const availableQuestionEmptyDescription = computed(() =>
  hasAvailableQuestionFilter.value
    ? '当前课程下没有符合筛选条件的可选题目，请调整题型、难度或关键词。'
    : '当前课程下暂无可加入本试卷的题目，或已全部加入当前试卷。',
);
const composePlannedScore = computed(() =>
  composeRules.reduce(
    (total, rule) => total + Number(rule.count || 0) * Number(rule.score || 0),
    0,
  ),
);
const composeFinalScore = computed(() =>
  composeMode.value === 'APPEND'
    ? Number(selectedPaper.value?.totalScore ?? 0) + composePlannedScore.value
    : composePlannedScore.value,
);

const paperPagination = reactive({ page: 1, pageSize: 6, total: 0 });
const paperQuestionPagination = reactive({ page: 1, pageSize: 5, total: 0 });
const availableQuestionPagination = reactive({ page: 1, pageSize: 5, total: 0 });

const loadPaperQuestions = async () => {
  if (!selectedPaperId.value) {
    paperQuestions.value = [];
    paperQuestionPagination.total = 0;
    return;
  }

  const page = await listPaperQuestionsPage(
    selectedPaperId.value,
    paperQuestionPagination.page,
    paperQuestionPagination.pageSize,
  );
  paperQuestions.value = page.items;
  paperQuestionPagination.total = page.total;
  paperQuestionPagination.page = page.page;
  paperQuestionPagination.pageSize = page.pageSize;
};

const loadAvailableQuestions = async () => {
  const currentPaper = selectedPaper.value;
  if (!currentPaper) {
    questionPool.value = [];
    availableQuestionPagination.total = 0;
    return;
  }

  const query: QuestionQuery = {
    status: 'ACTIVE',
    courseId: currentPaper.courseId,
    excludePaperId: currentPaper.id,
    type: availableQuestionFilters.type,
    difficulty: availableQuestionFilters.difficulty,
    page: availableQuestionPagination.page,
    pageSize: availableQuestionPagination.pageSize,
  };

  const keyword = availableQuestionFilters.keyword.trim();
  if (keyword) {
    query.keyword = keyword;
  }

  const page = await listQuestionsPage(query);
  questionPool.value = page.items;
  availableQuestionPagination.total = page.total;
  availableQuestionPagination.page = page.page;
  availableQuestionPagination.pageSize = page.pageSize;
};

const loadSelectedPaperDetail = async () => {
  if (!selectedPaperId.value) {
    selectedPaperDetail.value = null;
    return;
  }

  const paperFromCurrentPage = papers.value.find((paper) => paper.id === selectedPaperId.value);
  selectedPaperDetail.value = paperFromCurrentPage ?? selectedPaperDetail.value;

  const detail = await getPaperById(selectedPaperId.value);
  if (!detail) {
    throw new Error('未找到当前试卷，请刷新试卷列表后重试。');
  }
  selectedPaperDetail.value = detail;
};

const loadSelectedPaperRelated = async () => {
  await loadSelectedPaperDetail();
  await Promise.all([loadPaperQuestions(), loadAvailableQuestions()]);
};

const clearSelectedPaperRelated = () => {
  selectedPaperId.value = '';
  selectedPaperDetail.value = null;
  paperQuestions.value = [];
  questionPool.value = [];
  paperQuestionPagination.total = 0;
  availableQuestionPagination.total = 0;
  composePreview.value = null;
};

const loadPapers = async () => {
  const page = await listPapersPage(paperPagination.page, paperPagination.pageSize);
  papers.value = page.items;
  paperPagination.total = page.total;
  paperPagination.page = page.page;
  paperPagination.pageSize = page.pageSize;

  if (selectedPaperId.value) {
    const paperFromCurrentPage = page.items.find((paper) => paper.id === selectedPaperId.value);
    if (paperFromCurrentPage) {
      selectedPaperDetail.value = paperFromCurrentPage;
    }
  }
};

const handlePaperPaginationChange = (page: number, pageSize: number) => {
  paperPagination.page = page;
  paperPagination.pageSize = pageSize;
  void loadData();
};

const handlePaperQuestionPaginationChange = (page: number, pageSize: number) => {
  paperQuestionPagination.page = page;
  paperQuestionPagination.pageSize = pageSize;
  void loadPaperQuestions();
};

const handleAvailableQuestionPaginationChange = (page: number, pageSize: number) => {
  availableQuestionPagination.page = page;
  availableQuestionPagination.pageSize = pageSize;
  void loadAvailableQuestions();
};

const applyAvailableQuestionFilters = () => {
  availableQuestionPagination.page = 1;
  void loadAvailableQuestions();
};

const resetAvailableQuestionFilters = () => {
  availableQuestionFilters.keyword = '';
  availableQuestionFilters.type = 'ALL';
  availableQuestionFilters.difficulty = 'ALL';
  availableQuestionPagination.page = 1;
  void loadAvailableQuestions();
};

const correctPagedListIfEmpty = async (
  pagination: { page: number },
  reload: () => Promise<void>,
  length: number,
) => {
  if (length === 0 && pagination.page > 1) {
    pagination.page -= 1;
    await reload();
  }
};

const openPaperEditor = (paperId: string) => {
  void router.push({ name: 'PaperEditor', params: { paperId } });
};

const backToPaperList = () => {
  void router.push({ name: 'Papers' });
};

const loadData = async () => {
  loading.value = true;
  errorMessage.value = null;

  try {
    selectedPaperId.value = routePaperId.value;
    await loadCourses();
    await loadPapers();
    if (isPaperEditor.value) {
      await loadSelectedPaperRelated();
    } else {
      clearSelectedPaperRelated();
    }
  } catch (error) {
    papers.value = [];
    paperQuestions.value = [];
    questionPool.value = [];
    selectedPaperId.value = '';
    errorMessage.value = getErrorMessage(error, '试卷列表加载失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const addQuestion = async (question: Question) => {
  if (!selectedPaper.value) {
    return;
  }

  const confirmed = await requestUserConfirmation(`确认将「${question.title}」加入当前试卷吗？`);

  if (!confirmed) {
    return;
  }

  operating.value = true;
  errorMessage.value = null;
  try {
    await addQuestionToPaper(selectedPaper.value.id, question);
    await loadPapers();
    await loadPaperQuestions();
    await loadAvailableQuestions();
    await correctPagedListIfEmpty(
      availableQuestionPagination,
      loadAvailableQuestions,
      availableQuestions.value.length,
    );
    operationMessage.value = '题目已加入试卷，试卷分值已自动更新。';
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '题目加入试卷失败，请稍后重试');
  } finally {
    operating.value = false;
  }
};

const removeQuestion = async (paperQuestionRef: string, questionTitle: string) => {
  if (!selectedPaper.value) {
    return;
  }

  const confirmed = await requestUserConfirmation(
    `确认从当前试卷中移除「${questionTitle}」吗？移除后题号和总分将自动重排。`,
  );

  if (!confirmed) {
    return;
  }

  operating.value = true;
  errorMessage.value = null;
  try {
    await removeQuestionFromPaper(selectedPaper.value.id, paperQuestionRef);
    await loadPapers();
    await loadPaperQuestions();
    await correctPagedListIfEmpty(
      paperQuestionPagination,
      loadPaperQuestions,
      selectedPaperQuestions.value.length,
    );
    await loadAvailableQuestions();
    operationMessage.value = '题目已从试卷中移除，试卷分值与题号已自动重排。';
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '题目从试卷移除失败，请稍后重试');
  } finally {
    operating.value = false;
  }
};

const deletePaperItem = async (paper: Paper) => {
  if (isPaperDeleteDisabled(paper)) {
    errorMessage.value = '已发布或已归档试卷不能删除，请先确认考试与归档数据。';
    return;
  }

  const confirmed = await requestUserConfirmation(
    `确认删除试卷「${paper.title}」吗？删除后会同步移除试卷题目关系；已创建考试的试卷会被后端拦截。`,
  );

  if (!confirmed) {
    return;
  }

  operating.value = true;
  errorMessage.value = null;
  try {
    await deletePaper(paper.id);

    if (selectedPaperId.value === paper.id) {
      clearSelectedPaperRelated();
    }

    if (isPaperEditor.value) {
      await router.push({ name: 'Papers' });
    }

    await loadPapers();
    await correctPagedListIfEmpty(paperPagination, loadPapers, papers.value.length);
    operationMessage.value = `试卷「${paper.title}」已删除，列表分页已自动校正。`;
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      '试卷删除失败：已发布、已归档或已创建考试的试卷不能删除。',
    );
  } finally {
    operating.value = false;
  }
};

const markReady = async () => {
  if (!selectedPaper.value) {
    return;
  }

  const confirmed = await requestUserConfirmation(
    `确认将《${selectedPaper.value.title}》标记为可用于考试吗？`,
  );

  if (!confirmed) {
    return;
  }

  operating.value = true;
  try {
    await updatePaperStatus(selectedPaper.value.id, 'READY');
    await loadPapers();
    operationMessage.value = '试卷已标记为可用于考试，可继续创建考试安排。';
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '试卷状态更新失败，请检查试卷题目后重试');
  } finally {
    operating.value = false;
  }
};

const parseKnowledgePoints = (value: string) =>
  value
    .split(/[，,、/]/)
    .map((item) => item.trim())
    .filter(Boolean);

const resetComposeTemplate = () => {
  composeTargetScore.value = 100;
  composeChapterFromNo.value = null;
  composeChapterToNo.value = null;
  composeMode.value = 'REPLACE';
  composeRules.splice(0, composeRules.length, ...createDefaultComposeRules());
  composePreview.value = null;
};

const toComposeRules = (): PaperComposeRule[] =>
  composeRules
    .filter((rule) => Number(rule.count) > 0)
    .map((rule) => ({
      type: rule.type,
      count: Number(rule.count),
      score: Number(rule.score),
      chapterIds: [],
      chapterFromNo: null,
      chapterToNo: null,
      difficulties: [...rule.difficulties],
      knowledgePoints: parseKnowledgePoints(rule.knowledgeText),
    }));

const buildComposeRequest = (): PaperComposeRequest => ({
  targetScore: Number(composeTargetScore.value),
  mode: composeMode.value,
  rules: toComposeRules(),
});

const updateRuleDifficulties = (rule: ComposeRuleForm, values: string[]) => {
  rule.difficulties = values.filter((value): value is Difficulty =>
    difficultyOptions.some((option) => option.value === value),
  );
};

watch(
  () => [
    composeTargetScore.value,
    composeMode.value,
    composeChapterFromNo.value,
    composeChapterToNo.value,
    composeRules
      .map(
        (rule) =>
          `${rule.type}:${rule.count}:${rule.score}:${rule.difficulties.join(',')}:${rule.knowledgeText}`,
      )
      .join('|'),
  ],
  () => {
    composePreview.value = null;
  },
);

const previewComposeQuality = async (strategy: 'random' | 'agent' = 'agent') => {
  if (!selectedPaper.value) {
    return;
  }

  composePreviewLoading.value = true;
  errorMessage.value = null;
  try {
    composePreview.value =
      strategy === 'agent'
        ? await previewComposePaperAgent(selectedPaper.value.id, buildComposeRequest())
        : await previewComposePaperRandom(selectedPaper.value.id, buildComposeRequest());
    operationMessage.value = '组卷质量预览已更新，可检查题型、难度和知识点覆盖后再写入试卷。';
  } catch (error) {
    composePreview.value = null;
    errorMessage.value = getErrorMessage(error, '组卷预览失败，请检查题库库存、难度和知识点规则');
  } finally {
    composePreviewLoading.value = false;
  }
};

const composePaper = async (strategy: 'random' | 'agent') => {
  if (!selectedPaper.value) {
    return;
  }

  const actionName = strategy === 'agent' ? '智能组卷' : '随机组卷';
  const confirmed = await requestUserConfirmation(
    `确认执行${actionName}吗？${composeMode.value === 'REPLACE' ? '当前已选题目将被替换。' : '新题目将追加到当前试卷。'}`,
  );
  if (!confirmed) {
    return;
  }

  operating.value = true;
  errorMessage.value = null;
  try {
    const request = buildComposeRequest();
    const result =
      strategy === 'agent'
        ? await composePaperAgent(selectedPaper.value.id, request)
        : await composePaperRandom(selectedPaper.value.id, request);

    composePreview.value = {
      paperId: result.paper.id,
      mode: result.mode,
      strategy: result.strategy,
      targetScore: result.targetScore,
      currentScore:
        composeMode.value === 'APPEND' ? Number(selectedPaper.value?.totalScore ?? 0) : 0,
      plannedAddedScore: result.addedScore,
      plannedFinalScore: result.actualScore,
      plannedAddedCount: result.addedCount,
      ready: result.gaps.length === 0,
      gaps: result.gaps,
      warnings: result.warnings,
      qualityReport: result.qualityReport,
      agentPlan: result.agentPlan,
    };
    selectedPaperId.value = result.paper.id;
    paperQuestionPagination.page = 1;
    availableQuestionPagination.page = 1;
    await loadPapers();
    await loadSelectedPaperRelated();
    operationMessage.value = `${actionName}完成：新增 ${result.addedCount} 道题，试卷总分 ${result.actualScore} 分。`;
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      `${actionName}失败，请检查题库库存、难度和知识点规则`,
    );
  } finally {
    operating.value = false;
  }
};

watch(routePaperId, (paperId) => {
  selectedPaperId.value = paperId;
  paperQuestionPagination.page = 1;
  availableQuestionPagination.page = 1;
  composePreview.value = null;
  answerKey.value = null;
  answerKeyOpen.value = false;
  errorMessage.value = null;

  if (paperId) {
    void loadSelectedPaperRelated().catch((error) => {
      errorMessage.value = getErrorMessage(error, '试卷加载失败，请返回列表重新选择');
    });
    return;
  }

  clearSelectedPaperRelated();
  void loadPapers();
});

onMounted(() => {
  void loadData();
});
</script>

<template>
  <div class="page-shell papers-page">
    <OperationNotice
      v-if="operationMessage"
      title="组卷操作完成"
      :description="operationMessage"
      tone="success"
    />

    <p v-if="loading" class="muted-text loading-text">正在加载试卷与题库...</p>
    <ErrorState v-else-if="errorMessage" title="数据加载失败" :description="errorMessage">
      <AppActionButton @click="loadData">重试</AppActionButton>
    </ErrorState>

    <div
      v-else
      :class="[
        'paper-builder-layout',
        isPaperEditor ? 'paper-builder-layout--editor' : 'paper-builder-layout--list',
      ]"
    >
      <section v-if="!isPaperEditor" class="content-card paper-list-card paper-list-card--full">
        <div class="section-title">
          <div>
            <h2>试卷列表</h2>
            <p class="muted-text">共 {{ paperPagination.total }} 套试卷。</p>
          </div>
          <div class="section-actions">
            <AppActionButton
              class="icon-action-button"
              icon="➕"
              variant="primary"
              title="新增试卷"
              :disabled="operating"
              @click="openCreatePaperPanel"
            >
              新增试卷
            </AppActionButton>
            <AppActionButton
              class="icon-action-button"
              icon="📚"
              title="返回题库"
              to="/teacher/questions"
            >
              题库
            </AppActionButton>
            <AppActionButton
              class="icon-action-button"
              icon="🗓️"
              variant="primary"
              title="创建考试"
              to="/teacher/exams"
            >
              创建考试
            </AppActionButton>
          </div>
        </div>
        <div v-if="createPaperPanelOpen" class="create-paper-inline-panel">
          <div class="inline-form-title">
            <strong>创建新试卷</strong>
            <span>先确定课程与考试时长，再使用 100 分组卷模板补题。</span>
          </div>
          <div class="create-paper-form-grid">
            <AppFormControl
              v-model="createPaperForm.title"
              label="试卷名称"
              placeholder="例如：前端工程实践期末 A 卷"
            />
            <AppFormControl
              v-model="createPaperForm.courseId"
              control="select"
              label="课程"
              :options="createPaperCourseOptions"
            />
            <AppFormControl
              v-model="createPaperForm.durationMinutes"
              label="考试时长"
              type="number"
              min="1"
              step="1"
            />
            <AppFormControl
              v-model="createPaperForm.description"
              class="create-paper-description"
              label="说明"
              placeholder="可选：适用班级、考试范围或命题说明"
            />
          </div>
          <div class="create-paper-actions">
            <AppActionButton
              class="icon-action-button"
              icon="✖️"
              size="sm"
              :disabled="operating"
              title="取消创建"
              @click="cancelCreatePaper"
            >
              取消
            </AppActionButton>
            <AppActionButton
              class="icon-action-button"
              icon="✅"
              size="sm"
              variant="primary"
              :loading="operating"
              :disabled="operating"
              title="保存试卷"
              @click="submitCreatePaper"
            >
              保存试卷
            </AppActionButton>
          </div>
        </div>
        <div class="paper-list-grid">
          <article
            v-for="paper in papers"
            :key="paper.id"
            :class="[
              'paper-list-item',
              { 'paper-list-item--active': paper.id === selectedPaperId },
            ]"
          >
            <button
              class="paper-list-item__clickable"
              type="button"
              @click="openPaperEditor(paper.id)"
            >
              <span class="paper-list-item__topline">
                <strong>{{ paper.title }}</strong>
                <StatusTag
                  :label="PAPER_STATUS_META[paper.status].label"
                  :tone="PAPER_STATUS_META[paper.status].tone"
                />
              </span>
              <span class="paper-list-item__meta">
                {{ paper.courseName }} · {{ paper.questions.length }} 题 · {{ paper.totalScore }} 分
              </span>
            </button>
            <div class="paper-list-item__actions">
              <AppActionButton
                class="icon-action-button"
                icon="🗑️"
                size="sm"
                variant="danger"
                :disabled="operating || isPaperDeleteDisabled(paper)"
                :title="isPaperDeleteDisabled(paper) ? '已发布或归档试卷不能删除' : '删除试卷'"
                @click.stop="deletePaperItem(paper)"
              >
                删除
              </AppActionButton>
            </div>
          </article>
        </div>
        <EnterprisePagination
          v-if="paperPagination.total > 0"
          class="section-pagination"
          :current="paperPagination.page"
          :page-size="paperPagination.pageSize"
          :total="paperPagination.total"
          :page-size-options="['6', '12', '24']"
          :disabled="loading"
          @change="handlePaperPaginationChange"
        />
      </section>

      <section v-if="isPaperEditor && selectedPaper" class="content-card paper-editor-card">
        <div class="section-title">
          <div>
            <h2>{{ selectedPaper.title }}</h2>
            <p class="muted-text">
              {{ selectedPaper.description }} · 考试时长 {{ selectedPaper.durationMinutes }} 分钟 ·
              更新于
              {{ selectedPaper.updatedAt }}
            </p>
          </div>
          <div class="section-actions">
            <AppActionButton
              class="icon-action-button"
              icon="←"
              title="返回试卷列表"
              @click="backToPaperList"
            >
              返回列表
            </AppActionButton>
            <AppActionButton
              class="icon-action-button"
              icon="✓"
              variant="primary"
              :disabled="operating"
              title="标记可用于考试"
              @click="markReady"
            >
              标记可用于考试
            </AppActionButton>
            <AppActionButton
              class="icon-action-button"
              :icon="'\u{1F4D8}'"
              size="sm"
              :loading="answerKeyLoading"
              :disabled="operating || answerKeyLoading"
              title="&#x67E5;&#x770B;&#x5F53;&#x524D;&#x8BD5;&#x5377;&#x5B8C;&#x6574;&#x53C2;&#x8003;&#x7B54;&#x6848;"
              @click="loadAnswerKey"
            >
              &#x53C2;&#x8003;&#x7B54;&#x6848;
            </AppActionButton>
            <AppActionButton
              class="icon-action-button"
              icon="🗑️"
              size="sm"
              variant="danger"
              :disabled="operating || isPaperDeleteDisabled(selectedPaper)"
              :title="
                isPaperDeleteDisabled(selectedPaper) ? '已发布或归档试卷不能删除' : '删除当前试卷'
              "
              @click="deletePaperItem(selectedPaper)"
            >
              删除试卷
            </AppActionButton>
          </div>
        </div>

        <section
          v-if="answerKeyOpen && answerKey"
          class="paper-answer-key-panel"
          aria-label="&#x8BD5;&#x5377;&#x53C2;&#x8003;&#x7B54;&#x6848;"
        >
          <div class="paper-answer-key-panel__header">
            <div>
              <h3>&#x1F4D8; {{ answerKey.title }} &middot; &#x53C2;&#x8003;&#x7B54;&#x6848;</h3>
              <p class="muted-text">
                {{ answerKey.courseName }} &middot; &#x5171; {{ answerKey.items.length }} &#x9898;
                &middot; &#x603B;&#x5206; {{ answerKey.totalScore }} &#x5206;
              </p>
            </div>
            <AppActionButton
              class="icon-action-button"
              :icon="'\u2715'"
              size="sm"
              title="&#x5173;&#x95ED;&#x53C2;&#x8003;&#x7B54;&#x6848;"
              @click="answerKeyOpen = false"
            >
              &#x5173;&#x95ED;
            </AppActionButton>
          </div>

          <div class="paper-answer-key-list">
            <article v-for="item in answerKey.items" :key="item.id" class="paper-answer-key-item">
              <div class="paper-answer-key-item__heading">
                <strong>&#x7B2C; {{ item.order }} &#x9898;</strong>
                <QuestionTypeTag :type="item.question.type" short />
                <StatusTag :label="`${item.score} \u5206`" tone="default" />
              </div>
              <h4>{{ item.question.title }}</h4>
              <ul v-if="item.question.options.length" class="paper-answer-key-options">
                <li v-for="option in item.question.options" :key="option.key">
                  <span>{{ option.key }}</span>
                  {{ option.content }}
                </li>
              </ul>
              <div class="paper-answer-key-content">
                <div>
                  <span>&#x6807;&#x51C6;&#x7B54;&#x6848;</span>
                  <pre>{{ formatReferenceAnswer(item.question.answer) }}</pre>
                </div>
                <div v-if="item.question.analysis">
                  <span>&#x89E3;&#x6790;</span>
                  <p>{{ item.question.analysis }}</p>
                </div>
                <div v-if="item.question.scoringPoints.length">
                  <span>&#x8BC4;&#x5206;&#x70B9;</span>
                  <ul>
                    <li v-for="point in item.question.scoringPoints" :key="point.id">
                      {{ point.description }}&#xFF08;{{ point.score }} &#x5206;&#xFF09;
                    </li>
                  </ul>
                </div>
              </div>
            </article>
          </div>
        </section>

        <div class="paper-summary-grid">
          <div class="metric-card compact-metric">
            <span>题目数</span>
            <strong>{{ paperQuestionPagination.total }}</strong>
          </div>
          <div class="metric-card compact-metric">
            <span>总分</span>
            <strong>{{ selectedPaper.totalScore }}</strong>
          </div>
          <div class="metric-card compact-metric">
            <span>题型数</span>
            <strong>{{ selectedPaperTypeCount }}</strong>
          </div>
        </div>

        <div class="compose-assistant-card compose-assistant-card--refined">
          <div class="compose-assistant-header compose-assistant-header--refined">
            <div class="compose-assistant-title">
              <span class="compose-assistant-icon" aria-hidden="true">🧠</span>
              <div>
                <h3>组卷助手</h3>
                <p class="muted-text">
                  根据当前课程题库，按题型、难度、知识点与目标总分生成结构均衡的 100 分试卷。
                </p>
              </div>
            </div>
            <div class="compose-assistant-status">
              <span
                class="compose-status-pill"
                :class="{
                  'compose-status-pill--warning': composeFinalScore !== composeTargetScore,
                }"
              >
                {{ composeFinalScore === composeTargetScore ? '分值已匹配' : '分值需调整' }}
              </span>
              <div class="section-actions">
                <AppActionButton
                  class="icon-action-button"
                  icon="🧩"
                  size="sm"
                  title="恢复 100 分模板"
                  :disabled="operating"
                  @click="resetComposeTemplate"
                >
                  100 分模板
                </AppActionButton>
                <AppActionButton
                  class="icon-action-button"
                  :icon="composePanelOpen ? '▴' : '▾'"
                  size="sm"
                  title="收起或展开组卷规则"
                  @click="composePanelOpen = !composePanelOpen"
                >
                  {{ composePanelOpen ? '收起规则' : '展开规则' }}
                </AppActionButton>
              </div>
            </div>
          </div>

          <div class="compose-step-strip" aria-label="组卷流程">
            <span class="compose-step-strip__item compose-step-strip__item--active"
              >① 配置规则</span
            >
            <span class="compose-step-strip__item">② 质量预览</span>
            <span class="compose-step-strip__item">③ 写入试卷</span>
          </div>

          <div class="compose-command-panel">
            <div class="compose-toolbar compose-toolbar--refined">
              <AppFormControl
                v-model="composeTargetScore"
                label="目标总分"
                type="number"
                min="1"
                step="0.5"
              />
              <AppFormControl
                v-model="composeMode"
                control="select"
                label="写入方式"
                :options="composeModeOptions"
              />
              <div
                class="compose-score-preview compose-score-preview--refined"
                :class="{
                  'compose-score-preview--warning': composeFinalScore !== composeTargetScore,
                }"
              >
                <span>预计总分</span>
                <strong>{{ composeFinalScore }} / {{ composeTargetScore }} 分</strong>
                <small v-if="composeFinalScore !== composeTargetScore"
                  >需与目标总分一致后写入</small
                >
                <small v-else>可进行质量预览或直接组卷</small>
              </div>
            </div>

            <div class="compose-actions-strip">
              <AppActionButton
                class="icon-action-button"
                icon="📊"
                size="sm"
                :loading="composePreviewLoading"
                :disabled="
                  operating || composePreviewLoading || composeFinalScore !== composeTargetScore
                "
                title="预览题型、难度、知识点覆盖质量"
                @click="previewComposeQuality('agent')"
              >
                质量预览
              </AppActionButton>
              <AppActionButton
                class="icon-action-button"
                icon="🎲"
                size="sm"
                :loading="operating"
                :disabled="operating || composeFinalScore !== composeTargetScore"
                title="按规则随机抽题"
                @click="composePaper('random')"
              >
                随机组卷
              </AppActionButton>
              <AppActionButton
                class="icon-action-button"
                icon="🤖"
                size="sm"
                variant="primary"
                :loading="operating"
                :disabled="operating || composeFinalScore !== composeTargetScore"
                title="按题库库存智能均衡难度与知识点"
                @click="composePaper('agent')"
              >
                智能组卷
              </AppActionButton>
            </div>
          </div>

          <div v-if="composePreview" class="compose-quality-panel compose-quality-panel--refined">
            <div class="compose-quality-summary">
              <div>
                <span>质量报告</span>
                <strong
                  >{{ composePreview.qualityReport.actualScore }} /
                  {{ composePreview.targetScore }} 分</strong
                >
              </div>
              <div>
                <span>计划新增</span>
                <strong>{{ composePreview.plannedAddedCount }} 道</strong>
              </div>
              <div>
                <span>知识点</span>
                <strong>{{ composePreview.qualityReport.knowledgePointCount }} 个</strong>
              </div>
              <div>
                <span>工作流</span>
                <strong>{{ composePreview.strategy === 'AGENT' ? '智能计划' : '随机计划' }}</strong>
              </div>
            </div>

            <div v-if="!composePreview.ready" class="compose-gap-list">
              <strong>库存缺口</strong>
              <span v-for="gap in composePreview.gaps" :key="gap.type">
                {{ getErrorMessage(gap.message, '题库库存不足') }}：需要
                {{ gap.requiredCount }} 道，可用 {{ gap.availableCount }} 道
              </span>
            </div>
            <div v-if="composePreview.warnings.length" class="compose-warning-list">
              <strong>执行说明</strong>
              <span v-for="warning in composePreview.warnings" :key="warning">{{ warning }}</span>
            </div>

            <div class="compose-quality-grid">
              <div class="compose-quality-card">
                <h4>题型分值</h4>
                <div
                  v-for="item in composePreview.qualityReport.typeDistribution"
                  :key="item.key"
                  class="compose-bar-row"
                >
                  <span>{{ item.label }}</span>
                  <div><i :style="{ width: item.percentage + '%' }"></i></div>
                  <strong>{{ item.count }}题 / {{ item.score }}分</strong>
                </div>
              </div>
              <div class="compose-quality-card">
                <h4>难度结构</h4>
                <div
                  v-for="item in composePreview.qualityReport.difficultyDistribution"
                  :key="item.key"
                  class="compose-bar-row"
                >
                  <span>{{ item.label }}</span>
                  <div><i :style="{ width: item.percentage + '%' }"></i></div>
                  <strong>{{ item.percentage }}%</strong>
                </div>
              </div>
              <div class="compose-quality-card compose-quality-card--wide">
                <h4>知识点覆盖</h4>
                <div class="compose-knowledge-tags">
                  <span
                    v-for="item in composePreview.qualityReport.knowledgePointDistribution"
                    :key="item.key"
                  >
                    {{ item.label }} · {{ item.count }}题
                  </span>
                </div>
              </div>
            </div>

            <div class="compose-agent-plan">
              <div>
                <h4>{{ composePreview.agentPlan.summary }}</h4>
                <p class="muted-text">{{ composePreview.agentPlan.workflow }}</p>
              </div>
              <ul>
                <li v-for="step in composePreview.agentPlan.steps" :key="step">{{ step }}</li>
              </ul>
              <div class="compose-plan-detail">
                <div v-if="composePreview.agentPlan.rationale.length">
                  <strong>计划依据</strong>
                  <span v-for="item in composePreview.agentPlan.rationale" :key="item">{{
                    item
                  }}</span>
                </div>
                <div v-if="composePreview.agentPlan.recommendations.length">
                  <strong>复核建议</strong>
                  <span v-for="item in composePreview.agentPlan.recommendations" :key="item">{{
                    item
                  }}</span>
                </div>
              </div>
            </div>

            <div v-if="composePreview.qualityReport.risks.length" class="compose-risk-list">
              <strong>需要关注</strong>
              <span v-for="risk in composePreview.qualityReport.risks" :key="risk">{{ risk }}</span>
            </div>
            <div v-else class="compose-highlight-list">
              <strong>质量亮点</strong>
              <span v-for="item in composePreview.qualityReport.highlights" :key="item">{{
                item
              }}</span>
            </div>
          </div>

          <div v-if="composePanelOpen" class="compose-rule-grid compose-rule-grid--refined">
            <article v-for="rule in composeRules" :key="rule.type" class="compose-rule-card">
              <div class="compose-rule-card__header">
                <div class="compose-type-cell">
                  <strong>{{
                    questionTypeOptions.find((item) => item.value === rule.type)?.label
                  }}</strong>
                  <small>{{
                    questionTypeOptions.find((item) => item.value === rule.type)?.scoreHint
                  }}</small>
                </div>
                <strong class="compose-rule-subtotal">
                  {{ Number(rule.count || 0) * Number(rule.score || 0) }} 分
                </strong>
              </div>

              <div class="compose-rule-field-grid">
                <AppFormControl v-model="rule.count" label="题量" type="number" min="0" step="1" />
                <AppFormControl
                  v-model="rule.score"
                  label="单题分"
                  type="number"
                  min="0.5"
                  step="0.5"
                />
              </div>

              <AppFormControl
                v-model="rule.knowledgeText"
                class="compose-rule-knowledge-field"
                label="知识点约束"
                placeholder="可选，逗号分隔"
              />

              <AppChoiceChips
                label="难度范围"
                :model-value="rule.difficulties"
                :options="difficultyOptions"
                @update:model-value="updateRuleDifficulties(rule, $event)"
              />
            </article>
          </div>
        </div>

        <div class="paper-section-subtitle">
          <div>
            <h3>当前试卷题目</h3>
            <span>{{ paperQuestionPagination.total }} 道题，按题号顺序展示</span>
          </div>
        </div>

        <div class="paper-question-list">
          <article v-for="item in paperQuestions" :key="item.id" class="paper-question-item">
            <span class="question-order">{{ item.order }}</span>
            <div class="paper-question-content">
              <h3 :title="item.question.title">{{ item.question.title }}</h3>
              <div class="tag-list">
                <QuestionTypeTag :type="item.question.type" short />
                <DifficultyTag :difficulty="item.question.difficulty" />
                <StatusTag :label="`${item.score} 分`" tone="default" />
                <span
                  class="muted-text question-meta-text"
                  :title="item.question.knowledgePoints.join(' / ')"
                  >{{ item.question.knowledgePoints.join(' / ') }}</span
                >
              </div>
            </div>
            <AppActionButton
              class="icon-action-button"
              icon="−"
              variant="danger"
              :disabled="operating"
              title="移除题目"
              @click="removeQuestion(item.questionId, item.question.title)"
            >
              移除
            </AppActionButton>
          </article>
        </div>
        <EnterprisePagination
          v-if="paperQuestionPagination.total > 0"
          class="section-pagination"
          :current="paperQuestionPagination.page"
          :page-size="paperQuestionPagination.pageSize"
          :total="paperQuestionPagination.total"
          :page-size-options="['5', '10', '20']"
          :disabled="operating"
          @change="handlePaperQuestionPaginationChange"
        />
      </section>

      <section v-if="isPaperEditor && selectedPaper" class="content-card question-pool-card">
        <div class="section-title">
          <div>
            <h2>可选题目</h2>
            <p class="muted-text">
              仅显示 {{ selectedPaper.courseName }} 当前课程中已入库、未加入本试卷的题目。
            </p>
          </div>
        </div>

        <div class="available-question-filter-panel">
          <AppFormControl
            v-model="availableQuestionFilters.keyword"
            class="available-question-filter-field available-question-filter-field--keyword"
            label="关键词"
            placeholder="题干 / 知识点 / 解析"
            @keyup.enter="applyAvailableQuestionFilters"
          />
          <AppFormControl
            v-model="availableQuestionFilters.type"
            class="available-question-filter-field"
            control="select"
            label="题型"
            :options="availableQuestionTypeOptions"
            @change="applyAvailableQuestionFilters"
          />
          <AppFormControl
            v-model="availableQuestionFilters.difficulty"
            class="available-question-filter-field"
            control="select"
            label="难度"
            :options="availableQuestionDifficultyOptions"
            @change="applyAvailableQuestionFilters"
          />
          <div class="available-question-filter-actions">
            <AppActionButton
              class="icon-action-button"
              icon="🔍"
              size="sm"
              :disabled="operating"
              title="筛选可选题目"
              @click="applyAvailableQuestionFilters"
            >
              筛选
            </AppActionButton>
            <AppActionButton
              class="icon-action-button"
              icon="↺"
              size="sm"
              :disabled="operating || !hasAvailableQuestionFilter"
              title="重置筛选条件"
              @click="resetAvailableQuestionFilters"
            >
              重置
            </AppActionButton>
          </div>
        </div>

        <EmptyState
          v-if="!availableQuestionPagination.total"
          title="暂无可选题目"
          :description="availableQuestionEmptyDescription"
        />
        <template v-else>
          <div class="question-pool-list">
            <article
              v-for="question in availableQuestions"
              :key="question.id"
              class="question-pool-item"
            >
              <div class="question-pool-content">
                <h3 :title="question.title">{{ question.title }}</h3>
                <div class="tag-list">
                  <QuestionTypeTag :type="question.type" short />
                  <DifficultyTag :difficulty="question.difficulty" />
                  <span
                    class="muted-text question-meta-text"
                    :title="`${question.score} 分 · ${question.knowledgePoints.join(' / ')}`"
                    >{{ question.score }} 分 · {{ question.knowledgePoints.join(' / ') }}</span
                  >
                </div>
              </div>
              <AppActionButton
                class="icon-action-button"
                icon="＋"
                :disabled="operating"
                title="加入试卷"
                @click="addQuestion(question)"
              >
                加入试卷
              </AppActionButton>
            </article>
          </div>
          <EnterprisePagination
            v-if="availableQuestionPagination.total > 0"
            class="section-pagination"
            :current="availableQuestionPagination.page"
            :page-size="availableQuestionPagination.pageSize"
            :total="availableQuestionPagination.total"
            :page-size-options="['5', '10', '20', '50']"
            :disabled="operating"
            @change="handleAvailableQuestionPaginationChange"
          />
        </template>
      </section>
    </div>
  </div>
</template>
