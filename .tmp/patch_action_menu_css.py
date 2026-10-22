from pathlib import Path
p = Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
s = p.read_text(encoding='utf-8')
s = s.replace('.danger-button,\n.action-link--danger {', '.danger-button,\n.action-menu__item--danger {')
old = '''.action-more {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid var(--mm-color-border);
  border-radius: var(--radius-sm);
  background: var(--mm-color-card);
  color: var(--mm-color-text-secondary);
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 650;
}

.action-more:hover,
.action-more:focus-within {
  border-color: color-mix(in srgb, var(--mm-color-primary) 28%, var(--mm-color-border));
  color: var(--mm-color-primary);
}

.action-popover {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 20;
  display: none;
  min-width: 112px;
  padding: 6px;
  border: 1px solid var(--mm-color-border);
  border-radius: var(--radius-sm);
  background: var(--mm-color-card);
  box-shadow: var(--shadow-lg);
}

.action-more:hover .action-popover,
.action-more:focus-within .action-popover {
  display: grid;
  gap: 2px;
}

.action-popover .action-link {
  display: block;
  padding: 7px 8px;
  border-radius: var(--radius-xs, 4px);
  color: var(--mm-color-text-primary);
  text-align: left;
  white-space: nowrap;
}

.action-popover .action-link:hover {
  background: color-mix(in srgb, var(--mm-color-primary) 7%, var(--mm-color-card));
  color: var(--mm-color-primary);
}

.action-popover .action-link--danger {
  color: var(--mm-color-danger);
}
'''
new = '''.action-menu {
  position: relative;
  display: inline-flex;
  justify-content: flex-end;
}

.action-menu__trigger {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid var(--mm-color-border);
  border-radius: var(--radius-sm);
  background: var(--mm-color-card);
  color: var(--mm-color-text-secondary);
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 650;
  list-style: none;
}

.action-menu__trigger::-webkit-details-marker {
  display: none;
}

.action-menu__trigger:hover,
.action-menu[open] .action-menu__trigger {
  border-color: color-mix(in srgb, var(--mm-color-primary) 28%, var(--mm-color-border));
  color: var(--mm-color-primary);
}

.action-menu__panel {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 20;
  display: grid;
  min-width: 126px;
  padding: 6px;
  border: 1px solid var(--mm-color-border);
  border-radius: var(--radius-sm);
  background: var(--mm-color-card);
  box-shadow: var(--shadow-lg);
  gap: 2px;
}

.action-menu:not([open]) .action-menu__panel {
  display: none;
}

.action-menu__item {
  width: 100%;
  padding: 7px 8px;
  border: 0;
  border-radius: var(--radius-xs, 4px);
  background: transparent;
  color: var(--mm-color-text-primary);
  cursor: pointer;
  font: inherit;
  font-size: 0.82rem;
  text-align: left;
  white-space: nowrap;
}

.action-menu__item:hover:not(:disabled) {
  background: color-mix(in srgb, var(--mm-color-primary) 7%, var(--mm-color-card));
  color: var(--mm-color-primary);
}

.action-menu__item:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.action-menu__item--danger {
  color: var(--mm-color-danger);
}
'''
if old not in s:
    raise SystemExit('old css block not found')
s = s.replace(old, new)
p.write_text(s, encoding='utf-8')
