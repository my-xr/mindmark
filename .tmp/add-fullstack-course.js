const fs = require('fs');
const p = 'apps/mindmark-web/src/services/academicService.ts';
let s = fs.readFileSync(p, 'utf8');
const from = `  {
    id: 'course-frontend-001',
    code: 'FE-2026',
    name: '前端工程化',
    description: '前端工程化与质量保障',
    status: 'ACTIVE',
    createdAt: now(),
    updatedAt: now(),
  },`;
const to = `  {
    id: 'course-frontend-001',
    code: 'FE-2026',
    name: '前端工程化',
    description: '前端工程化与质量保障',
    status: 'ACTIVE',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'course-fullstack-001',
    code: 'FS-2026',
    name: '全栈开发实践',
    description: '全栈工程与接口联调',
    status: 'ACTIVE',
    createdAt: now(),
    updatedAt: now(),
  },`;
if (!s.includes("id: 'course-fullstack-001'")) {
  s = s.replace(from, to);
}
fs.writeFileSync(p, s, 'utf8');
