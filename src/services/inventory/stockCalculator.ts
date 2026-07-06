import { Product } from '../../types/product.types';
import { ProductVariant } from '../../types/variant.types';
import { LowStockAlert } from '../../types/inventory.types';

export const stockCalculator = {
  calculateTotalStockValueAtCost(variants: ProductVariant[], products?: Product[]): number {
    const prodMap = new Map(products?.map(p => [p.id, p]) || []);
    const variantsByProduct: { [productId: string]: ProductVariant[] } = {};
    variants.forEach(v => {
      if (!variantsByProduct[v.productId]) {
        variantsByProduct[v.productId] = [];
      }
      variantsByProduct[v.productId].push(v);
    });

    let total = 0;
    Object.entries(variantsByProduct).forEach(([productId, prodVariants]) => {
      const prod = prodMap.get(productId);
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
          const isHens = v.name.toLowerCase().includes('hen') || 
                         v.name.toLowerCase().includes('live') ||
                         prod?.name.toLowerCase().includes('hen') ||
                         prod?.name.toLowerCase().includes('live');
          
          if (isHens && v.weightStock !== undefined && v.weightStock > 0) {
            total += v.cost * v.weightStock;
          } else {
            total += v.cost * v.stock;
          }
        });
      }
    });
    return total;
  },

  calculateTotalStockValueAtRetail(variants: ProductVariant[], products?: Product[]): number {
    const prodMap = new Map(products?.map(p => [p.id, p]) || []);
    const variantsByProduct: { [productId: string]: ProductVariant[] } = {};
    variants.forEach(v => {
      if (!variantsByProduct[v.productId]) {
        variantsByProduct[v.productId] = [];
      }
      variantsByProduct[v.productId].push(v);
    });

    let total = 0;
    Object.entries(variantsByProduct).forEach(([productId, prodVariants]) => {
      const prod = prodMap.get(productId);
      if (prod && prod.hasSharedStock) {
        if (prodVariants.length > 0) {
          const anyVar = prodVariants[0];
          const baseStock = anyVar.stock * (anyVar.conversionFactor || 1);
          const costVar = prodVariants.find(v => v.purpose === 'buy' || v.purpose === 'both') || anyVar;
          const priceVar = prodVariants.find(v => v.purpose === 'sell' || v.purpose === 'both') || anyVar;
          
          if (priceVar.purpose !== 'buy') {
            const retailPricePerBaseUnit = priceVar.price / (priceVar.conversionFactor || 1);
            total += baseStock * retailPricePerBaseUnit;
          } else {
            // Raw ingredient fallback (40% markup on cost)
            total += baseStock * ((costVar.cost * 1.4) / (costVar.conversionFactor || 1));
          }
        }
      } else {
        prodVariants.forEach(v => {
          const isHens = v.name.toLowerCase().includes('hen') || 
                         v.name.toLowerCase().includes('live') ||
                         prod?.name.toLowerCase().includes('hen') ||
                         prod?.name.toLowerCase().includes('live');
          
          if (isHens && v.weightStock !== undefined && v.weightStock > 0) {
            total += (v.cost * 1.4) * v.weightStock;
          } else {
            if (v.purpose !== 'buy') {
              total += v.price * v.stock;
            } else {
              // Raw ingredient fallback (40% markup on cost)
              total += (v.cost * 1.4) * v.stock;
            }
          }
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
        const isHens = variant.name.toLowerCase().includes('hen') || 
                       variant.name.toLowerCase().includes('live') ||
                       product.name.toLowerCase().includes('hen') ||
                       product.name.toLowerCase().includes('live') ||
                       variant.variantUnit?.toLowerCase() === 'pcs';
        const isLow = (() => {
          if (isHens && variant.weightStock !== undefined) {
            return variant.weightStock <= variant.lowStockThreshold;
          }
          if (product.hasSharedStock && variant.purpose === 'buy') {
            const baseStock = variant.stock * (variant.conversionFactor || 1);
            return baseStock <= variant.lowStockThreshold;
          }
          return variant.stock <= variant.lowStockThreshold;
        })();
        if (isLow) {
          alerts.push({
            productId: variant.productId,
            variantId: variant.id,
            productName: product.name,
            variantName: variant.name,
            currentStock: isHens && variant.weightStock !== undefined ? variant.weightStock : variant.stock,
            threshold: variant.lowStockThreshold
          });
        }
      }
    });

    return alerts;
  }
};
