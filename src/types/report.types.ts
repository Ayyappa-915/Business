export type ReportType = 'sales' | 'expense' | 'inventory' | 'profit_loss';

export interface SalesReportSummary {
  totalSales: number;
  totalTransactions: number;
  averageTransactionValue: number;
  paymentMethodSplit: {
    cash: number;
    upi: number;
    card: number;
    credit: number;
  };
}

export interface ExpenseReportSummary {
  totalExpenses: number;
  categorySplit: { [category: string]: number };
}

export interface InventoryValuationSummary {
  totalItems: number;
  totalStockValueAtCost: number;
  totalStockValueAtRetail: number;
  potentialProfit: number;
}

export interface ProfitLossReportSummary {
  grossRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  totalPurchases?: number;
}
