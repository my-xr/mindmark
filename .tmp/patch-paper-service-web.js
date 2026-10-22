const fs = require('fs');
const p = 'apps/mindmark-web/src/services/paperService.ts';
let s = fs.readFileSync(p, 'utf8');
s = s.replace(`const toScore = (value: number | string) => Number(value);

const normalizePaper = (paper: Paper): Paper => ({
`, `const toScore = (value: number | string) => Number(value);

const ensureQuestionMatchesPaperCourse = (paper: Paper, question: Question) => {
  if (!question.courseId) {
    throw new Error('题目未绑定课程，不能加入试卷');
  }
  if (paper.courseId && paper.courseId !== question.courseId) {
    throw new Error('题目课程与试卷课程不一致，不能加入试卷');
  }
};

const normalizePaper = (paper: Paper): Paper => ({
`);
s = s.replace(`    if (paper.id !== paperId || paper.questions.some((item) => item.questionId === question.id)) {
      return paper;
    }

    const nextQuestion: PaperQuestion = {
`, `    if (paper.id !== paperId || paper.questions.some((item) => item.questionId === question.id)) {
      return paper;
    }

    ensureQuestionMatchesPaperCourse(paper, question);

    const nextQuestion: PaperQuestion = {
`);
fs.writeFileSync(p, s);
