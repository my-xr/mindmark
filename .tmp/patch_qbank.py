from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
s=p.read_text(encoding='utf-8')
s=s.replace("  deleteQuestion,\n  listQuestionsPage,", "  createQuestion,\n  deleteQuestion,\n  listQuestionsPage,")
s=s.replace("const editingQuestion = ref<Question | null>(null);", "const editingQuestion = ref<Question | null>(null);\nconst isCreatingQuestion = ref(false);")
s=s.replace("const availablePapers = computed(() => {", "const isQuestionEditorOpen = computed(() => Boolean(editingQuestion.value) || isCreatingQuestion.value);\n\nconst availablePapers = computed(() => {")
# insert reset/openCreate before openEdit
marker="const openEdit = (question: Question) => {"
insert=r'''const resetEditForm = (courseId = courses.value[0]?.id ?? '') => {
  editForm.courseId = courseId;
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
  resetEditForm();
};

'''
s=s.replace(marker, insert+marker)
s=s.replace("const closeEdit = () => {\n  editingQuestion.value = null;\n};", "const closeEdit = () => {\n  editingQuestion.value = null;\n  isCreatingQuestion.value = false;\n};")
# enhance validation in buildUpdateRequest
s=s.replace("const buildUpdateRequest = (): QuestionUpsertRequest => {\n  const options = normalizeOptions();", "const buildUpdateRequest = (): QuestionUpsertRequest => {\n  if (!editForm.courseId) {\n    throw new Error('请选择课程');\n  }\n  if (!editForm.title.trim()) {\n    throw new Error('请填写题干');\n  }\n  if ((Number(editForm.score) || 0) <= 0) {\n    throw new Error('分值必须大于 0');\n  }\n  if (!editForm.answer.trim()) {\n    throw new Error('请填写参考答案');\n  }\n\n  const options = normalizeOptions();")
old=r'''const saveEdit = async () => {
  if (!editingQuestion.value) {
    return;
  }
  editSaving.value = true;
  try {
    const updated = await updateQuestion(editingQuestion.value.id, buildUpdateRequest());
    selectedQuestion.value = updated;
    editingQuestion.value = null;
    showFeedback('题目已保存；如为已驳回 AI 题，将自动重新进入待审核。', 'success');
    await loadQuestions();
  } catch (error) {
    showFeedback(getErrorMessage(error, '题目保存失败，请检查表单内容'), 'danger');
  } finally {
    editSaving.value = false;
  }
};'''
new=r'''const saveEdit = async () => {
  if (!editingQuestion.value && !isCreatingQuestion.value) {
    return;
  }
  editSaving.value = true;
  try {
    const request = buildUpdateRequest();
    const saved = isCreatingQuestion.value
      ? await createQuestion(request)
      : await updateQuestion(editingQuestion.value!.id, request);
    selectedQuestion.value = saved;
    closeEdit();
    showFeedback(isCreatingQuestion.value ? '题目已新增并进入可用题库。' : '题目已保存；如为已驳回 AI 题，将自动重新进入待审核。', 'success');
    await loadQuestions();
  } catch (error) {
    showFeedback(getErrorMessage(error, '题目保存失败，请检查表单内容'), 'danger');
  } finally {
    editSaving.value = false;
  }
};'''
if old not in s:
    raise SystemExit('old saveEdit not found')
s=s.replace(old,new)
s=s.replace('<button class="primary-button" type="button">新增题目</button>', '<button class="primary-button" type="button" @click="openCreate">新增题目</button>')
s=s.replace('<section v-if="editingQuestion" class="content-card question-edit-panel">', '<section v-if="isQuestionEditorOpen" class="content-card question-edit-panel">')
s=s.replace('<h2>编辑题目</h2>', '<h2>{{ isCreatingQuestion ? \'新增题目\' : \'编辑题目\' }}</h2>')
s=s.replace("{{ editSaving ? '保存中...' : '保存题目' }}", "{{ editSaving ? '保存中...' : isCreatingQuestion ? '创建题目' : '保存题目' }}")
p.write_text(s,encoding='utf-8')
