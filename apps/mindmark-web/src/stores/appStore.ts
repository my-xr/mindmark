import { defineStore } from 'pinia';

import { DEFAULT_THEME, isThemeCode, type ThemeCode } from '@/constants/theme';

export type ActionButtonMode = 'expanded' | 'compact';
export type ActionButtonWeight = 'bold' | 'regular';

const THEME_STORAGE_KEY = 'mindmark-theme';
const ACTION_BUTTON_MODE_STORAGE_KEY = 'mindmark-action-button-mode';
const ACTION_BUTTON_WEIGHT_STORAGE_KEY = 'mindmark-action-button-weight';
const DEFAULT_ACTION_BUTTON_MODE: ActionButtonMode = 'expanded';
const DEFAULT_ACTION_BUTTON_WEIGHT: ActionButtonWeight = 'bold';

const isActionButtonMode = (mode: string | null): mode is ActionButtonMode =>
  mode === 'expanded' || mode === 'compact';
const isActionButtonWeight = (weight: string | null): weight is ActionButtonWeight =>
  weight === 'bold' || weight === 'regular';

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

const getStoredActionButtonWeight = (): ActionButtonWeight => {
  if (typeof window === 'undefined') {
    return DEFAULT_ACTION_BUTTON_WEIGHT;
  }

  const storedWeight = window.localStorage.getItem(ACTION_BUTTON_WEIGHT_STORAGE_KEY);

  return isActionButtonWeight(storedWeight) ? storedWeight : DEFAULT_ACTION_BUTTON_WEIGHT;
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

const applyActionButtonWeightToDocument = (weight: ActionButtonWeight) => {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.dataset.actionButtonWeight = weight;
};

interface AppState {
  actionButtonMode: ActionButtonMode;
  actionButtonWeight: ActionButtonWeight;
  sidebarCollapsed: boolean;
  theme: ThemeCode;
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    actionButtonMode: getStoredActionButtonMode(),
    actionButtonWeight: getStoredActionButtonWeight(),
    sidebarCollapsed: false,
    theme: getStoredTheme(),
  }),
  actions: {
    initTheme() {
      applyThemeToDocument(this.theme);
      applyActionButtonModeToDocument(this.actionButtonMode);
      applyActionButtonWeightToDocument(this.actionButtonWeight);
    },
    setActionButtonMode(mode: ActionButtonMode) {
      this.actionButtonMode = mode;
      applyActionButtonModeToDocument(mode);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(ACTION_BUTTON_MODE_STORAGE_KEY, mode);
      }
    },
    setActionButtonWeight(weight: ActionButtonWeight) {
      this.actionButtonWeight = weight;
      applyActionButtonWeightToDocument(weight);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(ACTION_BUTTON_WEIGHT_STORAGE_KEY, weight);
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
    toggleActionButtonWeight() {
      this.setActionButtonWeight(this.actionButtonWeight === 'bold' ? 'regular' : 'bold');
    },
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },
  },
});
