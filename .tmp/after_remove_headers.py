from pathlib import Path
for name in ['DashboardView.vue','AiQuestionsView.vue','ExamsView.vue','PapersView.vue','GradingView.vue','ScoresView.vue','ReviewsView.vue','StudentRosterView.vue','TeacherSettingsView.vue']:
 s=Path('apps/mindmark-web/src/views/teacher/'+name).read_text(encoding='utf-8')
 print('\n###',name)
 print(s[s.find('<template>'):s.find('<template>')+1800].encode('unicode_escape').decode())
