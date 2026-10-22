const fs = require('fs');
{
  const p = 'apps/mindmark-web/src/types/paper.ts';
  let s = fs.readFileSync(p, 'utf8');
  s = s.replace(`  title: string;
  courseName: string;
`, `  title: string;
  courseId: string;
  courseName: string;
`);
  fs.writeFileSync(p, s);
}
{
  const p = 'apps/mindmark-web/src/mock/paperExamMock.ts';
  let s = fs.readFileSync(p, 'utf8');
  s = s.replace(`const frontendQuestions = [
  createPaperQuestion('Q-1001', 1, 2),
  createPaperQuestion('Q-1002', 2, 4),
  createPaperQuestion('Q-1003', 3, 2),
  createPaperQuestion('Q-1005', 4, 8),
];

const fullStackQuestions = [
  createPaperQuestion('Q-1001', 1, 2),
  createPaperQuestion('Q-1004', 2, 3),
  createPaperQuestion('Q-1005', 3, 8),
  createPaperQuestion('Q-1006', 4, 10),
];`, `const frontendQuestions = [
  createPaperQuestion('Q-1001', 1, 2),
  createPaperQuestion('Q-1002', 2, 4),
  createPaperQuestion('Q-1006', 3, 10),
];

const fullStackQuestions = [
  createPaperQuestion('Q-1003', 1, 2),
  createPaperQuestion('Q-1005', 2, 8),
];`);
  s = s.replace(`    courseName: '前端工程化',
`, `    courseId: 'course-frontend-001',
    courseName: '前端工程化',
`);
  s = s.replace(`    courseName: 'Web 全栈开发',
`, `    courseId: 'course-fullstack-001',
    courseName: 'Web 全栈开发',
`);
  fs.writeFileSync(p, s);
}
