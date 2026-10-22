const fs = require('fs');
const file = 'docs/11_测试验收与质量门禁.md';
let s = fs.readFileSync(file, 'utf8');
const marker = '### Round 1 质量门禁记录（2026-07-18）';
if (!s.includes(marker)) {
  s += `\n\n${marker}\n\n| 门禁 | 命令 / 检查 | 结果 |\n| --- | --- | --- |\n| 后端编译 | \`pnpm server:compile\` | 通过，BUILD SUCCESS |\n| 后端单元/契约测试 | \`pnpm server:test\` | 通过，2 tests passed |\n| 前端类型检查 | \`pnpm web:typecheck\` | 通过 |\n| 前端 ESLint | \`pnpm web:lint\` | 通过 |\n| 前端格式检查 | \`pnpm web:format:check\` | 通过 |\n| 前端 Stylelint | \`pnpm web:stylelint\` | 通过 |\n| 前端生产构建 | \`pnpm web:build\` | 通过 |\n\n说明：本记录覆盖代码级质量门禁；真实数据库 Flyway V9 与完整登录态 E2E Smoke 尚未在本轮执行，保留为 Round 2 前置验证项。\n`;
  fs.writeFileSync(file, s, 'utf8');
  console.log('appended Round 1 quality gate');
} else {
  console.log('Round 1 quality gate already exists');
}
