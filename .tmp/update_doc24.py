from pathlib import Path
p=Path('docs/24_真实浏览器视觉与批量数据巡检记录.md')
text=p.read_text(encoding='utf-8-sig')
append='''

## 17. 2026-07-22 批改中心答卷队列列表化重构记录

### 17.1 调整目标

- 将批改中心“答卷队列”从左侧窄栏 + 右侧详情的拥挤布局，调整为与“试卷与组卷 / 试卷列表”一致的整行列表模式。
- 点击某份答卷后进入独立批改详情页，详情页提供“返回队列”，避免列表和题目复核内容挤在同一屏。
- 保留科目、考试、分数段筛选与真实分页，并继续支持批量自动判分、一键核对、不及格复核等教师批改闭环操作。

### 17.2 涉及文件

```text
apps/mindmark-web/src/views/teacher/GradingView.vue
apps/mindmark-web/src/styles/visual-alignment.css
```

### 17.3 关键调整

- `selectedTask` 不再默认回退到第一页首条答卷；批改中心默认进入整行答卷列表，只有点击答卷后才进入详情。
- 答卷队列改为响应式卡片网格，展示学生、考试、班级、提交时间、当前分数、复核状态与不及格标识。
- 详情页顶部增加“返回队列”按钮，复核、AI 批改、核对通过等操作集中在详情页右上角。
- 筛选区从原生 `select` 迁移到 `AppFormControl`，与后续表单组件化规范保持一致。
- 翻页、筛选、返回队列时会清理当前答卷详情、题目分页、AI 任务状态与本地分数覆盖，避免错用上一份答卷状态。

### 17.4 验收结果

```powershell
pnpm --filter mindmark-web typecheck
pnpm --filter mindmark-web exec eslint src/views/teacher/GradingView.vue src/components/common/AppFormControl.vue
pnpm --filter mindmark-web stylelint
pnpm --filter mindmark-web build
```

结果：均通过；build 仅提示 vendor chunk 较大，非本次改动引入的阻断问题。

### 17.5 下一步建议

- 对“成绩中心”的考试成绩批次列表继续参照该模式做列表/详情分离，避免成绩批次、学生成绩、发布动作同屏拥挤。
- 批改详情页后续可进一步将单题复核卡片组件化，统一主观题、编程题、客观题的判分依据展示。
'''
p.write_text(text.rstrip()+append, encoding='utf-8', newline='\n')
