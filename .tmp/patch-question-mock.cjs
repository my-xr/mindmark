const fs = require('fs');
const p = 'apps/mindmark-web/src/services/questionService.ts';
let s = fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
s = s.replace("import { mockQuestions } from '@/mock/questionMock';", "import { mockPapers } from '@/mock/paperExamMock';\nimport { mockQuestions } from '@/mock/questionMock';");
s = s.replace(`const filterQuestions = (query: QuestionQuery = {}) => {
  const keyword = normalizeKeyword(query.keyword);

  return questionStore.filter((question) => {`, `const filterQuestions = (query: QuestionQuery = {}) => {
  const keyword = normalizeKeyword(query.keyword);
  const excludedQuestionIds = new Set(
    query.excludePaperId?.trim()
      ? (mockPapers.find((paper) => paper.id === query.excludePaperId?.trim())?.questions ?? []).map(
          (item) => item.questionId,
        )
      : [],
  );

  return questionStore.filter((question) => {`);
s = s.replace(`      courseMatched &&
      matchesKeyword(question, keyword)`, `      courseMatched &&
      !excludedQuestionIds.has(question.id) &&
      matchesKeyword(question, keyword)`);
fs.writeFileSync(p, s, 'utf8');
