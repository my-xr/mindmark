from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
s=p.read_text(encoding='utf-8')
s=s.replace("const openCompose = async (question: Question) => {\n  clearFeedback();", "const openCompose = async (question: Question) => {\n  clearFeedback();\n  if (question.status !== 'ACTIVE') {\n    showFeedback('仅可将“可用”状态的题目加入试卷。', 'danger');\n    return;\n  }")
p.write_text(s,encoding='utf-8')
