import { storageService, DatabaseState } from '../services/storage/storageService';

export const loadState = (): DatabaseState => {
  return storageService.loadDatabase();
};

export const saveState = (state: DatabaseState): boolean => {
  return storageService.saveDatabase(state);
};
