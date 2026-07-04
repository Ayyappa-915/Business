import { ProductVariant } from '../../types/variant.types';
import { SaleItem } from '../../types/sale.types';
import { PurchaseItem } from '../../types/purchase.types';
import { StockAdjustmentLog } from '../../types/inventory.types';
import { Product } from '../../types/product.types';

export const inventoryEngine = {
  applySale(variants: ProductVariant[], items: SaleItem[], products?: Product[]): ProductVariant[] {
    return variants.map(variant => {
      const prod = products?.find(p => p.id === variant.productId);
      const isStockTracked = prod ? prod.isStockTracked !== false : true;
      if (!isStockTracked) return variant;

      if (prod && prod.hasSharedStock) {
        // Find all sale items for variants of this product
        const productSaleItems = items.filter(item => {
          const v = variants.find(varItem => varItem.id === item.variantId);
          return v && v.productId === prod.id;
        });

        if (productSaleItems.length === 0) return variant;

        // Calculate total base quantity sold
        const totalBaseSold = productSaleItems.reduce((sum, item) => {
          const v = variants.find(varItem => varItem.id === item.variantId);
          return sum + item.quantity * (v?.conversionFactor || 1);
        }, 0);

        const currentBaseStock = variant.stock * (variant.conversionFactor || 1);
        const newBaseStock = Math.max(0, currentBaseStock - totalBaseSold);
        
        return {
          ...variant,
          stock: newBaseStock / (variant.conversionFactor || 1),
          updatedAt: new Date().toISOString()
        };
      } else {
        // Independent stock
        const saleItem = items.find(item => item.variantId === variant.id);
        if (saleItem) {
          const isHens = variant.name.toLowerCase().includes('hen') || 
                         variant.name.toLowerCase().includes('live') ||
                         prod?.name.toLowerCase().includes('hen') ||
                         prod?.name.toLowerCase().includes('live') ||
                         variant.variantUnit?.toLowerCase() === 'pcs' ||
                         prod?.unitId?.toLowerCase() === 'pcs';

          if (isHens) {
            const avgWeight = (variant.stock > 0 && variant.weightStock) 
              ? variant.weightStock / variant.stock 
              : 3.33;

            const soldByWeight = prod?.unitId === 'kg' || !Number.isInteger(saleItem.quantity) || saleItem.quantity > 50; 
            
            let piecesReduced = 0;
            let weightReduced = 0;

            if (soldByWeight) {
              weightReduced = saleItem.quantity;
              piecesReduced = Math.round(saleItem.quantity / avgWeight) || 1;
            } else {
              piecesReduced = saleItem.quantity;
              weightReduced = saleItem.quantity * avgWeight;
            }

            return {
              ...variant,
              stock: Math.max(0, variant.stock - piecesReduced),
              weightStock: Math.max(0, (variant.weightStock || 0) - weightReduced),
              updatedAt: new Date().toISOString()
            };
          }

          return {
            ...variant,
            stock: Math.max(0, variant.stock - saleItem.quantity),
            updatedAt: new Date().toISOString()
          };
        }
      }
      return variant;
    });
  },

  applyPurchase(variants: ProductVariant[], items: PurchaseItem[], products?: Product[]): ProductVariant[] {
    return variants.map(variant => {
      const prod = products?.find(p => p.id === variant.productId);
      const isStockTracked = prod ? prod.isStockTracked !== false : true;

      if (prod && prod.hasSharedStock) {
        // Find all purchase items for variants of this product
        const productPurchaseItems = items.filter(item => {
          const v = variants.find(varItem => varItem.id === item.variantId);
          return v && v.productId === prod.id;
        });

        if (productPurchaseItems.length === 0) return variant;

        // Calculate total base quantity purchased
        const totalBasePurchased = productPurchaseItems.reduce((sum, item) => {
          const v = variants.find(varItem => varItem.id === item.variantId);
          return sum + item.quantity * (v?.conversionFactor || 1);
        }, 0);

        // Update cost price dynamically based on latest purchase cost per base unit
        const directPurchaseItem = productPurchaseItems.find(item => item.variantId === variant.id);
        let updatedCost = variant.cost;
        
        if (directPurchaseItem) {
          updatedCost = directPurchaseItem.costPrice;
        } else {
          // If another variant of this product was purchased, we scale its cost to this variant
          const anyPurchaseItem = productPurchaseItems[0];
          const vPurchased = variants.find(varItem => varItem.id === anyPurchaseItem.variantId);
          if (vPurchased) {
            const baseCost = anyPurchaseItem.costPrice / (vPurchased.conversionFactor || 1);
            updatedCost = baseCost * (variant.conversionFactor || 1);
          }
        }

        if (!isStockTracked) {
          return {
            ...variant,
            cost: updatedCost,
            updatedAt: new Date().toISOString()
          };
        }

        const currentBaseStock = variant.stock * (variant.conversionFactor || 1);
        const newBaseStock = currentBaseStock + totalBasePurchased;

        return {
          ...variant,
          stock: newBaseStock / (variant.conversionFactor || 1),
          cost: updatedCost,
          updatedAt: new Date().toISOString()
        };
      } else {
        // Independent stock
        const purchaseItem = items.find(item => item.variantId === variant.id);
        if (purchaseItem) {
          if (!isStockTracked) {
            return {
              ...variant,
              cost: purchaseItem.costPrice,
              updatedAt: new Date().toISOString()
            };
          }
          const isHens = variant.name.toLowerCase().includes('hen') || 
                         variant.name.toLowerCase().includes('live') ||
                         prod?.name.toLowerCase().includes('hen') ||
                         prod?.name.toLowerCase().includes('live') ||
                         variant.variantUnit?.toLowerCase() === 'pcs' ||
                         prod?.unitId?.toLowerCase() === 'pcs';
          return {
            ...variant,
            stock: variant.stock + (isHens ? (purchaseItem.pieces !== undefined ? purchaseItem.pieces : Math.round(purchaseItem.quantity / 3.33)) : purchaseItem.quantity),
            weightStock: (variant.weightStock || 0) + (isHens ? (purchaseItem.weight !== undefined ? purchaseItem.weight : purchaseItem.quantity) : 0),
            cost: purchaseItem.costPrice,
            updatedAt: new Date().toISOString()
          };
        }
      }
      return variant;
    });
  },

  applyAdjustment(variants: ProductVariant[], log: StockAdjustmentLog, products?: Product[]): ProductVariant[] {
    const targetVariant = variants.find(v => v.id === log.variantId);
    if (!targetVariant) return variants;

    const prod = products?.find(p => p.id === targetVariant.productId);
    const isShared = prod?.hasSharedStock;

    if (isShared) {
      const factor = targetVariant.conversionFactor || 1;
      const targetBaseStock = targetVariant.stock * factor;
      
      let newBaseStock = targetBaseStock;
      if (log.type === 'add') {
        newBaseStock += log.quantity * factor;
      } else if (log.type === 'subtract') {
        newBaseStock = Math.max(0, targetBaseStock - log.quantity * factor);
      } else if (log.type === 'set') {
        newBaseStock = log.quantity * factor;
      }

      return variants.map(variant => {
        if (variant.productId === targetVariant.productId) {
          return {
            ...variant,
            stock: newBaseStock / (variant.conversionFactor || 1),
            updatedAt: new Date().toISOString()
          };
        }
        return variant;
      });
    } else {
      // Non-shared, independent adjustment
      return variants.map(variant => {
        if (variant.id === log.variantId) {
          let newStock = variant.stock;
          let newWeightStock = variant.weightStock || 0;

          const isHens = variant.name.toLowerCase().includes('hen') || 
                         variant.name.toLowerCase().includes('live') ||
                         prod?.name.toLowerCase().includes('hen') ||
                         prod?.name.toLowerCase().includes('live') ||
                         variant.variantUnit?.toLowerCase() === 'pcs' ||
                         prod?.unitId?.toLowerCase() === 'pcs';

          const avgWeight = (variant.stock > 0 && variant.weightStock) 
            ? variant.weightStock / variant.stock 
            : 3.33;

          const estWeight = log.weight !== undefined ? log.weight : (isHens ? log.quantity * avgWeight : 0);

          if (log.type === 'add') {
            newStock += log.quantity;
            newWeightStock += estWeight;
          } else if (log.type === 'subtract') {
            newStock = Math.max(0, variant.stock - log.quantity);
            newWeightStock = Math.max(0, newWeightStock - estWeight);
          } else if (log.type === 'set') {
            newStock = log.quantity;
            newWeightStock = log.weight !== undefined ? log.weight : (isHens ? log.quantity * avgWeight : 0);
          }
          return {
            ...variant,
            stock: newStock,
            weightStock: newWeightStock,
            updatedAt: new Date().toISOString()
          };
        }
        return variant;
      });
    }
  }
};
