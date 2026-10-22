from pathlib import Path
path = next(Path('docs').glob('21_*.md'))
text = path.read_text(encoding='utf-8')
row = "| 真实 AI 多题生成 Smoke | `POST /api/v1/ai/questions/generation-tasks` count=2 并轮询任务 | 通过，任务生成 2 道中文待审核题并写入题库 |\n"
if row not in text:
    text = text.replace("| AI 出题任务历史接口 | `GET /api/v1/ai/questions/generation-tasks?page=1&pageSize=5` | 通过，返回任务分页数据 |\n", "| AI 出题任务历史接口 | `GET /api/v1/ai/questions/generation-tasks?page=1&pageSize=5` | 通过，返回任务分页数据 |\n" + row)
text = text.replace("3. 对教师工作台的待办项增加“跳转后筛选条件自动带入”，提升真实业务操作效率。\n", "3. 对教师工作台的待办项增加“跳转后筛选条件自动带入”，提升真实业务操作效率。\n\n### 真实 AI 验收补充\n\n已执行 count=2 的真实 AI 生成任务，任务号 `ai-question-task-***REDACTED***`，生成 2 道中文题目并以 `AI / PENDING_REVIEW` 写入题库，可在 AI 出题审核页继续审核。\n")
path.write_text(text, encoding='utf-8', newline='\n')
print('updated real ai smoke')
