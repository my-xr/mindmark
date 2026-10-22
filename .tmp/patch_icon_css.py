from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
s=p.read_text(encoding='utf-8')
s=s.replace('''.icon-action-button__emoji {
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
''', '''.icon-action-button :deep(.app-action-button__icon) {
  width: 18px;
  flex: 0 0 18px;
  font-size: 0.9rem;
}

.icon-action-button :deep(.app-action-button__label) {
  display: inline-block;
  max-width: 0;
  overflow: hidden;
  opacity: 0;
  transition:
    max-width 160ms ease,
    opacity 120ms ease;
}

.icon-action-button:hover :deep(.app-action-button__label),
.icon-action-button:focus-visible :deep(.app-action-button__label) {
  max-width: 8em;
  opacity: 1;
}
''')
p.write_text(s, encoding='utf-8')
