from pathlib import Path

app_store = Path('apps/mindmark-web/src/stores/appStore.ts')
app_store.write_text('''import { defineStore } from 'pinia';

import { DEFAULT_THEME, isThemeCode, type ThemeCode } from '@/constants/theme';

export type ActionButtonMode = 'expanded' | 'compact';

const THEME_STORAGE_KEY = 'mindmark-theme';
const ACTION_BUTTON_MODE_STORAGE_KEY = 'mindmark-action-button-mode';
const DEFAULT_ACTION_BUTTON_MODE: ActionButtonMode = 'expanded';

const isActionButtonMode = (mode: string | null): mode is ActionButtonMode =>
  mode === 'expanded' || mode === 'compact';

const getStoredTheme = (): ThemeCode => {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME;
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  return isThemeCode(storedTheme) ? storedTheme : DEFAULT_THEME;
};

const getStoredActionButtonMode = (): ActionButtonMode => {
  if (typeof window === 'undefined') {
    return DEFAULT_ACTION_BUTTON_MODE;
  }

  const storedMode = window.localStorage.getItem(ACTION_BUTTON_MODE_STORAGE_KEY);

  return isActionButtonMode(storedMode) ? storedMode : DEFAULT_ACTION_BUTTON_MODE;
};

const applyThemeToDocument = (theme: ThemeCode) => {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.dataset.theme = theme;
};

const applyActionButtonModeToDocument = (mode: ActionButtonMode) => {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.dataset.actionButtons = mode;
};

interface AppState {
  actionButtonMode: ActionButtonMode;
  sidebarCollapsed: boolean;
  theme: ThemeCode;
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    actionButtonMode: getStoredActionButtonMode(),
    sidebarCollapsed: false,
    theme: getStoredTheme(),
  }),
  actions: {
    initTheme() {
      applyThemeToDocument(this.theme);
      applyActionButtonModeToDocument(this.actionButtonMode);
    },
    setActionButtonMode(mode: ActionButtonMode) {
      this.actionButtonMode = mode;
      applyActionButtonModeToDocument(mode);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(ACTION_BUTTON_MODE_STORAGE_KEY, mode);
      }
    },
    setTheme(theme: ThemeCode) {
      this.theme = theme;
      applyThemeToDocument(theme);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
      }
    },
    toggleActionButtonMode() {
      this.setActionButtonMode(this.actionButtonMode === 'expanded' ? 'compact' : 'expanded');
    },
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },
  },
});
''', encoding='utf-8')

p = Path('apps/mindmark-web/src/views/teacher/TeacherSettingsView.vue')
s = p.read_text(encoding='utf-8')
if "import { useAppStore } from '@/stores/appStore';" not in s:
    s = s.replace("import { useAuthStore } from '@/stores/authStore';", "import { useAppStore } from '@/stores/appStore';\nimport { useAuthStore } from '@/stores/authStore';")
if 'const appStore = useAppStore();' not in s:
    s = s.replace('const authStore = useAuthStore();', 'const appStore = useAppStore();\nconst authStore = useAuthStore();')
if 'const actionButtonModeTitle = computed' not in s:
    s = s.replace(
        "const keyStatusText = computed(() => setting.value?.keyPreview || '未配置个人 Key');",
        "const keyStatusText = computed(() => setting.value?.keyPreview || '未配置个人 Key');\nconst actionButtonModeTitle = computed(() =>\n  appStore.actionButtonMode === 'expanded' ? '收起按钮文字' : '展开按钮文字',\n);",
    )
if "@click=\"appStore.toggleActionButtonMode\"" not in s:
    s = s.replace(
        '''        <StatusTag label="教师空间" tone="info" />
        <AppActionButton''',
        '''        <StatusTag label="教师空间" tone="info" />
        <AppActionButton
          class="icon-action-button"
          :icon="appStore.actionButtonMode === 'expanded' ? '🏷️' : '👁️'"
          :title="actionButtonModeTitle"
          @click="appStore.toggleActionButtonMode"
        >
          {{ actionButtonModeTitle }}
        </AppActionButton>
        <AppActionButton''',
    )
# Make the provider save action participate in the same expanded/compact behavior.
old_save = '''        <AppActionButton
          variant="primary"
          :disabled="isSaving || isLoading || isTesting"
          @click="saveSetting"
        >'''
new_save = '''        <AppActionButton
          class="icon-action-button"
          icon="💾"
          variant="primary"
          :disabled="isSaving || isLoading || isTesting"
          :title="isSaving ? '保存中...' : `保存 ${selectedOption.label} 配置`"
          @click="saveSetting"
        >'''
s = s.replace(old_save, new_save)
p.write_text(s, encoding='utf-8')

css_path = Path('apps/mindmark-web/src/styles/visual-alignment.css')
css = css_path.read_text(encoding='utf-8')
start = css.find('/* Shared compact emoji action buttons')
if start == -1:
    start = css.find('/* Shared emoji action buttons.')
end = css.find('\n.profile-summary-card .section-actions', start)
if start == -1 or end == -1:
    raise SystemExit('global icon-action-button block not found')
new_block = '''/* Shared emoji action buttons. Default is expanded; personal settings can switch to compact. */
.icon-action-button {
  min-width: 34px;
  min-height: 34px;
  gap: 6px;
  padding-inline: 10px;
  overflow: hidden;
  border-radius: 999px;
  white-space: nowrap;
  transition:
    width 160ms ease,
    max-width 160ms ease,
    padding 160ms ease,
    border-color 160ms ease,
    background 160ms ease;
}

.icon-action-button .app-action-button__icon {
  width: 18px;
  flex: 0 0 18px;
  font-size: 0.9rem;
}

.icon-action-button .app-action-button__label {
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
  width: auto;
  max-width: 220px;
  flex-basis: auto;
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

qb = Path('apps/mindmark-web/src/views/teacher/QuestionBankView.vue')
s = qb.read_text(encoding='utf-8')
start = s.find('\n.icon-action-button {')
end = s.find('\n.question-detail-actions {', start)
if start != -1 and end != -1:
    s = s[:start] + '\n' + s[end:]
qb.write_text(s, encoding='utf-8')
