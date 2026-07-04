import { DatabaseState } from '../services/storage/storageService';

export const loadState = (): DatabaseState => {
  return {
    users: [],
    categories: [],
    subcategories: [],
    products: [],
    variants: [],
    purchases: [],
    sales: [],
    expenses: [],
    adjustments: [],
    units: [],
    readNotificationIds: [],
  };
};

export const saveState = (state: DatabaseState): boolean => {
  return true;
};
