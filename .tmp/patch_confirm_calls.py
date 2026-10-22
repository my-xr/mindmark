from pathlib import Path
files = [
 'apps/mindmark-web/src/views/student/ExamTakingView.vue',
 'apps/mindmark-web/src/views/teacher/GradingView.vue',
 'apps/mindmark-web/src/views/teacher/PapersView.vue',
 'apps/mindmark-web/src/views/teacher/ReviewsView.vue',
 'apps/mindmark-web/src/views/teacher/ScoresView.vue',
]
for f in files:
    p=Path(f); s=p.read_text(encoding='utf-8')
    s=s.replace('const confirmed = requestUserConfirmation(', 'const confirmed = await requestUserConfirmation(')
    p.write_text(s, encoding='utf-8', newline='\n')

# StudentRoster import + confirm options
p=Path('apps/mindmark-web/src/views/teacher/StudentRosterView.vue')
s=p.read_text(encoding='utf-8')
if "@/utils/confirmAction" not in s:
    s=s.replace("import { getErrorMessage } from '@/utils/errorMessage';", "import { requestUserConfirmation } from '@/utils/confirmAction';\nimport { getErrorMessage } from '@/utils/errorMessage';")
old="""const handleResetPassword = async (student: StudentAccount) => {
  const confirmed = window.confirm(
    `确认将 ${student.name} 的密码重置为学号后 6 位，并要求下次登录修改密码？`,
  );
"""
new="""const handleResetPassword = async (student: StudentAccount) => {
  const confirmed = await requestUserConfirmation({
    title: '重置学生密码',
    message: `确认将 ${student.name} 的密码重置为学号后 6 位，并要求下次登录修改密码？`,
    confirmText: '确认重置',
    tone: 'danger',
  });
"""
if old not in s:
    print('StudentRoster pattern not found')
else:
    s=s.replace(old,new)
p.write_text(s, encoding='utf-8', newline='\n')

# QuestionBank import + delete confirm options
p=Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
s=p.read_text(encoding='utf-8')
if "@/utils/confirmAction" not in s:
    s=s.replace("import { getErrorMessage } from '@/utils/errorMessage';", "import { requestUserConfirmation } from '@/utils/confirmAction';\nimport { getErrorMessage } from '@/utils/errorMessage';")
old="""const confirmDeleteQuestion = async (question: Question) => {
  const confirmed = window.confirm(
    `确认删除题目「${question.title}」？

若题目已被试卷引用，系统会自动停用题目并保留历史试卷记录。`,
  );
"""
new="""const confirmDeleteQuestion = async (question: Question) => {
  const confirmed = await requestUserConfirmation({
    title: '删除或停用题目',
    message: `确认删除题目「${question.title}」？\n\n若题目已被已发布试卷引用，系统会自动停用题目并保留历史试卷记录；未锁定试卷中的引用会自动移除。`,
    confirmText: '删除/停用',
    tone: 'danger',
  });
"""
if old not in s:
    print('QuestionBank pattern not found')
else:
    s=s.replace(old,new)
p.write_text(s, encoding='utf-8', newline='\n')
