const fs = require('fs');
const patches = [
  {
    file: 'docs/08_API设计规范.md',
    from: '| `GET /api/v1/student/exams` | 已实现 | 学生考试列表；鉴权未实现前支持可选 `studentId` Mock 查询参数，默认 `student-001`。 |',
    to: '| `GET /api/v1/student/exams` | 已实现 | 学生考试列表；Round 1 后不再接收 `studentId`，后端从 Sa-Token 登录态解析当前学生。 |',
  },
  {
    file: 'docs/08_API设计规范.md',
    from: '| `GET` | `/api/v1/student/score-reports` | 学生成绩报告列表 | 默认 Mock 学生 `student-001`，支持临时 `studentId` 查询参数 |',
    to: '| `GET` | `/api/v1/student/score-reports` | 学生成绩报告列表 | Round 1 后不再接收 `studentId`，后端从 Sa-Token 登录态解析当前学生 |',
  },
  {
    file: 'docs/11_测试验收与质量门禁.md',
    from: '| Vite 代理联调 | `GET http://localhost:5173/api/v1/auth/me`、`GET /api/v1/student/exams?studentId=student-001` | 通过 |',
    to: '| Vite 代理联调 | `GET http://localhost:5173/api/v1/auth/me`、Round 1 后改为 `GET /api/v1/student/exams`（学生身份来自 Sa-Token） | 历史通过；Round 1 需重新执行真实登录态 Smoke |',
  },
];
for (const {file, from, to} of patches) {
  let s = fs.readFileSync(file, 'utf8');
  if (!s.includes(from)) {
    console.error(`Pattern not found in ${file}: ${from}`);
    process.exitCode = 1;
    continue;
  }
  s = s.replace(from, to);
  fs.writeFileSync(file, s, 'utf8');
  console.log(`patched ${file}`);
}
