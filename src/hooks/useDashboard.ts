import { useMemo, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { analyticsEngine } from '../services/analytics/analyticsEngine';
import { selectLowStockAlerts } from '../features/inventory/inventorySlice';
import { BusinessNotification } from '../types/dashboard.types';
import { markNotificationsAsRead } from '../features/db/dbSlice';

export const useDashboard = () => {
  const dispatch = useAppDispatch();
  const sales = useAppSelector((state) => state.db.sales);
  const expenses = useAppSelector((state) => state.db.expenses);
  const products = useAppSelector((state) => state.db.products);
  const variants = useAppSelector((state) => state.db.variants);
  const categories = useAppSelector((state) => state.db.categories);
  const purchases = useAppSelector((state) => state.db.purchases);
  const readNotificationIds = useAppSelector((state) => state.db.readNotificationIds || []);
  
  const lowStockAlerts = useAppSelector(selectLowStockAlerts);
  const stats = analyticsEngine.getDashboardStats(sales, expenses, variants, products);

  const notifications = useMemo((): BusinessNotification[] => {
    const list: BusinessNotification[] = [];
    
    // Low stock notifications
    lowStockAlerts.forEach((alert) => {
      const id = `notif_stock_${alert.variantId}`;
      const variant = variants.find(v => v.id === alert.variantId);
      list.push({
        id,
        type: 'stock_alert',
        title: 'Low Stock Warning',
        message: `"${alert.productName} (${alert.variantName})" is running low! Current stock: ${alert.currentStock} ${alert.currentStock === 1 ? 'unit' : 'units'}.`,
        timestamp: variant?.updatedAt || new Date().toISOString(),
        isRead: readNotificationIds.includes(id)
      });
    });

    // Recent sale notifications
    sales.forEach((sale) => {
      const id = `notif_sale_${sale.id}`;
      list.push({
        id,
        type: 'sale_alert',
        title: 'New Sale Completed',
        message: `Sale of ₹${sale.totalAmount} was processed via ${sale.paymentMethod.toUpperCase()}.`,
        timestamp: sale.saleDate || sale.createdAt,
        isRead: readNotificationIds.includes(id)
      });
    });

    // Recent purchase notifications
    purchases.forEach((purchase) => {
      const id = `notif_purchase_${purchase.id}`;
      list.push({
        id,
        type: 'purchase_alert',
        title: 'Stock Purchase Logged',
        message: `Restock of ₹${purchase.totalAmount} was logged from ${purchase.supplierName || 'supplier'}.`,
        timestamp: purchase.purchaseDate || purchase.createdAt,
        isRead: readNotificationIds.includes(id)
      });
    });

    // Sort chronologically descending
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [sales, purchases, lowStockAlerts, variants, readNotificationIds]);

  const markAsRead = useCallback((ids: string[]) => {
    dispatch(markNotificationsAsRead(ids));
  }, [dispatch]);

  return {
    sales,
    expenses,
    products,
    variants,
    categories,
    purchases,
    stats,
    notifications,
    markAsRead
  };
};
