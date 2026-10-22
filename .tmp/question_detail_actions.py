from pathlib import Path
path = Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
text = path.read_text(encoding='utf-8')
old = '''      <template #extra>
        <ASpace v-if="selectedQuestion && !isEditorMode">
          <AButton size="small" @click="openEdit(selectedQuestion)">编辑</AButton>
          <AButton size="small" type="primary" @click="openCompose(selectedQuestion)"
            >加入试卷</AButton
          >
        </ASpace>
      </template>'''
new = '''      <template #extra>
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
if old not in text:
    raise SystemExit('detail actions block not found')
text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
