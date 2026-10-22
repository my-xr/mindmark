from pathlib import Path
s=Path('apps/mindmark-web/src/views/teacher/ReviewsView.vue').read_text(encoding='utf-8')
print(s[s.find('<template>'):s.find('</template>')].encode('unicode_escape').decode())
