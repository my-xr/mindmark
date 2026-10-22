from pathlib import Path
p=Path('docs/21_考试闭环缺口分析与三轮收敛计划.md')
s=p.read_text(encoding='utf-8-sig')
section='''

## 15. 2026-07-20 页面级自动化验收与教师端逐页按钮巡检

### 15.1 本轮目标
本轮从“接口 Smoke 通过”继续推进到“页面级真实可验收”：教师端各页面必须能在真实接口模式下加载，左侧导航状态正确，页面按钮/链接具备可访问名称，关键按钮可以真实点击，不出现运行时错误、后端 500 错误码或全局横向溢出。

### 15.2 已落地内容
1. **引入 Playwright 页面级 E2E**：
   - 新增 `apps/mindmark-web/playwright.config.ts`。
   - 新增 `apps/mindmark-web/e2e/teacher-pages.spec.ts`。
   - 前端包新增脚本：`e2e`、`e2e:report`。
   - 根项目新增脚本：`web:e2e`。
2. **教师端逐页巡检覆盖**：
   - 教师工作台：`/teacher/dashboard`
   - 题库管理：`/teacher/questions`
   - AI 出题审核：`/teacher/ai-questions`
   - 试卷与组卷：`/teacher/papers`
   - 考试管理：`/teacher/exams`
   - 学生名单与账号：`/teacher/students`
   - 批改中心：`/teacher/grading`
   - 成绩中心：`/teacher/scores`
   - 考试复盘与 AI 讲评：`/teacher/reviews`
   - 个人配置：`/teacher/settings`
3. **关键按钮巡检覆盖**：
   - 左侧导航折叠/展开。
   - 题库筛选折叠、新增题目、更多菜单、编辑题目、加入试卷。
   - AI 出题审核生成模块折叠、刷新任务、跳转个人配置。
   - 试卷与组卷、考试管理、成绩中心核心卡片/按钮点击不触发运行时错误。
4. **发现并修复的问题**：
   - Ant Design Vue 分页的上一页/下一页按钮在禁用态缺少可访问名称，已在 `EnterprisePagination` 中统一补充 `aria-label` 与 `title`。
   - AI 出题任务历史刷新按钮文案从“刷新历史”统一为“刷新任务”，与页面语义和自动化验收一致。
   - E2E 错误巡检规则调整为识别真实错误组件与后端错误码，避免题目内容中出现 `internal server error` 这类技术考题文本时被误判。

### 15.3 已通过的验收命令
- 页面级 E2E：`pnpm --filter mindmark-web exec playwright test e2e/teacher-pages.spec.ts --project=teacher-chrome --reporter=line`，结果：14 passed。
- 前端类型检查：`pnpm --filter mindmark-web typecheck`，通过。
- 前端 Lint：`pnpm --filter mindmark-web lint`，通过。
- 前端生产构建：`pnpm --filter mindmark-web build`，通过。

### 15.4 当前结论
教师端已经具备页面级自动化回归能力，不再只依赖后端接口 Smoke。当前巡检能及时发现页面加载失败、按钮无可访问名称、关键按钮未接线、控制台运行时错误、后端错误码外露和布局横向溢出等问题。

### 15.5 下一步建议
1. 补充学生端 E2E：登录、首次改密、考试列表、进入考试、全屏/倒计时/切屏审计、保存草稿、交卷、查看成绩。
2. 补充管理端 E2E：用户治理、角色分配、课程/班级基础数据维护、安全审计查看。
3. 将页面级 E2E 与接口 Smoke 组合成一键验收脚本，例如 `scripts/run-local-acceptance.ps1`，统一输出验收报告。
4. 对 E2E 增加独立造数/清理能力，减少历史 Smoke 数据对页面展示和断言稳定性的影响。
'''
if '## 15. 2026-07-20 页面级自动化验收与教师端逐页按钮巡检' not in s:
    s += section
p.write_text(s, encoding='utf-8')
