export interface ChartDataPoint {
  label: string; // e.g. "Monday", "Jan"
  value: number;
}

export interface DualChartDataPoint {
  label: string;
  value1: number; // e.g. Revenue
  value2: number; // e.g. Profit
}

export interface CategoryContribution {
  categoryName: string;
  salesAmount: number;
  percentage: number;
}

export interface ProductPerformance {
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface BusinessAnalytics {
  revenueTrend: ChartDataPoint[];
  profitTrend: ChartDataPoint[];
  expenseTrend: ChartDataPoint[];
  categoryPerformance: CategoryContribution[];
  topProducts: ProductPerformance[];
}
