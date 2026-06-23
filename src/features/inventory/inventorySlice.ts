import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import { stockCalculator } from '../../services/inventory/stockCalculator';
import { addAdjustment } from '../db/dbSlice';

// Re-export adjustment actions
export { addAdjustment };

// Selectors
const selectProducts = (state: RootState) => state.db.products;
const selectVariants = (state: RootState) => state.db.variants;
const selectAdjustments = (state: RootState) => state.db.adjustments;

export const selectLowStockAlerts = createSelector(
  [selectProducts, selectVariants],
  (products, variants) => stockCalculator.getLowStockAlerts(products, variants)
);

export const selectInventoryValuation = createSelector(
  [selectProducts, selectVariants],
  (products, variants) => ({
    totalItems: variants.length,
    totalValueAtCost: stockCalculator.calculateTotalStockValueAtCost(variants, products),
    totalValueAtRetail: stockCalculator.calculateTotalStockValueAtRetail(variants, products),
    potentialProfit: stockCalculator.calculatePotentialProfit(variants, products),
  })
);

export const selectAdjustmentLogs = createSelector(
  [selectAdjustments, selectProducts, selectVariants],
  (adjustments, products, variants) => {
    return adjustments.map(log => {
      const product = products.find(p => p.id === log.productId);
      const variant = variants.find(v => v.id === log.variantId);
      return {
        ...log,
        productName: product ? product.name : 'Unknown Product',
        variantName: variant ? variant.name : 'Default',
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
);
