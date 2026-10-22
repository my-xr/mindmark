from pathlib import Path

# Make the settings switch explicit instead of binding the store action directly.
p = Path('apps/mindmark-web/src/views/teacher/TeacherSettingsView.vue')
s = p.read_text(encoding='utf-8')
if 'const toggleActionButtonMode = () =>' not in s:
    s = s.replace(
        """const actionButtonModeTitle = computed(() =>
  appStore.actionButtonMode === 'expanded' ? '收起按钮文字' : '展开按钮文字',
);""",
        """const actionButtonModeTitle = computed(() =>
  appStore.actionButtonMode === 'expanded' ? '收起按钮文字' : '展开按钮文字',
);

const toggleActionButtonMode = () => {
  appStore.toggleActionButtonMode();
};""",
    )
s = s.replace('@click="appStore.toggleActionButtonMode"', '@click="toggleActionButtonMode"')
p.write_text(s, encoding='utf-8')

# Harden compact/expanded CSS so labels always recover after switching back,
# and compact buttons expand reliably on hover/focus.
css_path = Path('apps/mindmark-web/src/styles/visual-alignment.css')
css = css_path.read_text(encoding='utf-8')
start = css.find('/* Shared emoji action buttons.')
end = css.find('\n.profile-summary-card .section-actions', start)
if start == -1 or end == -1:
    raise SystemExit('icon action CSS block not found')
new_block = '''/* Shared emoji action buttons. Default is expanded; personal settings can switch to compact. */
.icon-action-button,
:root[data-action-buttons='expanded'] .icon-action-button {
  width: auto;
  min-width: 34px;
  max-width: none;
  height: auto;
  min-height: 34px;
  flex: 0 1 auto;
  gap: 6px;
  padding-inline: 10px;
  overflow: hidden;
  border-radius: 999px;
  white-space: nowrap;
  aspect-ratio: auto;
  transition:
    width 160ms ease,
    max-width 160ms ease,
    padding 160ms ease,
    border-color 160ms ease,
    background 160ms ease;
}

.icon-action-button .app-action-button__icon,
:root[data-action-buttons='expanded'] .icon-action-button .app-action-button__icon {
  width: 18px;
  flex: 0 0 18px;
  font-size: 0.9rem;
}

.icon-action-button .app-action-button__label,
:root[data-action-buttons='expanded'] .icon-action-button .app-action-button__label {
  display: inline-block;
  max-width: 12em;
  overflow: hidden;
  opacity: 1;
  transition:
    max-width 160ms ease,
    opacity 120ms ease;
}

:root[data-action-buttons='compact'] .icon-action-button {
  width: 34px;
  min-width: 34px;
  max-width: 34px;
  height: 34px;
  min-height: 34px;
  flex: 0 0 34px;
  gap: 0;
  padding-inline: 0;
  border-radius: 999px;
  aspect-ratio: 1 / 1;
}

:root[data-action-buttons='compact'] .icon-action-button:hover,
:root[data-action-buttons='compact'] .icon-action-button:focus-visible {
  width: max-content;
  min-width: 34px;
  max-width: min(220px, calc(100vw - 32px));
  height: 34px;
  flex: 0 0 auto;
  gap: 6px;
  padding-inline: 10px;
}

:root[data-action-buttons='compact'] .icon-action-button .app-action-button__label {
  max-width: 0;
  opacity: 0;
}

:root[data-action-buttons='compact'] .icon-action-button:hover .app-action-button__label,
:root[data-action-buttons='compact'] .icon-action-button:focus-visible .app-action-button__label {
  max-width: 12em;
  opacity: 1;
}
'''
css = css[:start] + new_block + css[end:]
css_path.write_text(css, encoding='utf-8')
