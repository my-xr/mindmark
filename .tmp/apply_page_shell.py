from pathlib import Path
mapping = {
  'apps/mindmark-web/src/views/teacher/AiQuestionsView.vue': 'page-shell ai-questions-page',
  'apps/mindmark-web/src/views/teacher/DashboardView.vue': 'page-shell dashboard-page',
  'apps/mindmark-web/src/views/teacher/ExamsView.vue': 'page-shell exams-page',
  'apps/mindmark-web/src/views/teacher/GradingView.vue': 'page-shell grading-page',
  'apps/mindmark-web/src/views/teacher/PapersView.vue': 'page-shell papers-page',
  'apps/mindmark-web/src/views/teacher/QuestionBankView.vue': 'page-shell question-bank-page',
  'apps/mindmark-web/src/views/teacher/ScoresView.vue': 'page-shell scores-page',
  'apps/mindmark-web/src/views/teacher/TeacherSettingsView.vue': 'page-shell teacher-settings-page',
  'apps/mindmark-web/src/views/admin/ClassesView.vue': 'page-shell admin-classes-page',
  'apps/mindmark-web/src/views/admin/UsersView.vue': 'page-shell admin-users-page',
  'apps/mindmark-web/src/views/student/ExamNoticeView.vue': 'page-shell exam-notice-page',
  'apps/mindmark-web/src/views/student/ExamTakingView.vue': 'page-shell taking-page',
  'apps/mindmark-web/src/views/student/StudentExamsView.vue': 'page-shell student-exams-page',
  'apps/mindmark-web/src/views/student/StudentScoresView.vue': 'page-shell student-scores-page',
}
for file, cls in mapping.items():
    p=Path(file)
    s=p.read_text(encoding='utf-8-sig')
    marker='<template>\n'
    idx=s.find(marker)
    if idx == -1:
        print('missing template', file); continue
    start=idx+len(marker)
    # skip whitespace before first div
    prefix_end=start
    while prefix_end < len(s) and s[prefix_end].isspace():
        prefix_end += 1
    if s.startswith('<div>', prefix_end):
        s=s[:prefix_end] + f'<div class="{cls}">' + s[prefix_end+5:]
    elif s.startswith('<div class="', prefix_end):
        end=s.find('"', prefix_end+12)
        old=s[prefix_end+12:end]
        tokens=[]
        for t in (cls + ' ' + old).split():
            if t not in tokens:
                tokens.append(t)
        s=s[:prefix_end+12] + ' '.join(tokens) + s[end:]
    else:
        print('first root not div?', file, s[prefix_end:prefix_end+50])
        continue
    p.write_text(s, encoding='utf-8')
