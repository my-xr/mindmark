from pathlib import Path
p = Path('docs/06_前端开发规范.md')
s = p.read_text(encoding='utf-8')
section = '''

## 14. 2026-07-20 前端操作按钮与布局统一规范

本轮完成前端操作按钮组件化收敛，后续页面开发与重构必须遵循以下约束：

- 页面级主操作、次操作、危险操作统一使用 `components/common/AppActionButton.vue`，禁止继续新增散落的 `primary-button` / `secondary-button` / `danger-button` 业务按钮实现。
- `AppActionButton` 统一承载 `primary`、`secondary`、`danger`、`tag`、`tag-danger` 五类语义；新增、保存、提交等强主操作使用 `primary`，删除、禁用、移除等破坏性操作使用 `danger` 或 `tag-danger`。
- 顶部操作区使用 `page-header-actions`，模块操作区使用 `section-actions` 或 `page-section-title__actions`，行内操作使用 `inline-actions`；按钮间距由全局样式控制，不在页面内临时写 gap。
- 列表、表格、卡片之间默认以 20px 为页面节奏；筛选卡片、内容卡片、详情抽屉的主次操作位置必须保持一致。
- 链接型操作同样使用 `AppActionButton` 的 `to` 属性实现，避免同一页面混用 RouterLink 按钮样式与原生 button 样式。
- 需要图标标签化的高频操作优先使用 `icon` / `iconOnly` / `size="sm"`，文字仅用于解释动作，不再为单页单独创建重复按钮样式。
- 每次按钮或布局规范调整后，必须执行 `pnpm --filter mindmark-web lint`、`stylelint`、`typecheck` 验收。
'''
if '## 14. 2026-07-20 前端操作按钮与布局统一规范' not in s:
    s += section
p.write_text(s, encoding='utf-8')
