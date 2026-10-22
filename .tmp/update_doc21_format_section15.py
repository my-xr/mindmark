from pathlib import Path
p=Path('docs/21_考试闭环缺口分析与三轮收敛计划.md')
s=p.read_text(encoding='utf-8-sig')
marker='### 15.3 已通过的验收命令'
pos=s.index(marker)
old='- 前端 Lint：`pnpm --filter mindmark-web lint`，通过。\n- 前端生产构建：`pnpm --filter mindmark-web build`，通过。'
new='- 前端 Lint：`pnpm --filter mindmark-web lint`，通过。\n- 前端格式检查：`pnpm --filter mindmark-web format:check`，通过。\n- 前端生产构建：`pnpm --filter mindmark-web build`，通过。'
s=s[:pos]+s[pos:].replace(old,new,1)
p.write_text(s,encoding='utf-8')
