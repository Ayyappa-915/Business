import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User, UserRole } from '../../types/auth.types';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { storageAdapter } from '../../services/storage/storageAdapter';

const cachedAuth = storageAdapter.getItem<{ user: User | null; token: string | null } | null>(STORAGE_KEYS.AUTH, null);

const initialState: AuthState = {
  user: cachedAuth?.user || null,
  token: cachedAuth?.token || null,
  isAuthenticated: !!cachedAuth?.token,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess(state, action: PayloadAction<{ user: User; token: string }>) {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      storageAdapter.setItem(STORAGE_KEYS.AUTH, {
        user: action.payload.user,
        token: action.payload.token
      });
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
    registerSuccess(state, action: PayloadAction<{ user: User; token: string }>) {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      storageAdapter.setItem(STORAGE_KEYS.AUTH, {
        user: action.payload.user,
        token: action.payload.token
      });
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      storageAdapter.removeItem(STORAGE_KEYS.AUTH);
    },
    updateProfile(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        storageAdapter.setItem(STORAGE_KEYS.AUTH, {
          user: state.user,
          token: state.token
        });
      }
    }
  }
});

export const { loginStart, loginSuccess, loginFailure, registerSuccess, logout, updateProfile } = authSlice.actions;
export default authSlice.reducer;
