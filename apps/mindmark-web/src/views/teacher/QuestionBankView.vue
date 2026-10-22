<script setup lang="ts">
import { computed, h, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  Button as AButton,
  Drawer as ADrawer,
  Space as ASpace,
  Table as ATable,
  Tooltip as ATooltip,
  type TableColumnsType,
  type TableProps,
} from 'ant-design-vue';

import AppActionButton from '@/components/common/AppActionButton.vue';
import AppCheckbox from '@/components/common/AppCheckbox.vue';
import AppFormControl from '@/components/common/AppFormControl.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import ErrorState from '@/components/common/ErrorState.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import DifficultyTag from '@/components/question/DifficultyTag.vue';
import QuestionPreviewCard from '@/components/question/QuestionPreviewCard.vue';
import QuestionTypeTag from '@/components/question/QuestionTypeTag.vue';
import { DIFFICULTY_META, QUESTION_TYPE_META } from '@/constants/question';
import { QUESTION_STATUS_META } from '@/constants/status';
import { listCourseChapters, listVisibleCourses } from '@/services/academicService';
import { addQuestionToPaper, listPapers } from '@/services/paperService';
import {
  createQuestion,
  deleteQuestion,
  getQuestionById,
  importMarkdownQuestions,
  listQuestionsPage,
  updateQuestion,
  type MarkdownQuestionImportResponse,
  type QuestionDeleteResponse,
  type QuestionUpsertRequest,
} from '@/services/questionService';
import { requestUserConfirmation } from '@/utils/confirmAction';
import { getErrorMessage } from '@/utils/errorMessage';
import { normalizeQuestionText } from '@/utils/markdownQuestionText';
import type { Course, CourseChapter } from '@/types/academic';
import type { Paper } from '@/types/paper';
import type {
  Difficulty,
  Question,
  QuestionOption,
  QuestionQuery,
  QuestionSource,
  QuestionStatus,
  QuestionType,
  ScoringPoint,
} from '@/types/question';

type FilterState = Required<
  Pick<
    QuestionQuery,
    'keyword' | 'type' | 'difficulty' | 'status' | 'source' | 'courseId' | 'chapterId'
  >
>;

type EditableScoringPoint = ScoringPoint & { keywordsText: string };

type EditQuestionForm = {
  courseId: string;
  chapterId: string;
  title: string;
  type: QuestionType;
  difficulty: Difficulty;
  knowledgePoints: string;
  score: number;
  answer: string;
  analysis: string;
  options: QuestionOption[];
  scoringPoints: EditableScoringPoint[];
};

const SOURCE_META: Record<QuestionSource, string> = {
  MANUAL: '人工录入',
  AI: 'AI 生成',
  IMPORT: '批量导入',
};

const MARKDOWN_IMPORT_MAX_SIZE = 2 * 1024 * 1024;

const typeOptions = Object.entries(QUESTION_TYPE_META).map(([value, meta]) => ({
  value: value as QuestionType,
  label: meta.label,
}));
const difficultyOptions = Object.entries(DIFFICULTY_META).map(([value, meta]) => ({
  value: value as Difficulty,
  label: meta.label,
}));
const statusOptions = Object.entries(QUESTION_STATUS_META).map(([value, meta]) => ({
  value: value as QuestionStatus,
  label: meta.label,
}));
const sourceOptions = Object.entries(SOURCE_META).map(([value, label]) => ({
  value: value as QuestionSource,
  label,
}));
const pageSizeOptions = ['10', '20', '50', '100'];

const courseFilterOptions = computed(() => [
  { label: '全部课程', value: 'ALL' },
  ...courses.value.map((course) => ({ label: course.name, value: course.id })),
]);
const courseRequiredOptions = computed(() => [
  { disabled: true, label: '请选择课程', value: '' },
  ...courses.value.map((course) => ({ label: course.name, value: course.id })),
]);
const typeFilterOptions = [{ label: '全部', value: 'ALL' }, ...typeOptions];
const difficultyFilterOptions = [{ label: '全部', value: 'ALL' }, ...difficultyOptions];
const statusFilterOptions = [{ label: '全部', value: 'ALL' }, ...statusOptions];
const sourceFilterOptions = [{ label: '全部', value: 'ALL' }, ...sourceOptions];
const availablePaperOptions = computed(() =>
  availablePapers.value.map((paper) => ({
    label: `${paper.title} · ${paper.totalScore} 分 · ${paper.status}`,
    value: paper.id,
  })),
);

const route = useRoute();

