const fs = require('fs');
const path = require('path');

function write(file, text) {
  fs.writeFileSync(path.join(process.cwd(), file), text, { encoding: 'utf8' });
}
function read(file) {
  return fs.readFileSync(path.join(process.cwd(), file), 'utf8');
}

// 1) Fix mojibake fallback text in HTTP client.
{
  const file = 'apps/mindmark-web/src/services/api/httpClient.ts';
  let s = read(file);
  s = s.replaceAll('璇锋眰澶辫触锛岃绋嶅悗閲嶈瘯', '请求失败，请稍后重试');
  write(file, s);
}

// 2) Add shared frontend error message helper.
{
  const file = 'apps/mindmark-web/src/utils/errorMessage.ts';
  const s = `export const getErrorMessage = (error: unknown, fallback = '操作失败，请稍后重试') =>
  error instanceof Error && error.message ? error.message : fallback;
`;
  write(file, s);
}

// 3) Use shared error helper in high-traffic teacher/student pages.
const pageFallbacks = new Map([
  ['apps/mindmark-web/src/views/teacher/GradingView.vue', '批改任务加载失败，请稍后重试'],
  ['apps/mindmark-web/src/views/teacher/ExamsView.vue', '考试列表加载失败，请稍后重试'],
  ['apps/mindmark-web/src/views/teacher/PapersView.vue', '试卷列表加载失败，请稍后重试'],
  ['apps/mindmark-web/src/views/teacher/QuestionBankView.vue', '题库加载失败，请稍后重试'],
  ['apps/mindmark-web/src/views/teacher/ScoresView.vue', '成绩数据加载失败，请稍后重试'],
  ['apps/mindmark-web/src/views/student/StudentScoresView.vue', '成绩反馈加载失败，请稍后重试'],
]);
for (const [file, fallback] of pageFallbacks) {
  let s = read(file);
  if (!s.includes("@/utils/errorMessage")) {
    s = s.replace("import { computed, onMounted, ref } from 'vue';\n", "import { computed, onMounted, ref } from 'vue';\n\nimport { getErrorMessage } from '@/utils/errorMessage';\n");
  }
  s = s.replace(
    "errorMessage.value = error instanceof Error ? error.message : 'Load failed, please retry';",
    `errorMessage.value = getErrorMessage(error, '${fallback}');`,
  );
  write(file, s);
}

// 4) Optimize grading service mapping and remove English user-facing fallbacks.
{
  const file = 'apps/mindmark-web/src/services/gradingService.ts';
  let s = read(file);
  s = s.replace("import type { AnswerSheet, StudentAnswer } from '@/types/exam';", "import type { AnswerSheet, Exam, StudentAnswer } from '@/types/exam';");
  s = s.replace("  publishedAt?: string | null;\n}", "  publishedAt?: string | null;\n  courseName?: string | null;\n  studentId?: string | null;\n  studentName?: string | null;\n  className?: string | null;\n  totalScore?: number | string | null;\n}");
  s = s.replace(
`const toQuestionGrade = async (
  item: BackendGradingItem,
  taskStatus: GradingTask['status'],
  examId: string,
): Promise<QuestionGrade> => {
  const exam = await getExamById(examId);
  const paperQuestion = exam?.paper.questions.find(
    (question) => question.questionId === item.questionId,
  );`,
`const toQuestionGrade = (
  item: BackendGradingItem,
  taskStatus: GradingTask['status'],
  exam: Exam | undefined,
): QuestionGrade => {
  const paperQuestion = exam?.paper.questions.find(
    (question) => question.questionId === item.questionId,
  );`
  );
  s = s.replace(
`  const questionGrades = await Promise.all(
    task.items.map((item) => toQuestionGrade(item, status, task.examId)),
  );`,
`  const questionGrades = task.items.map((item) => toQuestionGrade(item, status, exam));`
  );
  s = s.replace("...(item.correct === false ? { riskLabel: 'Needs manual review' } : {}),", "...(item.correct === false ? { riskLabel: '需要人工复核' } : {}),");
  s = s.replace("...(task.status === 'REVIEWED' ? { reviewer: 'Current teacher' } : {}),", "...(task.status === 'REVIEWED' ? { reviewer: '当前教师' } : {}),");
  s = s.replace(
`const toRealReport = async (
  item: BackendScoreSummaryItem,
  examId: string,
  examTitle: string,
  totalScore: number,
): Promise<StudentScoreReport> => {
  const exam = await getExamById(examId);

  return {`,
`const toRealReport = (
  item: BackendScoreSummaryItem,
  examId: string,
  examTitle: string,
  totalScore: number,
  exam: Exam | undefined,
): StudentScoreReport => ({`
  );
  s = s.replace(
`    questionResults: [],
  };
};

const toRealStudentReport = (report: BackendScoreReport): StudentScoreReport => ({`,
`    questionResults: [],
  });

const toRealStudentReport = (report: BackendScoreReport): StudentScoreReport => ({`
  );
  s = s.replace("  courseName: report.examTitle,", "  courseName: report.courseName ?? report.examTitle,");
  s = s.replace("  studentId: 'student-001',", "  studentId: report.studentId ?? '',");
  s = s.replace("  studentName: 'Student Alice',", "  studentName: report.studentName ?? '',");
  s = s.replace("  className: '-',", "  className: report.className ?? '-',");
  s = s.replace("  totalScore: 0,", "  totalScore: toNumber(report.totalScore),");
  s = s.replace("    suggestion: 'Review related course materials and redo similar questions.',", "    suggestion: '建议复习相关课程材料，并重做同类错题。',");
  s = s.replace("teacherComment: isCorrect ? 'Objective answer is correct.' : 'Objective answer is incorrect.',", "teacherComment: isCorrect ? '客观题自动判定正确。' : '客观题自动判定错误。',");
  s = s.replace("? 'AI suggests the answer covers key scoring points; please review quickly.'", "? 'AI 判断答案覆盖了主要得分点，请教师快速复核。'");
  s = s.replace(": 'AI found missing scoring points; teacher review is recommended.'", ": 'AI 发现部分得分点缺失，建议教师重点复核。'");
  s = s.replace("...(aiConfidence < 0.75 ? { riskLabel: 'Needs manual review' } : {}),", "...(aiConfidence < 0.75 ? { riskLabel: '需要人工复核' } : {}),");
  s = s.replace("? 'Good mastery. Keep practicing at the current pace.'", "? '掌握情况较好，建议保持当前练习节奏。'");
  s = s.replace(": 'Review class materials and complete similar wrong-question drills.'", ": '建议回看课堂材料，并完成同类错题训练。'");
  s = s.replace("override?.teacherComment || grade.teacherComment || 'Teacher reviewed this answer.'", "override?.teacherComment || grade.teacherComment || '教师已完成复核。'");
  s = s.replace("reviewer: 'Current teacher',", "reviewer: '当前教师',");
  s = s.replace(
`    return Promise.all(
      summary.items.map((item) => toRealReport(item, examId, summary.examTitle, totalScore)),
    );`,
`    const exam = await getExamById(examId);

    return summary.items.map((item) => toRealReport(item, examId, summary.examTitle, totalScore, exam));`
  );
  write(file, s);
}