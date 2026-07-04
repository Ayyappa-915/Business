import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
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
import { api } from '../../services/api';

// --- ASYNC THUNKS ---

export const fetchInitialData = createAsyncThunk(
  'db/fetchInitialData',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      let data = await api.get<DatabaseState>('/data/sync');
      
      // Auto-migrate localStorage data to MongoDB if MongoDB is empty
      if (!data.products || data.products.length === 0) {
        const localDataStr = localStorage.getItem('biztracker_db_v1');
        if (localDataStr) {
          try {
            const localData = JSON.parse(localDataStr);
            if (localData.products && localData.products.length > 0) {
              console.log('Automigrating localStorage data to MongoDB...');
              await api.post('/data/import', localData);
              data = await api.get<DatabaseState>('/data/sync');
            }
          } catch (e) {}
        }
      }
      
      dispatch(fetchShopUsers());
      return data;
    } catch (err: any) {
      console.error('Failed to sync with backend, using local state.', err);
      return rejectWithValue(err.message || 'Failed to sync with backend');
    }
  }
);

export const addCategory = createAsyncThunk(
  'db/addCategory',
  async (category: Category) => {
    return await api.post<Category>('/data/categories', category);
  }
);

export const updateCategory = createAsyncThunk(
  'db/updateCategory',
  async (category: Category) => {
    return await api.put<Category>(`/data/categories/${category.id}`, category);
  }
);

export const deleteCategory = createAsyncThunk(
  'db/deleteCategory',
  async (id: string) => {
    await api.delete(`/data/categories/${id}`);
    return id;
  }
);

export const addSubcategory = createAsyncThunk(
  'db/addSubcategory',
  async (subcat: Subcategory) => {
    return await api.post<Subcategory>('/data/subcategories', subcat);
  }
);

export const deleteSubcategory = createAsyncThunk(
  'db/deleteSubcategory',
  async (id: string) => {
    await api.delete(`/data/subcategories/${id}`);
    return id;
  }
);

export const addProduct = createAsyncThunk(
  'db/addProduct',
  async (payload: { product: Product; variants: ProductVariant[] }) => {
    return await api.post<{ product: Product; variants: ProductVariant[] }>('/data/products', payload);
  }
);

export const updateProduct = createAsyncThunk(
  'db/updateProduct',
  async (payload: { product: Product; variants: ProductVariant[] }) => {
    return await api.put<{ product: Product; variants: ProductVariant[] }>(`/data/products/${payload.product.id}`, payload);
  }
);

export const deleteProduct = createAsyncThunk(
  'db/deleteProduct',
  async (id: string) => {
    await api.delete(`/data/products/${id}`);
    return id;
  }
);

export const updateSubcategory = createAsyncThunk(
  'db/updateSubcategory',
  async (subcat: Subcategory) => {
    return await api.put<Subcategory>(`/data/subcategories/${subcat.id}`, subcat);
  }
);

export const addVariant = createAsyncThunk(
  'db/addVariant',
  async (variant: ProductVariant) => {
    return await api.post<ProductVariant>('/data/variants', variant);
  }
);

export const updateVariant = createAsyncThunk(
  'db/updateVariant',
  async (variant: ProductVariant) => {
    return await api.put<ProductVariant>(`/data/variants/${variant.id}`, variant);
  }
);

export const deleteVariant = createAsyncThunk(
  'db/deleteVariant',
  async (id: string) => {
    await api.delete(`/data/variants/${id}`);
    return id;
  }
);

export const addSale = createAsyncThunk(
  'db/addSale',
  async (sale: Sale, { dispatch }) => {
    const result = await api.post<Sale>('/data/sales', sale);
    dispatch(fetchInitialData()); // Sync variant stocks
    return result;
  }
);

export const deleteSale = createAsyncThunk(
  'db/deleteSale',
  async (id: string, { dispatch }) => {
    await api.delete(`/data/sales/${id}`);
    dispatch(fetchInitialData()); // Sync variant stocks
    return id;
  }
);

