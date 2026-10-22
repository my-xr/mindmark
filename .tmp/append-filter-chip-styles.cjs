const fs = require('fs');
const p = 'apps/mindmark-web/src/styles/visual-alignment.css';
let s = fs.readFileSync(p, 'utf8');
const block = `

/* Filter and generation option chips: clearer selected state without adding visual noise. */
.filter-option-field {
  align-content: start;
  min-width: 0;
}

.filter-option-group {
  display: flex;
  min-width: 0;
  min-height: 32px;
  gap: 6px;
  align-items: center;
  overflow: hidden;
}

.collapsible-filter-body--single-row .filter-option-group {
  flex-wrap: nowrap;
  mask-image: linear-gradient(90deg, #000 92%, transparent 100%);
}

.collapsible-filter-body:not(.collapsible-filter-body--single-row) .filter-option-group {
  flex-wrap: wrap;
  overflow: visible;
}

.filter-option-chip {
  position: relative;
  display: inline-flex;
  min-width: 0;
  min-height: 30px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  color: var(--mm-color-text-secondary);
  font: inherit;
  font-size: 12px;
  font-weight: 560;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  background: var(--mm-color-card);
  border: 1px solid var(--mm-color-border);
  border-radius: 5px;
  outline: none;
  box-shadow: none;
  transition:
    color 0.16s ease,
    background-color 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}

.filter-option-chip:hover {
  color: var(--mm-color-text);
  background: color-mix(in srgb, var(--mm-color-bg) 64%, var(--mm-color-card));
  border-color: var(--mm-color-border-strong);
}

.filter-option-chip:focus-visible {
  border-color: var(--mm-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--mm-color-primary) 14%, transparent);
}

.filter-option-chip--active {
  color: var(--mm-color-primary);
  font-weight: 620;
  background: color-mix(in srgb, var(--mm-color-primary-soft) 78%, var(--mm-color-card));
  border-color: color-mix(in srgb, var(--mm-color-primary) 54%, var(--mm-color-border));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--mm-color-primary) 12%, transparent);
}

.filter-option-chip--active::before {
  width: 6px;
  height: 6px;
  margin-right: 6px;
  content: '';
  background: currentcolor;
  border-radius: 999px;
}

:root[data-theme='dark'] .filter-option-chip {
  background: color-mix(in srgb, var(--mm-color-card) 88%, #0f172a);
  border-color: rgb(148 163 184 / 22%);
}

:root[data-theme='dark'] .filter-option-chip:hover {
  background: rgb(30 41 59 / 72%);
  border-color: rgb(148 163 184 / 38%);
}

:root[data-theme='dark'] .filter-option-chip--active {
  color: #93c5fd;
  background: rgb(37 99 235 / 18%);
  border-color: rgb(147 197 253 / 48%);
  box-shadow: inset 0 0 0 1px rgb(147 197 253 / 12%);
}
`;
if (!s.includes('Filter and generation option chips')) {
  s = s.replace(/\s*$/, '') + block + '\n';
  fs.writeFileSync(p, s, 'utf8');
}
