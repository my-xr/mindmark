from pathlib import Path

# Dashboard: move header actions into section cards and make them icon-label buttons.
p=Path('apps/mindmark-web/src/views/teacher/DashboardView.vue')
s=p.read_text(encoding='utf-8')
s=s.replace('  <div class="page-shell dashboard-page">\n\n    <ErrorState', '  <div class="page-shell dashboard-page">\n    <ErrorState')
s=s.replace('''          <RouterLink to="/teacher/exams">查看考试</RouterLink>''', '''          <div class="section-actions">
            <AppActionButton
              class="icon-action-button"
              icon="↻"
              :disabled="loading"
              :title="loading ? '刷新中...' : '刷新数据'"
              @click="loadDashboard"
            >
              {{ loading ? '刷新中...' : '刷新数据' }}
            </AppActionButton>
            <AppActionButton
              class="icon-action-button"
              icon="📅"
              title="查看考试"
              to="/teacher/exams"
            >
              查看考试
            </AppActionButton>
          </div>''')
s=s.replace('''        <div class="section-title">
          <div>
            <h2>快捷入口</h2>
            <p class="muted-text">按考试闭环顺序进入核心页面。</p>
          </div>
        </div>''', '''        <div class="section-title">
          <div>
            <h2>快捷入口</h2>
            <p class="muted-text">按考试闭环顺序进入核心页面。</p>
          </div>
          <div class="section-actions">
            <AppActionButton
              class="icon-action-button"
              icon="✨"
              variant="primary"
              title="AI 出题"
              to="/teacher/ai-questions"
            >
              AI 出题
            </AppActionButton>
          </div>
        </div>''')
p.write_text(s, encoding='utf-8')

# AI questions: place navigation/config into generate card action area.
p=Path('apps/mindmark-web/src/views/teacher/AiQuestionsView.vue')
s=p.read_text(encoding='utf-8')
s=s.replace('  <div class="page-shell ai-questions-page">\n\n    <section', '  <div class="page-shell ai-questions-page">\n    <section')
s=s.replace('''        <div class="section-actions">
          <AppActionButton
            :icon="isGenerateCollapsed ? '🔎' : '↟'"''', '''        <div class="section-actions">
          <AppActionButton
            class="icon-action-button"
            icon="⚙️"
            title="个人配置"
            to="/teacher/settings"
          >
            个人配置
          </AppActionButton>
          <AppActionButton
            class="icon-action-button"
            icon="📚"
            title="返回题库管理"
            to="/teacher/questions"
          >
            题库管理
          </AppActionButton>
          <AppActionButton
            class="icon-action-button"
            :icon="isGenerateCollapsed ? '🔎' : '↟'"''')
s=s.replace('''          <AppActionButton
            variant="primary"
            :disabled="isGenerating || !form.courseId"
            @click="generate"
          >''', '''          <AppActionButton
            class="icon-action-button"
            icon="✨"
            variant="primary"
            :disabled="isGenerating || !form.courseId"
            :title="isGenerating ? '生成中...' : '生成题目'"
            @click="generate"
          >''')
s=s.replace('''        <AppActionButton :disabled="taskHistoryLoading" @click="loadTaskHistory">''', '''        <AppActionButton class="icon-action-button" icon="↻" :disabled="taskHistoryLoading" title="刷新历史" @click="loadTaskHistory">''')
p.write_text(s, encoding='utf-8')

# Exams: move return button into create card actions; iconize create/refresh.
p=Path('apps/mindmark-web/src/views/teacher/ExamsView.vue')
s=p.read_text(encoding='utf-8')
s=s.replace('  <div class="page-shell exams-page">\n\n    <OperationNotice', '  <div class="page-shell exams-page">\n    <OperationNotice')
s=s.replace('''        <div class="section-actions">
          <AppActionButton
            variant="primary"
            :disabled="creating || !canCreate"
            @click="submitCreateExam"
          >''', '''        <div class="section-actions">
          <AppActionButton
            class="icon-action-button"
            icon="🧩"
            title="返回组卷"
            to="/teacher/papers"
          >
            返回组卷
          </AppActionButton>
          <AppActionButton
            class="icon-action-button"
            icon="🗓️"
            variant="primary"
            :disabled="creating || !canCreate"
            :title="creating ? '创建中...' : '创建考试'"
            @click="submitCreateExam"
          >''')
