from pathlib import Path
for name in ['AiQuestionsView.vue','ExamsView.vue','GradingView.vue','PapersView.vue','ReviewsView.vue','ScoresView.vue','StudentRosterView.vue','TeacherSettingsView.vue']:
 s=Path('apps/mindmark-web/src/views/teacher/'+name).read_text(encoding='utf-8')
 print('\n###',name)
 start=s.find('<template>')
 end=s.find('</template>')
 t=s[start:end]
 # print first 2500 escaped for structure
 print(t[:2600].encode('unicode_escape').decode())
