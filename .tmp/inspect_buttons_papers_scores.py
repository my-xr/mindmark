from pathlib import Path
for name in ['ScoresView.vue','PapersView.vue']:
 s=Path('apps/mindmark-web/src/views/teacher/'+name).read_text(encoding='utf-8')
 lines=s.splitlines()
 print('\n###',name)
 for i in range(len(lines)):
  if '<AppActionButton' in lines[i]:
   print('---',i+1)
   print('\n'.join(f'{j+1}: {lines[j]}' for j in range(i, min(len(lines), i+8))).encode('unicode_escape').decode())
