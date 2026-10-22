from pathlib import Path

p=Path('apps/mindmark-web/src/views/teacher/PapersView.vue')
s=p.read_text(encoding='utf-8')
s=s.replace('''        <div class="section-title">
          <div>
            <h2>试卷列表</h2>
            <p class="muted-text">共 {{ papers.length }} 套试卷。</p>
          </div>
        </div>''', '''        <div class="section-title">
          <div>
            <h2>试卷列表</h2>
            <p class="muted-text">共 {{ papers.length }} 套试卷。</p>
          </div>
          <div class="section-actions">
            <AppActionButton
              class="icon-action-button"
              icon="📚"
              title="返回题库"
              to="/teacher/questions"
            >
              题库
            </AppActionButton>
            <AppActionButton
              class="icon-action-button"
              icon="🗓️"
              variant="primary"
              title="创建考试"
              to="/teacher/exams"
            >
              创建考试
            </AppActionButton>
          </div>
        </div>''')
s=s.replace('''          <AppActionButton variant="primary" :disabled="operating" @click="markReady">''', '''          <AppActionButton
            class="icon-action-button"
            icon="✓"
            variant="primary"
            :disabled="operating"
            title="标记可用于考试"
            @click="markReady"
          >''')
s=s.replace('''            <AppActionButton
              variant="danger"
              :disabled="operating"
              @click="removeQuestion(item.questionId, item.question.title)"
            >''', '''            <AppActionButton
              class="icon-action-button"
              icon="−"
              variant="danger"
              :disabled="operating"
              title="移除题目"
              @click="removeQuestion(item.questionId, item.question.title)"
            >''')
s=s.replace('''          <AppActionButton :disabled="operating" @click="addQuestion(question)">''', '''          <AppActionButton
            class="icon-action-button"
            icon="＋"
            :disabled="operating"
            title="加入试卷"
            @click="addQuestion(question)"
          >''')
p.write_text(s, encoding='utf-8')

p=Path('apps/mindmark-web/src/views/teacher/ScoresView.vue')
s=p.read_text(encoding='utf-8')
s=s.replace('''        <div class="section-title">
          <div>
            <h2>考试成绩批次</h2>
            <p class="muted-text">选择考试后查看统计和学生明细。</p>
          </div>
        </div>''', '''        <div class="section-title">
          <div>
            <h2>考试成绩批次</h2>
            <p class="muted-text">选择考试后查看统计和学生明细。</p>
          </div>
          <div class="section-actions">
            <AppActionButton
              class="icon-action-button"
              icon="✅"
              title="返回批改中心"
              to="/teacher/grading"
            >
              批改中心
            </AppActionButton>
          </div>
        </div>''')
s=s.replace('''          <AppActionButton
            variant="primary"
            :disabled="!canPublish || publishing"
            @click="publishScores"
          >''', '''          <AppActionButton
            class="icon-action-button"
            icon="📣"
            variant="primary"
            :disabled="!canPublish || publishing"
            :title="publishing ? '发布中...' : selectedSummary.status === 'PUBLISHED' ? '已发布' : '发布成绩'"
            @click="publishScores"
          >''')
p.write_text(s, encoding='utf-8')

p=Path('apps/mindmark-web/src/views/teacher/ReviewsView.vue')
s=p.read_text(encoding='utf-8')
s=s.replace('''    <main class="two-column-layout review-page-layout">''', '''    <div class="page-local-actions section-actions">
      <AppActionButton
        class="icon-action-button"
        icon="↻"
        :disabled="loading"
        :title="loading ? '刷新中...' : '刷新复盘数据'"
        @click="loadData"
      >
        {{ loading ? '刷新中...' : '刷新' }}
      </AppActionButton>
    </div>

    <main class="two-column-layout review-page-layout">''')
p.write_text(s, encoding='utf-8')
