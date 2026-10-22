const fs = require('fs');
const updates = {
  'docs/02_需求规格说明书.md': `\n\n## 需求补充：题库课程筛选、AI 出题课程选择与五级难度（2026-07-19）\n\n- 题库管理页必须支持按课程筛选题目；筛选参数为 \`courseId\`，\`ALL\` 表示全部课程。\n- AI 出题审核页的“生成题目”模块中，课程必须来自当前用户可见课程下拉列表，不允许手动录入课程名称；提交时携带 \`courseId\`，并以课程名称作为生成上下文。\n- 题目难度统一调整为 5 个等级：\`VERY_EASY\`（很简单）、\`EASY\`（简单）、\`MEDIUM\`（中等）、\`HARD\`（困难）、\`VERY_HARD\`（很困难）。\n`,
  'docs/07_领域模型与数据字典.md': `\n\n## 数据字典补充：Question 课程归属与五级难度（2026-07-19）\n\n### Question 题目\n\n| 字段 | 类型 | 必填 | 说明 |\n| --- | --- | --- | --- |\n| \`courseId\` | string | 否 | 题目所属课程 ID，用于题库课程筛选与后续组卷约束。 |\n| \`courseName\` | string | 否 | 题目所属课程名称快照，用于列表和详情展示。 |\n| \`difficulty\` | enum | 是 | 五级难度枚举：\`VERY_EASY\`、\`EASY\`、\`MEDIUM\`、\`HARD\`、\`VERY_HARD\`。 |\n\n> 兼容策略：存量 \`EASY/MEDIUM/HARD\` 数据继续有效；新建题目与 AI 出题应从五级枚举中选择。\n`,
  'docs/08_API设计规范.md': `\n\n## API 契约补充：课程可见列表与题库课程筛选（2026-07-19）\n\n- \`GET /api/v1/courses\`：返回当前登录用户可见的 ACTIVE 课程列表；ADMIN 返回全部 ACTIVE 课程，教师/助教/学生基于可见班级反查课程。\n- \`GET /api/v1/questions\`：新增查询参数 \`courseId\`，用于按课程过滤题库题目。\n- \`Question.difficulty\` 五级枚举：\`VERY_EASY\`、\`EASY\`、\`MEDIUM\`、\`HARD\`、\`VERY_HARD\`。\n- \`Question\` 响应新增 \`courseId\`、\`courseName\` 字段；AI 出题生成请求新增 \`courseId\`。\n`,
  'docs/19_后端接口契约准备.md': `\n\n## 契约补齐：题库课程维度与五级难度（2026-07-19）\n\n- 后端新增 \`GET /api/v1/courses\`，供教师题库筛选与 AI 出题课程下拉使用。\n- \`GET /api/v1/questions\` 支持 \`courseId\` 过滤；题目响应返回课程 ID 与课程名称快照。\n- 数据库迁移 \`V14__question_course_and_five_level_difficulty.sql\`：为 \`question\` 表补充 \`course_id/course_name\`，并将难度约束扩展为五级。\n`,
  'docs/14_迭代计划与复盘.md': `\n\n## 本轮复盘：题目课程维度与五级难度收敛（2026-07-19）\n\n### 完成内容\n- 题目难度从 3 级扩展为 5 级，并同步前端类型、标签、Mock 与后端枚举/数据库约束。\n- 题库管理增加课程筛选，列表副信息展示题目所属课程。\n- AI 出题审核页的课程字段改为可见课程下拉选择，避免手动录入课程名称。\n- 后端补齐 \`/api/v1/courses\` 与 \`/api/v1/questions?courseId=...\` 契约。\n\n### 下一步建议\n1. 将题目创建/导入/AI 入库接口的课程必填校验补齐，确保题目不会产生无课程归属。\n2. 组卷时增加“试卷课程与题目课程一致”校验。\n3. 为课程筛选和五级难度补充页面级 Smoke 用例。\n`,
};
for (const [p, text] of Object.entries(updates)) {
  fs.appendFileSync(p, text, 'utf8');
}
