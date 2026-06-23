import { DatabaseState } from '../storage/storageService';

export const importService = {
  validateSchema(db: any): db is DatabaseState {
    if (!db || typeof db !== 'object') return false;
    
    // Core arrays check
    const requiredKeys = ['users', 'categories', 'products', 'variants', 'purchases', 'sales', 'expenses', 'units'];
    for (const key of requiredKeys) {
      if (!Array.isArray(db[key])) {
        return false;
      }
    }
    return true;
  },

  importDatabase(file: File): Promise<DatabaseState> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          
          if (this.validateSchema(parsed)) {
            resolve(parsed);
          } else {
            reject(new Error('Invalid backup file format. Missing core datasets.'));
          }
        } catch (err) {
          reject(new Error('Failed to parse JSON backup file.'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('File reading error.'));
      };
      
      reader.readAsText(file);
    });
  }
};
