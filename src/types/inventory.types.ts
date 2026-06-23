import { BaseEntity } from './common.types';

export interface StockAdjustmentLog extends BaseEntity {
  productId: string;
  variantId: string;
  type: 'add' | 'subtract' | 'set';
  quantity: number;
  reason: string; // e.g. "Damage", "Initial Stock", "Manual Correction"
  date: string;
}

export interface LowStockAlert {
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  currentStock: number;
  threshold: number;
}
