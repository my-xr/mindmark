from pathlib import Path
p = Path('docs/21_考试闭环缺口分析与三轮收敛计划.md')
text = p.read_text(encoding='utf-8-sig')
section = r'''

## 14. 2026-07-20 教师端题库与 AI 审核企业级闭环验收记录

### 14.1 本轮目标
本轮不再按 Demo 标准推进，而是按“真实接口、可回归、可验收”的企业级闭环标准收口：教师工作台接真实数据，题库管理按钮可用，乱码/异常题可删除或停用，试卷组卷可移除题目，AI 出题从异步任务到教师审核再入库必须全链路打通。

### 14.2 已补齐的关键能力
1. **题库详情查询接口**：新增 `GET /api/v1/questions/{questionId}`，前端可从 AI 审核页直接定位具体题目，不再依赖分页扫描。
2. **题库管理企业级操作闭环**：题库列表支持课程筛选、分页、新增、编辑、删除/停用、加入试卷；被草稿试卷引用的题目删除时可自动清理引用关系，避免乱码题或异常题无法处理。
3. **试卷与组卷闭环**：题目加入试卷、从试卷移除、试卷题量回写均纳入 Smoke 验收。
4. **AI 审核编辑链路**：AI 审核页“编辑题目”会跳转到题库管理并自动打开对应题目编辑面板；驳回题编辑保存后回到 `PENDING_REVIEW`，教师可再次审核通过。
5. **真实 AI Provider 闭环**：通过教师个人配置的 OpenAI-compatible Provider 调用 Moonshot/Kimi，异步生成任务完成后生成中文题目并进入待审核题库。
6. **AI 生成健壮性修复**：当模型返回空 `questions` 数组时，不再直接失败，而是作为可重试生成失败处理，追加更严格的 JSON 与中文题目约束后重试。
7. **AI 全闭环 Smoke**：新增 `scripts/api-smoke/run-ai-question-loop-smoke.ps1`，覆盖任务提交、轮询、生成数量校验、中文内容校验、审核通过、驳回、编辑驳回题、再次审核、清理生成题。

### 14.3 已通过的验收命令
- 后端编译：`mvn -f apps/mindmark-server/pom.xml -q -DskipTests compile`
- 后端测试：`mvn -f apps/mindmark-server/pom.xml -q test`
- 前端类型检查：`pnpm --filter mindmark-web typecheck`
- 前端 Lint：`pnpm --filter mindmark-web lint`
- 前端生产构建：`pnpm --filter mindmark-web build`
- 题库与组卷 Smoke：`scripts/api-smoke/run-question-paper-smoke.ps1`
- 考试闭环与超时交卷 Smoke：`scripts/api-smoke/run-exam-loop-smoke.ps1`
- 账号体系 Smoke：`scripts/api-smoke/run-account-system-smoke.ps1 -BaseUrl http://localhost:8080/api/v1`
- AI 出题审核闭环 Smoke：`scripts/api-smoke/run-ai-question-loop-smoke.ps1 -BaseUrl http://localhost:8080 -Provider OPENAI -Count 2 -TimeoutSeconds 300`

### 14.4 本轮验收结论
截至 2026-07-20，本地后端已重启并加载最新代码，题库、组卷、考试、账号、AI 出题审核四条核心链路的接口级 Smoke 均已通过。当前状态已经从“可演示 Demo”推进到“可回归验收版本”。

### 14.5 后续仍建议加强的企业级事项
1. 增加 Playwright 页面级自动化验收，覆盖教师端每个按钮的真实点击路径，避免仅接口通过但页面交互遗漏。
2. 对 AI 生成任务增加更细粒度进度：提交中、调用模型中、解析中、入库中、失败可重试。
3. AI Provider 增加模型能力标签，例如是否要求 `temperature=1`、是否支持 JSON mode、推荐最大输出 token。
4. 题库和试卷页面可继续统一为 Ant Design Vue Dropdown / Modal 交互，减少自定义菜单的维护成本。
'''
if '## 14. 2026-07-20 教师端题库与 AI 审核企业级闭环验收记录' not in text:
    text = text.rstrip() + section + '\n'
else:
    start = text.index('## 14. 2026-07-20 教师端题库与 AI 审核企业级闭环验收记录')
    text = text[:start].rstrip() + section + '\n'
p.write_text(text, encoding='utf-8')