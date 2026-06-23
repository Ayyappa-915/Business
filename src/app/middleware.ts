import { Middleware } from '@reduxjs/toolkit';
import { saveState } from './persist';

export const persistMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  const state = store.getState();
  
  // Extract database slices to persist
  const dbState = {
    users: state.db?.users || [],
    categories: state.db?.categories || [],
    subcategories: state.db?.subcategories || [],
    products: state.db?.products || [],
    variants: state.db?.variants || [],
    purchases: state.db?.purchases || [],
    sales: state.db?.sales || [],
    expenses: state.db?.expenses || [],
    adjustments: state.db?.adjustments || [],
    units: state.db?.units || [],
    readNotificationIds: state.db?.readNotificationIds || [],
  };

  saveState(dbState);
  
  return result;
};
