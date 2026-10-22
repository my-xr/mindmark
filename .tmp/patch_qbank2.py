from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
s=p.read_text(encoding='utf-8')
s=s.replace("  selectedQuestion.value = question;\n  editingQuestion.value = question;", "  selectedQuestion.value = question;\n  isCreatingQuestion.value = false;\n  editingQuestion.value = question;")
s=s.replace("    const request = buildUpdateRequest();\n    const saved = isCreatingQuestion.value\n      ? await createQuestion(request)\n      : await updateQuestion(editingQuestion.value!.id, request);\n    selectedQuestion.value = saved;\n    closeEdit();\n    showFeedback(isCreatingQuestion.value ? '题目已新增并进入可用题库。' : '题目已保存；如为已驳回 AI 题，将自动重新进入待审核。', 'success');", "    const request = buildUpdateRequest();\n    const creatingNew = isCreatingQuestion.value;\n    const saved = creatingNew\n      ? await createQuestion(request)\n      : await updateQuestion(editingQuestion.value!.id, request);\n    selectedQuestion.value = saved;\n    closeEdit();\n    showFeedback(creatingNew ? '题目已新增并进入可用题库。' : '题目已保存；如为已驳回 AI 题，将自动重新进入待审核。', 'success');")
p.write_text(s,encoding='utf-8')
