from pathlib import Path
p = Path('docs/21_考试闭环缺口分析与三轮收敛计划.md')
append = '''

---

## 2026-07-22 真实考试闭环验收记录（100 分试卷 + AI 批改）

### 本轮目标

本轮不继续扩展 AI 能力，改为做一次真实运行态闭环验收：题库写入、100 分组卷、考试创建、学生答题交卷、系统判分、AI 批改主观题/编程题、教师确认成绩。

### 本轮修复

1. 修复 `LangGraphGradingWorkflow` 图状态序列化问题：
   - `GradingWorkflowInput` / `GradingWorkflowResult` 已实现 `Serializable`。
   - 图状态不再持有 `QuestionEntity` JPA 实体，改为只传递 `questionTitle`、`questionType`、参考答案、评分点、满分等可序列化字段。
2. 修复组卷 LangGraph 计划状态序列化问题：
   - `PaperComposePlanContext`、`PaperComposeAgentPlanResponse`、`PaperComposeRuleRequest`、`PaperComposeQualityReportResponse`、`PaperComposeDistributionItemResponse` 已实现 `Serializable`。
3. 重写 AI 批改智能体提示词为清晰中文，要求只返回严格 JSON，避免乱码提示词影响真实模型输出质量。

### 验收命令

```powershell
mvn -f apps/mindmark-server/pom.xml compile
pnpm --filter mindmark-web typecheck
powershell -ExecutionPolicy Bypass -File scripts/api-smoke/run-100-point-exam-smoke.ps1 `
  -BaseUrl http://localhost:18084 `
  -AiJobTimeoutSec 240 `
  -AiProvider OPENAI `
  -AiProviderBaseUrl https://api.moonshot.cn/v1 `
  -AiProviderModel kimi-k2.6 `
  -AiProviderApiKeyEnvName KIMI_API_KEY `
  -RequireAiSucceeded
```

### 验收结果

- 后端编译：通过。
- 前端类型检查：通过。
- 后端健康检查：`UP`。
- AI Provider 连接测试：通过。
- 创建题目：56 道。
- 试卷总分：100 分。
- 试卷题量：56 道。
- 题型覆盖：单选、多选、判断、填空、简答、论述/案例/编程等主观题链路。
- 客观题自动判分：50 道。
- 主观题/编程题 AI 批改：6 道。
- AI 批改任务状态：`SUCCEEDED`。
- AI 批改耗时：约 2 秒。
- 批改任务状态：`AI_CHECKED`。
- 自动汇总得分：100 分。
- 教师确认成绩：100 分。

### 当前闭环边界

考试主流程已具备真实闭环：教师准备题库和试卷，发布考试，学生作答并交卷，系统自动判分，AI 对主观题和编程题给出系统默认分，教师可复核并确认成绩。

编程题当前按既定边界不接入 Sandbox/OJ：系统使用 AI 静态评分 + 教师复核，不在后端主进程执行学生代码。若未来需要编程题完全客观化判分，应单独建设独立 Sandbox Worker。
'''
with p.open('a', encoding='utf-8') as f:
    f.write(append)
