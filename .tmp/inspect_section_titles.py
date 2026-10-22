from pathlib import Path
for name in ['PapersView.vue','ScoresView.vue','ReviewsView.vue']:
 s=Path('apps/mindmark-web/src/views/teacher/'+name).read_text(encoding='utf-8')
 print('\n###',name)
 # show template first 2500 and section-titles lines contexts
 lines=s.splitlines()
 for idx,l in enumerate(lines):
  if '<div class="section-title"' in l:
   start=max(0,idx-2); end=min(len(lines),idx+12)
   print('--- line',idx+1)
   print('\n'.join(f'{j+1}: {lines[j]}' for j in range(start,end)).encode('unicode_escape').decode())
