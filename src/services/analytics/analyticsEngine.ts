import { Sale } from '../../types/sale.types';
import { Expense } from '../../types/expense.types';
import { Product } from '../../types/product.types';
import { ProductVariant } from '../../types/variant.types';
import { Category } from '../../types/category.types';
import { DashboardStats } from '../../types/dashboard.types';
import { ChartDataPoint, CategoryContribution, ProductPerformance } from '../../types/analytics.types';
import { Purchase } from '../../types/purchase.types';

export const analyticsEngine = {
  adjustPreparedDate(dateStr: string): string {
    return new Date(dateStr).toDateString();
  },

  getDashboardStats(sales: Sale[], expenses: Expense[], variants: ProductVariant[], products: Product[]): DashboardStats {
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    let todaySales = 0;
    let todayCostOfGoods = 0;
    let todayTxCount = 0;
    let yesterdaySales = 0;
    let yesterdayCostOfGoods = 0;

    sales.forEach(sale => {
      const saleDate = new Date(sale.saleDate).toDateString();

      // Calculate Cost of Goods Sold for this sale
      let saleCost = 0;
      sale.items.forEach(item => {
        const variant = variants.find(v => v.id === item.variantId);
        if (variant) {
          saleCost += variant.cost * item.quantity;
        }
      });

      if (saleDate === today) {
        todaySales += sale.totalAmount;
        todayCostOfGoods += saleCost;
        todayTxCount++;
      } else if (saleDate === yesterdayStr) {
        yesterdaySales += sale.totalAmount;
        yesterdayCostOfGoods += saleCost;
      }
    });

    let todayExpenses = 0;
    let yesterdayExpenses = 0;

    expenses.forEach(exp => {
      const expDate = new Date(exp.expenseDate).toDateString();
      if (expDate === today) {
        todayExpenses += exp.amount;
      } else if (expDate === yesterdayStr) {
        yesterdayExpenses += exp.amount;
      }
    });

    const todayProfit = todaySales - todayCostOfGoods - todayExpenses;
    const yesterdayProfit = yesterdaySales - yesterdayCostOfGoods - yesterdayExpenses;

    // Growth percentages
    const salesGrowth = yesterdaySales === 0 ? (todaySales > 0 ? 100 : 0) : ((todaySales - yesterdaySales) / yesterdaySales) * 100;
    const profitGrowth = yesterdayProfit === 0 ? (todayProfit > 0 ? 100 : 0) : ((todayProfit - yesterdayProfit) / Math.abs(yesterdayProfit)) * 100;

    const lowStockItemsCount = variants.filter(v => {
      const prod = products.find(p => p.id === v.productId);
      if (!prod || prod.isStockTracked === false) return false;
      const isHens = v.name.toLowerCase().includes('hen') || 
                     v.name.toLowerCase().includes('live') ||
                     prod.name.toLowerCase().includes('hen') ||
                     prod.name.toLowerCase().includes('live') ||
                     v.variantUnit?.toLowerCase() === 'pcs';
      const isLow = (() => {
        if (isHens && v.weightStock !== undefined) {
          return v.weightStock <= v.lowStockThreshold;
        }
        if (prod.hasSharedStock && v.purpose === 'buy') {
          const baseStock = v.stock * (v.conversionFactor || 1);
          return baseStock <= v.lowStockThreshold;
        }
        return v.stock <= v.lowStockThreshold;
      })();
      return isLow;
    }).length;

    return {
      todaySales,
      todayProfit,
      todayExpenses,
      todayTransactionsCount: todayTxCount,
      lowStockItemsCount,
      salesGrowthPercentage: Math.round(salesGrowth),
      profitGrowthPercentage: Math.round(profitGrowth)
    };
  },

  getSalesTrend(sales: Sale[], days: number = 7): ChartDataPoint[] {
    const trend: { [label: string]: number } = {};

    // Initialize last N days
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const label = date.toLocaleDateString('en-US', { weekday: 'short' });
      trend[label] = 0;
    }

    sales.forEach(sale => {
      const date = new Date(sale.saleDate);
      const daysDiff = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff <= days) {
        const label = date.toLocaleDateString('en-US', { weekday: 'short' });
        if (trend[label] !== undefined) {
          trend[label] += sale.totalAmount;
        }
      }
    });

    return Object.keys(trend).map(key => ({ label: key, value: trend[key] }));
  },

  getCategoryPerformance(sales: Sale[], products: Product[], categories: Category[]): CategoryContribution[] {
    const catSales: { [catId: string]: number } = {};
    let totalSalesVal = 0;

    sales.forEach(sale => {
      sale.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          const itemVal = item.unitPrice * item.quantity - (item.discount || 0);
          catSales[prod.categoryId] = (catSales[prod.categoryId] || 0) + itemVal;
          totalSalesVal += itemVal;
        }
      });
    });

    return categories.map(cat => {
      const salesAmount = catSales[cat.id] || 0;
      const percentage = totalSalesVal === 0 ? 0 : Math.round((salesAmount / totalSalesVal) * 100);
      return {
        categoryName: cat.name,
        salesAmount,
        percentage
      };
    }).sort((a, b) => b.salesAmount - a.salesAmount);
  },

  getTopProducts(sales: Sale[], products: Product[]): ProductPerformance[] {
    const prodPerformance: { [prodId: string]: { qty: number; rev: number } } = {};

    sales.forEach(sale => {
      sale.items.forEach(item => {
        const itemVal = item.unitPrice * item.quantity - (item.discount || 0);
        if (!prodPerformance[item.productId]) {
          prodPerformance[item.productId] = { qty: 0, rev: 0 };
        }
        prodPerformance[item.productId].qty += item.quantity;
        prodPerformance[item.productId].rev += itemVal;
      });
    });

    return Object.keys(prodPerformance).map(prodId => {
      const prod = products.find(p => p.id === prodId);
      return {
        productName: prod ? prod.name : 'Unknown Product',
        quantitySold: prodPerformance[prodId].qty,
        revenue: prodPerformance[prodId].rev
      };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  },

  getModeDashboardStats(
    mode: 'prepared' | 'exchanged',
    sales: Sale[],
    purchases: Purchase[],
    variants: ProductVariant[],
    products: Product[],
    categories: Category[]
  ) {
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const catMap = new Map(categories.map(c => [c.id, c]));
    const prodMap = new Map(products.map(p => [p.id, p]));

    let todaySales = 0;
    let todayCost = 0;
    let yesterdaySales = 0;
    let yesterdayCost = 0;
    let todayTxCount = 0;

    sales.forEach(sale => {
      const saleDate = new Date(sale.saleDate).toDateString();
      let saleSales = 0;
      let saleCost = 0;

      sale.items.forEach(item => {
        const prod = prodMap.get(item.productId);
        if (!prod) return;
        const cat = catMap.get(prod.categoryId);
        if (!cat || cat.type !== mode) return;

        const itemVal = item.unitPrice * item.quantity - (item.discount || 0);
        saleSales += itemVal;

        if (mode === 'exchanged') {
          const variant = variants.find(v => v.id === item.variantId);
          if (variant) {
            saleCost += variant.cost * item.quantity;
          }
        }
      });

      if (saleSales > 0) {
        if (saleDate === today) {
          todaySales += saleSales;
          todayCost += saleCost;
          todayTxCount++;
        } else if (saleDate === yesterdayStr) {
          yesterdaySales += saleSales;
          yesterdayCost += saleCost;
        }
      }
    });

    if (mode === 'prepared') {
      purchases.forEach(pur => {
        if (pur.type !== 'prepared') return;
        const cat = catMap.get(pur.categoryId || '');
        if (!cat || cat.type !== 'prepared') return;

        const purDate = analyticsEngine.adjustPreparedDate(pur.purchaseDate);
        if (purDate === today) {
          todayCost += pur.totalAmount;
        } else if (purDate === yesterdayStr) {
          yesterdayCost += pur.totalAmount;
        }
      });
    }

    let todayPurchases = 0;
    let yesterdayPurchases = 0;
    purchases.forEach(pur => {
      const purDate = pur.type === 'prepared' ? analyticsEngine.adjustPreparedDate(pur.purchaseDate) : new Date(pur.purchaseDate).toDateString();
      if (mode === 'prepared' && pur.type === 'prepared') {
        const cat = catMap.get(pur.categoryId || '');
        if (cat && cat.type === 'prepared') {
          if (purDate === today) todayPurchases += pur.totalAmount;
          else if (purDate === yesterdayStr) yesterdayPurchases += pur.totalAmount;
        }
      } else if (mode === 'exchanged' && pur.type !== 'prepared') {
        if (purDate === today) todayPurchases += pur.totalAmount;
        else if (purDate === yesterdayStr) yesterdayPurchases += pur.totalAmount;
      }
    });

    const todayProfit = todaySales - todayCost;
    const yesterdayProfit = yesterdaySales - yesterdayCost;

    const salesGrowth = yesterdaySales === 0 ? (todaySales > 0 ? 100 : 0) : ((todaySales - yesterdaySales) / yesterdaySales) * 100;
    const profitGrowth = yesterdayProfit === 0 ? (todayProfit > 0 ? 100 : 0) : ((todayProfit - yesterdayProfit) / Math.abs(yesterdayProfit)) * 100;

    let statusValue = 0;
    if (mode === 'exchanged') {
      statusValue = variants.filter(v => {
        const prod = prodMap.get(v.productId);
        if (!prod || prod.isStockTracked === false) return false;
        const cat = catMap.get(prod.categoryId);
        const isHens = v.name.toLowerCase().includes('hen') || 
                       v.name.toLowerCase().includes('live') ||
                       prod.name.toLowerCase().includes('hen') ||
                       prod.name.toLowerCase().includes('live') ||
                       v.variantUnit?.toLowerCase() === 'pcs';
        const isLow = (() => {
          if (isHens && v.weightStock !== undefined) {
            return v.weightStock <= v.lowStockThreshold;
          }
          if (prod.hasSharedStock && v.purpose === 'buy') {
            const baseStock = v.stock * (v.conversionFactor || 1);
            return baseStock <= v.lowStockThreshold;
          }
          return v.stock <= v.lowStockThreshold;
        })();
        return cat?.type === 'exchanged' && isLow;
      }).length;
    } else {
      statusValue = categories.filter(c => c.type === 'prepared').length;
    }

    return {
      todaySales,
      todayCost,
      todayProfit,
      todayTransactionsCount: todayTxCount,
      statusValue,
      salesGrowthPercentage: Math.round(salesGrowth),
      profitGrowthPercentage: Math.round(profitGrowth),
      todayPurchases,
      yesterdayPurchases
    };
  },

  getModeCategoryBreakdown(
    mode: 'prepared' | 'exchanged',
    sales: Sale[],
    purchases: Purchase[],
    variants: ProductVariant[],
    products: Product[],
    categories: Category[]
  ) {
    const today = new Date().toDateString();
    const catMap = new Map(categories.map(c => [c.id, c]));
    const prodMap = new Map(products.map(p => [p.id, p]));

    const breakdown: { [catId: string]: { sales: number; cost: number; profit: number } } = {};
    const filteredCategories = categories.filter(c => c.type === mode);

    filteredCategories.forEach(cat => {
      breakdown[cat.id] = { sales: 0, cost: 0, profit: 0 };
    });

    sales.forEach(sale => {
      const saleDate = new Date(sale.saleDate).toDateString();
      if (saleDate !== today) return;

      sale.items.forEach(item => {
        const prod = prodMap.get(item.productId);
        if (!prod) return;
        const cat = catMap.get(prod.categoryId);
        if (!cat || cat.type !== mode) return;

        const itemVal = item.unitPrice * item.quantity - (item.discount || 0);
        breakdown[cat.id].sales += itemVal;

        if (mode === 'exchanged') {
          const variant = variants.find(v => v.id === item.variantId);
          if (variant) {
            breakdown[cat.id].cost += variant.cost * item.quantity;
          }
        }
      });
    });

    if (mode === 'prepared') {
      purchases.forEach(pur => {
        if (pur.type !== 'prepared' || !pur.categoryId) return;
        const cat = catMap.get(pur.categoryId);
        if (!cat || cat.type !== 'prepared') return;

        const purDate = analyticsEngine.adjustPreparedDate(pur.purchaseDate);
        if (purDate !== today) return;

        breakdown[pur.categoryId].cost += pur.totalAmount;
      });
    }

    filteredCategories.forEach(cat => {
      const data = breakdown[cat.id];
      data.profit = data.sales - data.cost;
    });

    return filteredCategories.map(cat => ({
      categoryId: cat.id,
      categoryName: cat.name,
      color: cat.color,
      sales: breakdown[cat.id].sales,
      cost: breakdown[cat.id].cost,
      profit: breakdown[cat.id].profit
    }));
  },

  getModeSalesTrend(
    mode: 'prepared' | 'exchanged',
    sales: Sale[],
    products: Product[],
    categories: Category[],
    days: number = 7
  ): ChartDataPoint[] {
    const trend: { [label: string]: number } = {};
    const catMap = new Map(categories.map(c => [c.id, c]));
    const prodMap = new Map(products.map(p => [p.id, p]));

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const label = date.toLocaleDateString('en-US', { weekday: 'short' });
      trend[label] = 0;
    }

    sales.forEach(sale => {
      const date = new Date(sale.saleDate);
      const daysDiff = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff <= days) {
        const label = date.toLocaleDateString('en-US', { weekday: 'short' });
        if (trend[label] !== undefined) {
          let saleValForMode = 0;
          sale.items.forEach(item => {
            const prod = prodMap.get(item.productId);
            if (!prod) return;
            const cat = catMap.get(prod.categoryId);
            if (cat && cat.type === mode) {
              saleValForMode += item.unitPrice * item.quantity - (item.discount || 0);
            }
          });
          trend[label] += saleValForMode;
        }
      }
    });

    return Object.keys(trend).map(key => ({ label: key, value: trend[key] }));
  },

  getModeTopProducts(
    mode: 'prepared' | 'exchanged',
    sales: Sale[],
    products: Product[],
    categories: Category[]
  ): ProductPerformance[] {
    const prodPerformance: { [prodId: string]: { qty: number; rev: number } } = {};
    const catMap = new Map(categories.map(c => [c.id, c]));
    const prodMap = new Map(products.map(p => [p.id, p]));

    sales.forEach(sale => {
      sale.items.forEach(item => {
        const prod = prodMap.get(item.productId);
        if (!prod) return;
        const cat = catMap.get(prod.categoryId);
        if (!cat || cat.type !== mode) return;

        const itemVal = item.unitPrice * item.quantity - (item.discount || 0);
        if (!prodPerformance[item.productId]) {
          prodPerformance[item.productId] = { qty: 0, rev: 0 };
        }
        prodPerformance[item.productId].qty += item.quantity;
        prodPerformance[item.productId].rev += itemVal;
      });
    });

    return Object.keys(prodPerformance).map(prodId => {
      const prod = prodMap.get(prodId);
      return {
        productName: prod ? prod.name : 'Unknown Product',
        quantitySold: prodPerformance[prodId].qty,
        revenue: prodPerformance[prodId].rev
      };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }
};
