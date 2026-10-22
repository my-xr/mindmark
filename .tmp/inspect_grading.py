from pathlib import Path
s=Path('apps/mindmark-web/src/views/teacher/GradingView.vue').read_text(encoding='utf-8')
for start in [s.find('<section class="metric-grid'), s.find('<main v-else')]:
 print('---',start)
 print(s[start:start+1800].encode('unicode_escape').decode())
