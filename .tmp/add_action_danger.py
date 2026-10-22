from pathlib import Path
p = Path('apps/mindmark-web/src/components/common/AppActionButton.vue')
text = p.read_text(encoding='utf-8')
text = text.replace("variant?: 'primary' | 'secondary' | 'tag' | 'tag-danger';", "variant?: 'primary' | 'secondary' | 'danger' | 'tag' | 'tag-danger';")
needle = '''.app-action-button--secondary:hover,
.app-action-button--secondary:focus-visible {
  border-color: color-mix(in srgb, var(--mm-color-primary) 34%, var(--mm-color-border));
  color: var(--mm-color-primary);
  background: color-mix(in srgb, var(--mm-color-primary) 10%, var(--mm-color-card));
  box-shadow: 0 8px 18px color-mix(in srgb, var(--mm-color-primary) 12%, transparent);
  transform: translateY(-1px);
}

.app-action-button--primary {'''
insert = '''.app-action-button--secondary:hover,
.app-action-button--secondary:focus-visible {
  border-color: color-mix(in srgb, var(--mm-color-primary) 34%, var(--mm-color-border));
  color: var(--mm-color-primary);
  background: color-mix(in srgb, var(--mm-color-primary) 10%, var(--mm-color-card));
  box-shadow: 0 8px 18px color-mix(in srgb, var(--mm-color-primary) 12%, transparent);
  transform: translateY(-1px);
}

.app-action-button--danger {
  border-color: color-mix(in srgb, var(--mm-color-danger) 22%, var(--mm-color-border));
  color: var(--mm-color-danger);
  background: color-mix(in srgb, var(--mm-color-danger) 7%, var(--mm-color-card));
}

.app-action-button--danger .app-action-button__icon {
  background: color-mix(in srgb, var(--mm-color-danger) 12%, transparent);
}

.app-action-button--danger:hover,
.app-action-button--danger:focus-visible {
  border-color: color-mix(in srgb, var(--mm-color-danger) 38%, var(--mm-color-border));
  color: var(--mm-color-danger);
  background: color-mix(in srgb, var(--mm-color-danger) 11%, var(--mm-color-card));
  box-shadow: 0 8px 18px color-mix(in srgb, var(--mm-color-danger) 12%, transparent);
  transform: translateY(-1px);
}

.app-action-button--primary {'''
if needle not in text:
    raise SystemExit('needle not found')
text = text.replace(needle, insert, 1)
p.write_text(text, encoding='utf-8')