const query = reactive<FilterState>({
  keyword: '',
  courseId: 'ALL',
  chapterId: 'ALL',
  type: 'ALL',
  difficulty: 'ALL',
  status: 'ALL',
  source: 'ALL',
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

const courses = ref<Course[]>([]);
const chapterCache = ref<Record<string, CourseChapter[]>>({});
const questions = ref<Question[]>([]);
const selectedQuestion = ref<Question | null>(null);
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const isFilterCollapsed = ref(true);
const isDetailDrawerOpen = ref(false);
const isEditorMode = ref(false);
const feedbackMessage = ref<string | null>(null);
const feedbackTone = ref<'success' | 'danger' | 'info'>('info');
const isMarkdownImportOpen = ref(false);
const markdownImportCourseId = ref('');
const markdownImportFile = ref<File | null>(null);
const markdownImportFileName = ref('');
const markdownImportWarnings = ref<string[]>([]);
const markdownImportResult = ref<MarkdownQuestionImportResponse | null>(null);
const markdownImporting = ref(false);
const markdownFileInput = ref<HTMLInputElement | null>(null);
let feedbackTimer: number | undefined;

const papers = ref<Paper[]>([]);
const paperLoading = ref(false);
const composingQuestion = ref<Question | null>(null);
const selectedPaperId = ref('');
const editSaving = ref(false);
const composingSaving = ref(false);
const deletingQuestionId = ref<string | null>(null);
const editingQuestion = ref<Question | null>(null);
const isCreatingQuestion = ref(false);
const pendingEditQuestionId = ref<string | null>(null);
const editForm = reactive<EditQuestionForm>({
  courseId: '',
  chapterId: '',
  title: '',
  type: 'SINGLE_CHOICE',
  difficulty: 'MEDIUM',
  knowledgePoints: '',
  score: 0,
  answer: '',
  analysis: '',
  options: [],
  scoringPoints: [],
});

const totalPages = computed(() => Math.max(Math.ceil(pagination.total / pagination.pageSize), 1));
const pageRangeText = computed(() => {
  if (pagination.total === 0) {
    return '0-0';
  }
  const start = (pagination.page - 1) * pagination.pageSize + 1;
  const end = Math.min(pagination.page * pagination.pageSize, pagination.total);

  return `${start}-${end}`;
});
const questionDrawerTitle = computed(() => {
  if (isEditorMode.value) {
    return isCreatingQuestion.value ? '新增题目' : '编辑题目';
  }

  return '题目详情';
});
const editingCourseName = computed(() => {
  return courses.value.find((course) => course.id === editForm.courseId)?.name ?? '未选择课程';
});
const editingTypeLabel = computed(() => QUESTION_TYPE_META[editForm.type]?.label ?? editForm.type);
const editingDifficultyLabel = computed(
  () => DIFFICULTY_META[editForm.difficulty]?.label ?? editForm.difficulty,
);
const markdownImportCourseName = computed(
  () =>
    courses.value.find((course) => course.id === markdownImportCourseId.value)?.name ??
    '未选择课程',
);
const canSubmitMarkdownImport = computed(
  () =>
    Boolean(markdownImportCourseId.value && markdownImportFile.value) && !markdownImporting.value,
);

const chapterOptionsForCourse = (courseId?: string) => {
  if (!courseId || courseId === 'ALL') {
    return [];
  }
  return (chapterCache.value[courseId] ?? []).map((chapter) => ({
    label: `${chapter.chapterNo}. ${chapter.title}`,
    value: chapter.id,
  }));
};

const chapterFilterOptions = computed(() => [
  { label: '????', value: 'ALL' },
  ...chapterOptionsForCourse(query.courseId),
]);

const chapterEditOptions = computed(() => chapterOptionsForCourse(editForm.courseId));
const renderPaginationItem = ({
  page,
  type,
  originalElement,
}: {
  page: number;
  type: 'next' | 'page' | 'prev' | 'jump-prev' | 'jump-next';
  originalElement: unknown;
}) => {
  if (type === 'page') {
    return originalElement;
  }

  const paginationActionMeta: Record<string, { label: string; text: string }> = {
    prev: { label: '上一页', text: '‹' },
    next: { label: '下一页', text: '›' },
    'jump-prev': { label: `跳转到第 ${Math.max(page, 1)} 页之前`, text: '…' },
    'jump-next': { label: `跳转到第 ${Math.max(page, 1)} 页之后`, text: '…' },
  };
  const meta = paginationActionMeta[type] ?? { label: '分页操作', text: '…' };

  return h(
    'button',
    {
      type: 'button',
      class: 'ant-pagination-item-link enterprise-pagination-action',
      'aria-label': meta.label,
      title: meta.label,
    },
    meta.text,
  );
};
const questionTablePagination = computed(() => ({
  current: pagination.page,
  pageSize: pagination.pageSize,
  total: pagination.total,
  showSizeChanger: true,
  showQuickJumper: true,
  pageSizeOptions,
  size: 'small' as const,
  showTotal: (total: number, range: [number, number]) =>
    `第 ${range[0]}-${range[1]} 条 / 共 ${total} 道题`,
  itemRender: renderPaginationItem,
}));
const questionColumns = computed<TableColumnsType<Question>>(() => [
  {
    title: '题干',
    dataIndex: 'title',
    key: 'title',
    width: 360,
    ellipsis: true,
    fixed: 'left',
  },
  {
    title: '课程',
    dataIndex: 'courseName',
    key: 'courseName',
    width: 160,
    ellipsis: true,
  },
  {
    title: '知识点',
    key: 'knowledgePoints',
    width: 190,
    ellipsis: true,
  },
  {
    title: '题型',
    dataIndex: 'type',
    key: 'type',
    width: 108,
  },
  {
    title: '难度',
    dataIndex: 'difficulty',
    key: 'difficulty',
    width: 108,
  },
  {
    title: '来源',
    dataIndex: 'source',
    key: 'source',
    width: 106,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 112,
  },
  {
    title: '更新时间',
    dataIndex: 'updatedAt',
    key: 'updatedAt',
    width: 156,
    sorter: (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    defaultSortOrder: 'descend',
  },
  {
    title: '操作',
    key: 'actions',
    width: 170,
    fixed: 'right',
  },
]);

const toQueryString = (value: unknown) => (Array.isArray(value) ? value[0] : value)?.toString();

const applyRouteQuery = () => {
  const routeQuery = route.query;
  const keyword = toQueryString(routeQuery.keyword);
  const courseId = toQueryString(routeQuery.courseId);
  const type = toQueryString(routeQuery.type) as QuestionType | 'ALL' | undefined;
  const difficulty = toQueryString(routeQuery.difficulty) as Difficulty | 'ALL' | undefined;
  const status = toQueryString(routeQuery.status) as QuestionStatus | 'ALL' | undefined;
  const source = toQueryString(routeQuery.source) as QuestionSource | 'ALL' | undefined;
  const edit = toQueryString(routeQuery.edit);

  if (keyword) {
    query.keyword = keyword;
  }
  if (courseId) {
    query.courseId = courseId;
  }
  if (type) {
    query.type = type;
  }
  if (difficulty) {
    query.difficulty = difficulty;
  }
  if (status) {
    query.status = status;
  }
  if (source) {
    query.source = source;
  }
  if (edit) {
    pendingEditQuestionId.value = edit;
    query.keyword = keyword || edit;
    isFilterCollapsed.value = false;
  }
};

const availablePapers = computed(() => {
  if (!composingQuestion.value) {
    return [];
  }

  return papers.value.filter(
    (paper) =>
      paper.courseId === composingQuestion.value?.courseId &&
      (paper.status === 'DRAFT' || paper.status === 'READY'),
  );
});

const showFeedback = (message: string, tone: 'success' | 'danger' | 'info' = 'info') => {
  if (feedbackTimer) {
    window.clearTimeout(feedbackTimer);
    feedbackTimer = undefined;
  }
  feedbackMessage.value = message;
  feedbackTone.value = tone;
  if (tone === 'success') {
    feedbackTimer = window.setTimeout(() => clearFeedback(), 4200);
  }
};

const clearFeedback = () => {
  if (feedbackTimer) {
    window.clearTimeout(feedbackTimer);
    feedbackTimer = undefined;
  }
  feedbackMessage.value = null;
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value || '-';
  }

  const pad = (item: number) => item.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

const loadQuestions = async () => {
  loading.value = true;
  errorMessage.value = null;

  try {
    const result = await listQuestionsPage({
      ...query,
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
    questions.value = result.items;
    pagination.total = result.total;

    const currentSelection = result.items.find(
      (question) => question.id === selectedQuestion.value?.id,
    );
    if (currentSelection) {
      selectedQuestion.value = currentSelection;
    } else if (isDetailDrawerOpen.value) {
      selectedQuestion.value = result.items[0] ?? null;
    } else {
      selectedQuestion.value = null;
    }

    await openPendingEditQuestion(result.items);
    if (pagination.page > totalPages.value) {
      pagination.page = totalPages.value;
    }
  } catch (error) {
    questions.value = [];
    selectedQuestion.value = null;
    pagination.total = 0;
    errorMessage.value = getErrorMessage(error, '题库加载失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const ensureCourseChapters = async (courseId?: string) => {
  if (!courseId || courseId === 'ALL' || chapterCache.value[courseId]) {
    return;
  }
  try {
    const chapters = await listCourseChapters(courseId);
    chapterCache.value = { ...chapterCache.value, [courseId]: chapters };
  } catch {
    chapterCache.value = { ...chapterCache.value, [courseId]: [] };
  }
};

const loadCourses = async () => {
  try {
    courses.value = await listVisibleCourses();
    await Promise.all(courses.value.map((course) => ensureCourseChapters(course.id)));
  } catch {
    courses.value = [];
  }
};

const resetFilters = () => {
  query.keyword = '';
  query.courseId = 'ALL';
  query.chapterId = 'ALL';
  query.type = 'ALL';
  query.difficulty = 'ALL';
  query.status = 'ALL';
  query.source = 'ALL';
};

const resetMarkdownImportState = () => {
  markdownImportFile.value = null;
  markdownImportFileName.value = '';
  markdownImportWarnings.value = [];
  markdownImportResult.value = null;
  if (markdownFileInput.value) {
    markdownFileInput.value.value = '';
  }
};

const openMarkdownImport = () => {
  clearFeedback();
  resetMarkdownImportState();
  markdownImportCourseId.value =
    query.courseId !== 'ALL' ? query.courseId : (courses.value[0]?.id ?? '');
  isMarkdownImportOpen.value = true;
};

const closeMarkdownImport = () => {
  if (markdownImporting.value) {
    return;
  }
  isMarkdownImportOpen.value = false;
};

const triggerMarkdownFileSelect = () => {
  markdownFileInput.value?.click();
};

const handleMarkdownFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0] ?? null;
  markdownImportResult.value = null;
  markdownImportWarnings.value = [];
  if (!file) {
    markdownImportFile.value = null;
    markdownImportFileName.value = '';
    return;
  }
  if (!file.name.toLowerCase().endsWith('.md')) {
    markdownImportFile.value = null;
    markdownImportFileName.value = '';
    markdownImportWarnings.value = ['请选择 .md Markdown 题库文件。'];
    target.value = '';
    return;
  }
  if (file.size > MARKDOWN_IMPORT_MAX_SIZE) {
    markdownImportFile.value = null;
    markdownImportFileName.value = '';
    markdownImportWarnings.value = ['Markdown 文件不能超过 2MB，请拆分题库后导入。'];
    target.value = '';
    return;
  }
  markdownImportFile.value = file;
  markdownImportFileName.value = file.name;
};

const submitMarkdownImport = async () => {
  if (!markdownImportCourseId.value) {
    markdownImportWarnings.value = ['请先选择题目归属课程。'];
    return;
  }
  if (!markdownImportFile.value) {
    markdownImportWarnings.value = ['请先选择需要导入的 Markdown 题库文件。'];
    return;
  }

  markdownImporting.value = true;
  markdownImportWarnings.value = [];
  markdownImportResult.value = null;
  try {
    const markdown = (await markdownImportFile.value.text()).trim();
    if (!markdown) {
      markdownImportWarnings.value = ['Markdown 文件内容为空，请重新选择文件。'];
      return;
    }
    const result = await importMarkdownQuestions({
      courseId: markdownImportCourseId.value,
      fileName: markdownImportFile.value.name,
      markdown,
    });
    markdownImportResult.value = result;
    markdownImportWarnings.value = result.warnings ?? [];
    query.courseId = markdownImportCourseId.value;
    query.source = 'IMPORT';
    pagination.page = 1;
    showFeedback(
      `Markdown 题库导入完成：解析 ${result.parsedCount} 道，入库 ${result.importedCount} 道，跳过 ${result.skippedCount} 道。`,
      result.importedCount > 0 ? 'success' : 'info',
    );
    await loadQuestions();
  } catch (error) {
    showFeedback(
      getErrorMessage(error, 'Markdown 题库导入失败，请检查文件格式和课程选择'),
      'danger',
    );
  } finally {
    markdownImporting.value = false;
  }
};

const selectQuestion = (question: Question) => {
  selectedQuestion.value = question;
  isEditorMode.value = false;
  editingQuestion.value = null;
  isCreatingQuestion.value = false;
  isDetailDrawerOpen.value = true;
};

const openPendingEditQuestion = async (loadedItems: Question[]) => {
  if (!pendingEditQuestionId.value) {
    return;
  }

  const questionId = pendingEditQuestionId.value;
  let target = loadedItems.find((question) => question.id === questionId);
  if (!target) {
    try {
      target = await getQuestionById(questionId);
    } catch {
      target = undefined;
    }
  }

  if (!target) {
    showFeedback('未找到需要编辑的 AI 题目，请刷新 AI 出题审核页确认题目状态。', 'danger');
    pendingEditQuestionId.value = null;
    return;
  }

  openEdit(target);
  showFeedback('已定位到 AI 题目，请完成修订并保存；驳回题保存后会重新进入待审核。', 'info');
  pendingEditQuestionId.value = null;
};

const resetEditForm = (courseId = courses.value[0]?.id ?? '') => {
  editForm.courseId = courseId;
  editForm.chapterId = chapterCache.value[courseId]?.[0]?.id ?? '';
  editForm.title = '';
  editForm.type = 'SINGLE_CHOICE';
  editForm.difficulty = 'MEDIUM';
  editForm.knowledgePoints = '';
  editForm.score = 2;
  editForm.answer = 'A';
  editForm.analysis = '';
  editForm.options = [
    { key: 'A', content: '' },
    { key: 'B', content: '' },
    { key: 'C', content: '' },
    { key: 'D', content: '' },
  ];
  editForm.scoringPoints = [];
};

const openCreate = () => {
  clearFeedback();
  selectedQuestion.value = null;
  editingQuestion.value = null;
  isCreatingQuestion.value = true;
  isEditorMode.value = true;
  isDetailDrawerOpen.value = true;
  resetEditForm(query.courseId !== 'ALL' ? query.courseId : undefined);
};

const openEdit = (question: Question) => {
  clearFeedback();
  selectedQuestion.value = question;
  isCreatingQuestion.value = false;
  editingQuestion.value = question;
  isEditorMode.value = true;
  isDetailDrawerOpen.value = true;
  editForm.courseId = question.courseId;
  editForm.chapterId = question.chapterId ?? '';
  void ensureCourseChapters(question.courseId);
  editForm.title = normalizeQuestionText(question.title) || question.title;
  editForm.type = question.type;
  editForm.difficulty = question.difficulty;
  editForm.knowledgePoints = question.knowledgePoints.join('，');
  editForm.score = question.score;
  editForm.answer = Array.isArray(question.answer)
    ? question.answer.join(',')
    : normalizeQuestionText(String(question.answer ?? ''));
  editForm.analysis = normalizeQuestionText(question.analysis) || question.analysis;
  editForm.options = (question.options ?? []).map((option) => ({ ...option }));
  editForm.scoringPoints = (question.scoringPoints ?? []).map((point) => ({
    ...point,
    keywords: [...(point.keywords ?? [])],
    keywordsText: (point.keywords ?? []).join('，'),
  }));
};

const closeEdit = () => {
  const shouldCloseDrawer = isCreatingQuestion.value && !selectedQuestion.value;
  editingQuestion.value = null;
  isCreatingQuestion.value = false;
  isEditorMode.value = false;
  if (shouldCloseDrawer) {
    isDetailDrawerOpen.value = false;
  }
};

const closeQuestionDrawer = () => {
  isDetailDrawerOpen.value = false;
  editingQuestion.value = null;
  isCreatingQuestion.value = false;
  isEditorMode.value = false;
};

const parseList = (value: string) =>
  value
    .split(/[，,；;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeOptions = () =>
  editForm.options
    .map((option) => ({ key: option.key.trim().toUpperCase(), content: option.content.trim() }))
    .filter((option) => option.key && option.content);

const normalizeScoringPoints = () =>
  editForm.scoringPoints
    .map((point, index) => ({
      id: point.id?.trim() || `SP-${index + 1}`,
      description: point.description.trim(),
      score: Number(point.score) || 0,
      keywords: parseList(point.keywordsText),
      required: Boolean(point.required),
    }))
    .filter((point) => point.description);

const addOption = () => {
  const nextKey = String.fromCharCode(65 + editForm.options.length);
  editForm.options.push({ key: nextKey, content: '' });
};

const removeOption = (index: number) => {
  editForm.options.splice(index, 1);
};

const addScoringPoint = () => {
  editForm.scoringPoints.push({
    id: `SP-${Date.now()}`,
    description: '',
    score: 0,
    keywords: [],
    keywordsText: '',
    required: true,
  });
};

const removeScoringPoint = (index: number) => {
  editForm.scoringPoints.splice(index, 1);
};

const buildUpdateRequest = (): QuestionUpsertRequest => {
  if (!editForm.courseId) {
    throw new Error('请选择课程');
  }
  if (!editForm.title.trim()) {
    throw new Error('请填写题干');
  }
  if ((Number(editForm.score) || 0) <= 0) {
    throw new Error('分值必须大于 0');
  }
  if (!editForm.answer.trim()) {
    throw new Error('请填写参考答案');
  }

  const options = normalizeOptions();
  if (
    ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(editForm.type) &&
    !options.length
  ) {
    throw new Error('选择/判断题至少需要一个有效选项');
  }

  return {
    courseId: editForm.courseId,
    chapterId: editForm.chapterId || null,
    title: editForm.title.trim(),
    type: editForm.type,
    difficulty: editForm.difficulty,
    knowledgePoints: parseList(editForm.knowledgePoints),
    score: Number(editForm.score) || 0,
    answer:
      editForm.type === 'MULTIPLE_CHOICE' ? parseList(editForm.answer) : editForm.answer.trim(),
    analysis: editForm.analysis.trim(),
    options,
    scoringPoints: normalizeScoringPoints(),
  };
};

const saveEdit = async () => {
  if (!editingQuestion.value && !isCreatingQuestion.value) {
    return;
  }
  editSaving.value = true;
  try {
    const request = buildUpdateRequest();
    const creatingNew = isCreatingQuestion.value;
    const saved = creatingNew
      ? await createQuestion(request)
      : await updateQuestion(editingQuestion.value!.id, request);
    selectedQuestion.value = saved;
    closeEdit();
    showFeedback(
      creatingNew
        ? '题目已新增并进入可用题库。'
        : '题目已保存；如为已驳回 AI 题，将自动重新进入待审核。',
      'success',
    );
    await loadQuestions();
  } catch (error) {
    showFeedback(getErrorMessage(error, '题目保存失败，请检查表单内容'), 'danger');
  } finally {
    editSaving.value = false;
  }
};

const describeDeleteResult = (result: QuestionDeleteResponse) =>
  result.message || (result.physicallyDeleted ? '题目已删除。' : '题目已停用并保留历史记录。');

const confirmDeleteQuestion = async (question: Question) => {
  const confirmed = await requestUserConfirmation({
    title: '删除或停用题目',
    message: `确认删除题目「${question.title}」？\n\n若题目已被已发布试卷引用，系统会自动停用题目并保留历史试卷记录；未锁定试卷中的引用会自动移除。`,
    confirmText: '删除/停用',
    tone: 'danger',
  });
  if (!confirmed) {
    return;
  }

  deletingQuestionId.value = question.id;
  clearFeedback();
  try {
    const result = await deleteQuestion(question.id);
    showFeedback(describeDeleteResult(result), 'success');
    if (selectedQuestion.value?.id === question.id) {
      selectedQuestion.value = null;
      isDetailDrawerOpen.value = false;
    }
    if (editingQuestion.value?.id === question.id) {
      closeEdit();
    }
    if (composingQuestion.value?.id === question.id) {
      closeCompose();
    }
    if (!result.physicallyDeleted && query.status === 'ALL') {
      query.status = 'ACTIVE';
      pagination.page = 1;
      showFeedback(
        `${describeDeleteResult(result)} 已切换到“已入库”状态，避免停用题继续干扰组卷。`,
        'success',
      );
      return;
    }
    await loadQuestions();
  } catch (error) {
    showFeedback(getErrorMessage(error, '删除题目失败，请稍后重试'), 'danger');
  } finally {
    deletingQuestionId.value = null;
  }
};

const handlePaginationChange = (page: number, pageSize: number) => {
  pagination.page = page;
  pagination.pageSize = pageSize;
};

const handleTableChange: TableProps<Question>['onChange'] = (nextPagination) => {
  const nextPage = Number(nextPagination.current) || 1;
  const nextPageSize = Number(nextPagination.pageSize) || pagination.pageSize;
  if (nextPage !== pagination.page || nextPageSize !== pagination.pageSize) {
    handlePaginationChange(nextPage, nextPageSize);
  }
};

const toQuestionRecord = (record: Question | Record<string, unknown>) => record as Question;

const getQuestionSourceLabel = (record: Question | Record<string, unknown>) =>
  SOURCE_META[toQuestionRecord(record).source];

const getQuestionDisplayTitle = (record: Question | Record<string, unknown>) => {
  const question = toQuestionRecord(record);
  return normalizeQuestionText(question.title) || question.title;
};

const editQuestionRecord = (record: Question | Record<string, unknown>) => {
  openEdit(toQuestionRecord(record));
};

const composeQuestionRecord = (record: Question | Record<string, unknown>) => {
  void openCompose(toQuestionRecord(record));
};

const deleteQuestionRecord = (record: Question | Record<string, unknown>) => {
  void confirmDeleteQuestion(toQuestionRecord(record));
};

const createQuestionRowProps = (record: Question) => ({
  class:
    selectedQuestion.value?.id === record.id
      ? 'enterprise-question-row enterprise-question-row--active'
      : 'enterprise-question-row',
  onClick: () => selectQuestion(record),
  onDblclick: () => openEdit(record),
});

const loadPaperOptions = async () => {
  paperLoading.value = true;
  try {
    papers.value = await listPapers();
  } catch (error) {
    showFeedback(getErrorMessage(error, '试卷列表加载失败'), 'danger');
  } finally {
    paperLoading.value = false;
  }
};

const openCompose = async (question: Question) => {
  clearFeedback();
  if (question.status !== 'ACTIVE') {
    showFeedback('仅可将“已入库”状态的题目加入试卷。', 'danger');
    return;
  }
  selectedQuestion.value = question;
  composingQuestion.value = question;
  selectedPaperId.value = '';
  await loadPaperOptions();
  selectedPaperId.value = availablePapers.value[0]?.id ?? '';
};

const closeCompose = () => {
  composingQuestion.value = null;
  selectedPaperId.value = '';
};

const confirmCompose = async () => {
  if (!composingQuestion.value || !selectedPaperId.value) {
    return;
  }
  composingSaving.value = true;
  try {
    await addQuestionToPaper(selectedPaperId.value, composingQuestion.value);
    showFeedback('题目已加入试卷，可前往“试卷与组卷”继续调整题序和分值。', 'success');
    closeCompose();
  } catch (error) {
    showFeedback(getErrorMessage(error, '加入试卷失败，请确认课程与试卷一致'), 'danger');
  } finally {
    composingSaving.value = false;
  }
};

applyRouteQuery();

onMounted(() => {
  void loadCourses();
});

watch(
  query,
  () => {
    if (pagination.page !== 1) {
      pagination.page = 1;
      return;
    }
    void loadQuestions();
  },
  { deep: true, immediate: true },
);

watch(
  () => [pagination.page, pagination.pageSize] as const,
  () => {
    void loadQuestions();
  },
);

watch(
  () => query.courseId,
  async (courseId) => {
    query.chapterId = 'ALL';
    await ensureCourseChapters(courseId);
  },
);

watch(
  () => editForm.courseId,
  async (courseId) => {
    await ensureCourseChapters(courseId);
    if (!editForm.chapterId) {
      editForm.chapterId = chapterCache.value[courseId]?.[0]?.id ?? '';
    }
  },
);
</script>

<template>
  <div class="page-shell question-bank-page">
    <div
      v-if="feedbackMessage"
      :class="['question-feedback', `question-feedback--${feedbackTone}`]"
      :role="feedbackTone === 'danger' ? 'alert' : 'status'"
    >
      <span class="question-feedback__icon">
        {{ feedbackTone === 'success' ? '✓' : feedbackTone === 'danger' ? '!' : 'i' }}
      </span>
      <span class="question-feedback__content">{{ feedbackMessage }}</span>
      <button
        class="question-feedback__close"
        type="button"
        aria-label="关闭提示"
        @click="clearFeedback"
      >
        ×
      </button>
    </div>

    <section class="filter-card filter-card--compact question-filter-card">
      <div class="section-title question-filter-title">
        <div>
          <h2>题目筛选</h2>
          <p class="muted-text">筛选后实时刷新题库；超过一行的低频筛选可展开查看。</p>
        </div>
        <div class="section-actions question-filter-actions">
          <AppActionButton
            class="icon-action-button"
            icon="✨"
            to="/teacher/ai-questions"
            title="AI 出题"
          >
            AI 出题
          </AppActionButton>
          <AppActionButton
            class="icon-action-button"
            icon="＋"
            variant="primary"
            title="新增题目"
            @click="openCreate"
          >
            新增题目
          </AppActionButton>
          <AppActionButton
            class="icon-action-button"
            icon="📥"
            title="导入 Markdown 题库"
            @click="openMarkdownImport"
          >
            导入MD
          </AppActionButton>
          <AppActionButton
            class="icon-action-button"
            :icon="isFilterCollapsed ? '🔎' : '↟'"
            :aria-expanded="!isFilterCollapsed"
            :title="isFilterCollapsed ? '展开全部' : '收起到一行'"
            @click="isFilterCollapsed = !isFilterCollapsed"
          >
            {{ isFilterCollapsed ? '展开全部' : '收起到一行' }}
          </AppActionButton>
          <AppActionButton
            class="icon-action-button"
            icon="↺"
            title="重置筛选"
            @click="resetFilters"
          >
            重置
          </AppActionButton>
        </div>
      </div>
      <div
        :class="[
          'filter-grid',
          'collapsible-filter-body',
          { 'collapsible-filter-body--single-row': isFilterCollapsed },
        ]"
      >
        <AppFormControl
          v-model="query.keyword"
          class="form-field form-field--wide"
          label="关键词"
          type="search"
          placeholder="搜索题干、知识点或解析"
        />
        <AppFormControl
          v-model="query.courseId"
          class="form-field"
          control="select"
          label="课程"
          :options="courseFilterOptions"
        />
        <AppFormControl
          v-model="query.chapterId"
          class="form-field"
          control="select"
          label="??"
          :options="chapterFilterOptions"
        />
        <AppFormControl
          v-model="query.type"
          class="form-field"
          control="select"
          label="题型"
          :options="typeFilterOptions"
        />
        <AppFormControl
          v-model="query.difficulty"
          class="form-field"
          control="select"
          label="难度"
          :options="difficultyFilterOptions"
        />
        <AppFormControl
          v-model="query.status"
          class="form-field"
          control="select"
          label="状态"
          :options="statusFilterOptions"
        />
        <AppFormControl
          v-model="query.source"
          class="form-field"
          control="select"
          label="来源"
          :options="sourceFilterOptions"
        />
      </div>
    </section>

    <ADrawer
      v-model:open="isMarkdownImportOpen"
      class="markdown-import-drawer"
      :width="560"
      title="导入 Markdown 题库"
      destroy-on-close
      @close="closeMarkdownImport"
    >
      <div class="markdown-import-stack">
        <div class="markdown-import-hero">
          <span class="markdown-import-hero__icon">📚</span>
          <div>
            <strong>一键解析并写入题库</strong>
            <p>
              支持 exam/题库.md 同类格式；导入时题目知识点统一使用所选课程名称，重复题会自动跳过。
            </p>
          </div>
        </div>

        <AppFormControl
          v-model="markdownImportCourseId"
          class="form-field"
          control="select"
          label="归属课程"
          :options="courseRequiredOptions"
          hint="知识点将写入为该课程名称。"
        />

        <button class="markdown-upload-card" type="button" @click="triggerMarkdownFileSelect">
          <input
            ref="markdownFileInput"
            accept=".md,text/markdown,text/plain"
            class="markdown-import-file-input"
            type="file"
            @change="handleMarkdownFileChange"
          />
          <span class="markdown-upload-card__icon">⬆️</span>
          <span class="markdown-upload-card__body">
            <strong>{{ markdownImportFileName || '选择 Markdown 题库文件' }}</strong>
            <small>
              当前课程：{{ markdownImportCourseName }} · 支持 .md 文件 ·
              自动识别单选、多选、判断、填空、简答、程序与编程题
            </small>
          </span>
        </button>

        <div v-if="markdownImportResult" class="markdown-import-result">
          <span>解析 {{ markdownImportResult.parsedCount }} 道</span>
          <span>入库 {{ markdownImportResult.importedCount }} 道</span>
          <span>跳过 {{ markdownImportResult.skippedCount }} 道</span>
        </div>

        <ul v-if="markdownImportWarnings.length" class="markdown-import-warnings">
          <li v-for="warning in markdownImportWarnings.slice(0, 6)" :key="warning">
            {{ warning }}
          </li>
          <li v-if="markdownImportWarnings.length > 6">
            还有 {{ markdownImportWarnings.length - 6 }} 条提示未展示。
          </li>
        </ul>

        <div class="question-drawer-actions markdown-import-actions">
          <AppActionButton icon="↩" @click="closeMarkdownImport">取消</AppActionButton>
          <AppActionButton
            :disabled="!canSubmitMarkdownImport"
            :loading="markdownImporting"
            icon="✓"
            variant="primary"
            @click="submitMarkdownImport"
          >
            {{ markdownImporting ? '导入中...' : '开始导入' }}
          </AppActionButton>
        </div>
      </div>
    </ADrawer>
    <section class="content-card question-table-card">
      <div class="section-title question-table-title">
        <div>
          <h2>题库列表</h2>
          <p class="muted-text">
            共 {{ pagination.total }} 道题 · 当前显示 {{ pageRangeText }} ·
            默认按更新时间倒序；点击行查看详情，双击快速编辑。
          </p>
        </div>
      </div>

      <ErrorState v-if="errorMessage" title="数据加载失败" :description="errorMessage">
        <AppActionButton icon="↻" @click="loadQuestions">重试</AppActionButton>
      </ErrorState>

      <ATable
        v-else
        class="enterprise-question-table"
        row-key="id"
        size="middle"
        :columns="questionColumns"
        :custom-row="createQuestionRowProps"
        :data-source="questions"
        :loading="loading"
        :pagination="questionTablePagination"
        :scroll="{ x: 1370 }"
        @change="handleTableChange"
      >
        <template #emptyText>
          <EmptyState
            title="暂无匹配题目"
            description="请调整筛选条件，或通过新增题目 / AI 出题补充题库。"
          />
        </template>

        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'title'">
            <ATooltip :title="getQuestionDisplayTitle(record)">
              <span class="question-title-ellipsis">{{ getQuestionDisplayTitle(record) }}</span>
            </ATooltip>
          </template>
          <template v-else-if="column.key === 'courseName'">
            <ATooltip :title="record.courseName">
              <span class="cell-ellipsis">{{ record.courseName || '-' }}</span>
            </ATooltip>
          </template>
          <template v-else-if="column.key === 'knowledgePoints'">
            <ATooltip :title="record.knowledgePoints.join(' / ')">
              <span class="cell-ellipsis knowledge-ellipsis">
                {{ record.knowledgePoints.join(' / ') || '-' }}
              </span>
            </ATooltip>
          </template>
          <template v-else-if="column.key === 'type'">
            <QuestionTypeTag :type="record.type" short />
          </template>
          <template v-else-if="column.key === 'difficulty'">
            <DifficultyTag :difficulty="record.difficulty" />
          </template>
          <template v-else-if="column.key === 'source'">
            <StatusTag :label="getQuestionSourceLabel(record)" tone="default" />
          </template>
          <template v-else-if="column.key === 'status'">
            <StatusTag
              :label="QUESTION_STATUS_META[record.status].label"
              :tone="QUESTION_STATUS_META[record.status].tone"
            />
          </template>
          <template v-else-if="column.key === 'updatedAt'">
            <span class="time-cell">{{ formatDateTime(record.updatedAt) }}</span>
          </template>
          <template v-else-if="column.key === 'actions'">
            <ASpace class="question-row-actions" :size="4" @click.stop>
              <AButton type="link" size="small" @click.stop="editQuestionRecord(record)"
                >编辑</AButton
              >
              <AButton type="link" size="small" @click.stop="composeQuestionRecord(record)"
                >组卷</AButton
              >
              <AButton
                type="link"
                size="small"
                danger
                :loading="deletingQuestionId === toQuestionRecord(record).id"
                @click.stop="deleteQuestionRecord(record)"
              >
                删除
              </AButton>
            </ASpace>
          </template>
        </template>
      </ATable>
    </section>

    <ADrawer
      v-model:open="isDetailDrawerOpen"
      class="question-detail-drawer"
      :width="960"
      :title="questionDrawerTitle"
      destroy-on-close
      @close="closeQuestionDrawer"
    >
      <template #extra>
        <ASpace v-if="selectedQuestion && !isEditorMode" class="question-detail-actions" :size="10">
          <AppActionButton icon="✎" size="sm" @click="openEdit(selectedQuestion)">
            编辑题目
          </AppActionButton>
          <AppActionButton
            icon="＋"
            size="sm"
            variant="primary"
            @click="openCompose(selectedQuestion)"
          >
            加入试卷
          </AppActionButton>
        </ASpace>
      </template>

      <QuestionPreviewCard v-if="selectedQuestion && !isEditorMode" :item="selectedQuestion" />

      <div v-else class="question-edit-stack">
        <div class="question-edit-hero">
          <div class="question-edit-hero__icon">🧾</div>
          <div class="question-edit-hero__content">
            <span class="question-edit-hero__eyebrow">{{
              isCreatingQuestion ? '题目入库' : '题目维护'
            }}</span>
            <strong>{{
              isCreatingQuestion ? '创建标准化题目资源' : '维护题目内容与答案解析'
            }}</strong>
            <p>统一维护题干、选项、答案解析与评分点，保存后同步更新题库与组卷资源。</p>
          </div>
          <div class="question-edit-hero__meta" aria-label="当前编辑摘要">
            <span>{{ editingCourseName }}</span>
            <span>{{ editingTypeLabel }}</span>
            <span>{{ editingDifficultyLabel }}</span>
          </div>
        </div>

        <div class="question-edit-sections">
          <section class="question-edit-section">
            <div class="question-edit-section__head">
              <span class="question-edit-section__index">01</span>
              <div>
                <strong>基础属性</strong>
                <span>决定题目归属、类型、难度和默认分值。</span>
              </div>
            </div>
            <div class="question-edit-grid question-edit-grid--meta">
              <AppFormControl
                v-model="editForm.courseId"
                class="form-field"
                control="select"
                label="课程"
                :options="courseRequiredOptions"
              />
              <AppFormControl
                v-model="editForm.chapterId"
                class="form-field"
                control="select"
                label="??"
                :options="chapterEditOptions"
              />
              <AppFormControl
                v-model="editForm.type"
                class="form-field"
                control="select"
                label="题型"
                :options="typeOptions"
              />
              <AppFormControl
                v-model="editForm.difficulty"
                class="form-field"
                control="select"
                label="难度"
                :options="difficultyOptions"
              />
              <AppFormControl
                v-model="editForm.score"
                class="form-field"
                label="分值"
                min="0"
                type="number"
              />
            </div>
          </section>

          <section class="question-edit-section">
            <div class="question-edit-section__head">
              <span class="question-edit-section__index">02</span>
              <div>
                <strong>题目内容</strong>
                <span>题干、知识点、参考答案和解析均以结构化字段保存。</span>
              </div>
            </div>
            <div class="question-edit-grid">
              <AppFormControl
                v-model="editForm.title"
                class="form-field form-field--full question-title-textarea"
                control="textarea"
                label="题干"
                rows="5"
                placeholder="请输入清晰、完整、无歧义的题干"
              />
              <AppFormControl
                v-model="editForm.knowledgePoints"
                class="form-field form-field--full"
                label="知识点"
                placeholder="多个知识点可用中文逗号、英文逗号或换行分隔"
              />
              <AppFormControl
                v-model="editForm.answer"
                class="form-field form-field--full"
                control="textarea"
                label="参考答案"
                rows="2"
                placeholder="多选题可填写 A,B 或用逗号分隔"
              />
              <AppFormControl
                v-model="editForm.analysis"
                class="form-field form-field--full"
                control="textarea"
                label="解析"
                rows="4"
                placeholder="请说明答案依据，便于学生订正和 AI 讲评复用"
              />
            </div>
          </section>

          <section class="question-edit-section structured-editor">
            <div class="structured-editor__header">
              <div class="question-edit-section__head">
                <span class="question-edit-section__index">03</span>
                <div>
                  <strong>选项</strong>
                  <span>客观题建议保持 2-6 个选项，主观题可留空。</span>
                </div>
              </div>
              <AppActionButton
                aria-label="新增选项"
                title="新增选项"
                variant="tag"
                @click="addOption"
              >
                ＋选项
              </AppActionButton>
            </div>
            <div v-if="!editForm.options.length" class="structured-empty">
              暂无选项，主观题可不填写。
            </div>
            <div
              v-for="(option, index) in editForm.options"
              :key="`${option.key}-${index}`"
              class="option-editor-row"
            >
              <AppFormControl
                v-model="option.key"
                class="option-key-input"
                hide-label
                label="选项标识"
                placeholder="A"
              />
              <AppFormControl
                v-model="option.content"
                hide-label
                label="选项内容"
                placeholder="选项内容"
              />
              <AppActionButton
                aria-label="删除选项"
                icon="🗑"
                icon-only
                title="删除选项"
                variant="tag-danger"
                @click="removeOption(index)"
              />
            </div>
          </section>

          <section class="question-edit-section structured-editor">
            <div class="structured-editor__header">
              <div class="question-edit-section__head">
                <span class="question-edit-section__index">04</span>
                <div>
                  <strong>评分点</strong>
                  <span>主观题可配置关键词和必需项，客观题可留空。</span>
                </div>
              </div>
              <AppActionButton
                aria-label="新增评分点"
                title="新增评分点"
                variant="tag"
                @click="addScoringPoint"
              >
                ＋评分点
              </AppActionButton>
            </div>
            <div v-if="!editForm.scoringPoints.length" class="structured-empty">
              暂无评分点，客观题可不填写。
            </div>
            <div
              v-for="(point, index) in editForm.scoringPoints"
              :key="point.id || index"
              class="scoring-editor-row"
            >
              <AppFormControl
                v-model="point.description"
                hide-label
                label="评分点说明"
                placeholder="评分点说明"
              />
              <AppFormControl
                v-model="point.score"
                class="score-input"
                hide-label
                label="分值"
                min="0"
                type="number"
                placeholder="分值"
              />
              <AppFormControl
                v-model="point.keywordsText"
                hide-label
                label="关键词"
                placeholder="关键词，逗号分隔"
              />
              <AppCheckbox v-model="point.required" label="必需" />
              <AppActionButton
                aria-label="删除评分点"
                icon="🗑"
                icon-only
                title="删除评分点"
                variant="tag-danger"
                @click="removeScoringPoint(index)"
              />
            </div>
          </section>
        </div>

        <div class="question-drawer-actions question-editor-actions">
          <AppActionButton icon="↩" @click="closeEdit">取消</AppActionButton>
          <AppActionButton :loading="editSaving" icon="✓" variant="primary" @click="saveEdit">
            {{ editSaving ? '保存中...' : isCreatingQuestion ? '创建题目' : '保存题目' }}
          </AppActionButton>
        </div>
      </div>
    </ADrawer>

    <ADrawer
      :open="Boolean(composingQuestion)"
      class="question-compose-drawer"
      :width="520"
      title="加入试卷"
      destroy-on-close
      @close="closeCompose"
    >
      <div v-if="composingQuestion" class="compose-drawer-body">
        <div class="compose-summary">
          <strong>{{ composingQuestion.title }}</strong>
          <span class="muted-text">{{ composingQuestion.courseName }}</span>
        </div>
        <p v-if="paperLoading" class="muted-text loading-text">正在加载试卷...</p>
        <EmptyState
          v-else-if="!availablePapers.length"
          title="暂无可加入试卷"
          description="请先在“试卷与组卷”创建同课程的草稿试卷，或检查试卷状态。"
        />
        <template v-else>
          <AppFormControl
            v-model="selectedPaperId"
            class="form-field"
            control="select"
            label="选择试卷"
            :options="availablePaperOptions"
          />
          <div class="question-drawer-actions question-editor-actions question-compose-actions">
            <AppActionButton icon="↗" to="/teacher/papers">试卷管理</AppActionButton>
            <AppActionButton
              :disabled="!selectedPaperId"
              :loading="composingSaving"
              icon="＋"
              variant="primary"
              @click="confirmCompose"
            >
              {{ composingSaving ? '加入中...' : '确认加入' }}
            </AppActionButton>
          </div>
        </template>
      </div>
    </ADrawer>
  </div>
</template>

<style scoped>
.question-bank-page {
  display: grid;
  gap: 20px;
}

.question-feedback {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: var(--space-2);
  padding: 10px 12px;
  border: 1px solid var(--mm-color-border);
  border-radius: var(--radius-sm);
  background: var(--mm-color-card);
  box-shadow: var(--shadow-sm);
}

.question-feedback__icon {
  display: inline-grid;
  width: 20px;
  height: 20px;
  place-items: center;
  border-radius: 999px;
  background: color-mix(in srgb, var(--mm-color-primary) 10%, transparent);
  color: var(--mm-color-primary);
  font-size: 0.76rem;
  font-weight: 700;
}

.question-feedback__content {
  color: var(--mm-color-text-primary);
  font-size: 0.84rem;
  line-height: 1.55;
}

.question-feedback__close {
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--mm-color-text-tertiary);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}

.question-feedback__close:hover {
  background: color-mix(in srgb, var(--mm-color-primary) 8%, transparent);
  color: var(--mm-color-text-primary);
}

.question-feedback--success {
  border-color: color-mix(in srgb, var(--mm-color-success) 36%, var(--mm-color-border));
  background: color-mix(in srgb, var(--mm-color-success) 8%, var(--mm-color-card));
}

.question-feedback--success .question-feedback__icon {
  background: color-mix(in srgb, var(--mm-color-success) 14%, transparent);
  color: var(--mm-color-success);
}

.question-feedback--danger {
  border-color: color-mix(in srgb, var(--mm-color-danger) 34%, var(--mm-color-border));
  background: color-mix(in srgb, var(--mm-color-danger) 7%, var(--mm-color-card));
}

.question-feedback--danger .question-feedback__icon {
  background: color-mix(in srgb, var(--mm-color-danger) 14%, transparent);
  color: var(--mm-color-danger);
}

.question-bank-page > .question-filter-card {
  margin-top: 0;
  margin-bottom: 0;
}

.question-filter-title {
  align-items: flex-start;
}

.question-filter-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.question-detail-actions {
  align-items: center;
}
.markdown-import-stack {
  display: grid;
  gap: 16px;
}

.markdown-import-hero {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--mm-color-primary) 14%, var(--mm-color-border));
  border-radius: var(--radius-sm);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--mm-color-primary) 7%, var(--mm-color-card)),
    var(--mm-color-card)
  );
}

