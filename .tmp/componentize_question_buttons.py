from pathlib import Path
path = Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
text = path.read_text(encoding='utf-8')
text = text.replace("import EmptyState from '@/components/common/EmptyState.vue';\n", "import AppActionButton from '@/components/common/AppActionButton.vue';\nimport EmptyState from '@/components/common/EmptyState.vue';\n", 1)
repls = {}
old = '''      <template #extra>
        <ASpace v-if="selectedQuestion && !isEditorMode" class="question-detail-actions" :size="10">
          <AButton
            class="question-detail-action question-detail-action--edit"
            size="small"
            @click="openEdit(selectedQuestion)"
          >
            <span class="question-detail-action__icon">✎</span>
            <span>编辑题目</span>
          </AButton>
          <AButton
            class="question-detail-action question-detail-action--compose"
            size="small"
            type="primary"
            @click="openCompose(selectedQuestion)"
          >
            <span class="question-detail-action__icon">＋</span>
            <span>加入试卷</span>
          </AButton>
        </ASpace>
      </template>'''
new = '''      <template #extra>
        <ASpace v-if="selectedQuestion && !isEditorMode" class="question-detail-actions" :size="10">
          <AppActionButton icon="✎" size="sm" @click="openEdit(selectedQuestion)">
            编辑题目
          </AppActionButton>
          <AppActionButton
            icon="＋"
            size="sm"
            variant="primary"
            @click="openCompose(selectedQuestion)"
          >
            加入试卷
          </AppActionButton>
        </ASpace>
      </template>'''
if old not in text:
    raise SystemExit('detail block not found')
text = text.replace(old, new, 1)
old = '''              <button
                class="secondary-button compact-button tag-action-button tag-action-button--add"
                type="button"
                aria-label="新增选项"
                title="新增选项"
                @click="addOption"
              >
                <span class="tag-action-button__tag">＋选项</span>
              </button>'''
new = '''              <AppActionButton
                aria-label="新增选项"
                title="新增选项"
                variant="tag"
                @click="addOption"
              >
                ＋选项
              </AppActionButton>'''
if old not in text:
    raise SystemExit('add option block not found')
text = text.replace(old, new, 1)
old = '''              <button
                class="secondary-button compact-button tag-action-button tag-action-button--danger"
                type="button"
                aria-label="删除选项"
                title="删除选项"
                @click="removeOption(index)"
              >
                <span class="tag-action-button__tag">🗑</span>
              </button>'''
new = '''              <AppActionButton
                aria-label="删除选项"
                icon="🗑"
                icon-only
                title="删除选项"
                variant="tag-danger"
                @click="removeOption(index)"
              />'''
if old not in text:
    raise SystemExit('remove option block not found')
text = text.replace(old, new, 1)
old = '''              <button
                class="secondary-button compact-button tag-action-button tag-action-button--add"
                type="button"
                aria-label="新增评分点"
                title="新增评分点"
                @click="addScoringPoint"
              >
                <span class="tag-action-button__tag">＋评分点</span>
              </button>'''
new = '''              <AppActionButton
                aria-label="新增评分点"
                title="新增评分点"
                variant="tag"
                @click="addScoringPoint"
              >
                ＋评分点
              </AppActionButton>'''
if old not in text:
    raise SystemExit('add scoring block not found')
text = text.replace(old, new, 1)
old = '''              <button
                class="secondary-button compact-button tag-action-button tag-action-button--danger"
                type="button"
                aria-label="删除评分点"
                title="删除评分点"
                @click="removeScoringPoint(index)"
              >
                <span class="tag-action-button__tag">🗑</span>
              </button>'''
new = '''              <AppActionButton
                aria-label="删除评分点"
                icon="🗑"
                icon-only
                title="删除评分点"
                variant="tag-danger"
                @click="removeScoringPoint(index)"
              />'''
if old not in text:
    raise SystemExit('remove scoring block not found')
text = text.replace(old, new, 1)
old = '''        <div class="question-drawer-actions question-editor-actions">
          <button
            class="secondary-button question-editor-action question-editor-action--cancel"
            type="button"
            @click="closeEdit"
          >
            <span class="question-editor-action__icon">↩</span>
            <span>取消</span>
          </button>
          <button
            class="primary-button question-editor-action question-editor-action--save"
            type="button"
            :disabled="editSaving"
            @click="saveEdit"
          >
            <span class="question-editor-action__icon">{{ editSaving ? '⏳' : '✓' }}</span>
            <span>{{
              editSaving ? '保存中...' : isCreatingQuestion ? '创建题目' : '保存题目'
            }}</span>
          </button>
        </div>'''
new = '''        <div class="question-drawer-actions question-editor-actions">
          <AppActionButton icon="↩" @click="closeEdit">取消</AppActionButton>
          <AppActionButton :loading="editSaving" icon="✓" variant="primary" @click="saveEdit">
            {{ editSaving ? '保存中...' : isCreatingQuestion ? '创建题目' : '保存题目' }}
          </AppActionButton>
        </div>'''
if old not in text:
    raise SystemExit('editor actions block not found')
text = text.replace(old, new, 1)
old = '''          <div class="question-drawer-actions question-editor-actions question-compose-actions">
            <RouterLink
              class="secondary-button question-editor-action question-editor-action--cancel question-compose-action"
              to="/teacher/papers"
            >
              <span class="question-editor-action__icon">↗</span>
              <span>试卷管理</span>
            </RouterLink>
            <button
              class="primary-button question-editor-action question-editor-action--save question-compose-action"
              type="button"
              :disabled="composingSaving || !selectedPaperId"
              @click="confirmCompose"
            >
              <span class="question-editor-action__icon">{{ composingSaving ? '⏳' : '＋' }}</span>
              <span>{{ composingSaving ? '加入中...' : '确认加入' }}</span>
            </button>
          </div>'''
new = '''          <div class="question-drawer-actions question-editor-actions question-compose-actions">
            <AppActionButton icon="↗" to="/teacher/papers">试卷管理</AppActionButton>
            <AppActionButton
              :disabled="!selectedPaperId"
              :loading="composingSaving"
              icon="＋"
              variant="primary"
              @click="confirmCompose"
            >
              {{ composingSaving ? '加入中...' : '确认加入' }}
            </AppActionButton>
          </div>'''
if old not in text:
    raise SystemExit('compose actions block not found')
text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
