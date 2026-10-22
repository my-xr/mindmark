from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
s=p.read_text('utf-8')
s=s.replace("  size: 'small',\n  showTotal: (total, range) =>", "  size: 'small' as const,\n  showTotal: (total: number, range: [number, number]) =>")
p.write_text(s,'utf-8')
