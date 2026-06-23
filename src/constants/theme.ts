export const THEMES = {
  LIGHT: 'light' as const,
  DARK: 'dark' as const,
};

export type ThemeType = typeof THEMES[keyof typeof THEMES];

export const CATEGORY_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];
