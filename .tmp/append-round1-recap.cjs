const fs = require('fs');
const file = 'docs/14_迭代计划与复盘.md';
let s = fs.readFileSync(file, 'utf8');
const marker = '### Round 1 开发复盘（2026-07-18）';
if (!s.includes(marker)) {
  s += `\n\n${marker}\n\n#### 完成内容\n\n- 文档侧：同步更新领域模型、API 设计、权限与安全、测试验收、需求变更决策记录，明确 TeachingClass 是考试闭环最小权限边界。\n- 后端侧：新增 Course / TeachingClass 落库模型、Flyway V9、管理接口与 OpenAPI 契约；新增 ClassScopeService，按 ADMIN / TEACHER / TA / STUDENT 角色收敛班级可见与可管理范围。\n- 考试闭环侧：学生名单导入、教师/助教授权、考试创建、学生考试列表、答卷读取/保存/交卷、批改任务、成绩查询与发布均接入真实班级权限边界；学生端接口不再信任 query 中的 studentId。\n- 前端侧：新增课程与班级管理页；学生名单导入、考试创建、教师/助教授权改为选择真实教学班；真实接口下学生考试与成绩接口不再拼接 studentId。\n- 契约侧：OpenAPI 新增 Academic 相关路径与 schema，并更新学生身份通过 Sa-Token 解析的说明。\n\n#### 本轮质量门禁\n\n| 门禁 | 命令 | 结果 |\n| --- | --- | --- |\n| 后端编译 | \`pnpm server:compile\` | 通过，BUILD SUCCESS |\n| 后端测试/契约测试 | \`pnpm server:test\` | 通过，2 tests passed |\n| 前端类型检查 | \`pnpm web:typecheck\` | 通过 |\n| 前端 ESLint | \`pnpm web:lint\` | 通过 |\n| 前端格式检查 | \`pnpm web:format:check\` | 通过 |\n| 前端 Stylelint | \`pnpm web:stylelint\` | 通过 |\n| 前端构建 | \`pnpm web:build\` | 通过 |\n\n#### 风险与未完成项\n\n- 尚未启动真实后端验证 Flyway V9 在本地 \`mindmark\` 数据库中的实际执行结果。\n- 尚未补齐班级越权场景的自动化集成测试，当前主要依赖服务层校验与手工/Smoke 验证计划。\n- 迁移中新增的历史 FK 约束使用 \`NOT VALID\`，需要在数据清洗后执行约束校验。\n- 学生端答题入口仍需在 Round 2 与考试状态机、时间窗口、幂等提交一起强化。\n\n#### 下一步建议\n\n建议进入 **Round 2：考试状态机与时间窗口强一致**：统一考试状态流转、限制答题时间窗口、强化草稿保存/交卷幂等、防重复提交，并补齐真实登录态 Smoke 与越权测试。\n`;
  fs.writeFileSync(file, s, 'utf8');
  console.log('appended Round 1 recap');
} else {
  console.log('Round 1 recap already exists');
}
