import { storageAdapter } from './storageAdapter';
import { STORAGE_KEYS } from './storageKeys';
import { Category } from '../../types/category.types';
import { Subcategory } from '../../types/subcategory.types';
import { Unit } from '../../types/unit.types';
import { Product } from '../../types/product.types';
import { ProductVariant } from '../../types/variant.types';
import { Sale } from '../../types/sale.types';
import { Purchase } from '../../types/purchase.types';
import { Expense } from '../../types/expense.types';
import { StockAdjustmentLog } from '../../types/inventory.types';
import { User } from '../../types/auth.types';
import {
  SEED_CATEGORIES,
  SEED_PRODUCTS,
  SEED_VARIANTS,
  SEED_SALES,
  SEED_PURCHASES,
  SEED_EXPENSES,
  SEED_UNITS,
  SEED_USERS
} from '../../utils/seedData';

export interface DatabaseState {
  users: User[];
  categories: Category[];
  subcategories: Subcategory[];
  products: Product[];
  variants: ProductVariant[];
  purchases: Purchase[];
  sales: Sale[];
  expenses: Expense[];
  adjustments: StockAdjustmentLog[];
  units: Unit[];
  readNotificationIds?: string[];
}

const DEFAULT_DB: DatabaseState = {
  users: SEED_USERS,
  categories: SEED_CATEGORIES,
  subcategories: [],
  products: SEED_PRODUCTS,
  variants: SEED_VARIANTS,
  purchases: SEED_PURCHASES,
  sales: SEED_SALES,
  expenses: SEED_EXPENSES,
  adjustments: [],
  units: SEED_UNITS,
  readNotificationIds: [],
};

export const storageService = {
  loadDatabase(): DatabaseState {
    const db = storageAdapter.getItem<DatabaseState | null>(STORAGE_KEYS.DATABASE, null);
    if (!db) {
      // Seed initial data
      storageAdapter.setItem(STORAGE_KEYS.DATABASE, DEFAULT_DB);
      return DEFAULT_DB;
    }
    return {
      users: db.users || DEFAULT_DB.users,
      categories: db.categories || DEFAULT_DB.categories,
      subcategories: db.subcategories || DEFAULT_DB.subcategories,
      products: db.products || DEFAULT_DB.products,
      variants: db.variants || DEFAULT_DB.variants,
      purchases: db.purchases || DEFAULT_DB.purchases,
      sales: db.sales || DEFAULT_DB.sales,
      expenses: db.expenses || DEFAULT_DB.expenses,
      adjustments: db.adjustments || DEFAULT_DB.adjustments,
      units: db.units || DEFAULT_DB.units,
      readNotificationIds: db.readNotificationIds || DEFAULT_DB.readNotificationIds,
    };
  },

  saveDatabase(db: DatabaseState): boolean {
    return storageAdapter.setItem(STORAGE_KEYS.DATABASE, db);
  },

  clearDatabase(): void {
    storageAdapter.removeItem(STORAGE_KEYS.DATABASE);
  }
};