.markdown-import-hero__icon {
  display: inline-grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--mm-color-primary) 12%, transparent);
}

.markdown-import-hero strong {
  display: block;
  color: var(--mm-color-text-primary);
  font-size: 14px;
  line-height: 1.35;
}

.markdown-import-hero p {
  margin: 6px 0 0;
  color: var(--mm-color-text-secondary);
  font-size: 12px;
  line-height: 1.55;
}

.markdown-upload-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  width: 100%;
  padding: 14px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: color-mix(in srgb, var(--mm-color-bg) 48%, var(--mm-color-card));
  border: 1px dashed color-mix(in srgb, var(--mm-color-primary) 34%, var(--mm-color-border));
  border-radius: var(--radius-sm);
  transition:
    border-color 140ms ease,
    background 140ms ease,
    transform 140ms ease;
}

.markdown-upload-card:hover {
  background: color-mix(in srgb, var(--mm-color-primary) 5%, var(--mm-color-card));
  border-color: color-mix(in srgb, var(--mm-color-primary) 56%, var(--mm-color-border));
  transform: translateY(-1px);
}

.markdown-upload-card__icon {
  display: inline-grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: var(--radius-sm);
  background: var(--mm-color-card);
  box-shadow: var(--shadow-sm);
}

.markdown-upload-card__body {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.markdown-upload-card__body strong {
  overflow: hidden;
  color: var(--mm-color-text-primary);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.markdown-upload-card__body small {
  color: var(--mm-color-text-tertiary);
  font-size: 11px;
  line-height: 1.45;
}

.markdown-import-file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.markdown-import-result {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.markdown-import-result span {
  padding: 5px 9px;
  color: var(--mm-color-primary);
  font-size: 12px;
  background: color-mix(in srgb, var(--mm-color-primary) 9%, transparent);
  border-radius: var(--radius-sm);
}

.markdown-import-warnings {
  display: grid;
  gap: 6px;
  padding: 10px 12px 10px 28px;
  margin: 0;
  color: var(--mm-color-warning);
  font-size: 12px;
  line-height: 1.45;
  background: color-mix(in srgb, var(--mm-color-warning) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--mm-color-warning) 22%, var(--mm-color-border));
  border-radius: var(--radius-sm);
}

.markdown-import-actions {
  justify-content: flex-end;
  padding-top: 4px;
}

.question-edit-stack,
.compose-drawer-body,
.question-edit-sections {
  display: grid;
  gap: 16px;
}

.question-detail-drawer :deep(.ant-drawer-title) {
  color: var(--mm-color-text-primary);
  font-size: 0.96rem;
  font-weight: 650;
  letter-spacing: -0.01em;
}

.question-edit-stack {
  --edit-accent: color-mix(in srgb, var(--mm-color-primary) 78%, #7c3aed);
}

.question-edit-hero {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 16px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--mm-color-primary) 14%, var(--mm-color-border));
  border-radius: var(--radius-sm);
  background:
    radial-gradient(
      circle at 0 0,
      color-mix(in srgb, var(--mm-color-primary) 10%, transparent),
      transparent 34%
    ),
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--mm-color-primary) 5%, var(--mm-color-card)),
      var(--mm-color-card)
    );
  box-shadow: 0 10px 28px rgb(15 23 42 / 5%);
}

