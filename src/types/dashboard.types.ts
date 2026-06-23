export interface DashboardStats {
  todaySales: number;
  todayProfit: number;
  todayExpenses: number;
  todayTransactionsCount: number;
  lowStockItemsCount: number;
  salesGrowthPercentage: number; // vs yesterday
  profitGrowthPercentage: number; // vs yesterday
}

export interface BusinessNotification {
  id: string;
  type: 'stock_alert' | 'sale_alert' | 'system_alert' | 'purchase_alert';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}
