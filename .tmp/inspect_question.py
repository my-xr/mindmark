from pathlib import Path
s=Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue').read_text(encoding='utf-8')
for pat in ['SOURCE_META','PageHeader','requestUserConfirmation','题库管理','棰']:
    i=s.find(pat)
    print('PAT',pat,'IDX',i)
    if i>=0:
        print(repr(s[i:i+400]))
