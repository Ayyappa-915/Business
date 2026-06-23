import { useAppSelector } from '../app/hooks';
import { reportEngine } from '../services/reports/reportEngine';
import { reportGenerator } from '../services/reports/reportGenerator';
import { DateRange } from '../types/common.types';

export const useReports = () => {
  const sales = useAppSelector((state) => state.db.sales);
  const expenses = useAppSelector((state) => state.db.expenses);
  const products = useAppSelector((state) => state.db.products);
  const variants = useAppSelector((state) => state.db.variants);
  const purchases = useAppSelector((state) => state.db.purchases);
  const categories = useAppSelector((state) => state.db.categories);

  const getSalesReport = (range?: DateRange) => reportEngine.generateSalesReport(sales, range);
  const getExpenseReport = (range?: DateRange) => reportEngine.generateExpenseReport(expenses, range);
  const getInventoryReport = () => reportEngine.generateInventoryReport(products, variants);
  const getProfitLossReport = (range?: DateRange) => reportEngine.generateProfitLossReport(sales, expenses, variants, purchases, products, range);
  const getModeProfitLossReport = (mode: 'prepared' | 'exchanged', range?: DateRange) => reportEngine.generateModeProfitLossReport(mode, sales, expenses, variants, purchases, products, categories, range);

  const downloadSalesCSV = (range?: DateRange) => {
    const reportSales = sales.filter(s => reportEngine.isWithinRange(s.saleDate, range));
    const headers = ['Sale ID', 'Customer Name', 'Phone', 'Date', 'Total Items', 'Subtotal', 'Discount', 'Total Amount', 'Payment Method', 'Payment Status'];
    const rows = reportSales.map(s => [
      s.id,
      s.customerName || 'N/A',
      s.customerPhone || 'N/A',
      new Date(s.saleDate).toLocaleDateString(),
      s.items.reduce((sum, item) => sum + item.quantity, 0),
      s.subtotal,
      s.discount,
      s.totalAmount,
      s.paymentMethod.toUpperCase(),
      s.paymentStatus.toUpperCase()
    ]);
    const csv = reportGenerator.convertToCSV(headers, rows);
    reportGenerator.downloadCSV('sales_report.csv', csv);
  };

  const downloadExpensesCSV = (range?: DateRange) => {
    const reportExpenses = expenses.filter(e => reportEngine.isWithinRange(e.expenseDate, range));
    const headers = ['Expense ID', 'Category', 'Amount', 'Date', 'Payment Method', 'Description'];
    const rows = reportExpenses.map(e => [
      e.id,
      e.category,
      e.amount,
      new Date(e.expenseDate).toLocaleDateString(),
      e.paymentMethod.toUpperCase(),
      e.description || 'N/A'
    ]);
    const csv = reportGenerator.convertToCSV(headers, rows);
    reportGenerator.downloadCSV('expenses_report.csv', csv);
  };

  return {
    getSalesReport,
    getExpenseReport,
    getInventoryReport,
    getProfitLossReport,
    getModeProfitLossReport,
    downloadSalesCSV,
    downloadExpensesCSV
  };
};
