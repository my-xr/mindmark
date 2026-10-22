from pathlib import Path
path = Path('apps/mindmark-web/src/styles/visual-alignment.css')
append = r'''

/* 2026-07-22: Compose assistant visual refinement on paper editor. */
.papers-page .compose-assistant-card--refined {
  gap: 16px;
  padding: 18px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgb(255 255 255 / 78%), transparent),
    color-mix(in srgb, var(--mm-color-primary) 3%, var(--mm-color-card));
  border-color: color-mix(in srgb, var(--mm-color-primary) 14%, var(--mm-color-border));
  box-shadow: 0 12px 28px rgb(15 23 42 / 5%);
}

[data-theme='dark'] .papers-page .compose-assistant-card--refined {
  background:
    linear-gradient(180deg, rgb(255 255 255 / 3%), transparent),
    color-mix(in srgb, var(--mm-color-primary) 8%, var(--mm-color-card));
  box-shadow: none;
}

.papers-page .compose-assistant-header--refined {
  align-items: center;
}

.papers-page .compose-assistant-title {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.papers-page .compose-assistant-title h3 {
  margin-bottom: 3px;
  font-size: 15px;
  letter-spacing: 0.01em;
}

.papers-page .compose-assistant-title .muted-text {
  max-width: 760px;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.papers-page .compose-assistant-icon {
  display: inline-grid;
  width: 34px;
  height: 34px;
  place-items: center;
  color: var(--mm-color-primary);
  font-size: 16px;
  background: color-mix(in srgb, var(--mm-color-primary) 9%, var(--mm-color-card));
  border: 1px solid color-mix(in srgb, var(--mm-color-primary) 18%, var(--mm-color-border));
  border-radius: 9px;
}

.papers-page .compose-assistant-status {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
}

.papers-page .compose-status-pill {
  display: inline-flex;
  min-height: 26px;
  align-items: center;
  padding: 0 10px;
  color: var(--mm-color-success);
  font-size: 12px;
  font-weight: 650;
  background: color-mix(in srgb, var(--mm-color-success) 10%, var(--mm-color-card));
  border: 1px solid color-mix(in srgb, var(--mm-color-success) 22%, var(--mm-color-border));
  border-radius: 999px;
}

.papers-page .compose-status-pill--warning {
  color: var(--mm-color-warning);
  background: color-mix(in srgb, var(--mm-color-warning) 10%, var(--mm-color-card));
  border-color: color-mix(in srgb, var(--mm-color-warning) 24%, var(--mm-color-border));
}

.papers-page .compose-step-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  background: color-mix(in srgb, var(--mm-color-bg) 74%, var(--mm-color-card));
  border: 1px solid color-mix(in srgb, var(--mm-color-border) 80%, transparent);
  border-radius: 8px;
}

.papers-page .compose-step-strip__item {
  display: inline-flex;
  min-height: 26px;
  align-items: center;
  padding: 0 10px;
  color: var(--mm-color-text-secondary);
  font-size: 12px;
  background: var(--mm-color-card);
  border: 1px solid color-mix(in srgb, var(--mm-color-border) 86%, transparent);
  border-radius: 999px;
}

.papers-page .compose-step-strip__item--active {
  color: var(--mm-color-primary);
  background: color-mix(in srgb, var(--mm-color-primary) 8%, var(--mm-color-card));
  border-color: color-mix(in srgb, var(--mm-color-primary) 20%, var(--mm-color-border));
}

.papers-page .compose-command-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: stretch;
}

.papers-page .compose-toolbar--refined {
  grid-template-columns: minmax(128px, 0.8fr) minmax(176px, 1fr) minmax(220px, 1.15fr);
  padding: 12px;
  background: var(--mm-color-card);
  border-radius: 8px;
}

.papers-page .compose-toolbar--refined label span {
  color: var(--mm-color-text-secondary);
  font-weight: 650;
}

.papers-page .compose-score-preview--refined {
  min-height: 54px;
  padding: 9px 10px;
  background: color-mix(in srgb, var(--mm-color-bg) 70%, var(--mm-color-card));
  border: 1px solid color-mix(in srgb, var(--mm-color-border) 82%, transparent);
  border-radius: 7px;
}

.papers-page .compose-score-preview--refined strong {
  font-size: 16px;
}

.papers-page .compose-score-preview--refined small {
  overflow: hidden;
  color: var(--mm-color-text-tertiary);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.papers-page .compose-score-preview--warning {
  background: color-mix(in srgb, var(--mm-color-warning) 8%, var(--mm-color-card));
  border-color: color-mix(in srgb, var(--mm-color-warning) 22%, var(--mm-color-border));
}

.papers-page .compose-actions-strip {
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
  min-width: 116px;
  padding: 12px;
  background: color-mix(in srgb, var(--mm-color-bg) 70%, var(--mm-color-card));
  border: 1px solid color-mix(in srgb, var(--mm-color-border) 80%, transparent);
  border-radius: 8px;
}

.papers-page .compose-actions-strip .icon-action-button {
  width: 100%;
}

.papers-page .compose-rule-grid--refined {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.papers-page .compose-rule-grid--refined .compose-rule-card {
  position: relative;
  gap: 11px;
  padding: 13px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--mm-color-bg) 42%, transparent), transparent),
    var(--mm-color-card);
  border-color: color-mix(in srgb, var(--mm-color-border) 82%, transparent);
  border-radius: 8px;
}

.papers-page .compose-rule-grid--refined .compose-rule-card::before {
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: color-mix(in srgb, var(--mm-color-primary) 34%, transparent);
  border-radius: 8px 0 0 8px;
  content: '';
}

.papers-page .compose-rule-grid--refined .compose-type-cell strong {
  font-size: 14px;
}

.papers-page .compose-rule-grid--refined .compose-rule-subtotal {
  color: var(--mm-color-primary);
  background: color-mix(in srgb, var(--mm-color-primary) 7%, var(--mm-color-card));
  border-radius: 7px;
}

.papers-page .compose-rule-grid--refined .compose-rule-field-grid label,
.papers-page .compose-rule-grid--refined .compose-rule-knowledge-field {
  color: var(--mm-color-text-secondary);
  font-size: 12px;
  font-weight: 650;
}

.papers-page .compose-rule-grid--refined .compose-difficulty-list label {
  border-radius: 7px;
}

.papers-page .compose-quality-panel--refined {
  border-color: color-mix(in srgb, var(--mm-color-primary) 12%, var(--mm-color-border));
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 35%);
}

@media (width <= 1320px) {
  .papers-page .compose-command-panel {
    grid-template-columns: minmax(0, 1fr);
  }

  .papers-page .compose-actions-strip {
    flex-direction: row;
    justify-content: flex-end;
  }

  .papers-page .compose-actions-strip .icon-action-button {
    width: auto;
  }

  .papers-page .compose-rule-grid--refined {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 860px) {
  .papers-page .compose-assistant-header--refined,
  .papers-page .compose-assistant-status,
  .papers-page .compose-actions-strip {
    align-items: stretch;
    justify-content: flex-start;
  }

  .papers-page .compose-assistant-header--refined,
  .papers-page .compose-assistant-status {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }

  .papers-page .compose-assistant-title .muted-text {
    white-space: normal;
  }

  .papers-page .compose-actions-strip,
  .papers-page .compose-toolbar--refined,
  .papers-page .compose-rule-grid--refined {
    grid-template-columns: minmax(0, 1fr);
  }

  .papers-page .compose-actions-strip {
    flex-direction: column;
  }

  .papers-page .compose-actions-strip .icon-action-button {
    width: 100%;
  }
}
'''
path.write_text(path.read_text(encoding='utf-8') + append, encoding='utf-8')
