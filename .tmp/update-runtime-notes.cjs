const fs = require('fs');
for (const file of ['docs/14_迭代计划与复盘.md','docs/11_测试验收与质量门禁.md']) {
  let s = fs.readFileSync(file, 'utf8');
  s = s.replace('| 后端构建 | `pnpm server:compile` | 通过，BUILD SUCCESS |', '| 后端构建 | `pnpm server:compile` | 通过，BUILD SUCCESS |');
  s = s.replace('尚未启动真实后端验证 Flyway V9 在本地 `mindmark` 数据库中的实际执行结果。', '已启动后端连接本地 `mindmark` 数据库并验证健康检查、鉴权拦截、登录后课程/班级接口；但尚未执行完整考试闭环 E2E Smoke。');
  s = s.replace('说明：本记录覆盖代码级质量门禁；真实数据库 Flyway V9 与完整登录态 E2E Smoke 尚未在本轮执行，保留为 Round 2 前置验证项。', '说明：本轮已启动后端连接本地 `mindmark` 数据库，验证 `/actuator/health` 为 `UP`、未登录访问 `/api/v1/classes` 返回 401、教师登录后可读取 3 条课程和 3 条教学班；完整考试闭环登录态 E2E Smoke 保留为 Round 2 前置验证项。');
  fs.writeFileSync(file, s, 'utf8');
}
console.log('updated runtime verification notes');
