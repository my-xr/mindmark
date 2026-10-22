from pathlib import Path
repls = {
'apps/mindmark-web/src/views/teacher/QuestionBankView.vue': [
('''          <RouterLink
            class="secondary-button icon-action-button"
            to="/teacher/ai-questions"
            title="AI 出题"
          >
            <span class="icon-action-button__emoji" aria-hidden="true">✨</span>
            <span class="icon-action-button__label">AI 出题</span>
          </RouterLink>''', '''          <AppActionButton class="icon-action-button" icon="✨" to="/teacher/ai-questions" title="AI 出题">
            AI 出题
          </AppActionButton>'''),
('''          <button
            class="primary-button icon-action-button"
            type="button"
            title="新增题目"
            @click="openCreate"
          >
            <span class="icon-action-button__emoji" aria-hidden="true">＋</span>
            <span class="icon-action-button__label">新增题目</span>
          </button>''', '''          <AppActionButton
            class="icon-action-button"
            icon="＋"
            variant="primary"
            title="新增题目"
            @click="openCreate"
          >
            新增题目
          </AppActionButton>'''),
('''          <button
            class="secondary-button filter-toggle-button icon-action-button"
            type="button"
            :aria-expanded="!isFilterCollapsed"
            :title="isFilterCollapsed ? '展开全部' : '收起到一行'"
            @click="isFilterCollapsed = !isFilterCollapsed"
          >
            <span class="icon-action-button__emoji" aria-hidden="true">{{
              isFilterCollapsed ? '🔎' : '↟'
            }}</span>
            <span class="icon-action-button__label">{{
              isFilterCollapsed ? '展开全部' : '收起到一行'
            }}</span>
          </button>''', '''          <AppActionButton
            class="icon-action-button"
            :icon="isFilterCollapsed ? '🔎' : '↟'"
            :aria-expanded="!isFilterCollapsed"
            :title="isFilterCollapsed ? '展开全部' : '收起到一行'"
            @click="isFilterCollapsed = !isFilterCollapsed"
          >
            {{ isFilterCollapsed ? '展开全部' : '收起到一行' }}
          </AppActionButton>'''),
('''          <button
            class="secondary-button icon-action-button"
            type="button"
            title="重置筛选"
            @click="resetFilters"
          >
            <span class="icon-action-button__emoji" aria-hidden="true">↺</span>
            <span class="icon-action-button__label">重置</span>
          </button>''', '''          <AppActionButton class="icon-action-button" icon="↺" title="重置筛选" @click="resetFilters">
            重置
          </AppActionButton>'''),
('''        <button class="secondary-button" type="button" @click="loadQuestions">重试</button>''', '''        <AppActionButton icon="↻" @click="loadQuestions">重试</AppActionButton>'''),
],
'apps/mindmark-web/src/views/teacher/ExamsView.vue': [
('''              <RouterLink class="primary-button exam-entry-button" :to="primaryAction(exam).to">
                {{ primaryAction(exam).label }}
              </RouterLink>
              <RouterLink class="secondary-button exam-entry-button" to="/teacher/scores">
                成绩中心
              </RouterLink>''', '''              <AppActionButton
                class="exam-entry-button"
                icon="↗"
                variant="primary"
                :to="primaryAction(exam).to"
              >
                {{ primaryAction(exam).label }}
              </AppActionButton>
              <AppActionButton class="exam-entry-button" icon="📈" to="/teacher/scores">
                成绩中心
              </AppActionButton>'''),
],
'apps/mindmark-web/src/views/teacher/AiQuestionsView.vue': [
('''          <button
            class="secondary-button filter-toggle-button"
            type="button"
            :aria-expanded="!isGenerateCollapsed"
            @click="isGenerateCollapsed = !isGenerateCollapsed"
          >
            {{ isGenerateCollapsed ? '展开全部' : '收起到一行' }}
          </button>''', '''          <AppActionButton
            :icon="isGenerateCollapsed ? '🔎' : '↟'"
            :aria-expanded="!isGenerateCollapsed"
            @click="isGenerateCollapsed = !isGenerateCollapsed"
          >
            {{ isGenerateCollapsed ? '展开全部' : '收起到一行' }}
          </AppActionButton>'''),
],
'apps/mindmark-web/src/views/teacher/TeacherSettingsView.vue': [
('''        <RouterLink class="secondary-button" to="/teacher/ai-questions"
          >返回 AI 出题审核</RouterLink
        >''', '''        <AppActionButton icon="←" to="/teacher/ai-questions">返回 AI 出题审核</AppActionButton>'''),
]
}
for file, pairs in repls.items():
    p = Path(file)
    s = p.read_text(encoding='utf-8-sig')
    original = s
    for old, new in pairs:
        if old not in s:
            print(f'MISSING in {file}: {old[:60]!r}')
        s = s.replace(old, new)
    if s != original:
        p.write_text(s, encoding='utf-8')
