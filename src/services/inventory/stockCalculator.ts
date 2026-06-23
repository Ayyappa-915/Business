import { Product } from '../../types/product.types';
import { ProductVariant } from '../../types/variant.types';
import { LowStockAlert } from '../../types/inventory.types';

export const stockCalculator = {
  calculateTotalStockValueAtCost(variants: ProductVariant[], products?: Product[]): number {
    const variantsByProduct: { [productId: string]: ProductVariant[] } = {};
    variants.forEach(v => {
      if (!variantsByProduct[v.productId]) {
        variantsByProduct[v.productId] = [];
      }
      variantsByProduct[v.productId].push(v);
    });

    let total = 0;
    Object.entries(variantsByProduct).forEach(([productId, prodVariants]) => {
      const prod = products?.find(p => p.id === productId);
      if (prod && prod.hasSharedStock) {
        if (prodVariants.length > 0) {
          const anyVar = prodVariants[0];
          const baseStock = anyVar.stock * (anyVar.conversionFactor || 1);
          const costVar = prodVariants.find(v => v.purpose === 'buy' || v.purpose === 'both') || anyVar;
          const costPerBaseUnit = costVar.cost / (costVar.conversionFactor || 1);
          total += baseStock * costPerBaseUnit;
        }
      } else {
        prodVariants.forEach(v => {
          total += v.cost * v.stock;
        });
      }
    });
    return total;
  },

  calculateTotalStockValueAtRetail(variants: ProductVariant[], products?: Product[]): number {
    const variantsByProduct: { [productId: string]: ProductVariant[] } = {};
    variants.forEach(v => {
      if (!variantsByProduct[v.productId]) {
        variantsByProduct[v.productId] = [];
      }
      variantsByProduct[v.productId].push(v);
    });

    let total = 0;
    Object.entries(variantsByProduct).forEach(([productId, prodVariants]) => {
      const prod = products?.find(p => p.id === productId);
      if (prod && prod.hasSharedStock) {
        if (prodVariants.length > 0) {
          const anyVar = prodVariants[0];
          const baseStock = anyVar.stock * (anyVar.conversionFactor || 1);
          const priceVar = prodVariants.find(v => v.purpose === 'sell' || v.purpose === 'both') || anyVar;
          const retailPricePerBaseUnit = priceVar.price / (priceVar.conversionFactor || 1);
          total += baseStock * retailPricePerBaseUnit;
        }
      } else {
        prodVariants.forEach(v => {
          total += v.price * v.stock;
        });
      }
    });
    return total;
  },

  calculatePotentialProfit(variants: ProductVariant[], products?: Product[]): number {
    const cost = this.calculateTotalStockValueAtCost(variants, products);
    const retail = this.calculateTotalStockValueAtRetail(variants, products);
    return retail - cost;
  },

  getLowStockAlerts(products: Product[], variants: ProductVariant[]): LowStockAlert[] {
    const alerts: LowStockAlert[] = [];
    
    variants.forEach(variant => {
      const product = products.find(p => p.id === variant.productId);
      if (product && product.isStockTracked !== false) {
        if (variant.stock <= variant.lowStockThreshold) {
          alerts.push({
            productId: variant.productId,
            variantId: variant.id,
            productName: product.name,
            variantName: variant.name,
            currentStock: variant.stock,
            threshold: variant.lowStockThreshold
          });
        }
      }
    });

    return alerts;
  }
};
