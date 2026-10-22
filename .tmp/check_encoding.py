from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
print(p.read_bytes()[:20])
for enc in ['utf-8','gbk','utf-8-sig']:
    try:
        s=p.read_text(encoding=enc)
        print('---',enc,'---')
        print(s[:500])
    except Exception as e:
        print(enc,e)
