from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
text=p.read_text(encoding='utf-8')
repls={
'''        <div class="section-actions question-filter-actions">
          <RouterLink class="secondary-button" to="/teacher/ai-questions">AI 出题</RouterLink>
          <button class="primary-button" type="button" @click="openCreate">新增题目</button>
          <button
            class="secondary-button filter-toggle-button"
            type="button"
            :aria-expanded="!isFilterCollapsed"
            @click="isFilterCollapsed = !isFilterCollapsed"
          >
            {{ isFilterCollapsed ? '展开全部' : '收起到一行' }}
          </button>
          <button class="secondary-button" type="button" @click="resetFilters">重置</button>
        </div>''':
'''        <div class="section-actions question-filter-actions">
          <RouterLink
            class="secondary-button icon-action-button"
            to="/teacher/ai-questions"
            title="AI 出题"
          >
            <span class="icon-action-button__emoji" aria-hidden="true">✨</span>
            <span class="icon-action-button__label">AI 出题</span>
          </RouterLink>
          <button
            class="primary-button icon-action-button"
            type="button"
            title="新增题目"
            @click="openCreate"
          >
            <span class="icon-action-button__emoji" aria-hidden="true">＋</span>
            <span class="icon-action-button__label">新增题目</span>
          </button>
          <button
            class="secondary-button filter-toggle-button icon-action-button"
            type="button"
            :aria-expanded="!isFilterCollapsed"
            :title="isFilterCollapsed ? '展开全部' : '收起到一行'"
            @click="isFilterCollapsed = !isFilterCollapsed"
          >
            <span class="icon-action-button__emoji" aria-hidden="true">{{ isFilterCollapsed ? '🔎' : '↟' }}</span>
            <span class="icon-action-button__label">{{ isFilterCollapsed ? '展开全部' : '收起到一行' }}</span>
          </button>
          <button
            class="secondary-button icon-action-button"
            type="button"
            title="重置筛选"
            @click="resetFilters"
          >
            <span class="icon-action-button__emoji" aria-hidden="true">↺</span>
            <span class="icon-action-button__label">重置</span>
          </button>
        </div>''',
'''      <div class="question-table-toolbar">
        <div>
          <span class="eyebrow-text">题库列表</span>
          <strong>共 {{ pagination.total }} 道题</strong>
        </div>
        <span class="muted-text"
          >当前显示 {{ pageRangeText }}，默认按更新时间倒序；点击行查看详情，双击快速编辑。</span
        >
      </div>''':
'''      <div class="section-title question-table-title">
        <div>
          <h2>题库列表</h2>
          <p class="muted-text">
            共 {{ pagination.total }} 道题 · 当前显示 {{ pageRangeText }} · 默认按更新时间倒序；点击行查看详情，双击快速编辑。
          </p>
        </div>
      </div>'''
}
for old,new in repls.items():
    if old not in text:
        raise SystemExit('block not found: '+old[:60])
    text=text.replace(old,new)
p.write_text(text, encoding='utf-8')
