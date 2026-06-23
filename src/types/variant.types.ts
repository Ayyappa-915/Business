import { BaseEntity } from './common.types';

export interface ProductVariant extends BaseEntity {
  productId: string;
  name: string; // e.g. "500ml", "Red / XL"
  sku?: string;
  barcode?: string;
  price: number; // Selling price
  cost: number;  // Cost price
  stock: number;  // Current stock level
  lowStockThreshold: number; // Threshold for low stock warning
  conversionFactor?: number;
  variantUnit?: string;
  purpose?: 'both' | 'buy' | 'sell';
}
