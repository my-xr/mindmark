from pathlib import Path
path = next(Path('docs').glob('21_*.md'))
text = path.read_text(encoding='utf-8')
section = """

## 13. 2026-07-20 教师端企业级交互与闭环验收加固

### 本次收敛目标

围绕“不要做 demo、必须可验收”的要求，本次不新增演示性功能，优先把教师端已上线链路做成可确认、可回归、可复现的企业级闭环：教师工作台真实数据、题库删除/编辑/组卷、试卷移除题目、学生账号治理、考试闭环 Smoke。

### 已完成

1. 前端危险操作从原生 `window.confirm` 收敛为统一确认服务 `requestUserConfirmation`：
   - 文件：`apps/mindmark-web/src/utils/confirmAction.ts`
   - 接入 Ant Design Vue `Modal.confirm`，支持标题、说明、确认按钮文案和危险态。
   - 替换范围：学生交卷、教师批改提交、试卷加题/移除/标记可用、成绩发布、复盘讲评归档、学生重置密码、题库删除/停用。
2. 题库删除/停用确认文案补齐业务边界：
   - 未锁定试卷引用会自动移除；
   - 已发布/归档试卷引用会保留历史并停用题目；
   - 解决“乱码题无法删除后卡在题库/试卷”的验收风险。
3. 统一确认弹窗样式：
   - 文件：`apps/mindmark-web/src/styles/components.css`
   - 降低原生浏览器弹窗割裂感，统一企业级操作确认体验。
4. 前端代码质量收敛：
   - 统一前端源码换行与格式，`pnpm --filter mindmark-web lint` 已无 ESLint/Prettier 问题。
   - 复查前后端关键源码无 UTF-8 BOM，避免 Java 编译再次出现 `非法字符: '\ufeff'`。

### 验收结果

| 验收项 | 命令/接口 | 结果 |
| --- | --- | --- |
| 后端编译 | `mvn -f apps/mindmark-server/pom.xml -q -DskipTests compile` | 通过 |
| 后端测试 | `mvn -f apps/mindmark-server/pom.xml -q test` | 通过 |
| 前端类型检查 | `pnpm --filter mindmark-web typecheck` | 通过 |
| 前端 lint | `pnpm --filter mindmark-web lint` | 通过 |
| 前端生产构建 | `pnpm --filter mindmark-web build` | 通过 |
| 教师工作台真实接口 | `GET /api/v1/teacher/dashboard` | 通过，返回 4 个指标、4 个待办 |
| 题库 + 试卷组卷 Smoke | `scripts/api-smoke/run-question-paper-smoke.ps1` | 通过，覆盖创建、编辑、分页筛选、加入试卷、移除试卷、删除题目、引用自动清理 |
| 考试闭环 Smoke | `scripts/api-smoke/run-exam-loop-smoke.ps1` | 通过，覆盖教师建考、学生答题、保存草稿、交卷、批改、出分、复盘、超时自动交卷、缺考 |
| 账号体系 Smoke | `scripts/api-smoke/run-account-system-smoke.ps1 -BaseUrl http://localhost:8080/api/v1` | 通过，覆盖模板下载、学生导入去重、首次改密、教师重置密码 |

### 当前结论

考试 P0 闭环、题库/组卷 P0、学生账号 P0 已具备可回归验收能力。当前教师端不再依赖前端 mock 来支撑关键闭环；题库和试卷相关的删除、移除、编辑已有后端真实接口和 Smoke 保障。

### 下一步建议

1. 对 AI 出题审核继续补充企业级 Smoke：提交异步生成任务、轮询完成、驳回后二次编辑、审核入库、题库分页可查。
2. 为“题库管理 / 试卷与组卷 / 考试管理”补充页面级 Playwright E2E，验证按钮真实可点击与弹窗确认链路，而不仅是 API Smoke。
3. 对教师工作台的待办项增加“跳转后筛选条件自动带入”，提升真实业务操作效率。
"""
if '## 13. 2026-07-20 教师端企业级交互与闭环验收加固' not in text:
    text += section
path.write_text(text, encoding='utf-8', newline='\n')
print(path)
