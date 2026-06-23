import { BaseEntity } from './common.types';

export interface SaleItem {
  productId: string;
  variantId: string;
  quantity: number;
  unitPrice: number; // Price at time of sale
  discount?: number; // Discount per item (percent or flat, let's treat as flat discount amount)
}

export interface Sale extends BaseEntity {
  customerName?: string;
  customerPhone?: string;
  saleDate: string;
  items: SaleItem[];
  subtotal: number;
  discount: number; // Overall invoice discount
  totalAmount: number;
  paymentMethod: 'cash' | 'upi' | 'card' | 'credit';
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  notes?: string;
}
