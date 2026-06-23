import { DatabaseState } from '../storage/storageService';

export const exportService = {
  exportDatabase(db: DatabaseState): void {
    try {
      const dataStr = JSON.stringify(db, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const shopName = db.users[0]?.shopName || 'business';
      const cleanShopName = shopName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `${cleanShopName}_backup_${dateStr}.json`;
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = filename;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Failed to export database:', e);
      throw new Error('Database export failed. Please try again.');
    }
  }
};
