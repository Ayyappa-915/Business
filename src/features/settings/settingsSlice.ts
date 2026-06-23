import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { storageAdapter } from '../../services/storage/storageAdapter';
import { RootState } from '../../app/store';

export type ThemeMode = 'light' | 'dark';

interface SettingsState {
  theme: ThemeMode;
}

const cachedTheme = storageAdapter.getItem<ThemeMode>(STORAGE_KEYS.THEME, 'dark');

const initialState: SettingsState = {
  theme: cachedTheme,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      storageAdapter.setItem(STORAGE_KEYS.THEME, state.theme);
      // Apply class to body for vanilla styling overrides
      document.documentElement.setAttribute('data-theme', state.theme);
    },
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.theme = action.payload;
      storageAdapter.setItem(STORAGE_KEYS.THEME, action.payload);
      document.documentElement.setAttribute('data-theme', action.payload);
    }
  }
});

// Initialize theme on script execution
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', cachedTheme);
}

export const { toggleTheme, setTheme } = settingsSlice.actions;

export const selectTheme = (state: RootState) => state.settings.theme;

export default settingsSlice.reducer;
