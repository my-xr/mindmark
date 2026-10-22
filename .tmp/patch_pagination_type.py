from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
s=p.read_text('utf-8')
s=s.replace("const questionTablePagination = computed<TableProps<Question>['pagination']>(() => ({", "const questionTablePagination = computed(() => ({")
p.write_text(s,'utf-8')
