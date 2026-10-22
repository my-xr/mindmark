const fs = require('fs');
const p = 'apps/mindmark-web/src/services/questionService.ts';
let s = fs.readFileSync(p, 'utf8');
s = s.replace(
  `  return [question.title, question.createdBy, ...question.knowledgePoints]\n    .join(' ')`,
  `  return [question.title, question.createdBy, question.courseName ?? '', ...question.knowledgePoints]\n    .join(' ')`,
);
fs.writeFileSync(p, s, 'utf8');
