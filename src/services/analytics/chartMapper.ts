import { ChartDataPoint } from '../../types/analytics.types';

export const chartMapper = {
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  },

  toPercentageString(value: number): string {
    return `${Math.round(value)}%`;
  },

  padMissingPeriods(data: ChartDataPoint[], expectedLabels: string[]): ChartDataPoint[] {
    return expectedLabels.map(label => {
      const match = data.find(d => d.label.toLowerCase() === label.toLowerCase());
      return {
        label,
        value: match ? match.value : 0
      };
    });
  }
};
