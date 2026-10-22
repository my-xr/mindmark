from pathlib import Path
s=Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue').read_text('utf-8')
for n in [399,402,449,450,466,467,469,527,549,552,586,615,643]:
    line=s.splitlines()[n-1]
    print(n, repr(line))
