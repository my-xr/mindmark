const fs=require('fs');
const p='docs/21_考试闭环缺口分析与三轮收敛计划.md';
let t=fs.readFileSync(p,'utf8');
const marker='### 20.13 批改中心系统自动判分与不及格复核闭环（2026-07-21）';
const lines = [
'',
'',
marker,
'',
'本轮针对“批改中心所有题目由系统自动判分，教师只负责核对”的企业级考试闭环做收口，避免批改中心停留在演示状态。',
'',
'#### 已完成能力',
'',
'- **提交后自动进入系统判分**：学生交卷生成批改任务时，后端会立即执行系统自动判分，不再默认停留在未判分的 `PENDING` 状态。',
'- **客观题规则判分**：单选、多选、判断、填空等客观题由 `ObjectiveGradingPolicy` 按标准答案自动判分，并写入每题 `autoScore/finalScore/correct`。',
'- **主观题/编程题 AI 自动判分基线**：简答题、编程题由 `SubjectiveGradingPolicy` 基于参考答案和评分点给出系统默认分、答对/答错、置信度与复核建议；当前为稳定可回归的 deterministic AI grading fallback，后续可替换/增强为真实 LLM 异步评分。',
'- **教师复核分默认等于系统分**：每题 `finalScore` 在自动判分后即等于系统分，前端“教师复核分”输入框默认展示该分值，教师只需核对或必要时调整。',
'- **一键核对当前范围答卷**：批改中心新增批量自动判分、批量核对接口与按钮，当前科目/考试筛选范围内可一键处理。',
'- **不及格复核保护**：系统按考试总分 60% 计算及格线；不及格答卷会标识“未达及格线，需不及格复核”，默认跳过普通一键核对，教师需单独确认或点击“复核不及格”显式批量确认。',
'- **评分审计字段持久化**：`grading_item` 新增 `ai_confidence`、`needs_review` 字段，用于保存主观题 AI 判分置信度和是否建议复核，避免仅靠前端临时推断。',
'',
'#### 接口与数据契约',
'',
'- `POST /api/v1/grading-tasks/{gradingTaskId}/auto-grade`：单份答卷系统自动判分。',
'- `POST /api/v1/grading-tasks/{gradingTaskId}/confirm-system-score?includeFailed=false`：单份答卷按系统默认分核对通过；不及格答卷需 `includeFailed=true`。',
'- `POST /api/v1/grading-tasks/batch-auto-grade`：按考试/科目及教师权限范围批量自动判分。',
'- `POST /api/v1/grading-tasks/batch-confirm`：按考试/科目及教师权限范围批量核对系统分，默认跳过不及格答卷。',
'- `GradingTask` 响应补充 `passScore/passed/failed/needsReview/reviewReason`。',
'- `GradingItem` 响应补充 `aiConfidence/needsReview`。',
'',
'#### 后续企业级增强建议',
'',
'- 将主观题/编程题评分升级为异步 LLM 评分任务：提交评分任务 -> 轮询进度 -> 保存评分证据与 token 成本 -> 教师复核。',
'- 编程题引入代码沙箱、测试用例得分与 AI 解释分离，避免仅依赖文本相似度。',
'- 增加评分 Rubric 版本号与评分差异审计：记录 AI 默认分、教师改分、改分原因和差异比例。',
'- 对不及格答卷支持双人复核或二次确认策略，适配正式考试成绩发布流程。',
];
if (!t.includes(marker)) {
  t += lines.join('\n');
}
fs.writeFileSync(p,t,'utf8');
