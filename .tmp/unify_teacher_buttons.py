from pathlib import Path

# AI 出题审核：审核池与行内操作按钮统一为 emoji 标签式
p = Path('apps/mindmark-web/src/views/teacher/AiQuestionsView.vue')
s = p.read_text(encoding='utf-8')
s = s.replace(
"""          <AppActionButton :disabled=\"isLoading\" @click=\"loadDrafts\"> 刷新 </AppActionButton>
          <AppActionButton to=\"/teacher/questions\">编辑驳回题</AppActionButton>""",
"""          <AppActionButton
            class=\"icon-action-button\"
            icon=\"↻\"
            :disabled=\"isLoading\"
            :title=\"isLoading ? '刷新中...' : '刷新审核池'\"
            @click=\"loadDrafts\"
          >
            {{ isLoading ? '刷新中...' : '刷新' }}
          </AppActionButton>
          <AppActionButton
            class=\"icon-action-button\"
            icon=\"✏️\"
            title=\"编辑驳回题\"
            to=\"/teacher/questions\"
          >
            编辑驳回题
          </AppActionButton>""",
)
s = s.replace(
"""          <AppActionButton
            variant=\"primary\"
            :disabled=\"!canReview(draft) || reviewingId === draft.id\"
            @click=\"review(draft, 'ACCEPTED')\"
          >
            通过
          </AppActionButton>""",
"""          <AppActionButton
            class=\"icon-action-button\"
            icon=\"✅\"
            variant=\"primary\"
            :disabled=\"!canReview(draft) || reviewingId === draft.id\"
            title=\"通过审核\"
            @click=\"review(draft, 'ACCEPTED')\"
          >
            通过
          </AppActionButton>""",
)
s = s.replace(
"""          <AppActionButton
            :to=\"{
              path: '/teacher/questions',
              query: {
                edit: draft.id,
                keyword: draft.id,
                source: 'AI',
                status: draft.reviewStatus === 'REJECTED' ? 'REJECTED' : 'PENDING_REVIEW',
              },
            }\"
          >
            编辑题目
          </AppActionButton>""",
"""          <AppActionButton
            class=\"icon-action-button\"
            icon=\"✏️\"
            title=\"编辑题目\"
            :to=\"{
              path: '/teacher/questions',
              query: {
                edit: draft.id,
                keyword: draft.id,
                source: 'AI',
                status: draft.reviewStatus === 'REJECTED' ? 'REJECTED' : 'PENDING_REVIEW',
              },
            }\"
          >
            编辑题目
          </AppActionButton>""",
)
s = s.replace(
"""          <AppActionButton
            variant=\"danger\"
            :disabled=\"!canReview(draft) || reviewingId === draft.id\"
            @click=\"review(draft, 'REJECTED')\"
          >
            驳回
          </AppActionButton>""",
"""          <AppActionButton
            class=\"icon-action-button\"
            icon=\"↩\"
            variant=\"danger\"
            :disabled=\"!canReview(draft) || reviewingId === draft.id\"
            title=\"驳回题目\"
            @click=\"review(draft, 'REJECTED')\"
          >
            驳回
          </AppActionButton>""",
)
s = s.replace(
"""          <AppActionButton :disabled=\"isGenerating || !form.courseId\" @click=\"generate\">
            重新生成
          </AppActionButton>""",
"""          <AppActionButton
            class=\"icon-action-button\"
            icon=\"✨\"
            :disabled=\"isGenerating || !form.courseId\"
            :title=\"isGenerating ? '生成中...' : '重新生成'\"
            @click=\"generate\"
          >
            {{ isGenerating ? '生成中...' : '重新生成' }}
          </AppActionButton>""",
)
p.write_text(s, encoding='utf-8')

# 考试管理：错误重试与卡片入口按钮统一
p = Path('apps/mindmark-web/src/views/teacher/ExamsView.vue')
s = p.read_text(encoding='utf-8')
s = s.replace('<AppActionButton @click="loadData">重试</AppActionButton>', '<AppActionButton class="icon-action-button" icon="↻" title="重试" @click="loadData">重试</AppActionButton>')
s = s.replace('class="exam-entry-button" icon="↗"', 'class="exam-entry-button icon-action-button" icon="↗"')
s = s.replace('class="exam-entry-button" icon="📈"', 'class="exam-entry-button icon-action-button" icon="📈"')
p.write_text(s, encoding='utf-8')

# 批改中心/工作台：错误重试按钮统一
for file, needle in [('DashboardView.vue', 'loadDashboard'), ('GradingView.vue', 'loadTasks')]:
    p = Path('apps/mindmark-web/src/views/teacher') / file
    s = p.read_text(encoding='utf-8')
    s = s.replace(f'<AppActionButton @click="{needle}">重试</AppActionButton>', f'<AppActionButton class="icon-action-button" icon="↻" title="重试" @click="{needle}">重试</AppActionButton>')
    p.write_text(s, encoding='utf-8')

# 学生名单：导入、重置密码按钮统一
p = Path('apps/mindmark-web/src/views/teacher/StudentRosterView.vue')
s = p.read_text(encoding='utf-8')
s = s.replace(
"""        <AppActionButton variant=\"primary\" :disabled=\"importing || !selectedClass\" @click=\"handleImport\">
          {{ importing ? '导入中...' : '导入并创建账号' }}
        </AppActionButton>""",
"""        <AppActionButton
          class=\"icon-action-button\"
          icon=\"📥\"
          variant=\"primary\"
          :disabled=\"importing || !selectedClass\"
          :title=\"importing ? '导入中...' : '导入并创建账号'\"
          @click=\"handleImport\"
        >
          {{ importing ? '导入中...' : '导入并创建账号' }}
        </AppActionButton>""",
)
s = s.replace(
"""            <AppActionButton :disabled=\"resettingStudentId === student.id\" @click=\"handleResetPassword(student)\">
              {{ resettingStudentId === student.id ? '重置中...' : '重置密码' }}
            </AppActionButton>""",
"""            <AppActionButton
              class=\"icon-action-button\"
              icon=\"🔑\"
              :disabled=\"resettingStudentId === student.id\"
              :title=\"resettingStudentId === student.id ? '重置中...' : '重置密码'\"
              @click=\"handleResetPassword(student)\"
            >
              {{ resettingStudentId === student.id ? '重置中...' : '重置密码' }}
            </AppActionButton>""",
)
p.write_text(s, encoding='utf-8')

# 个人配置：保存按钮统一
p = Path('apps/mindmark-web/src/views/teacher/TeacherSettingsView.vue')
s = p.read_text(encoding='utf-8')
s = s.replace(
"""        <AppActionButton variant=\"primary\" :disabled=\"isSaving || isLoading || isTesting\" @click=\"saveSetting\">
          {{ isSaving ? '保存中...' : `保存 ${selectedOption.label} 配置` }}
        </AppActionButton>""",
"""        <AppActionButton
          class=\"icon-action-button\"
          icon=\"💾\"
          variant=\"primary\"
          :disabled=\"isSaving || isLoading || isTesting\"
          :title=\"isSaving ? '保存中...' : `保存 ${selectedOption.label} 配置`\"
          @click=\"saveSetting\"
        >
          {{ isSaving ? '保存中...' : `保存 ${selectedOption.label} 配置` }}
        </AppActionButton>""",
)
p.write_text(s, encoding='utf-8')
