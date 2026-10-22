from pathlib import Path
path = Path('apps/mindmark-web/src/styles/visual-alignment.css')
append = r'''

/* 2026-07-22: Compose assistant form control polish. */
.papers-page .compose-toolbar--refined input,
.papers-page .compose-toolbar--refined select,
.papers-page .compose-rule-grid--refined input[type='number'],
.papers-page .compose-rule-grid--refined input[type='text'] {
  min-height: 36px;
  padding: 0 12px;
  color: var(--mm-color-text);
  font-size: 13px;
  background:
    linear-gradient(180deg, rgb(255 255 255 / 52%), transparent),
    color-mix(in srgb, var(--mm-color-bg) 54%, var(--mm-color-card));
  border: 1px solid color-mix(in srgb, var(--mm-color-border) 88%, transparent);
  border-radius: 7px;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 45%);
  transition:
    border-color 140ms ease,
    box-shadow 140ms ease,
    background 140ms ease;
}

[data-theme='dark'] .papers-page .compose-toolbar--refined input,
[data-theme='dark'] .papers-page .compose-toolbar--refined select,
[data-theme='dark'] .papers-page .compose-rule-grid--refined input[type='number'],
[data-theme='dark'] .papers-page .compose-rule-grid--refined input[type='text'] {
  background: color-mix(in srgb, var(--mm-color-bg) 62%, var(--mm-color-card));
  box-shadow: none;
}

.papers-page .compose-toolbar--refined select {
  padding-right: 32px;
  appearance: none;
  background-image:
    linear-gradient(45deg, transparent 50%, var(--mm-color-text-tertiary) 50%),
    linear-gradient(135deg, var(--mm-color-text-tertiary) 50%, transparent 50%),
    linear-gradient(180deg, rgb(255 255 255 / 52%), transparent);
  background-position:
    calc(100% - 16px) 50%,
    calc(100% - 11px) 50%,
    0 0;
  background-size:
    5px 5px,
    5px 5px,
    100% 100%;
  background-repeat: no-repeat;
}

.papers-page .compose-toolbar--refined input:hover,
.papers-page .compose-toolbar--refined select:hover,
.papers-page .compose-rule-grid--refined input[type='number']:hover,
.papers-page .compose-rule-grid--refined input[type='text']:hover {
  border-color: color-mix(in srgb, var(--mm-color-primary) 24%, var(--mm-color-border));
  background-color: var(--mm-color-card);
}

.papers-page .compose-toolbar--refined input:focus,
.papers-page .compose-toolbar--refined select:focus,
.papers-page .compose-rule-grid--refined input[type='number']:focus,
.papers-page .compose-rule-grid--refined input[type='text']:focus {
  border-color: color-mix(in srgb, var(--mm-color-primary) 56%, var(--mm-color-border));
  box-shadow:
    0 0 0 2px color-mix(in srgb, var(--mm-color-primary) 10%, transparent),
    inset 0 1px 0 rgb(255 255 255 / 46%);
}

.papers-page .compose-rule-grid--refined .compose-rule-field-grid {
  gap: 8px;
  padding: 8px;
  background: color-mix(in srgb, var(--mm-color-bg) 58%, var(--mm-color-card));
  border: 1px solid color-mix(in srgb, var(--mm-color-border) 76%, transparent);
  border-radius: 8px;
}

.papers-page .compose-rule-grid--refined .compose-rule-field-grid label {
  gap: 6px;
}

.papers-page .compose-rule-grid--refined .compose-rule-field-grid label span,
.papers-page .compose-rule-grid--refined .compose-rule-knowledge-field > span {
  color: var(--mm-color-text-tertiary);
  font-size: 11px;
  letter-spacing: 0.01em;
}

.papers-page .compose-rule-grid--refined .compose-rule-knowledge-field {
  gap: 6px;
  padding: 8px;
  background: color-mix(in srgb, var(--mm-color-bg) 50%, var(--mm-color-card));
  border: 1px solid color-mix(in srgb, var(--mm-color-border) 74%, transparent);
  border-radius: 8px;
}

.papers-page .compose-rule-grid--refined .compose-difficulty-list {
  gap: 7px;
  padding: 8px;
  background: color-mix(in srgb, var(--mm-color-bg) 46%, var(--mm-color-card));
  border: 1px solid color-mix(in srgb, var(--mm-color-border) 72%, transparent);
  border-radius: 8px;
}

.papers-page .compose-rule-grid--refined .compose-difficulty-list label {
  position: relative;
  display: inline-flex;
  min-height: auto;
  padding: 0;
  overflow: visible;
  color: inherit;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 0;
}

.papers-page .compose-rule-grid--refined .compose-difficulty-list input[type='checkbox'] {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 0;
  margin: 0;
  cursor: pointer;
  opacity: 0;
}

.papers-page .compose-rule-grid--refined .compose-difficulty-list span {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  color: var(--mm-color-text-secondary);
  font-size: 12px;
  line-height: 1;
  background: var(--mm-color-card);
  border: 1px solid color-mix(in srgb, var(--mm-color-border) 86%, transparent);
  border-radius: 7px;
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
  transition:
    color 140ms ease,
    border-color 140ms ease,
    background 140ms ease,
    box-shadow 140ms ease,
    transform 140ms ease;
}

.papers-page .compose-rule-grid--refined .compose-difficulty-list span::before {
  display: inline-grid;
  width: 12px;
  height: 12px;
  place-items: center;
  color: transparent;
  font-size: 9px;
  line-height: 1;
  border: 1px solid color-mix(in srgb, var(--mm-color-border) 90%, transparent);
  border-radius: 4px;
  content: '✓';
}

.papers-page .compose-rule-grid--refined .compose-difficulty-list label:hover span {
  color: var(--mm-color-primary);
  border-color: color-mix(in srgb, var(--mm-color-primary) 28%, var(--mm-color-border));
  transform: translateY(-1px);
}

.papers-page .compose-rule-grid--refined .compose-difficulty-list input[type='checkbox']:focus-visible + span {
  border-color: color-mix(in srgb, var(--mm-color-primary) 48%, var(--mm-color-border));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--mm-color-primary) 11%, transparent);
}

.papers-page .compose-rule-grid--refined .compose-difficulty-list input[type='checkbox']:checked + span {
  color: var(--mm-color-primary);
  background: color-mix(in srgb, var(--mm-color-primary) 9%, var(--mm-color-card));
  border-color: color-mix(in srgb, var(--mm-color-primary) 28%, var(--mm-color-border));
  box-shadow: 0 5px 12px color-mix(in srgb, var(--mm-color-primary) 8%, transparent);
}

.papers-page .compose-rule-grid--refined .compose-difficulty-list input[type='checkbox']:checked + span::before {
  color: #fff;
  background: var(--mm-color-primary);
  border-color: var(--mm-color-primary);
}
'''
path.write_text(path.read_text(encoding='utf-8') + append, encoding='utf-8')
