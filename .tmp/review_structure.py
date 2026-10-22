from pathlib import Path
s=Path('apps/mindmark-web/src/views/teacher/ReviewsView.vue').read_text(encoding='utf-8')
for idx,l in enumerate(s.splitlines(),1):
 if '<main' in l or '<aside' in l or '<section class="content-card' in l or '<div class="section-title"' in l:
  print(idx, l.encode('unicode_escape').decode())
