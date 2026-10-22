from pathlib import Path
for name in ['AiQuestionsView.vue','ExamsView.vue','GradingView.vue','PapersView.vue','ReviewsView.vue','ScoresView.vue','StudentRosterView.vue','TeacherSettingsView.vue','DashboardView.vue']:
 s=Path('apps/mindmark-web/src/views/teacher/'+name).read_text(encoding='utf-8')
 print('\n###',name)
 for term in ['<section class="content-card','<section class="filter-card','<main','<div class="dashboard-main-grid','<PageSection']:
  idx=s.find(term)
  if idx!=-1:
   print('term',term,'at',idx)
   print(s[idx:idx+1200].encode('unicode_escape').decode())
   break
