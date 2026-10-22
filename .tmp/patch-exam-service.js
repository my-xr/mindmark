const fs = require('fs');
const p = 'apps/mindmark-web/src/services/examService.ts';
let s = fs.readFileSync(p, 'utf8');
s = s.replace(`  title: response.paperTitle,
  courseName: response.paperTitle,
`, `  title: response.paperTitle,
  courseId: 'UNKNOWN',
  courseName: response.paperTitle,
`);
s = s.replace(`      { questionId: 'Q-1003', type: 'TRUE_FALSE', answer: 'False' },
      {
        questionId: 'Q-1005',
        type: 'SHORT_ANSWER',
        answer:
          'Resources are identified by URIs and manipulated through HTTP methods such as GET, POST, PUT and DELETE.',
      },
`, `      {
        questionId: 'Q-1006',
        type: 'PROGRAMMING',
        answer: 'function debounce(fn, delay) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; }',
      },
`);
fs.writeFileSync(p, s);
