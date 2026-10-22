from pathlib import Path
p = Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
s = p.read_text(encoding='utf-8')
if "import { useRoute } from 'vue-router';" not in s:
    s = s.replace("import { computed, onMounted, reactive, ref, watch } from 'vue';\n", "import { computed, onMounted, reactive, ref, watch } from 'vue';\nimport { useRoute } from 'vue-router';\n")
if '  getQuestionById,' not in s:
    s = s.replace('''  createQuestion,
  deleteQuestion,
  listQuestionsPage,
''', '''  createQuestion,
  deleteQuestion,
  getQuestionById,
  listQuestionsPage,
''')
if 'const route = useRoute();' not in s:
    s = s.replace('''const pageSizeOptions = ['10', '20', '50', '100'];

const query = reactive<FilterState>({
''', '''const pageSizeOptions = ['10', '20', '50', '100'];

const route = useRoute();

const query = reactive<FilterState>({
''')
if 'const pendingEditQuestionId' not in s:
    s = s.replace('''const editingQuestion = ref<Question | null>(null);
const isCreatingQuestion = ref(false);
''', '''const editingQuestion = ref<Question | null>(null);
const isCreatingQuestion = ref(false);
const pendingEditQuestionId = ref<string | null>(null);
''')
helpers = '''
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

'''
if 'const toQueryString' not in s:
    s = s.replace('''const availablePapers = computed(() => {
''', helpers + '''const availablePapers = computed(() => {
''')
focus = '''
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

  selectedQuestion.value = target;
  openEdit(target);
  showFeedback('已定位到 AI 题目，请完成修订并保存；已驳回题保存后会重新进入待审核。', 'info');
  pendingEditQuestionId.value = null;
};

'''
if 'const openPendingEditQuestion' not in s:
    s = s.replace('''const selectQuestion = (question: Question) => {
  selectedQuestion.value = question;
};

''', '''const selectQuestion = (question: Question) => {
  selectedQuestion.value = question;
};

''' + focus)
# add await in loadQuestions after selected assignment before pagination if not present
old = '''    selectedQuestion.value =
      result.items.find((question) => question.id === selectedQuestion.value?.id) ??
      result.items[0] ??
      null;
    if (pagination.page > totalPages.value) {
'''
new = '''    selectedQuestion.value =
      result.items.find((question) => question.id === selectedQuestion.value?.id) ??
      result.items[0] ??
      null;
    await openPendingEditQuestion(result.items);
    if (pagination.page > totalPages.value) {
'''
if old in s:
    s = s.replace(old, new)
if 'applyRouteQuery();' not in s:
    s = s.replace('''onMounted(() => {
  void loadCourses();
});

watch(
''', '''applyRouteQuery();

onMounted(() => {
  void loadCourses();
});

watch(
''')
# replace row button with div and action menu details
s = s.replace('''        <button
          v-for="question in questions"
          v-else
          :key="question.id"
          :class="[
            'table-row',
            'question-row',
            { 'question-row--active': selectedQuestion?.id === question.id },
          ]"
          type="button"
          @click="selectQuestion(question)"
        >
''', '''        <div
          v-for="question in questions"
          v-else
          :key="question.id"
          :class="[
            'table-row',
            'question-row',
            { 'question-row--active': selectedQuestion?.id === question.id },
          ]"
          role="button"
          tabindex="0"
          @click="selectQuestion(question)"
          @keydown.enter.prevent="selectQuestion(question)"
          @keydown.space.prevent="selectQuestion(question)"
        >
''')
s = s.replace('''            <span class="action-more" role="button" tabindex="0" @click.stop>
              更多
              <span class="action-popover">
                <span
                  class="action-link"
                  role="button"
                  tabindex="0"
                  @click.stop="openEdit(question)"
                >
                  编辑题目
                </span>
                <span
                  class="action-link"
                  role="button"
                  tabindex="0"
                  @click.stop="openCompose(question)"
                >
                  加入试卷
                </span>
                <span
                  class="action-link action-link--danger"
                  role="button"
                  tabindex="0"
                  @click.stop="confirmDeleteQuestion(question)"
                >
                  {{ deletingQuestionId === question.id ? '删除中' : '删除/停用' }}
                </span>
              </span>
            </span>
''', '''            <details class="action-menu" @click.stop>
              <summary class="action-menu__trigger">更多</summary>
              <span class="action-menu__panel">
                <button class="action-menu__item" type="button" @click="openEdit(question)">
                  编辑题目
                </button>
                <button class="action-menu__item" type="button" @click="openCompose(question)">
                  加入试卷
                </button>
                <button
                  class="action-menu__item action-menu__item--danger"
                  type="button"
                  :disabled="deletingQuestionId === question.id"
                  @click="confirmDeleteQuestion(question)"
                >
                  {{ deletingQuestionId === question.id ? '删除中' : '删除/停用' }}
                </button>
              </span>
            </details>
''')
s = s.replace('''        </button>

        <EnterprisePagination
''', '''        </div>

        <EnterprisePagination
''')
p.write_text(s, encoding='utf-8')