.question-edit-hero::after {
  position: absolute;
  right: 18px;
  bottom: -36px;
  width: 120px;
  height: 120px;
  border: 1px solid color-mix(in srgb, var(--mm-color-primary) 12%, transparent);
  border-radius: 999px;
  content: '';
}

.question-edit-hero__icon {
  display: inline-grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 1rem;
  background: linear-gradient(
    135deg,
    var(--edit-accent),
    color-mix(in srgb, var(--mm-color-primary) 48%, #0f172a)
  );
  box-shadow: 0 10px 20px color-mix(in srgb, var(--mm-color-primary) 18%, transparent);
}

.question-edit-hero__content {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.question-edit-hero__eyebrow {
  color: var(--mm-color-primary);
  font-size: 0.68rem;
  font-weight: 720;
  letter-spacing: 0.12em;
}

.question-edit-hero__content strong {
  color: var(--mm-color-text-primary);
  font-size: 1rem;
  font-weight: 680;
  letter-spacing: -0.01em;
}

.question-edit-hero__content p {
  max-width: 600px;
  margin: 0;
  color: var(--mm-color-text-secondary);
  font-size: 0.8rem;
  line-height: 1.55;
}

.question-edit-hero__meta {
  position: relative;
  z-index: 1;
  display: flex;
  max-width: 260px;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.question-edit-hero__meta span {
  max-width: 180px;
  padding: 5px 8px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--mm-color-primary) 14%, var(--mm-color-border));
  border-radius: 999px;
  color: var(--mm-color-text-secondary);
  font-size: 0.74rem;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: color-mix(in srgb, var(--mm-color-card) 82%, transparent);
}

.question-edit-section {
  position: relative;
  display: grid;
  gap: 14px;
  padding: 16px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--mm-color-border) 84%, transparent);
  border-radius: var(--radius-sm);
  background:
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--mm-color-primary) 3%, transparent),
      transparent 24%
    ),
    var(--mm-color-card);
  box-shadow: 0 10px 24px rgb(15 23 42 / 4%);
}

