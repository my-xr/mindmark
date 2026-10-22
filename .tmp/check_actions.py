from pathlib import Path
for name in ['DashboardView.vue','AiQuestionsView.vue','ExamsView.vue','PapersView.vue','GradingView.vue','ScoresView.vue','ReviewsView.vue','StudentRosterView.vue','TeacherSettingsView.vue']:
 s=Path('apps/mindmark-web/src/views/teacher/'+name).read_text(encoding='utf-8')
 print('\n###',name)
 # show AppActionButton lines context in template
 lines=s.splitlines()
 for i,l in enumerate(lines,1):
  if 'icon-action-button' in l or '<section class="content-card' in l or '<section class="filter-card' in l or '<PageSection' in l:
   print(f'{i}: {l}')
