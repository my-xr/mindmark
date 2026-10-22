from pathlib import Path
p=Path('apps/mindmark-web/src/styles/visual-alignment.css')
s=p.read_text(encoding='utf-8')
marker='\n/* 2026-07-22: Compose assistant form control polish. */\n'
idx=s.find(marker)
if idx!=-1:
    s=s[:idx]
append=r'''

/* 2026-07-22: Compose assistant common form component layout. */
.papers-page .compose-toolbar--refined .app-form-control,
.papers-page .compose-rule-grid--refined .app-form-control,
.papers-page .compose-rule-grid--refined .app-choice-chips {
  min-width: 0;
}

.papers-page .compose-rule-grid--refined .compose-rule-field-grid {
  gap: 8px;
  padding: 8px;
  background: color-mix(in srgb, var(--mm-color-bg) 58%, var(--mm-color-card));
  border: 1px solid color-mix(in srgb, var(--mm-color-border) 76%, transparent);
  border-radius: 8px;
}

.papers-page .compose-rule-grid--refined .compose-rule-knowledge-field {
  padding: 8px;
  background: color-mix(in srgb, var(--mm-color-bg) 50%, var(--mm-color-card));
  border: 1px solid color-mix(in srgb, var(--mm-color-border) 74%, transparent);
  border-radius: 8px;
}
'''
p.write_text(s+append, encoding='utf-8')
