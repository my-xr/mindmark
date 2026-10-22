from pathlib import Path

# ScoresView: stricter publish guard + try/catch/finally
p = Path('apps/mindmark-web/src/views/teacher/ScoresView.vue')
s = p.read_text(encoding='utf-8-sig')
s = s.replace("  return Boolean(summary && summary.reviewedCount > 0 && summary.publishStatus !== 'PUBLISHED');", "  return Boolean(\n    summary &&\n      summary.reviewedCount > 0 &&\n      summary.reviewedCount >= summary.submittedCount &&\n      summary.publishStatus !== 'PUBLISHED',\n  );")
old = '''  publishing.value = true;
  summaries.value = await publishExamScores(selectedExamId.value);
  await loadReports();
  operationMessage.value = '成绩已发布，学生端现在可以查看成绩反馈。';
  publishing.value = false;
};
'''
new = '''  publishing.value = true;
  errorMessage.value = null;
  try {
    summaries.value = await publishExamScores(selectedExamId.value);
    await loadReports();
    operationMessage.value = '成绩已发布，学生端现在可以查看成绩反馈。';
  } catch (error) {
    operationMessage.value = '';
    errorMessage.value = getErrorMessage(error, '成绩发布失败，请确认所有答卷已完成复核后再试');
  } finally {
    publishing.value = false;
  }
};
'''
if old not in s:
    raise SystemExit('Scores publish block not found')
s = s.replace(old, new)
s = s.replace("{{ publishing ? '发布中...' : '发布成绩' }}", "{{ publishing ? '发布中...' : selectedSummary.reviewedCount < selectedSummary.submittedCount ? '待全部复核' : '发布成绩' }}")
p.write_text(s, encoding='utf-8')

# PapersView: pass stable questionId, improve remove feedback
p = Path('apps/mindmark-web/src/views/teacher/PapersView.vue')
s = p.read_text(encoding='utf-8-sig')
s = s.replace('const removeQuestion = async (paperQuestionRef: string) => {', 'const removeQuestion = async (paperQuestionRef: string, questionTitle: string) => {')
s = s.replace("  const confirmed = requestUserConfirmation('确认从当前试卷中移除该题目吗？');", "  const confirmed = requestUserConfirmation(`确认从当前试卷中移除「${questionTitle}」吗？移除后题号和总分将自动重排。`);")
s = s.replace('@click="removeQuestion(item.id)"', '@click="removeQuestion(item.questionId, item.question.title)"')
p.write_text(s, encoding='utf-8')

# StudentRosterView: friendly errors + disable reset while loading individual student
p = Path('apps/mindmark-web/src/views/teacher/StudentRosterView.vue')
s = p.read_text(encoding='utf-8-sig')
s = s.replace("import { computed, onMounted, ref } from 'vue';", "import { computed, onMounted, ref } from 'vue';\n\nimport { getErrorMessage } from '@/utils/errorMessage';")
s = s.replace("const operationMessage = ref<string | null>(null);", "const operationMessage = ref<string | null>(null);\nconst resettingStudentId = ref<string | null>(null);")
for oldtxt, newtxt in [
    ("errorMessage.value = error instanceof Error ? error.message : '加载学生名单失败';", "errorMessage.value = getErrorMessage(error, '加载学生名单失败，请稍后重试');"),
    ("errorMessage.value = error instanceof Error ? error.message : '基础数据或学生名单加载失败';", "errorMessage.value = getErrorMessage(error, '基础数据或学生名单加载失败，请稍后重试');"),
    ("errorMessage.value = error instanceof Error ? error.message : '下载导入模板失败';", "errorMessage.value = getErrorMessage(error, '下载导入模板失败，请稍后重试');"),
    ("errorMessage.value = error instanceof Error ? error.message : '导入学生名单失败';", "errorMessage.value = getErrorMessage(error, '导入学生名单失败，请检查 CSV 内容');"),
    ("errorMessage.value = error instanceof Error ? error.message : '重置密码失败';", "errorMessage.value = getErrorMessage(error, '重置密码失败，请稍后重试');"),
]:
    s = s.replace(oldtxt, newtxt)
s = s.replace('''  errorMessage.value = null;
  operationMessage.value = null;
  try {
    await resetStudentPassword(student.id);
    operationMessage.value = `${student.name} 的密码已重置，学生下次登录必须修改密码。`;
    await loadStudents();
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '重置密码失败，请稍后重试');
  }
};
''', '''  errorMessage.value = null;
  operationMessage.value = null;
  resettingStudentId.value = student.id;
  try {
    await resetStudentPassword(student.id);
    operationMessage.value = `${student.name} 的密码已重置，学生下次登录必须修改密码。`;
    await loadStudents();
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '重置密码失败，请稍后重试');
  } finally {
    resettingStudentId.value = null;
  }
};
''')
s = s.replace('<button class="secondary-button" type="button" @click="handleResetPassword(student)">\n              重置密码\n            </button>', '<button\n              class="secondary-button"\n              type="button"\n              :disabled="resettingStudentId === student.id"\n              @click="handleResetPassword(student)"\n            >\n              {{ resettingStudentId === student.id ? \'重置中...\' : \'重置密码\' }}\n            </button>')
p.write_text(s, encoding='utf-8')
