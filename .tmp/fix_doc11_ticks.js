const fs=require('fs');
const f='docs/11_测试验收与质量门禁.md';
let s=fs.readFileSync(f,'utf8');
s=s.replace('| 前端格式化 | pnpm web:format | PASS |','| 前端格式化 | `pnpm web:format` | PASS |');
s=s.replace('| 前端全量质量门禁 | pnpm web:quality | PASS |','| 前端全量质量门禁 | `pnpm web:quality` | PASS |');
s=s.replace('| 前端生产构建 | pnpm --filter mindmark-web build | PASS |','| 前端生产构建 | `pnpm --filter mindmark-web build` | PASS |');
fs.writeFileSync(f,s,'utf8');
