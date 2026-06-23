import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import dbReducer from '../features/db/dbSlice';
import settingsReducer from '../features/settings/settingsSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  db: dbReducer,
  settings: settingsReducer,
});

export default rootReducer;
export type RootState = ReturnType<typeof rootReducer>;
