from pathlib import Path
path = Path('docs/06_前端开发规范.md')
text = path.read_text(encoding='utf-8-sig')
section = '''

## 15. 2026-07-20 页面级布局一致性二次巡检规范

- 教师端、学生端、管理端主要业务页面根容器统一使用 `page-shell + 页面专属 class`，页面级纵向节奏由 `page-shell` 的 `gap: 20px` 统一控制。
- `PageHeader`、筛选卡片、内容卡片、指标栅格、管理端概览栅格等作为 `page-shell` 直接子元素时，不再叠加 `margin-top` / `margin-bottom`，避免出现“grid gap + 外边距”导致的间距不一致。
- 多栏工作区（如教师工作台、试卷组卷、批改中心、成绩中心、学生成绩反馈、复盘分析）统一使用 20px 横向间距；内部表单、列表、按钮组只保留组件自身的紧凑间距。
- 页面操作区统一使用 `page-header-actions`、`section-actions`、`inline-actions`、`page-section-title__actions`，按钮间距统一为 `gap: 8px 10px`，禁止在单页继续写临时操作区间距。
- 若局部页面使用 scoped 样式定义了根容器或直接子模块 margin，必须在最终视觉覆盖层中显式收敛，或回迁到组件/页面基础样式中，确保同屏模块起线、卡片间距和操作区节奏一致。
'''
if '## 15. 2026-07-20 页面级布局一致性二次巡检规范' not in text:
    path.write_text(text.rstrip() + section + '\n', encoding='utf-8')
