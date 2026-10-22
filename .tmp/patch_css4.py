from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
text=p.read_text(encoding='utf-8')
start=text.index('.question-edit-stack,')
end=text.index('.structured-empty {', start)
new='''.question-edit-stack,
.compose-drawer-body,
.question-edit-sections {
  display: grid;
  gap: 14px;
}

.question-edit-hint {
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, var(--mm-color-primary) 16%, var(--mm-color-border));
  border-radius: var(--radius-sm);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--mm-color-primary) 5%, var(--mm-color-card)),
    var(--mm-color-card)
  );
}

.question-edit-hint strong {
  color: var(--mm-color-text-primary);
  font-size: 0.9rem;
  font-weight: 650;
}

.question-edit-hint span {
  color: var(--mm-color-text-secondary);
  font-size: 0.8rem;
}

.question-edit-section {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--mm-color-border);
  border-radius: var(--radius-sm);
  background: var(--mm-color-card);
  box-shadow: 0 8px 18px rgb(15 23 42 / 3.5%);
}

.question-edit-section__head {
  display: grid;
  gap: 3px;
}

.question-edit-section__head strong {
  color: var(--mm-color-text-primary);
  font-size: 0.86rem;
  font-weight: 650;
}

.question-edit-section__head span {
  color: var(--mm-color-text-secondary);
  font-size: 0.78rem;
  line-height: 1.45;
}

.question-edit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.question-edit-grid--meta {
  grid-template-columns: minmax(220px, 1.4fr) repeat(3, minmax(120px, 0.7fr));
}

.question-title-textarea {
  min-height: 132px;
}

.question-drawer-actions {
  position: sticky;
  bottom: -18px;
  z-index: 2;
  justify-content: flex-end;
  padding: 12px 0 0;
  background: linear-gradient(
    to top,
    color-mix(in srgb, var(--mm-color-background) 96%, transparent),
    color-mix(in srgb, var(--mm-color-background) 72%, transparent),
    transparent
  );
}

.structured-editor {
  display: grid;
  gap: var(--space-2);
}

.structured-editor__header,
.option-editor-row,
.scoring-editor-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.structured-editor__header {
  justify-content: space-between;
}

.structured-editor__header .question-edit-section__head {
  min-width: 0;
}

'''
text=text[:start]+new+text[end:]
text=text.replace('''  .question-edit-grid {
    grid-template-columns: 1fr;
  }''','''  .question-edit-grid,
  .question-edit-grid--meta {
    grid-template-columns: 1fr;
  }''')
p.write_text(text,encoding='utf-8')
