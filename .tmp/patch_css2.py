from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
text=p.read_text(encoding='utf-8')
old='''.question-table-toolbar,
.compose-summary,
.question-drawer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.question-table-toolbar {
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--mm-color-border);
}

.question-table-toolbar > div,
.compose-summary {
  display: grid;
  gap: 2px;
}

.question-table-toolbar strong {
  color: var(--mm-color-text-primary);
  font-size: 0.95rem;
  font-weight: 650;
}'''
new='''.compose-summary,
.question-drawer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.question-table-title {
  padding-bottom: 10px;
  margin-bottom: 0;
  border-bottom: 1px solid var(--mm-color-border);
}

.question-table-title .muted-text {
  margin: 4px 0 0;
}

.compose-summary {
  display: grid;
  gap: 2px;
}'''
if old not in text: raise SystemExit('toolbar css block not found')
text=text.replace(old,new)
p.write_text(text,encoding='utf-8')
