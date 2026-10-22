from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
text=p.read_text(encoding='utf-8')
old='''.question-filter-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.question-table-card {
  padding: 0;
  overflow: hidden;
}'''
new='''.question-filter-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.icon-action-button {
  width: 34px;
  min-width: 34px;
  min-height: 34px;
  gap: 0;
  padding-inline: 0;
  overflow: hidden;
  white-space: nowrap;
  transition:
    width 160ms ease,
    padding 160ms ease,
    border-color 160ms ease,
    background 160ms ease;
}

.icon-action-button:hover,
.icon-action-button:focus-visible {
  width: auto;
  gap: 6px;
  padding-inline: 10px;
}

.icon-action-button__emoji {
  display: inline-grid;
  width: 18px;
  flex: 0 0 18px;
  place-items: center;
  font-size: 0.9rem;
  line-height: 1;
}

.icon-action-button__label {
  display: inline-block;
  max-width: 0;
  overflow: hidden;
  opacity: 0;
  transition:
    max-width 160ms ease,
    opacity 120ms ease;
}

.icon-action-button:hover .icon-action-button__label,
.icon-action-button:focus-visible .icon-action-button__label {
  max-width: 8em;
  opacity: 1;
}

.question-table-card {
  display: grid;
  gap: 12px;
  padding: 16px;
  overflow: hidden;
}'''
if old not in text: raise SystemExit('block 1 not found')
text=text.replace(old,new)
p.write_text(text,encoding='utf-8')
