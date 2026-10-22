from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
s=p.read_text(encoding='utf-8')
insert='''
.compact-actions {
  position: relative;
  justify-content: flex-end;
  overflow: visible;
}

.action-more {
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
marker='''.action-link {
  cursor: pointer;
}
'''
if marker not in s:
    raise SystemExit('marker not found')
s=s.replace(marker, marker+insert)
p.write_text(s, encoding='utf-8', newline='\n')
