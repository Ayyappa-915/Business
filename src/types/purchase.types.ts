import { BaseEntity } from './common.types';

export interface PurchaseItem {
  productId: string;
  variantId: string; // References ProductVariant
  quantity: number;
  costPrice: number;
  pieces?: number;   // count of hens/items
  weight?: number;   // total weight in kg if applicable
}

// Free-form item for recording any exchanged/stock purchase without variant lookup
export interface FreePurchaseItem {
  name: string;       // Product / item name (free text)
  quantity: number;
  unit: string;       // e.g. kg, pcs, box
  costPerUnit: number;
  totalCost: number;
  pieces?: number;   // count of hens/items
  weight?: number;   // total weight in kg if applicable
}

export interface Purchase extends BaseEntity {
  type?: 'prepared' | 'exchanged';
  categoryId?: string; // Reference to Category if type === 'prepared'
  preparedItems?: { name: string; cost: number }[];   // Raw ingredients for prepared
  exchangedItems?: FreePurchaseItem[];                 // Free-form items for exchanged
  supplierName?: string;
  purchaseDate: string;
  targetSalesDate?: string; // Sales date this purchase counts towards (prepared only)
  items: PurchaseItem[];    // Legacy variant-linked items (kept for backward compatibility)
  totalAmount: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  paymentMethod: 'cash' | 'upi' | 'card' | 'credit';
  notes?: string;
  additionalCost?: number; // Petrol / Transport expenses
  additionalCostReason?: string; // e.g. "Petrol"
}