export const updateSale = createAsyncThunk(
  'db/updateSale',
  async (sale: Sale, { dispatch }) => {
    const result = await api.put<Sale>(`/data/sales/${sale.id}`, sale);
    dispatch(fetchInitialData());
    return result;
  }
);

export const addPurchase = createAsyncThunk(
  'db/addPurchase',
  async (purchase: Purchase, { dispatch }) => {
    const result = await api.post<Purchase>('/data/purchases', purchase);
    dispatch(fetchInitialData()); // Sync variant stocks and costs
    return result;
  }
);

export const deletePurchase = createAsyncThunk(
  'db/deletePurchase',
  async (id: string, { dispatch }) => {
    await api.delete(`/data/purchases/${id}`);
    dispatch(fetchInitialData()); // Sync variant stocks
    return id;
  }
);

export const addAdjustment = createAsyncThunk(
  'db/addAdjustment',
  async (log: StockAdjustmentLog, { dispatch }) => {
    const result = await api.post<StockAdjustmentLog>('/data/adjustments', log);
    dispatch(fetchInitialData()); // Sync variant stocks
    return result;
  }
);

export const addExpense = createAsyncThunk(
  'db/addExpense',
  async (expense: Expense) => {
    return await api.post<Expense>('/data/expenses', expense);
  }
);

export const updateExpense = createAsyncThunk(
  'db/updateExpense',
  async (expense: Expense) => {
    return await api.put<Expense>(`/data/expenses/${expense.id}`, expense);
  }
);

export const deleteExpense = createAsyncThunk(
  'db/deleteExpense',
  async (id: string) => {
    await api.delete(`/data/expenses/${id}`);
    return id;
  }
);

export const slaughterConversion = createAsyncThunk(
  'db/slaughterConversion',
  async (payload: {
    liveVariantId: string;
    fleshVariantId: string;
    hensCount: number;
    hensWeight: number;
    fleshWeight: number;
    fleshCost: number;
    logReason: string;
  }, { dispatch }) => {
    const result = await api.post<any>('/data/slaughter', payload);
    dispatch(fetchInitialData()); // Sync variant stocks and adjustments
    return result;
  }
);

export const addUnit = createAsyncThunk(
  'db/addUnit',
  async (unit: Unit) => {
    return await api.post<Unit>('/data/units', unit);
  }
);

export const deleteUnit = createAsyncThunk(
  'db/deleteUnit',
  async (id: string) => {
    await api.delete(`/data/units/${id}`);
    return id;
  }
);

export const fetchShopUsers = createAsyncThunk(
  'db/fetchShopUsers',
  async () => {
    return await api.get<User[]>('/auth/staff');
  }
);

export const addShopUser = createAsyncThunk(
  'db/addShopUser',
  async (user: User) => {
    return await api.post<User>('/auth/staff', user);
  }
);

export const deleteShopUser = createAsyncThunk(
  'db/deleteShopUser',
  async (id: string) => {
    await api.delete(`/auth/staff/${id}`);
    return id;
  }
);

const initialState: DatabaseState & { error: string | null } = {
  ...loadState(),
  error: null
};

