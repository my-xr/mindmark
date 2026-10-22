const fs = require('fs');
const updates = [
  {
    file: 'docs/18_页面级UI设计规范.md',
    marker: '## 2026-07-19 Dark 主题工作区背景修复补充',
    text: `

## 2026-07-19 Dark 主题工作区背景修复补充

- Dark 主题不允许出现工作区大面积白底；` + '`body`、`#app`、`portal-layout`、`portal-main`、`student-layout`、`blank-layout`' + ` 必须跟随主题背景 token。
- Dark 主题采用深蓝灰而不是纯黑：背景、顶部栏、侧边栏、卡片、输入框和列表行均使用 token 统一控制。
- 页面标题、区块标题、表头、选中行、管理端 Tab、学生端导航等常见硬编码浅色样式必须在 ` + '`themes.css`' + ` 中提供深色覆盖，避免黑底白块或深色背景黑字。
- Light 仍为默认主题，本次仅修复 Dark 主题覆盖完整性，不改变已确认的 Light 页面视觉。
`,
  },
  {
    file: 'docs/14_迭代计划与复盘.md',
    marker: '## 2026-07-19 Dark 主题工作区背景修复复盘',
    text: `

## 2026-07-19 Dark 主题工作区背景修复复盘

### 背景

用户反馈黑色主题效果不好，工作页面背景仍为白色。经检查，` + '`modern.css`' + ` 中存在高优先级的 ` + '`:root body`' + ` 浅色渐变背景，且部分页面标题/表头/选中态仍有浅色硬编码。

### 完成内容

- 将主题最终覆盖层补齐到 ` + '`:root body`、`#app`、`.portal-layout`、`.portal-main`、`.student-layout` 和 `.blank-layout`' + `，确保 Dark 主题工作区不再露出白底。
- 调整 Dark token 为更柔和的深蓝灰，减少纯黑压迫感。
- 补齐页面标题、卡片、表单、表头、管理端 Tab、学生端导航、试卷/批改选中态等 Dark 覆盖。
- 保持默认 Light 主题与当前已认可的页面信息结构不变。

### 下一步建议

1. 请优先验收教师工作台、题库管理、考试管理、管理端用户页和学生考试中心在 Dark 主题下是否还有白块或黑字。
2. 若还希望 Dark 更高级，可以在“深蓝控制台 / 暖黑低对比 / 高对比无障碍”三种方向中选择后再做统一细化。
`,
  },
  {
    file: 'docs/11_测试验收与质量门禁.md',
    marker: '## 2026-07-19 Dark 主题工作区背景修复质量记录',
    text: `

## 2026-07-19 Dark 主题工作区背景修复质量记录

### 验收点

- Dark 主题下教师端/学生端/管理端工作区背景不再出现大面积白底。
- 页面标题、区块标题、表头、输入框、按钮和选中态在 Dark 主题下保持可读。
- 默认 Light 主题视觉不变。

### 命令门禁

| 门禁             | 命令                               | 结果 |
| ---------------- | ---------------------------------- | ---- |
| 前端格式化       | ` + '`pnpm web:format`' + `                  | PASS |
| 前端全量质量门禁 | ` + '`pnpm web:quality`' + `                 | PASS |
| 前端生产构建     | ` + '`pnpm --filter mindmark-web build`' + ` | PASS |
`,
  },
];
for (const { file, marker, text } of updates) {
  let s = fs.readFileSync(file, 'utf8');
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
  if (!s.includes(marker)) {
    s = s.replace(/\s*$/, '') + text;
  }
  fs.writeFileSync(file, s, 'utf8');
}
