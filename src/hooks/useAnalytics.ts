import { useAppSelector } from '../app/hooks';
import { analyticsEngine } from '../services/analytics/analyticsEngine';

export const useAnalytics = () => {
  const sales = useAppSelector((state) => state.db.sales);
  const expenses = useAppSelector((state) => state.db.expenses);
  const products = useAppSelector((state) => state.db.products);
  const variants = useAppSelector((state) => state.db.variants);
  const categories = useAppSelector((state) => state.db.categories);

  const getSalesTrend = (days: number = 7) => analyticsEngine.getSalesTrend(sales, days);
  const getCategoryPerformance = () => analyticsEngine.getCategoryPerformance(sales, products, categories);
  const getTopProducts = () => analyticsEngine.getTopProducts(sales, products);

  const getExpenseSummary = () => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const categorySplit = expenses.reduce((acc: { [cat: string]: number }, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});
    
    const chartData = Object.keys(categorySplit).map(cat => ({
      label: cat,
      value: categorySplit[cat]
    }));

    return { total, chartData };
  };

  return {
    getSalesTrend,
    getCategoryPerformance,
    getTopProducts,
    getExpenseSummary
  };
};
