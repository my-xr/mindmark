from pathlib import Path
path = Path('docs/24_真实浏览器视觉与批量数据巡检记录.md')
append = '''

## 15. 2026-07-22 常用表单组件封装记录

### 15.1 调整目标

- 将组卷助手中反复使用的输入框、下拉框、复选标签抽离为通用组件，避免页面内继续堆叠零散原生表单样式。
- 保持现有组卷业务逻辑不变，只替换 UI 表达层，便于后续题库管理、AI 出题审核、个人配置等页面复用。
- 将控件基础样式内聚到组件内部，页面样式只负责布局和区域间距。

### 15.2 新增组件

```text
apps/mindmark-web/src/components/common/AppFormControl.vue
apps/mindmark-web/src/components/common/AppChoiceChips.vue
```

- `AppFormControl`：统一 input / select 控件，支持 label、hint、placeholder、number/text/password、options，并透传 min、step、disabled 等属性。
- `AppChoiceChips`：统一多选标签控件，保留 checkbox 语义，提供企业级选中态、悬浮态、键盘聚焦态。

### 15.3 迁移范围

```text
apps/mindmark-web/src/views/teacher/PapersView.vue
apps/mindmark-web/src/styles/visual-alignment.css
```

- 组卷助手顶部的目标总分、写入方式已迁移到 `AppFormControl`。
- 每个题型规则卡片中的题量、单题分、知识点约束已迁移到 `AppFormControl`。
- 难度范围复选项已迁移到 `AppChoiceChips`。
- 页面 CSS 删除了大段控件细节样式，仅保留组卷助手中的表单区域布局样式。

### 15.4 验收结果

```powershell
pnpm --filter mindmark-web typecheck
pnpm --filter mindmark-web exec eslint src/components/common/AppFormControl.vue src/components/common/AppChoiceChips.vue src/views/teacher/PapersView.vue
pnpm --filter mindmark-web stylelint
pnpm --filter mindmark-web build
```

结果：均通过；build 仅提示 vendor 产物体积较大，非本次改动引入的阻断问题。

### 15.5 后续建议

- 下一步可把题库管理、AI 出题审核、个人配置中的普通 input / select / 多选标签逐步迁移到这两个组件。
- 若后续需要错误态、必填态、表单校验提示，可继续扩展 `AppFormControl` 的 `error`、`required`、`status` 属性。
'''
path.write_text(path.read_text(encoding='utf-8') + append, encoding='utf-8')
