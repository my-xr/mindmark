from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/ScoresView.vue')
s=p.read_text(encoding='utf-8')
for enc in ['gb18030','gbk','cp936']:
    try:
        r=s.encode(enc).decode('utf-8')
        print(enc, r.splitlines()[128])
        print('bad?', '鑰' in r, '考试' in r)
    except Exception as e:
        print(enc, 'ERR', repr(e))
