from pathlib import Path
path = Path('docs/24_真实浏览器视觉与批量数据巡检记录.md')
append = '''

## 14. 2026-07-22 组卷助手表单与复选项视觉优化记录

### 14.1 调整目标

- 优化组卷助手中的目标总分、写入方式、题量、单题分、知识点约束等表单控件，使其与当前企业级卡片风格一致。
- 将难度复选项从原生 checkbox 观感升级为可点击的轻量标签，选中态、悬浮态、键盘聚焦态更清晰。
- 保持交互逻辑不变，仅收敛视觉表现，避免影响随机组卷、智能组卷和质量预览接口链路。

### 14.2 涉及文件

```text
apps/mindmark-web/src/styles/visual-alignment.css
```

### 14.3 验收结果

```powershell
pnpm --filter mindmark-web stylelint
pnpm --filter mindmark-web typecheck
pnpm --filter mindmark-web build
```

结果：均通过；build 仅提示 vendor 产物体积较大，非本次改动引入的阻断问题。
'''
path.write_text(path.read_text(encoding='utf-8') + append, encoding='utf-8')
