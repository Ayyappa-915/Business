import { BaseEntity } from './common.types';

export interface Subcategory extends BaseEntity {
  categoryId: string;
  name: string;
  description?: string;
}
