const fs=require('fs');
const path='docs/21_考试闭环缺口分析与三轮收敛计划.md';
let text=fs.readFileSync(path,'utf8');
const section=`

### 20.12 组卷质量可视化与 LangGraph 组卷计划增强

本轮在随机组卷和智能组卷基础上继续补齐“发布前可解释、可预检、可复核”的企业级组卷能力。

#### 已完成能力

- 新增组卷预览接口：
  - \`POST /api/v1/papers/{paperId}/compose/random/preview\`
  - \`POST /api/v1/papers/{paperId}/compose/agent/preview\`
- 预览接口只执行规则校验、库存检查、候选题选择和质量分析，不写入试卷，便于教师在正式组卷前检查风险。
- 组卷结果和预览结果均返回质量报告：
  - 目标分与实际分；
  - 总题量；
  - 知识点覆盖数量；
  - 题型分值分布；
  - 难度分值分布；
  - 知识点覆盖分布；
  - 质量亮点与风险提示。
- 新增 \`LangGraphPaperComposePlanService\`，工作流为：
  - \`normalize_rules\`：归一化教师题型、题量、分值、难度与知识点规则；
  - \`analyze_quality\`：结合候选选题结果分析总分、题量、知识点和风险；
  - \`build_plan\`：输出可解释的组卷计划、执行步骤、依据与建议。
- 前端“组卷助手”新增“质量预览”按钮和质量可视化区域，教师可以在写入前查看题型、难度、知识点覆盖和 LangGraph 组卷计划。

#### 安全边界

- LangGraph 当前负责“计划、解释与质量分析”，不直接写库。
- 正式写入仍由后端事务执行，继续强校验课程边界、题目状态、题型、难度、知识点、去重、目标分值和题库库存。
- 预览失败时不会改变当前试卷，避免因库存不足或规则错误破坏已有试卷。

#### 后续增强建议

- 将 LangGraph 计划节点增强为“LLM 输出组卷计划 JSON + 后端确定性执行”，但仍禁止 LLM 直接指定未校验题目写库。
- 增加组卷策略模板持久化：教师可保存“期中/期末/章节测验/补考/编程专项”等模板。
- 增加试卷质量阈值配置：如知识点不少于 N 个、高难度占比不超过 X%、主观题分值不低于 Y%。
`;
if(!text.includes('### 20.12 组卷质量可视化与 LangGraph 组卷计划增强')){
  text=text.replace(/\s*$/,'')+section+'\n';
}
fs.writeFileSync(path,text,'utf8');
