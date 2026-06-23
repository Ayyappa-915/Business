import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DatabaseState } from '../../services/storage/storageService';
import { loadState } from '../../app/persist';
import { Category } from '../../types/category.types';
import { Subcategory } from '../../types/subcategory.types';
import { Product } from '../../types/product.types';
import { ProductVariant } from '../../types/variant.types';
import { Sale } from '../../types/sale.types';
import { Purchase } from '../../types/purchase.types';
import { Expense } from '../../types/expense.types';
import { StockAdjustmentLog } from '../../types/inventory.types';
import { Unit } from '../../types/unit.types';
import { User } from '../../types/auth.types';
import { inventoryEngine } from '../../services/inventory/inventoryEngine';

const initialState: DatabaseState = loadState();

const dbSlice = createSlice({
  name: 'db',
  initialState,
  reducers: {
    // Categories CRUD
    addCategory(state, action: PayloadAction<Category>) {
      state.categories.push(action.payload);
    },
    updateCategory(state, action: PayloadAction<Category>) {
      const idx = state.categories.findIndex(c => c.id === action.payload.id);
      if (idx !== -1) {
        state.categories[idx] = action.payload;
      }
    },
    deleteCategory(state, action: PayloadAction<string>) {
      state.categories = state.categories.filter(c => c.id !== action.payload);
      // Cascade delete products in category? The user might want to adjust manually, but let's keep products
    },

    // Subcategories CRUD
    addSubcategory(state, action: PayloadAction<Subcategory>) {
      state.subcategories.push(action.payload);
    },
    updateSubcategory(state, action: PayloadAction<Subcategory>) {
      const idx = state.subcategories.findIndex(s => s.id === action.payload.id);
      if (idx !== -1) {
        state.subcategories[idx] = action.payload;
      }
    },
    deleteSubcategory(state, action: PayloadAction<string>) {
      state.subcategories = state.subcategories.filter(s => s.id !== action.payload);
    },

    // Products & Variants CRUD
    addProduct(state, action: PayloadAction<{ product: Product; variants: ProductVariant[] }>) {
      state.products.push(action.payload.product);
      state.variants.push(...action.payload.variants);
    },
    updateProduct(state, action: PayloadAction<{ product: Product; variants: ProductVariant[] }>) {
      const pIdx = state.products.findIndex(p => p.id === action.payload.product.id);
      if (pIdx !== -1) {
        state.products[pIdx] = action.payload.product;
      }
      // Remove old variants and insert updated ones (or map them)
      state.variants = state.variants.filter(v => v.productId !== action.payload.product.id);
      state.variants.push(...action.payload.variants);
    },
    deleteProduct(state, action: PayloadAction<string>) {
      state.products = state.products.filter(p => p.id !== action.payload);
      state.variants = state.variants.filter(v => v.productId !== action.payload);
    },
    updateVariant(state, action: PayloadAction<ProductVariant>) {
      const updatedVariant = action.payload;
      const idx = state.variants.findIndex(v => v.id === updatedVariant.id);
      if (idx !== -1) {
        state.variants[idx] = updatedVariant;

        // Check if this product has shared stock
        const prod = state.products.find(p => p.id === updatedVariant.productId);
        if (prod && prod.hasSharedStock) {
          const factor = updatedVariant.conversionFactor || 1;
          const newBaseStock = updatedVariant.stock * factor;
          const baseCost = updatedVariant.cost / factor;

          state.variants = state.variants.map(v => {
            if (v.productId === updatedVariant.productId) {
              const vFactor = v.conversionFactor || 1;
              return {
                ...v,
                stock: newBaseStock / vFactor,
                cost: baseCost * vFactor,
                updatedAt: new Date().toISOString()
              };
            }
            return v;
          });
        }
      }
    },
    addVariant(state, action: PayloadAction<ProductVariant>) {
      const newVariant = action.payload;
      state.variants.push(newVariant);

      const prod = state.products.find(p => p.id === newVariant.productId);
      if (prod && prod.hasSharedStock) {
        const productVariants = state.variants.filter(v => v.productId === newVariant.productId);
        const otherVariants = productVariants.filter(v => v.id !== newVariant.id);
        let baseStock = 0;
        if (otherVariants.length > 0) {
          const firstOther = otherVariants[0];
          baseStock = firstOther.stock * (firstOther.conversionFactor || 1);
          if (newVariant.stock > 0) {
            baseStock += newVariant.stock * (newVariant.conversionFactor || 1);
          }
        } else {
          baseStock = newVariant.stock * (newVariant.conversionFactor || 1);
        }

        state.variants = state.variants.map(v => {
          if (v.productId === newVariant.productId) {
            const factor = v.conversionFactor || 1;
            return {
              ...v,
              stock: baseStock / factor,
              updatedAt: new Date().toISOString()
            };
          }
          return v;
        });
      }
    },
    deleteVariant(state, action: PayloadAction<string>) {
      state.variants = state.variants.filter(v => v.id !== action.payload);
    },

    // Sales CRUD + Stock Deduction
    addSale(state, action: PayloadAction<Sale>) {
      state.sales.push(action.payload);
      // Auto deduct stocks of variants
      state.variants = inventoryEngine.applySale(state.variants, action.payload.items, state.products);
    },
    deleteSale(state, action: PayloadAction<string>) {
      const sale = state.sales.find(s => s.id === action.payload);
      if (sale) {
        // Revert stock changes
        const refundItems = sale.items.map(item => ({
          variantId: item.variantId,
          productId: item.productId,
          quantity: -item.quantity, // Negative quantity to add back
          costPrice: 0 // cost doesn't change
        }));
        state.variants = inventoryEngine.applyPurchase(state.variants, refundItems, state.products);
        state.sales = state.sales.filter(s => s.id !== action.payload);
      }
    },

    // Purchases CRUD + Stock Addition
    addPurchase(state, action: PayloadAction<Purchase>) {
      state.purchases.push(action.payload);
      // Auto add stock of variants and update cost prices (exchanged only)
      if (action.payload.type !== 'prepared') {
        state.variants = inventoryEngine.applyPurchase(state.variants, action.payload.items, state.products);
      }
    },
    deletePurchase(state, action: PayloadAction<string>) {
      const purchase = state.purchases.find(p => p.id === action.payload);
      if (purchase) {
        // Revert stock changes (exchanged only)
        if (purchase.type !== 'prepared') {
          const refundItems = purchase.items.map(item => ({
            variantId: item.variantId,
            productId: item.productId,
            quantity: item.quantity, // subtract quantity
            unitPrice: 0
          }));
          state.variants = inventoryEngine.applySale(state.variants, refundItems, state.products);
        }
        state.purchases = state.purchases.filter(p => p.id !== action.payload);
      }
    },

    // Expenses CRUD
    addExpense(state, action: PayloadAction<Expense>) {
      state.expenses.push(action.payload);
    },
    updateExpense(state, action: PayloadAction<Expense>) {
      const idx = state.expenses.findIndex(e => e.id === action.payload.id);
      if (idx !== -1) {
        state.expenses[idx] = action.payload;
      }
    },
    deleteExpense(state, action: PayloadAction<string>) {
      state.expenses = state.expenses.filter(e => e.id !== action.payload);
    },

    // Stock Adjustments
    addAdjustment(state, action: PayloadAction<StockAdjustmentLog>) {
      state.adjustments.push(action.payload);
      state.variants = inventoryEngine.applyAdjustment(state.variants, action.payload, state.products);
    },

    // Units CRUD
    addUnit(state, action: PayloadAction<Unit>) {
      state.units.push(action.payload);
    },
    updateUnit(state, action: PayloadAction<Unit>) {
      const idx = state.units.findIndex(u => u.id === action.payload.id);
      if (idx !== -1) {
        state.units[idx] = action.payload;
      }
    },
    deleteUnit(state, action: PayloadAction<string>) {
      state.units = state.units.filter(u => u.id !== action.payload);
    },

    // Settings / Shop Users CRUD
    addShopUser(state, action: PayloadAction<User>) {
      state.users.push(action.payload);
    },
    deleteShopUser(state, action: PayloadAction<string>) {
      state.users = state.users.filter(u => u.id !== action.payload);
    },

    // Backup & Restore
    restoreDatabase(state, action: PayloadAction<DatabaseState>) {
      state.users = action.payload.users;
      state.categories = action.payload.categories;
      state.subcategories = action.payload.subcategories;
      state.products = action.payload.products;
      state.variants = action.payload.variants;
      state.purchases = action.payload.purchases;
      state.sales = action.payload.sales;
      state.expenses = action.payload.expenses;
      state.adjustments = action.payload.adjustments;
      state.units = action.payload.units;
      state.readNotificationIds = action.payload.readNotificationIds || [];
    },

    // Notifications state
    markNotificationsAsRead(state, action: PayloadAction<string[]>) {
      if (!state.readNotificationIds) {
        state.readNotificationIds = [];
      }
      action.payload.forEach(id => {
        if (!state.readNotificationIds!.includes(id)) {
          state.readNotificationIds!.push(id);
        }
      });
    }
  }
});

export const {
  addCategory, updateCategory, deleteCategory,
  addSubcategory, updateSubcategory, deleteSubcategory,
  addProduct, updateProduct, deleteProduct, updateVariant, addVariant, deleteVariant,
  addSale, deleteSale,
  addPurchase, deletePurchase,
  addExpense, updateExpense, deleteExpense,
  addAdjustment,
  addUnit, updateUnit, deleteUnit,
  addShopUser, deleteShopUser,
  restoreDatabase,
  markNotificationsAsRead
} = dbSlice.actions;

export default dbSlice.reducer;