.question-edit-section::before {
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: linear-gradient(
    180deg,
    var(--edit-accent),
    color-mix(in srgb, var(--mm-color-primary) 18%, transparent)
  );
  content: '';
  opacity: 0.72;
}

.question-edit-section__head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 10px;
}

.question-edit-section__index {
  display: inline-grid;
  min-width: 30px;
  height: 24px;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--mm-color-primary) 18%, var(--mm-color-border));
  border-radius: var(--radius-xs);
  color: var(--mm-color-primary);
  font-size: 0.7rem;
  font-weight: 760;
  line-height: 1;
  background: color-mix(in srgb, var(--mm-color-primary) 7%, var(--mm-color-card));
}

.question-edit-section__head > div {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.question-edit-section__head strong {
  color: var(--mm-color-text-primary);
  font-size: 0.88rem;
  font-weight: 680;
  letter-spacing: -0.01em;
}

.question-edit-section__head span:not(.question-edit-section__index) {
  color: var(--mm-color-text-secondary);
  font-size: 0.77rem;
  line-height: 1.45;
}

.question-edit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.question-edit-grid--meta {
  grid-template-columns: minmax(240px, 1.5fr) repeat(3, minmax(120px, 0.7fr));
}

.question-edit-stack .form-field {
  gap: 6px;
  color: var(--mm-color-text-secondary);
  font-size: 0.76rem;
  font-weight: 650;
}

.question-edit-stack .text-input,
.question-edit-stack .select-input,
.question-edit-stack .textarea-input {
  min-height: 36px;
  border-color: color-mix(in srgb, var(--mm-color-border) 86%, transparent);
  border-radius: var(--radius-xs);
  background: color-mix(in srgb, var(--mm-color-card) 92%, var(--mm-color-background));
  transition:
    border-color 140ms ease,
    box-shadow 140ms ease,
    background 140ms ease;
}

.question-edit-stack .text-input:hover,
.question-edit-stack .select-input:hover,
.question-edit-stack .textarea-input:hover {
  border-color: color-mix(in srgb, var(--mm-color-primary) 24%, var(--mm-color-border));
  background: var(--mm-color-card);
}

.question-title-textarea {
  min-height: 136px;
}

.question-drawer-actions {
  position: sticky;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  bottom: -18px;
  z-index: 2;
  padding: 14px 0 0;
  background: linear-gradient(
    to top,
    color-mix(in srgb, var(--mm-color-background) 98%, transparent),
    color-mix(in srgb, var(--mm-color-background) 84%, transparent),
    transparent
  );
}

.question-editor-actions,
.question-compose-actions {
  align-items: center;
  gap: 14px;
}

.question-editor-actions {
  justify-content: flex-end;
}

.structured-editor {
  display: grid;
  gap: 10px;
}

.structured-editor__header,
.option-editor-row,
.scoring-editor-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.structured-editor__header {
  justify-content: space-between;
}

.structured-editor__header .question-edit-section__head {
  min-width: 0;
}

.structured-empty {
  padding: 14px;
  border: 1px dashed color-mix(in srgb, var(--mm-color-primary) 18%, var(--mm-color-border));
  border-radius: var(--radius-sm);
  color: var(--mm-color-text-secondary);
  font-size: 0.8rem;
  text-align: center;
  background: color-mix(in srgb, var(--mm-color-primary) 4%, var(--mm-color-card));
}

.option-editor-row,
.scoring-editor-row {
  padding: 10px;
  border: 1px solid color-mix(in srgb, var(--mm-color-border) 80%, transparent);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--mm-color-card) 88%, var(--mm-color-background));
}

.option-editor-row .app-form-control,
.scoring-editor-row .app-form-control {
  min-width: 0;
}

.option-editor-row .app-form-control:not(.option-key-input),
.scoring-editor-row .app-form-control:first-child,
.scoring-editor-row .app-form-control:nth-child(3) {
  flex: 1 1 auto;
}

.option-key-input {
  flex: 0 0 64px;
}

.option-key-input :deep(.app-form-control__input) {
  text-align: center;
  font-weight: 700;
  text-transform: uppercase;
}

.score-input {
  flex: 0 0 86px;
}

.compact-button {
  min-height: 30px;
  padding: 0 10px;
}

.loading-text {
  margin: 0;
}

@media (max-width: 960px) {
  .question-filter-title,
  .question-table-toolbar,
  .question-drawer-actions,
  .option-editor-row,
  .scoring-editor-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .question-filter-actions,
  .question-drawer-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .question-edit-grid,
  .question-edit-grid--meta {
    grid-template-columns: 1fr;
  }

  .option-key-input,
  .score-input {
    flex-basis: auto;
    width: 100%;
  }
}
</style>
