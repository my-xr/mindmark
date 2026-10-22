export type ThemeCode = 'light' | 'dark' | 'slate' | 'ocean' | 'forest';

export interface ThemeOption {
  code: ThemeCode;
  label: string;
  description: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { code: 'light', label: 'Light', description: '浅色白灰，默认主题' },
  { code: 'dark', label: 'Dark', description: '深色控制台' },
  { code: 'slate', label: 'Slate', description: '中性石板灰' },
  { code: 'ocean', label: 'Ocean', description: '清爽蓝绿' },
  { code: 'forest', label: 'Forest', description: '低饱和绿色' },
];

export const DEFAULT_THEME: ThemeCode = 'light';

export const isThemeCode = (value: string | null): value is ThemeCode =>
  THEME_OPTIONS.some((option) => option.code === value);
