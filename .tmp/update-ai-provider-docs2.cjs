const fs = require('fs');
const enc = 'utf8';
function write(file, s) { fs.writeFileSync(file, s.replace(/^\uFEFF/, ''), enc); }
function replaceIf(file, from, to) {
  let s = fs.readFileSync(file, enc);
  if (s.includes(to)) return;
  if (!s.includes(from)) throw new Error(`not found in ${file}: ${from}`);
  s = s.replace(from, to);
  write(file, s);
}
replaceIf('docs/04_业务流程与状态机.md',
'教师打开 AI 出题审核页\n  -> 读取个人 Kimi Provider 配置\n  -> 选择课程、题型、五级难度、知识点与生成要求\n  -> LangGraph: validate_input -> resolve_course -> generate_with_kimi -> persist_questions\n  -> 写入 question(source=AI, status=PENDING_REVIEW)\n  -> 教师在审核列表中复核后再进入正式题库使用',
'教师打开 AI 出题审核页\n  -> 选择 OpenAI / Anthropic Provider，并读取当前教师个人 Key 脱敏配置\n  -> 选择课程、题型、五级难度、知识点与生成要求\n  -> LangGraph: validate_input -> resolve_course -> generate_with_ai -> persist_questions\n  -> 服务端校验题干、选项、解析、评分点为中文内容\n  -> 写入 question(source=AI, status=PENDING_REVIEW)\n  -> 教师在审核列表中复核后再进入正式题库使用');
replaceIf('docs/04_业务流程与状态机.md',
'约束：Kimi API Key 解析顺序为教师个人配置优先、全局环境变量兜底；链路失败不得产生半成品无课程题目。',
'约束：Provider API Key 解析顺序为教师个人配置优先、对应全局环境变量兜底；链路失败不得产生半成品无课程题目。');
replaceIf('docs/10_AI能力与人工审核规范.md',
'- P0 图节点固定为：`validate_input`、`resolve_course`、`generate_with_kimi`、`persist_questions`。\n- Kimi 调用必须使用当前教师个人 Key；个人 Key 不存在时才允许使用全局环境变量兜底。\n- 模型输出必须要求严格 JSON，并在服务端再次校验题型、五级难度、答案、解析、选项/评分点结构和题目数量。',
'- P0 图节点固定为：`validate_input`、`resolve_course`、`generate_with_ai`、`persist_questions`。\n- AI 出题 Provider 不绑定 Kimi，当前支持 `OPENAI` 与 `ANTHROPIC`；调用必须优先使用当前教师个人 Key，个人 Key 不存在时才允许使用对应全局环境变量兜底。\n- 模型输出必须要求严格 JSON，并在服务端再次校验题型、五级难度、答案、解析、选项/评分点结构、题目数量和中文内容；英文题干/解析不得入库。');
replaceIf('docs/20_后端系统框架设计.md',
'| ai | Kimi 等 AI Provider 抽象、调用审计、降级 | 仅配置占位，真实调用后续实现 |',
'| ai | OpenAI / Anthropic Provider 抽象、教师个人 Key 加密存储、LangGraph 出题编排、中文内容校验 | 题目生成已接真实接口；Kimi 仅作为历史兼容/讲评稿遗留入口 |');
replaceIf('docs/20_后端系统框架设计.md',
'| `KIMI_BASE_URL` | `https://api.moonshot.cn/v1` | Kimi 兼容接口地址 |\n| `KIMI_API_KEY` | 空 | 只通过环境变量注入，严禁落库或提交 |',
'| `MINDMARK_AI_QUESTION_PROVIDER` | `OPENAI` | AI 出题默认 Provider，可选 `OPENAI` / `ANTHROPIC` |\n| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | OpenAI-compatible Chat Completions 地址 |\n| `OPENAI_MODEL` | `gpt-4.1-mini` | OpenAI 出题模型 |\n| `OPENAI_API_KEY` | 空 | OpenAI 全局兜底 Key，仅环境变量注入 |\n| `ANTHROPIC_BASE_URL` | `https://api.anthropic.com/v1` | Anthropic Messages API 地址 |\n| `ANTHROPIC_MODEL` | `claude-3-5-sonnet-latest` | Anthropic 出题模型 |\n| `ANTHROPIC_API_KEY` | 空 | Anthropic 全局兜底 Key，仅环境变量注入 |\n| `KIMI_BASE_URL` | `https://api.moonshot.cn/v1` | 历史兼容/讲评稿遗留 Provider 地址 |\n| `KIMI_API_KEY` | 空 | 历史兼容/讲评稿遗留 Key，仅环境变量注入 |');
replaceIf('docs/20_后端系统框架设计.md',
'- 用户本地提供的 Kimi API Key 仅允许通过环境变量用于临时测试，不能写入 `application.yml`、README、OpenAPI 或任何文档。\n- 后续真实 AI 调用应通过本地 shell 环境变量或 `.env.local`（已被 `.gitignore` 忽略）注入。',
'- 用户本地提供的 OpenAI / Anthropic / Kimi API Key 仅允许通过教师个人加密配置、运行时环境变量或 `.env.local`（已被 `.gitignore` 忽略）注入，不能写入 `application.yml`、README、OpenAPI 或任何文档。\n- 前端不得直接调用外部 AI；所有 AI 能力必须经后端 Provider 封装、鉴权、审计和中文内容校验。');
replaceIf('docs/21_考试闭环缺口分析与三轮收敛计划.md', '### 5.5 AI / LangGraph / Kimi', '### 5.5 AI / LangGraph / OpenAI-Anthropic Provider');
replaceIf('docs/21_考试闭环缺口分析与三轮收敛计划.md',
'1. **Kimi API Key 不能明文写进代码或文档**，只能走配置或安全存储。',
'1. **OpenAI / Anthropic / Kimi API Key 不能明文写进代码或文档**，只能走教师个人加密配置、运行时环境变量或安全存储。');
let f='docs/12_需求变更与决策记录.md';
let s=fs.readFileSync(f,enc);
const entry=[
'',
'### 2026-07-19：AI 出题 Provider 去 Kimi 绑定与中文输出硬化',
'',
'- 背景：AI 出题审核页出现英文题目，且题目生成链路不应绑定单一 Kimi Provider。',
'- 决策：AI 出题 Provider 改为可插拔 `OPENAI` / `ANTHROPIC`；Kimi 仅作为历史兼容/讲评稿遗留入口，不再作为出题主链路命名。',
'- 处理：前端 AI 出题审核页改为中文界面，支持 Provider 下拉、教师个人 Key 保存、课程关联生成；后端 LangGraph 节点统一为 `generate_with_ai`，并在持久化前校验题干、选项、解析、评分点必须包含中文内容。',
'- 安全：任何 Provider API Key 均不得明文写入代码、文档或日志；前端不直接访问外部 AI。',
''
].join('\n');
if (!s.includes('2026-07-19：AI 出题 Provider 去 Kimi 绑定与中文输出硬化')) {
  s += entry;
  write(f, s);
}
