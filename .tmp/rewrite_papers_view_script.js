const fs = require('fs');
const file = 'apps/mindmark-web/src/views/teacher/PapersView.vue';
let text = fs.readFileSync(file, 'utf8');
const template = text.slice(text.indexOf('</script>') + '</script>'.length);
const script = `<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';

import { getErrorMessage } from '@/utils/errorMessage';

import AppActionButton from '@/components/common/AppActionButton.vue';
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
  composePaperAgent,
  composePaperRandom,
  listPaperQuestionsPage,
  listPapersPage,
  removeQuestionFromPaper,
  updatePaperStatus,
} from '@/services/paperService';
import { listQuestionsPage } from '@/services/questionService';
import { requestUserConfirmation } from '@/utils/confirmAction';
import type { Paper, PaperComposeMode, PaperComposeRule, PaperQuestion } from '@/types/paper';
import type { Difficulty, Question, QuestionType } from '@/types/question';

interface ComposeRuleForm extends PaperComposeRule {
  knowledgeText: string;
}

const papers = ref<Paper[]>([]);
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

const questionTypeOptions: Array<{ label: string; value: QuestionType; scoreHint: string }> = [
  { label: '单选', value: 'SINGLE_CHOICE', scoreHint: '0.5-1 分' },
  { label: '多选', value: 'MULTIPLE_CHOICE', scoreHint: '1-2 分' },
  { label: '判断', value: 'TRUE_FALSE', scoreHint: '1 分' },
  { label: '填空', value: 'FILL_BLANK', scoreHint: '1 分' },
  { label: '简答', value: 'SHORT_ANSWER', scoreHint: '5 分' },
  { label: '编程', value: 'PROGRAMMING', scoreHint: '10 分' },
];

const difficultyOptions: Array<{ label: string; value: Difficulty }> = [
  { label: '1 易', value: 'VERY_EASY' },
  { label: '2 较易', value: 'EASY' },
  { label: '3 中', value: 'MEDIUM' },
  { label: '4 较难', value: 'HARD' },
  { label: '5 难', value: 'VERY_HARD' },
];

const createDefaultComposeRules = (): ComposeRuleForm[] => [
  {
    type: 'SINGLE_CHOICE',
    count: 20,
    score: 1,
    difficulties: ['EASY', 'MEDIUM'],
    knowledgePoints: [],
    knowledgeText: '',
  },
  {
    type: 'MULTIPLE_CHOICE',
    count: 10,
    score: 2,
    difficulties: ['MEDIUM', 'HARD'],
    knowledgePoints: [],
    knowledgeText: '',
  },
  {
    type: 'TRUE_FALSE',
    count: 10,
    score: 1,
    difficulties: ['VERY_EASY', 'EASY', 'MEDIUM'],
    knowledgePoints: [],
    knowledgeText: '',
  },
  {
    type: 'FILL_BLANK',
    count: 10,
    score: 1,
    difficulties: ['EASY', 'MEDIUM'],
    knowledgePoints: [],
    knowledgeText: '',
  },
  {
    type: 'SHORT_ANSWER',
    count: 4,
    score: 5,
    difficulties: ['MEDIUM', 'HARD'],
    knowledgePoints: [],
    knowledgeText: '',
  },
  {
    type: 'PROGRAMMING',
    count: 2,
    score: 10,
    difficulties: ['HARD', 'VERY_HARD'],
    knowledgePoints: [],
    knowledgeText: '',
  },
];

const composeRules = reactive<ComposeRuleForm[]>(createDefaultComposeRules());

const selectedPaper = computed(
  () => papers.value.find((paper) => paper.id === selectedPaperId.value) ?? null,
);

const selectedPaperTypeCount = computed(
  () => new Set(selectedPaper.value?.questions.map((item) => item.question.type) ?? []).size,
);

const selectedPaperQuestions = computed(() => paperQuestions.value);
const availableQuestions = computed(() => questionPool.value);
const composePlannedScore = computed(() =>
  composeRules.reduce((total, rule) => total + Number(rule.count || 0) * Number(rule.score || 0), 0),
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

  const page = await listQuestionsPage({
    status: 'ACTIVE',
    courseId: currentPaper.courseId,
    excludePaperId: currentPaper.id,
    page: availableQuestionPagination.page,
    pageSize: availableQuestionPagination.pageSize,
  });
  questionPool.value = page.items;
  availableQuestionPagination.total = page.total;
  availableQuestionPagination.page = page.page;
  availableQuestionPagination.pageSize = page.pageSize;
};

const loadSelectedPaperRelated = async () => {
  await Promise.all([loadPaperQuestions(), loadAvailableQuestions()]);
};

const loadPapers = async () => {
  const page = await listPapersPage(paperPagination.page, paperPagination.pageSize);
  papers.value = page.items;
  paperPagination.total = page.total;
  paperPagination.page = page.page;
  paperPagination.pageSize = page.pageSize;
  selectedPaperId.value = page.items.some((paper) => paper.id === selectedPaperId.value)
    ? selectedPaperId.value
    : page.items[0]?.id || '';
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

const selectPaper = (paperId: string) => {
  if (selectedPaperId.value === paperId) {
    return;
  }

  selectedPaperId.value = paperId;
  paperQuestionPagination.page = 1;
  availableQuestionPagination.page = 1;
  void loadSelectedPaperRelated();
};

const loadData = async () => {
  loading.value = true;
  errorMessage.value = null;

  try {
    await loadPapers();
    await loadSelectedPaperRelated();
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
  composeMode.value = 'REPLACE';
  composeRules.splice(0, composeRules.length, ...createDefaultComposeRules());
};

const toComposeRequest = (): PaperComposeRule[] =>
  composeRules
    .filter((rule) => Number(rule.count) > 0)
    .map((rule) => ({
      type: rule.type,
      count: Number(rule.count),
      score: Number(rule.score),
      difficulties: [...rule.difficulties],
      knowledgePoints: parseKnowledgePoints(rule.knowledgeText),
    }));

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
    const request = {
      targetScore: Number(composeTargetScore.value),
      mode: composeMode.value,
      rules: toComposeRequest(),
    };
    const result =
      strategy === 'agent'
        ? await composePaperAgent(selectedPaper.value.id, request)
        : await composePaperRandom(selectedPaper.value.id, request);

    selectedPaperId.value = result.paper.id;
    paperQuestionPagination.page = 1;
    availableQuestionPagination.page = 1;
    await loadPapers();
    await loadSelectedPaperRelated();
    operationMessage.value = `${actionName}完成：新增 ${result.addedCount} 道题，试卷总分 ${result.actualScore} 分。`;
  } catch (error) {
    errorMessage.value = getErrorMessage(error, `${actionName}失败，请检查题库库存、难度和知识点规则`);
  } finally {
    operating.value = false;
  }
};

onMounted(() => {
  void loadData();
});
</script>`;
fs.writeFileSync(file, Buffer.from(new TextEncoder().encode(script + template)));