const fs = require('fs');
const updates = [
  {
    path: 'docs/18_页面级UI设计规范.md',
    text: `

## 2026-07-19 小范围组件化收敛补充

### 公共组件边界

- ` + "`PageSection`" + `：用于承载页面内稳定的内容模块，统一 ` + "`content-card`" + `、标题、描述、右侧操作区与分割线结构。页面不再重复手写 ` + "`section-title`" + ` 骨架。
- ` + "`SummaryStrip`" + `：用于当前对象摘要、班级摘要、复盘摘要等“标题 + 说明 + 轻量指标”的横向信息条，避免各页面重复维护摘要布局。
- 本轮只收敛复盘分析与学生名单页面中的高重复模块，不改变题库、组卷、考试管理等页面既有交互，避免小范围优化扩大成全局重构。

### 使用要求

- 页面级组件优先负责数据编排和业务动作，标题区、操作区、摘要区交给公共组件承载。
- ` + "`PageSection`" + ` 的 ` + "`actions`" + ` 插槽只放主次按钮、状态标签、计数标签，不放复杂业务表单。
- ` + "`SummaryStrip`" + ` 的指标数量建议 1-3 个；超过 3 个应使用独立指标栅格，避免摘要条过载。
- 视觉保持现代简洁：轻边框、低阴影、低干扰背景；不得恢复强发光或遮挡文字的科技感效果。
`,
  },
  {
    path: 'docs/14_迭代计划与复盘.md',
    text: `

## 2026-07-19 小范围组件化收敛复盘

### 本轮目标

- 将复盘分析、AI 讲评稿、导出产物、考试列表、学生名单导入、学生账号列表中的重复卡片标题结构收敛到公共组件。
- 保持页面当前“清爽、不乱”的视觉状态，不做大范围布局重排。
- 执行前端代码审查，确认组件边界、类型、Lint、Stylelint 与构建均通过。

### 完成内容

- 新增 ` + "`src/components/common/PageSection.vue`" + `，统一内容卡片、标题、描述、操作区、分割线。
- 新增 ` + "`src/components/common/SummaryStrip.vue`" + `，统一复盘摘要与班级摘要的信息条表达。
- 接入范围：` + "`ReviewsView.vue`" + `、` + "`StudentRosterView.vue`" + `、` + "`ReviewReportSelector.vue`" + `、` + "`ReviewAnalysisSections.vue`" + `、` + "`ReviewArtifactList.vue`" + `、` + "`LectureDraftCard.vue`" + `。
- 复盘页只保留指标栅格为业务展示结构，其余高重复内容模块已收敛为 ` + "`PageSection`" + `。

### 代码审查结论

- 组件化边界合理：公共组件只处理展示骨架，不侵入业务服务、状态流或接口契约。
- 类型修正：` + "`SummaryStrip`" + ` 对可选 ` + "`stats`" + ` 做标准化计算，避免模板层 undefined 类型风险。
- 样式收敛：新增 ` + "`.page-section`" + ` 与 ` + "`.summary-strip`" + ` 样式，复用已有 token，支持 Light/Dark 与响应式。
- 交互风险：未改变下拉、输入、导入、导出、批注、确认讲评稿等既有业务动作。

### 下一步建议

- 若继续组件化，建议进入第二批：筛选条 ` + "`FilterPanel`" + `、表格标题工具栏 ` + "`TableToolbar`" + `、空/错/加载组合态 ` + "`DataStateBlock`" + `；不要一次性重构所有表格。
`,
  },
  {
    path: 'docs/11_测试验收与质量门禁.md',
    text: `

## 2026-07-19 小范围组件化收敛质量记录

### 验收范围

- 公共组件：` + "`PageSection.vue`" + `、` + "`SummaryStrip.vue`" + `。
- 复盘链路页面组件：考试列表、当前复盘摘要、成绩分布与薄弱点、题目表现、AI 讲评稿、导出产物。
- 学生账号页面：名单导入、当前班级摘要、已导入学生列表标题区。
- 前端代码审查：组件边界、Props 类型、插槽使用、样式 token、响应式与主题兼容。

### 命令门禁

| 门禁 | 命令 | 结果 |
| --- | --- | --- |
| 前端格式化 | ` + "`pnpm web:format`" + ` | PASS |
| 前端全量质量门禁 | ` + "`pnpm web:quality`" + ` | PASS |
| 前端生产构建 | ` + "`pnpm --filter mindmark-web build`" + ` | PASS |

### 审查结论

- 本轮未发现阻塞级前端问题。
- 页面级重复卡片标题结构已在目标范围内收敛。
- 暂不建议继续扩大重构范围；下一轮应优先按真实页面验收反馈，选择单一组件族渐进收敛。
`,
  },
];

for (const update of updates) {
  fs.appendFileSync(update.path, update.text, 'utf8');
}
