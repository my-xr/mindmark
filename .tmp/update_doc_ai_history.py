from pathlib import Path
path = next(Path('docs').glob('21_*.md'))
text = path.read_text(encoding='utf-8')
insert = """
5. AI 出题审核页补齐任务历史与审核池状态筛选：
   - 文件：`apps/mindmark-web/src/views/teacher/AiQuestionsView.vue`
   - 支持查看异步任务历史、分页、刷新、失败原因；可按待审核/已驳回/全部 AI 题筛选审核池。
   - 已驳回 AI 题可从“编辑驳回题”进入题库管理二次编辑；后端保存后会重新进入待审核状态。
"""
marker = "4. 前端代码质量收敛：\n   - 统一前端源码换行与格式，`pnpm --filter mindmark-web lint` 已无 ESLint/Prettier 问题。\n   - 复查前后端关键源码无 UTF-8 BOM，避免 Java 编译再次出现 `非法字符: '\\ufeff'`。\n"
if insert.strip() not in text and marker in text:
    text = text.replace(marker, marker + insert)
row = "| AI 出题任务历史接口 | `GET /api/v1/ai/questions/generation-tasks?page=1&pageSize=5` | 通过，返回任务分页数据 |\n"
if row not in text:
    text = text.replace("| 账号体系 Smoke | `scripts/api-smoke/run-account-system-smoke.ps1 -BaseUrl http://localhost:8080/api/v1` | 通过，覆盖模板下载、学生导入去重、首次改密、教师重置密码 |\n", "| 账号体系 Smoke | `scripts/api-smoke/run-account-system-smoke.ps1 -BaseUrl http://localhost:8080/api/v1` | 通过，覆盖模板下载、学生导入去重、首次改密、教师重置密码 |\n" + row)
path.write_text(text, encoding='utf-8', newline='\n')
print('updated')
