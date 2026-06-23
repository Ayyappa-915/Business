import { Sale } from '../../types/sale.types';
import { Expense } from '../../types/expense.types';
import { Product } from '../../types/product.types';
import { ProductVariant } from '../../types/variant.types';
import { DateRange } from '../../types/common.types';
import { Purchase } from '../../types/purchase.types';
import { Category } from '../../types/category.types';
import {
  SalesReportSummary,
  ExpenseReportSummary,
  InventoryValuationSummary,
  ProfitLossReportSummary
} from '../../types/report.types';

export const reportEngine = {
  isWithinRange(dateStr: string, range?: DateRange): boolean {
    if (!range) return true;
    const date = new Date(dateStr);
    const start = new Date(range.startDate);
    const end = new Date(range.endDate);

    // Set hours to start/end of day
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return date >= start && date <= end;
  },

  generateSalesReport(sales: Sale[], range?: DateRange): SalesReportSummary {
    let totalSales = 0;
    let totalTransactions = 0;
    const paymentMethodSplit = { cash: 0, upi: 0, card: 0, credit: 0 };

    sales.forEach(sale => {
      if (this.isWithinRange(sale.saleDate, range)) {
        totalSales += sale.totalAmount;
        totalTransactions++;
        paymentMethodSplit[sale.paymentMethod] = (paymentMethodSplit[sale.paymentMethod] || 0) + sale.totalAmount;
      }
    });

    return {
      totalSales,
      totalTransactions,
      averageTransactionValue: totalTransactions === 0 ? 0 : Math.round(totalSales / totalTransactions),
      paymentMethodSplit
    };
  },

  generateExpenseReport(expenses: Expense[], range?: DateRange): ExpenseReportSummary {
    let totalExpenses = 0;
    const categorySplit: { [category: string]: number } = {};

    expenses.forEach(exp => {
      if (this.isWithinRange(exp.expenseDate, range)) {
        totalExpenses += exp.amount;
        categorySplit[exp.category] = (categorySplit[exp.category] || 0) + exp.amount;
      }
    });

    return {
      totalExpenses,
      categorySplit
    };
  },

  generateInventoryReport(products: Product[], variants: ProductVariant[]): InventoryValuationSummary {
    let totalStockValueAtCost = 0;
    let totalStockValueAtRetail = 0;
    let trackedItemsCount = 0;

    variants.forEach(variant => {
      const prod = products.find(p => p.id === variant.productId);
      if (prod && prod.isStockTracked !== false) {
        totalStockValueAtCost += variant.cost * variant.stock;
        totalStockValueAtRetail += variant.price * variant.stock;
        trackedItemsCount++;
      }
    });

    return {
      totalItems: trackedItemsCount,
      totalStockValueAtCost,
      totalStockValueAtRetail,
      potentialProfit: totalStockValueAtRetail - totalStockValueAtCost
    };
  },

  generateProfitLossReport(
    sales: Sale[],
    expenses: Expense[],
    variants: ProductVariant[],
    purchases: Purchase[],
    products: Product[],
    range?: DateRange
  ): ProfitLossReportSummary {
    let grossRevenue = 0;
    let costOfGoodsSold = 0;

    const prodMap = new Map(products.map(p => [p.id, p]));

    sales.forEach(sale => {
      if (this.isWithinRange(sale.saleDate, range)) {
        grossRevenue += sale.totalAmount;
        sale.items.forEach(item => {
          const prod = prodMap.get(item.productId);
          if (prod && prod.isStockTracked !== false) {
            const variant = variants.find(v => v.id === item.variantId);
            if (variant) {
              costOfGoodsSold += variant.cost * item.quantity;
            }
          }
        });
      }
    });

    // Add prepared purchases inside the date range as part of COGS (material costs)
    purchases.forEach(pur => {
      if (pur.type === 'prepared' && this.isWithinRange(pur.purchaseDate, range)) {
        costOfGoodsSold += pur.totalAmount;
      }
    });

    let totalExpenses = 0;
    expenses.forEach(exp => {
      if (this.isWithinRange(exp.expenseDate, range)) {
        totalExpenses += exp.amount;
      }
    });

    let totalPurchases = 0;
    purchases.forEach(pur => {
      if (this.isWithinRange(pur.purchaseDate, range)) {
        totalPurchases += pur.totalAmount;
      }
    });

    const grossProfit = grossRevenue - costOfGoodsSold;
    const netProfit = grossProfit - totalExpenses;

    return {
      grossRevenue,
      costOfGoodsSold,
      grossProfit,
      totalExpenses,
      netProfit,
      totalPurchases
    };
  },

  generateModeProfitLossReport(
    mode: 'prepared' | 'exchanged',
    sales: Sale[],
    expenses: Expense[],
    variants: ProductVariant[],
    purchases: Purchase[],
    products: Product[],
    categories: Category[],
    range?: DateRange
  ): ProfitLossReportSummary {
    let grossRevenue = 0;
    let costOfGoodsSold = 0;

    const catMap = new Map(categories.map(c => [c.id, c]));
    const prodMap = new Map(products.map(p => [p.id, p]));

    sales.forEach(sale => {
      if (this.isWithinRange(sale.saleDate, range)) {
        let saleSales = 0;
        let saleCost = 0;

        sale.items.forEach(item => {
          const prod = prodMap.get(item.productId);
          if (!prod) return;
          const cat = catMap.get(prod.categoryId);
          if (!cat || cat.type !== mode) return;

          saleSales += item.unitPrice * item.quantity - (item.discount || 0);

          if (mode === 'exchanged') {
            const variant = variants.find(v => v.id === item.variantId);
            if (variant) {
              saleCost += variant.cost * item.quantity;
            }
          }
        });

        grossRevenue += saleSales;
        costOfGoodsSold += saleCost;
      }
    });

    if (mode === 'prepared') {
      purchases.forEach(pur => {
        if (pur.type === 'prepared' && this.isWithinRange(pur.purchaseDate, range)) {
          const cat = catMap.get(pur.categoryId || '');
          if (cat && cat.type === 'prepared') {
            costOfGoodsSold += pur.totalAmount;
          }
        }
      });
    }

    let totalExpenses = 0;
    expenses.forEach(exp => {
      if (this.isWithinRange(exp.expenseDate, range)) {
        totalExpenses += exp.amount;
      }
    });

    let totalPurchases = 0;
    purchases.forEach(pur => {
      if (this.isWithinRange(pur.purchaseDate, range)) {
        if (mode === 'prepared' && pur.type === 'prepared') {
          const cat = catMap.get(pur.categoryId || '');
          if (cat && cat.type === 'prepared') {
            totalPurchases += pur.totalAmount;
          }
        } else if (mode === 'exchanged' && pur.type !== 'prepared') {
          totalPurchases += pur.totalAmount;
        }
      }
    });

    const grossProfit = grossRevenue - costOfGoodsSold;
    const netProfit = grossProfit - totalExpenses;

    return {
      grossRevenue,
      costOfGoodsSold,
      grossProfit,
      totalExpenses,
      netProfit,
      totalPurchases
    };
  }
};