const dbSlice = createSlice({
  name: 'db',
  initialState,
  reducers: {
    clearDbError(state) {
      state.error = null;
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInitialData.fulfilled, (state, action) => {
        if (action.payload) {
          state.categories = action.payload.categories || [];
          state.subcategories = action.payload.subcategories || [];
          state.products = action.payload.products || [];
          state.variants = action.payload.variants || [];
          state.sales = action.payload.sales || [];
          state.purchases = action.payload.purchases || [];
          state.expenses = action.payload.expenses || [];
          state.adjustments = action.payload.adjustments || [];
          state.units = action.payload.units || [];
        }
      })
      .addCase(addCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const idx = state.categories.findIndex(c => c.id === action.payload.id);
        if (idx !== -1) {
          state.categories[idx] = action.payload;
        }
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(c => c.id !== action.payload);
      })
      .addCase(addSubcategory.fulfilled, (state, action) => {
        state.subcategories.push(action.payload);
      })
      .addCase(deleteSubcategory.fulfilled, (state, action) => {
        state.subcategories = state.subcategories.filter(sc => sc.id !== action.payload);
      })
      .addCase(addProduct.fulfilled, (state, action) => {
        state.products.push(action.payload.product);
        state.variants.push(...action.payload.variants);
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const idx = state.products.findIndex(p => p.id === action.payload.product.id);
        if (idx !== -1) {
          state.products[idx] = action.payload.product;
        }
        // Replace old variants for this product
        state.variants = state.variants.filter(v => v.productId !== action.payload.product.id);
        state.variants.push(...action.payload.variants);
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter(p => p.id !== action.payload);
        state.variants = state.variants.filter(v => v.productId !== action.payload);
      })
      .addCase(addSale.fulfilled, (state, action) => {
        state.sales.push(action.payload);
      })
      .addCase(deleteSale.fulfilled, (state, action) => {
        state.sales = state.sales.filter(s => s.id !== action.payload);
      })
      .addCase(addPurchase.fulfilled, (state, action) => {
        state.purchases.push(action.payload);
      })
      .addCase(deletePurchase.fulfilled, (state, action) => {
        state.purchases = state.purchases.filter(p => p.id !== action.payload);
      })
      .addCase(addAdjustment.fulfilled, (state, action) => {
        state.adjustments.push(action.payload);
      })
      .addCase(addExpense.fulfilled, (state, action) => {
        state.expenses.push(action.payload);
      })
      .addCase(updateExpense.fulfilled, (state, action) => {
        const idx = state.expenses.findIndex(e => e.id === action.payload.id);
        if (idx !== -1) {
          state.expenses[idx] = action.payload;
        }
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.filter(e => e.id !== action.payload);
      })
      .addCase(addUnit.fulfilled, (state, action) => {
        state.units.push(action.payload);
      })
      .addCase(deleteUnit.fulfilled, (state, action) => {
        state.units = state.units.filter(u => u.id !== action.payload);
      })
      .addCase(updateSubcategory.fulfilled, (state, action) => {
        const idx = state.subcategories.findIndex(sc => sc.id === action.payload.id);
        if (idx !== -1) {
          state.subcategories[idx] = action.payload;
        }
      })
      .addCase(updateSale.fulfilled, (state, action) => {
        const idx = state.sales.findIndex(s => s.id === action.payload.id);
        if (idx !== -1) {
          state.sales[idx] = action.payload;
        }
      })
      .addCase(addVariant.fulfilled, (state, action) => {
        state.variants.push(action.payload);
      })
      .addCase(updateVariant.fulfilled, (state, action) => {
        const idx = state.variants.findIndex(v => v.id === action.payload.id);
        if (idx !== -1) {
          state.variants[idx] = action.payload;
        }
      })
      .addCase(deleteVariant.fulfilled, (state, action) => {
        state.variants = state.variants.filter(v => v.id !== action.payload);
      })
      .addCase(fetchShopUsers.fulfilled, (state, action) => {
        state.users = action.payload || [];
      })
      .addCase(addShopUser.fulfilled, (state, action) => {
        state.users.push(action.payload);
      })
      .addCase(deleteShopUser.fulfilled, (state, action) => {
        state.users = state.users.filter(u => u.id !== action.payload);
      })
      .addMatcher(
        (action) => action.type.endsWith('/rejected'),
        (state, action: any) => {
          state.error = action.payload || action.error?.message || 'Database transaction failed';
        }
      );
  }
});

export const {
  clearDbError,
  restoreDatabase,
  markNotificationsAsRead
} = dbSlice.actions;

export default dbSlice.reducer;
