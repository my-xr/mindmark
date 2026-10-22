from pathlib import Path
path = Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
text = path.read_text(encoding='utf-8')
text = text.replace(':width="880"', ':width="960"', 1)
start = text.index('.question-edit-stack,')
end = text.index('.loading-text {', start)
new_css = r'''.question-edit-stack,
.compose-drawer-body,
.question-edit-sections {
  display: grid;
  gap: 16px;
}

.question-detail-drawer :deep(.ant-drawer-title) {
  color: var(--mm-color-text-primary);
  font-size: 0.96rem;
  font-weight: 650;
  letter-spacing: -0.01em;
}

.question-edit-stack {
  --edit-accent: color-mix(in srgb, var(--mm-color-primary) 78%, #7c3aed);
}

.question-edit-hero {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 16px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--mm-color-primary) 14%, var(--mm-color-border));
  border-radius: var(--radius-sm);
  background:
    radial-gradient(circle at 0 0, color-mix(in srgb, var(--mm-color-primary) 10%, transparent), transparent 34%),
    linear-gradient(135deg, color-mix(in srgb, var(--mm-color-primary) 5%, var(--mm-color-card)), var(--mm-color-card));
  box-shadow: 0 10px 28px rgb(15 23 42 / 5%);
}

.question-edit-hero::after {
  position: absolute;
  right: 18px;
  bottom: -36px;
  width: 120px;
  height: 120px;
  border: 1px solid color-mix(in srgb, var(--mm-color-primary) 12%, transparent);
  border-radius: 999px;
  content: '';
}

.question-edit-hero__icon {
  display: inline-grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 1rem;
  background: linear-gradient(135deg, var(--edit-accent), color-mix(in srgb, var(--mm-color-primary) 48%, #0f172a));
  box-shadow: 0 10px 20px color-mix(in srgb, var(--mm-color-primary) 18%, transparent);
}

.question-edit-hero__content {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.question-edit-hero__eyebrow {
  color: var(--mm-color-primary);
  font-size: 0.68rem;
  font-weight: 720;
  letter-spacing: 0.12em;
}

.question-edit-hero__content strong {
  color: var(--mm-color-text-primary);
  font-size: 1rem;
  font-weight: 680;
  letter-spacing: -0.01em;
}

.question-edit-hero__content p {
  max-width: 600px;
  margin: 0;
  color: var(--mm-color-text-secondary);
  font-size: 0.8rem;
  line-height: 1.55;
}

.question-edit-hero__meta {
  position: relative;
  z-index: 1;
  display: flex;
  max-width: 260px;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.question-edit-hero__meta span {
  max-width: 180px;
  padding: 5px 8px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--mm-color-primary) 14%, var(--mm-color-border));
  border-radius: 999px;
  color: var(--mm-color-text-secondary);
  font-size: 0.74rem;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: color-mix(in srgb, var(--mm-color-card) 82%, transparent);
}

.question-edit-section {
  position: relative;
  display: grid;
  gap: 14px;
  padding: 16px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--mm-color-border) 84%, transparent);
  border-radius: var(--radius-sm);
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--mm-color-primary) 3%, transparent), transparent 24%),
    var(--mm-color-card);
  box-shadow: 0 10px 24px rgb(15 23 42 / 4%);
}

.question-edit-section::before {
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: linear-gradient(180deg, var(--edit-accent), color-mix(in srgb, var(--mm-color-primary) 18%, transparent));
  content: '';
  opacity: 0.72;
}

.question-edit-section__head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 10px;
}

.question-edit-section__index {
  display: inline-grid;
  min-width: 30px;
  height: 24px;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--mm-color-primary) 18%, var(--mm-color-border));
  border-radius: var(--radius-xs);
  color: var(--mm-color-primary);
  font-size: 0.7rem;
  font-weight: 760;
  line-height: 1;
  background: color-mix(in srgb, var(--mm-color-primary) 7%, var(--mm-color-card));
}

.question-edit-section__head > div {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.question-edit-section__head strong {
  color: var(--mm-color-text-primary);
  font-size: 0.88rem;
  font-weight: 680;
  letter-spacing: -0.01em;
}

.question-edit-section__head span:not(.question-edit-section__index) {
  color: var(--mm-color-text-secondary);
  font-size: 0.77rem;
  line-height: 1.45;
}

.question-edit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.question-edit-grid--meta {
  grid-template-columns: minmax(240px, 1.5fr) repeat(3, minmax(120px, 0.7fr));
}

.question-edit-stack .form-field {
  gap: 6px;
  color: var(--mm-color-text-secondary);
  font-size: 0.76rem;
  font-weight: 650;
}

.question-edit-stack .text-input,
.question-edit-stack .select-input,
.question-edit-stack .textarea-input {
  min-height: 36px;
  border-color: color-mix(in srgb, var(--mm-color-border) 86%, transparent);
  border-radius: var(--radius-xs);
  background: color-mix(in srgb, var(--mm-color-card) 92%, var(--mm-color-background));
  transition:
    border-color 140ms ease,
    box-shadow 140ms ease,
    background 140ms ease;
}

.question-edit-stack .text-input:hover,
.question-edit-stack .select-input:hover,
.question-edit-stack .textarea-input:hover {
  border-color: color-mix(in srgb, var(--mm-color-primary) 24%, var(--mm-color-border));
  background: var(--mm-color-card);
}

.question-title-textarea {
  min-height: 136px;
}

.question-drawer-actions {
  position: sticky;
  bottom: -18px;
  z-index: 2;
  justify-content: flex-end;
  padding: 14px 0 0;
  background: linear-gradient(
    to top,
    color-mix(in srgb, var(--mm-color-background) 98%, transparent),
    color-mix(in srgb, var(--mm-color-background) 84%, transparent),
    transparent
  );
}

.question-drawer-actions .secondary-button,
.question-drawer-actions .primary-button {
  min-width: 96px;
}

.structured-editor {
  display: grid;
  gap: 10px;
}

.structured-editor__header,
.option-editor-row,
.scoring-editor-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.structured-editor__header {
  justify-content: space-between;
}

.structured-editor__header .question-edit-section__head {
  min-width: 0;
}

.structured-empty {
  padding: 14px;
  border: 1px dashed color-mix(in srgb, var(--mm-color-primary) 18%, var(--mm-color-border));
  border-radius: var(--radius-sm);
  color: var(--mm-color-text-secondary);
  font-size: 0.8rem;
  text-align: center;
  background: color-mix(in srgb, var(--mm-color-primary) 4%, var(--mm-color-card));
}

.option-editor-row,
.scoring-editor-row {
  padding: 10px;
  border: 1px solid color-mix(in srgb, var(--mm-color-border) 80%, transparent);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--mm-color-card) 88%, var(--mm-color-background));
}

.option-editor-row .text-input,
.scoring-editor-row .text-input {
  min-width: 0;
  background: var(--mm-color-card);
}

.option-editor-row .text-input:not(.option-key-input),
.scoring-editor-row .text-input:first-child,
.scoring-editor-row .text-input:nth-child(3) {
  flex: 1 1 auto;
}

.option-key-input {
  flex: 0 0 64px;
  text-align: center;
  font-weight: 700;
  text-transform: uppercase;
}

.score-input {
  flex: 0 0 86px;
}

.checkbox-field {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  color: var(--mm-color-text-secondary);
  font-size: 0.8rem;
}

.checkbox-field input {
  accent-color: var(--mm-color-primary);
}

.compact-button {
  min-height: 30px;
  padding: 0 10px;
}

.danger-button {
  color: var(--mm-color-danger);
}

.danger-button:hover {
  border-color: color-mix(in srgb, var(--mm-color-danger) 42%, var(--mm-color-border));
  background: color-mix(in srgb, var(--mm-color-danger) 7%, var(--mm-color-card));
}

'''
text = text[:start] + new_css + text[end:]
path.write_text(text, encoding='utf-8')
