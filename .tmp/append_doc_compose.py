from pathlib import Path
path = Path('docs/24_真实浏览器视觉与批量数据巡检记录.md')
append = '''

## 13. 2026-07-22 组卷助手设计优化记录

### 13.1 调整目标

- 将组卷助手从“表单堆叠”优化为“标题说明 + 流程步骤 + 策略控制 + 规则配置 + 质量报告”的信息结构。
- 明确 100 分组卷的关键状态：目标总分、写入方式、预计总分、分值是否匹配。
- 保留随机组卷、智能组卷、质量预览能力，同时让主操作区域更集中，减少页面拥挤感。
- 规则卡片保留题量、单题分、知识点约束、难度范围，视觉上按题型分组，便于教师快速调整。

### 13.2 涉及文件

```text
apps/mindmark-web/src/views/teacher/PapersView.vue
apps/mindmark-web/src/styles/visual-alignment.css
```

### 13.3 验收结果

```powershell
pnpm --filter mindmark-web typecheck
pnpm --filter mindmark-web exec eslint src/views/teacher/PapersView.vue
pnpm --filter mindmark-web stylelint
```

结果：均通过。

### 13.4 后续建议

- 若真实浏览器中 1366px 宽度仍显拥挤，下一步可将规则配置改为可编辑表格或按题型折叠分组。
- 后续可增加“题库库存命中率”提示：每条规则实时展示当前课程下可用题量，降低教师组卷失败概率。
'''
path.write_text(path.read_text(encoding='utf-8') + append, encoding='utf-8')