s=s.replace('''          <AppActionButton :disabled="loading" @click="loadData">''', '''          <AppActionButton class="icon-action-button" icon="↻" :disabled="loading" title="刷新考试列表" @click="loadData">''')
p.write_text(s, encoding='utf-8')

# Papers: move header nav actions into paper list card title and iconize.
p=Path('apps/mindmark-web/src/views/teacher/PapersView.vue')
s=p.read_text(encoding='utf-8')
s=s.replace('  <div class="page-shell papers-page">\n\n    <OperationNotice', '  <div class="page-shell papers-page">\n    <OperationNotice')
s=s.replace('''        <div class="section-title">
          <div>
            <h2>试卷列表</h2>
            <p class="muted-text">选择试卷后可查看结构并调整题目。</p>
          </div>
        </div>''', '''        <div class="section-title">
          <div>
            <h2>试卷列表</h2>
            <p class="muted-text">选择试卷后可查看结构并调整题目。</p>
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
p.write_text(s, encoding='utf-8')

# Grading: put score center entry into queue card title and iconize submit review.
p=Path('apps/mindmark-web/src/views/teacher/GradingView.vue')
s=p.read_text(encoding='utf-8')
s=s.replace('  <div class="page-shell grading-page">\n\n    <OperationNotice', '  <div class="page-shell grading-page">\n    <OperationNotice')
s=s.replace('''        <div class="section-title">
          <div>
            <h2>答卷队列</h2>
            <p class="muted-text">按提交时间进入批改任务池。</p>
          </div>
        </div>''', '''        <div class="section-title">
          <div>
            <h2>答卷队列</h2>
            <p class="muted-text">按提交时间进入批改任务池。</p>
          </div>
          <div class="section-actions">
            <AppActionButton
              class="icon-action-button"
              icon="📊"
              title="进入成绩中心"
              to="/teacher/scores"
            >
              成绩中心
            </AppActionButton>
          </div>
        </div>''')
s=s.replace('''          <AppActionButton
            variant="primary"
            :disabled="reviewing || selectedTask.status === 'REVIEWED'"
            @click="submitReview"
          >''', '''          <AppActionButton
            class="icon-action-button"
            icon="✓"
            variant="primary"
            :disabled="reviewing || selectedTask.status === 'REVIEWED'"
            :title="selectedTask.status === 'REVIEWED' ? '已复核' : reviewing ? '提交中...' : '提交复核'"
            @click="submitReview"
          >''')
p.write_text(s, encoding='utf-8')

# Scores: put grading center entry into exam list card title and iconize publish.
p=Path('apps/mindmark-web/src/views/teacher/ScoresView.vue')
s=p.read_text(encoding='utf-8')
s=s.replace('  <div class="page-shell scores-page">\n\n    <OperationNotice', '  <div class="page-shell scores-page">\n    <OperationNotice')
s=s.replace('''        <div class="section-title">
          <div>
            <h2>考试列表</h2>
            <p class="muted-text">选择考试后查看成绩汇总并发布。</p>
          </div>
        </div>''', '''        <div class="section-title">
          <div>
            <h2>考试列表</h2>
            <p class="muted-text">选择考试后查看成绩汇总并发布。</p>
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
            :disabled="publishing || selectedSummary.status === 'PUBLISHED'"
            @click="publish"
          >''', '''          <AppActionButton
            class="icon-action-button"
            icon="📣"
            variant="primary"
            :disabled="publishing || selectedSummary.status === 'PUBLISHED'"
            :title="publishing ? '发布中...' : selectedSummary.status === 'PUBLISHED' ? '已发布' : '发布成绩'"
            @click="publish"
          >''')
p.write_text(s, encoding='utf-8')

# Reviews: iconize refresh in first available section title.
p=Path('apps/mindmark-web/src/views/teacher/ReviewsView.vue')
s=p.read_text(encoding='utf-8')
s=s.replace('  <div class="page-shell review-page">\n\n    <OperationNotice', '  <div class="page-shell review-page">\n    <OperationNotice')
s=s.replace('''            <AppActionButton
              :disabled="securityLoading || !selectedReport"
              @click="loadSecurityEvents(selectedReport.examId)"
            >''', '''            <AppActionButton
              class="icon-action-button"
              icon="↻"
              :disabled="securityLoading || !selectedReport"
              title="刷新审计"
              @click="loadSecurityEvents(selectedReport.examId)"
            >''')
# if no main refresh left, add to report selector title if exact exists
s=s.replace('''        <div class="section-title">
          <div>
            <h2>考试选择</h2>
            <p class="muted-text">选择已发布成绩的考试查看复盘。</p>
          </div>
        </div>''', '''        <div class="section-title">
          <div>
            <h2>考试选择</h2>
            <p class="muted-text">选择已发布成绩的考试查看复盘。</p>
          </div>
          <div class="section-actions">
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
        </div>''')
p.write_text(s, encoding='utf-8')

# Student roster: move template download into import card actions.
p=Path('apps/mindmark-web/src/views/teacher/StudentRosterView.vue')
s=p.read_text(encoding='utf-8')
s=s.replace('  <div class="page-shell roster-page">\n\n    <PageSection', '  <div class="page-shell roster-page">\n    <PageSection')
s=s.replace('''      <template #actions>
        <span class="soft-tag">初始密码：学号后 6 位</span>
      </template>''', '''      <template #actions>
        <span class="soft-tag">初始密码：学号后 6 位</span>
        <AppActionButton
          class="icon-action-button"
          icon="⬇️"
          title="下载导入模板"
          @click="handleDownloadTemplate"
        >
          下载模板
        </AppActionButton>
      </template>''')
s=s.replace('''          <AppActionButton :disabled="loading || !selectedClass" @click="loadStudents">''', '''          <AppActionButton class="icon-action-button" icon="↻" :disabled="loading || !selectedClass" title="刷新学生名单" @click="loadStudents">''')
p.write_text(s, encoding='utf-8')

# Settings: move back action into profile summary.
p=Path('apps/mindmark-web/src/views/teacher/TeacherSettingsView.vue')
s=p.read_text(encoding='utf-8')
s=s.replace('  <div class="page-shell teacher-settings-page">\n\n    <section', '  <div class="page-shell teacher-settings-page">\n    <section')
s=s.replace('''      <StatusTag label="教师空间" tone="info" />''', '''      <div class="section-actions">
        <StatusTag label="教师空间" tone="info" />
        <AppActionButton
          class="icon-action-button"
          icon="←"
          title="返回 AI 出题审核"
          to="/teacher/ai-questions"
        >
          AI 出题审核
        </AppActionButton>
      </div>''')
s=s.replace('''        <AppActionButton
          variant="primary"
          :disabled="isSaving || isLoading || isTesting || !canSave"
          @click="saveSetting"
        >''', '''        <AppActionButton
          class="icon-action-button"
          icon="✓"
          variant="primary"
          :disabled="isSaving || isLoading || isTesting || !canSave"
          :title="isSaving ? '保存中...' : '保存配置'"
          @click="saveSetting"
        >''')
s=s.replace('''        <AppActionButton :disabled="isSaving || isLoading || isTesting" @click="testConnection">''', '''        <AppActionButton class="icon-action-button" icon="🔌" :disabled="isSaving || isLoading || isTesting" title="测试连接" @click="testConnection">''')
s=s.replace('''        <AppActionButton :disabled="isSaving || isLoading || isTesting" @click="resetToDefault">''', '''        <AppActionButton class="icon-action-button" icon="↺" :disabled="isSaving || isLoading || isTesting" title="恢复默认" @click="resetToDefault">''')
p.write_text(s, encoding='utf-8')
