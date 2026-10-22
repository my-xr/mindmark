from pathlib import Path
path = Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
text = path.read_text(encoding='utf-8')
old = '''        <div class="question-drawer-actions">
          <button class="secondary-button" type="button" @click="closeEdit">取消</button>
          <button class="primary-button" type="button" :disabled="editSaving" @click="saveEdit">
            {{ editSaving ? '保存中...' : isCreatingQuestion ? '创建题目' : '保存题目' }}
          </button>
        </div>'''
new = '''        <div class="question-drawer-actions question-editor-actions">
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
            <span>{{ editSaving ? '保存中...' : isCreatingQuestion ? '创建题目' : '保存题目' }}</span>
          </button>
        </div>'''
if old not in text:
    raise SystemExit('drawer actions block not found')
text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
