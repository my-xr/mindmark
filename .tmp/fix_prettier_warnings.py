from pathlib import Path
p = Path('apps/mindmark-web/src/views/teacher/AiQuestionsView.vue')
s = p.read_text(encoding='utf-8')
s = s.replace("    generateMessage.value = status === 'REJECTED' ? '题目已驳回，可在题库管理中二次编辑后重新提交审核。' : '题目审核已通过并进入可用题库。';", "    generateMessage.value =\n      status === 'REJECTED'\n        ? '题目已驳回，可在题库管理中二次编辑后重新提交审核。'\n        : '题目审核已通过并进入可用题库。';")
with p.open('w', encoding='utf-8', newline='\n') as f:
    f.write(s)

p = Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
s = p.read_text(encoding='utf-8')
s = s.replace(');\n\n\nconst toQueryString', ');\n\nconst toQueryString')
s = s.replace('};\n\n\nconst openPendingEditQuestion', '};\n\nconst openPendingEditQuestion')
with p.open('w', encoding='utf-8', newline='\n') as f:
    f.write(s)
