from pathlib import Path
for name in ['ReviewsView.vue','ScoresView.vue','PapersView.vue']:
 s=Path('apps/mindmark-web/src/views/teacher/'+name).read_text(encoding='utf-8')
 print('\n###',name)
 for i,line in enumerate(s.splitlines(),1):
  if 'icon-action-button' in line or 'section-actions' in line:
   print(i, line.encode('unicode_escape').decode())
