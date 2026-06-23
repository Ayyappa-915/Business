import { BaseEntity } from './common.types';

export interface Product extends BaseEntity {
  name: string;
  description?: string;
  categoryId: string;
  subcategoryId?: string;
  unitId: string; // e.g. "kg", "pcs"
  hasVariants: boolean;
  isStockTracked?: boolean;
  image?: string;
  hasSharedStock?: boolean;
}
