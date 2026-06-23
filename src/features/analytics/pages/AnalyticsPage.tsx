import React, { useState } from 'react';
import { useAppSelector } from '../../../app/hooks';
import { analyticsEngine } from '../../../services/analytics/analyticsEngine';
import SalesChart from '../../../components/charts/SalesChart';
import CategoryChart from '../../../components/charts/CategoryChart';
import SegmentedControl from '../../../components/common/SegmentedControl';

export const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'exchanged' | 'prepared'>('exchanged');

  const sales = useAppSelector(state => state.db.sales);
  const purchases = useAppSelector(state => state.db.purchases);
  const variants = useAppSelector(state => state.db.variants);
  const products = useAppSelector(state => state.db.products);
  const categories = useAppSelector(state => state.db.categories);

  const salesTrendData = analyticsEngine.getModeSalesTrend(activeTab, sales, products, categories, 7);

  // Convert CategoryBreakdown into CategoryContribution format: { categoryName, salesAmount, percentage }
  const rawBreakdown = analyticsEngine.getModeCategoryBreakdown(activeTab, sales, purchases, variants, products, categories);
  const totalSalesVal = rawBreakdown.reduce((sum, c) => sum + c.sales, 0);
  const categorySplit = rawBreakdown.map(c => ({
    categoryName: c.categoryName,
    salesAmount: c.sales,
    percentage: totalSalesVal === 0 ? 0 : Math.round((c.sales / totalSalesVal) * 100)
  }));

  const topProducts = analyticsEngine.getModeTopProducts(activeTab, sales, products, categories);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
      <div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Business Visualizations</span>
        <h3 style={{ fontSize: '1.25rem', marginTop: '2px', fontWeight: 800 }}>Performance Analytics</h3>
      </div>

      <SegmentedControl
        options={[
          { value: 'exchanged', label: 'Exchanged Analytics' },
          { value: 'prepared', label: 'Prepared Analytics' }
        ]}
        value={activeTab}
        onChange={(val) => setActiveTab(val as any)}
      />

      {/* Sales trend */}
      <SalesChart 
        data={salesTrendData}
        title={`${activeTab === 'prepared' ? 'Prepared' : 'Exchanged'} Revenue Performance Trend (7 Days)`}
        color={activeTab === 'prepared' ? 'var(--info)' : 'var(--success)'}
      />

      {/* Category breakdown */}
      <CategoryChart 
        data={categorySplit}
        title="Category Contribution Breakdown"
      />

      {/* Top selling products list */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '16px' }}>
        <h5 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Top Selling Products</h5>
        
        {topProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            No sales recorded to compute product rankings
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topProducts.map((prod, i) => (
              <div 
                key={i} 
                className="flex-between"
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--border-color)',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.75rem'
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontWeight: 600 }}>{prod.productName}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ color: 'var(--success)' }}>₹{prod.revenue}</strong>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Qty: {prod.quantitySold} units sold
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default AnalyticsPage;
