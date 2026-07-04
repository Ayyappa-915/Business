import React, { useState } from 'react';
import { Download, Calendar, BarChart2, ShoppingBag, TrendingUp } from 'lucide-react';
import { useReports } from '../../../hooks/useReports';
import { useAppSelector } from '../../../app/hooks';
import { reportEngine } from '../../../services/reports/reportEngine';
import Button from '../../../components/common/Button';
import Select from '../../../components/common/Select';
import BottomSheet from '../../../components/common/BottomSheet';
import SaleCard from '../../../components/cards/SaleCard';
import PurchaseCard from '../../../components/cards/PurchaseCard';
import { DateRange } from '../../../types/common.types';
import { Sale } from '../../../types/sale.types';
import { Purchase } from '../../../types/purchase.types';
import DateInput from '../../../components/common/DateInput';
import SegmentedControl from '../../../components/common/SegmentedControl';

export const ReportsPage: React.FC = () => {
  const { 
    getSalesReport, getExpenseReport, getInventoryReport, getModeProfitLossReport,
    downloadSalesCSV, downloadExpensesCSV 
  } = useReports();

  const sales = useAppSelector(state => state.db.sales);
  const products = useAppSelector(state => state.db.products);
  const categories = useAppSelector(state => state.db.categories);
  const variants = useAppSelector(state => state.db.variants);
  const purchases = useAppSelector(state => state.db.purchases);

  const [activeTab, setActiveTab] = useState<'exchanged' | 'prepared'>('exchanged');
  const [preset, setPreset] = useState<'today' | 'day' | 'week' | 'month' | 'custom'>('week');
  
  // Custom/Particular date fields
  const [singleDate, setSingleDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Ledger grouping & modal detail state
  const [ledgerGroup, setLedgerGroup] = useState<'day' | 'week' | 'month'>('day');
  const [selectedLedgerPeriod, setSelectedLedgerPeriod] = useState<{ label: string; range: DateRange; sales: number; cost: number; profit: number; count: number } | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  // Compute active date range based on preset selection
  const getActiveRange = (): DateRange | undefined => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (preset === 'today') {
      return {
        startDate: today.toISOString(),
        endDate: new Date().toISOString()
      };
    }
    if (preset === 'day') {
      const dayStart = new Date(singleDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(singleDate);
      dayEnd.setHours(23, 59, 59, 999);
      return {
        startDate: dayStart.toISOString(),
        endDate: dayEnd.toISOString()
      };
    }
    if (preset === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return {
        startDate: weekAgo.toISOString(),
        endDate: new Date().toISOString()
      };
    }
    if (preset === 'month') {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      return {
        startDate: monthAgo.toISOString(),
        endDate: new Date().toISOString()
      };
    }
    // Custom
    return {
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString()
    };
  };

  const range = getActiveRange();
  
  // Fetch aggregates
  const stockSummary = getInventoryReport();
  const plSummary = getModeProfitLossReport(activeTab, range);

  // Dynamic Sales summary stats for activeTab
  const activeSales = sales.filter(s => reportEngine.isWithinRange(s.saleDate, range) && s.items.some(item => {
    const prod = products.find(p => p.id === item.productId);
    if (!prod) return false;
    const cat = categories.find(c => c.id === prod.categoryId);
    return cat?.type === activeTab;
  }));

  const totalSalesAmount = activeSales.reduce((sum, s) => {
    let val = 0;
    s.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod && categories.find(c => c.id === prod.categoryId)?.type === activeTab) {
        val += item.unitPrice * item.quantity - (item.discount || 0);
      }
    });
    return sum + val;
  }, 0);

  const totalTransactionsCount = activeSales.length;
  const avgInvoiceValue = totalTransactionsCount === 0 ? 0 : Math.round(totalSalesAmount / totalTransactionsCount);

  // Compute grouped performance list for the active mode
  const getPerformanceList = () => {
    const groupedData: { [key: string]: { label: string; range: DateRange; sales: number; cost: number; count: number } } = {};
    
    const prodMap = new Map(products.map(p => [p.id, p]));
    const catMap = new Map(categories.map(c => [c.id, c]));

    const getWeekKeyAndLabel = (date: Date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day; // Sunday of that week
      const sunday = new Date(d.setDate(diff));
      sunday.setHours(0, 0, 0, 0);
      const saturday = new Date(sunday);
      saturday.setDate(sunday.getDate() + 6);
      saturday.setHours(23, 59, 59, 999);
      
      const formatOption: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      const label = `Week of ${sunday.toLocaleDateString('en-US', formatOption)} - ${saturday.toLocaleDateString('en-US', formatOption)}, ${saturday.getFullYear()}`;
      const key = sunday.toDateString();
      return { key, label, range: { startDate: sunday.toISOString(), endDate: saturday.toISOString() } };
    };

    const getMonthKeyAndLabel = (date: Date) => {
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      return { key, label, range: { startDate: startOfMonth.toISOString(), endDate: endOfMonth.toISOString() } };
    };

    const getDayKeyAndLabel = (date: Date) => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      const key = startOfDay.toDateString();
      return { key, label, range: { startDate: startOfDay.toISOString(), endDate: endOfDay.toISOString() } };
    };

    // Filter sales/purchases by the active preset range
    const filteredSales = sales.filter(s => reportEngine.isWithinRange(s.saleDate, range));
    const filteredPurchases = purchases.filter(p => reportEngine.isWithinRange(p.purchaseDate, range));

    // Group sales by selected ledger period duration
    filteredSales.forEach(sale => {
      const date = new Date(sale.saleDate);
      let groupKey = '';
      let groupLabel = '';
      let groupRange: DateRange = { startDate: '', endDate: '' };

      if (ledgerGroup === 'day') {
        const { key, label, range } = getDayKeyAndLabel(date);
        groupKey = key; groupLabel = label; groupRange = range;
      } else if (ledgerGroup === 'week') {
        const { key, label, range } = getWeekKeyAndLabel(date);
        groupKey = key; groupLabel = label; groupRange = range;
      } else {
        const { key, label, range } = getMonthKeyAndLabel(date);
        groupKey = key; groupLabel = label; groupRange = range;
      }

      let saleSales = 0;
      let saleCost = 0;

      sale.items.forEach(item => {
        const prod = prodMap.get(item.productId);
        if (!prod) return;
        const cat = catMap.get(prod.categoryId);
        if (!cat || cat.type !== activeTab) return;

        saleSales += item.unitPrice * item.quantity - (item.discount || 0);

        if (activeTab === 'exchanged') {
          const variant = variants.find(v => v.id === item.variantId);
          if (variant) {
            saleCost += variant.cost * item.quantity;
          }
        }
      });

      if (saleSales > 0) {
        if (!groupedData[groupKey]) {
          groupedData[groupKey] = { label: groupLabel, range: groupRange, sales: 0, cost: 0, count: 0 };
        }
        groupedData[groupKey].sales += saleSales;
        groupedData[groupKey].cost += saleCost;
        groupedData[groupKey].count += 1;
      }
    });

    // Group purchases by selected ledger period duration (Prepared Only)
    if (activeTab === 'prepared') {
      filteredPurchases.forEach(pur => {
        if (pur.type !== 'prepared') return;
        const cat = catMap.get(pur.categoryId || '');
        if (!cat || cat.type !== 'prepared') return;

        const date = new Date(pur.purchaseDate);
        let groupKey = '';
        let groupLabel = '';
        let groupRange: DateRange = { startDate: '', endDate: '' };

        if (ledgerGroup === 'day') {
          const { key, label, range } = getDayKeyAndLabel(date);
          groupKey = key; groupLabel = label; groupRange = range;
        } else if (ledgerGroup === 'week') {
          const { key, label, range } = getWeekKeyAndLabel(date);
          groupKey = key; groupLabel = label; groupRange = range;
        } else {
          const { key, label, range } = getMonthKeyAndLabel(date);
          groupKey = key; groupLabel = label; groupRange = range;
        }

        if (!groupedData[groupKey]) {
          groupedData[groupKey] = { label: groupLabel, range: groupRange, sales: 0, cost: 0, count: 0 };
        }
        groupedData[groupKey].cost += pur.totalAmount;
      });
    }

    // Sort by key start date descending
    const sortedKeys = Object.keys(groupedData).sort((a, b) => {
      const dateA = new Date(groupedData[a].range.startDate).getTime();
      const dateB = new Date(groupedData[b].range.startDate).getTime();
      return dateB - dateA;
    });

    return sortedKeys.map(key => {
      const data = groupedData[key];
      return {
        key,
        label: data.label,
        range: data.range,
        sales: data.sales,
        cost: data.cost,
        profit: data.sales - data.cost,
        count: data.count
      };
    });
  };

  const performanceData = getPerformanceList();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="animate-fade-in">
      <div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Accounting Ledger</span>
        <h3 style={{ fontSize: '1.25rem', marginTop: '2px', fontWeight: 800 }}>Reports & CSV Exports</h3>
      </div>

      <SegmentedControl
        options={[
          { value: 'exchanged', label: 'Exchanged Reports' },
          { value: 'prepared', label: 'Prepared Reports' }
        ]}
        value={activeTab}
        onChange={(val) => setActiveTab(val as any)}
      />

      {/* Date Filter Selection */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Select
          label="Filter Report Date Range"
          options={[
            { value: 'today', label: 'Today Summary' },
            { value: 'day', label: 'Particular Day' },
            { value: 'week', label: 'Last 7 Days' },
            { value: 'month', label: 'Last 30 Days' },
            { value: 'custom', label: 'Custom Date Range' }
          ]}
          value={preset}
          onChange={(e) => setPreset(e.target.value as any)}
          style={{ marginBottom: 0 }}
        />

        {preset === 'day' && (
          <div style={{ marginTop: '6px' }}>
            <DateInput
              label="Select Particular Day"
              value={singleDate}
              onChange={setSingleDate}
            />
          </div>
        )}

        {preset === 'custom' && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <DateInput
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
            />
            <DateInput
              label="End Date"
              value={endDate}
              onChange={setEndDate}
            />
          </div>
        )}
      </div>

      {/* P&L Statement Widget */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BarChart2 size={18} color="var(--primary)" /> {activeTab === 'prepared' ? 'Prepared P&L Statement' : 'Exchanged P&L Statement'}
        </h4>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          marginTop: '6px',
          fontSize: '0.88rem'
        }}>
          <div className="flex-between">
            <span style={{ color: 'var(--text-secondary)' }}>Gross Revenues (Sales)</span>
            <span style={{ fontWeight: 600 }}>₹{plSummary.grossRevenue.toFixed(2)}</span>
          </div>
          <div className="flex-between">
            <span style={{ color: 'var(--text-secondary)' }}>{activeTab === 'prepared' ? 'Ingredients Purchases' : 'Cost of Goods Sold (COGS)'}</span>
            <span style={{ color: 'var(--text-muted)' }}>- ₹{plSummary.costOfGoodsSold.toFixed(2)}</span>
          </div>
          {activeTab === 'exchanged' && (
            <div className="flex-between">
              <span style={{ color: 'var(--text-secondary)' }}>Actual Stock Purchases (Cash Outflow)</span>
              <span style={{ color: 'var(--warning)', fontWeight: 600 }}>₹{(plSummary.totalPurchases || 0).toFixed(2)}</span>
            </div>
          )}
          <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
            <span style={{ fontWeight: 600 }}>Gross Profit Margin</span>
            <span style={{ fontWeight: 600, color: 'var(--success)' }}>₹{plSummary.grossProfit.toFixed(2)}</span>
          </div>
          <div className="flex-between">
            <span style={{ color: 'var(--text-secondary)' }}>General Shop Expenses</span>
            <span style={{ color: 'var(--danger)' }}>- ₹{plSummary.totalExpenses.toFixed(2)}</span>
          </div>
          <div className="flex-between" style={{ borderTop: '1.5px solid var(--border-color)', paddingTop: '6px', marginTop: '4px' }}>
            <strong style={{ fontSize: '1rem' }}>Net Profit</strong>
            <strong style={{ fontSize: '1.1rem', color: plSummary.netProfit >= 0 ? 'var(--success)' : 'var(--danger)', fontFamily: 'var(--font-title)' }}>
              ₹{plSummary.netProfit.toFixed(2)}
            </strong>
          </div>
        </div>
      </div>

      {/* Sales Summary Widgets */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{activeTab === 'prepared' ? 'Prepared Sales Summary' : 'Exchanged Sales Summary'}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem', marginTop: '4px' }}>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>Transactions</span>
            <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{totalTransactionsCount}</p>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>Avg Invoice Value</span>
            <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>₹{avgInvoiceValue}</p>
          </div>
        </div>
      </div>

      {/* Inventory Valuation summary */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{activeTab === 'prepared' ? 'Prepared Menu Summary' : 'Inventory Valuation'}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem', marginTop: '4px' }}>
          {activeTab === 'exchanged' ? (
            <>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Valuation at Retail</span>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>₹{stockSummary.totalStockValueAtRetail.toFixed(2)}</p>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Stocked Items</span>
                <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{stockSummary.totalItems} variants</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Prepared Categories</span>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>{categories.filter(c => c.type === 'prepared').length}</p>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Menu Products</span>
                <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  {products.filter(p => categories.find(c => c.id === p.categoryId)?.type === 'prepared').length} items
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Performance Ledger */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="flex-between">
          <h5 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0 }}>Performance Ledger</h5>
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--bg-secondary)',
            padding: '2px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)'
          }}>
            {(['day', 'week', 'month'] as const).map(grp => (
              <button
                key={grp}
                onClick={() => setLedgerGroup(grp)}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: ledgerGroup === grp ? 'var(--primary)' : 'transparent',
                  color: ledgerGroup === grp ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {grp.charAt(0).toUpperCase() + grp.slice(1)}ly
              </button>
            ))}
          </div>
        </div>
        
        {performanceData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            No sales or purchase records logged yet for this model
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
            {performanceData.map((period, idx) => {
              const isProfitPositive = period.profit >= 0;
              return (
                <div 
                  key={idx}
                  onClick={() => {
                    setSelectedLedgerPeriod(period);
                    setSelectedSale(null);
                    setSelectedPurchase(null);
                  }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    borderLeft: `4px solid ${isProfitPositive ? 'var(--success)' : 'var(--danger)'}`
                  }}
                  className="interactive-ledger-row"
                >
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>{period.label}</strong>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {period.count} {period.count === 1 ? 'sale transaction' : 'sale transactions'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', textAlign: 'right' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Sales</span>
                      <strong style={{ color: 'var(--text-primary)' }}>₹{period.sales.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Net Profit</span>
                      <strong style={{ color: isProfitPositive ? 'var(--success)' : 'var(--danger)' }}>
                        ₹{period.profit.toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CSV Downloads actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px', paddingBottom: '30px' }}>
        <Button 
          onClick={() => downloadSalesCSV(range)}
          leftIcon={<Download size={18} />}
          variant="outline"
          fullWidth
        >
          Download Sales Ledger (CSV)
        </Button>
        <Button 
          onClick={() => downloadExpensesCSV(range)}
          leftIcon={<Download size={18} />}
          variant="outline"
          fullWidth
        >
          Download Expenses Ledger (CSV)
        </Button>
      </div>

      {/* Ledger Period Details BottomSheet */}
      <BottomSheet
        isOpen={selectedLedgerPeriod !== null}
        onClose={() => {
          setSelectedLedgerPeriod(null);
          setSelectedSale(null);
          setSelectedPurchase(null);
        }}
        title={
          selectedSale 
            ? "Invoice Receipt Details" 
            : selectedPurchase 
              ? "Purchase Details Summary" 
              : `Ledger Period: ${selectedLedgerPeriod?.label || ''}`
        }
      >
        {selectedLedgerPeriod && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {selectedSale ? (
              // 1. Drilled down Sale Receipt View
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setSelectedSale(null)}
                  style={{ alignSelf: 'flex-start', marginBottom: '8px' }}
                >
                  ← Back to Period Transactions
                </Button>

                <div>
                  <strong>Customer:</strong> {selectedSale.customerName || 'Walk-in'}
                  {selectedSale.customerPhone && <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Phone: {selectedSale.customerPhone}</span>}
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {selectedSale.id}</span>
                  <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Date: {new Date(selectedSale.saleDate).toLocaleString()}</span>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Invoice items list:</span>
                  {selectedSale.items.map((item, idx) => {
                    const prod = products.find(p => p.id === item.productId);
                    const variant = variants.find(v => v.id === item.variantId);
                    return (
                      <div key={idx} className="flex-between" style={{ fontSize: '0.82rem', padding: '6px 0', borderBottom: '1px solid var(--bg-tertiary)' }}>
                        <span>{prod ? prod.name : 'Unknown Product'} ({variant?.name})</span>
                        <span>{item.quantity} units x ₹{item.unitPrice}</span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Subtotal: ₹{selectedSale.subtotal}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Discount: -₹{selectedSale.discount}</span>
                  <strong style={{ fontSize: '1.15rem', color: 'var(--success)', fontFamily: 'var(--font-title)' }}>
                    Paid Amount: ₹{selectedSale.totalAmount}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Method: {selectedSale.paymentMethod.toUpperCase()} | Status: {selectedSale.paymentStatus.toUpperCase()}</span>
                </div>

                {selectedSale.notes && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', backgroundColor: 'var(--bg-tertiary)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                    Notes: {selectedSale.notes}
                  </div>
                )}
              </div>
            ) : selectedPurchase ? (
              // 2. Drilled down Purchase View
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setSelectedPurchase(null)}
                  style={{ alignSelf: 'flex-start', marginBottom: '8px' }}
                >
                  ← Back to Period Transactions
                </Button>

                <div>
                  <strong>Supplier:</strong> {selectedPurchase.supplierName || (selectedPurchase.type === 'prepared' ? 'Ingredient Raw Materials' : 'N/A')}
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Date: {new Date(selectedPurchase.purchaseDate).toLocaleString()}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Payment Method: {selectedPurchase.paymentMethod.toUpperCase()} | Status: {selectedPurchase.paymentStatus.toUpperCase()}
                  </span>
                  {selectedPurchase.type === 'prepared' && (
                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                      Category: {categories.find(c => c.id === selectedPurchase.categoryId)?.name || 'Unknown Category'}
                    </span>
                  )}
                </div>

                {selectedPurchase.type === 'prepared' ? (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Prepared Ingredients Cost:</span>
                    {selectedPurchase.preparedItems?.map((item, idx) => (
                      <div key={idx} className="flex-between" style={{ fontSize: '0.82rem', padding: '6px 0', borderBottom: '1px solid var(--bg-tertiary)' }}>
                        <span>{item.name}</span>
                        <span>₹{item.cost}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Restocked Items:</span>
                    {selectedPurchase.exchangedItems && selectedPurchase.exchangedItems.length > 0 ? (
                      selectedPurchase.exchangedItems.map((item, idx) => (
                        <div key={idx} className="flex-between" style={{ fontSize: '0.82rem', padding: '7px 0', borderBottom: '1px solid var(--bg-tertiary)' }}>
                          <span style={{ fontWeight: 600 }}>{item.name}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{item.quantity} {item.unit} × ₹{item.costPerUnit} = <strong style={{ color: 'var(--text-primary)' }}>₹{item.totalCost.toFixed(2)}</strong></span>
                        </div>
                      ))
                    ) : (
                      selectedPurchase.items?.map((item, idx) => {
                        const prod = products.find(p => p.id === item.productId);
                        const variant = variants.find(v => v.id === item.variantId);
                        return (
                          <div key={idx} className="flex-between" style={{ fontSize: '0.82rem', padding: '6px 0', borderBottom: '1px solid var(--bg-tertiary)' }}>
                            <span>{prod ? prod.name : 'Unknown Product'} ({variant?.name})</span>
                            <span>{item.quantity} units @ ₹{item.costPrice}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.05rem', marginTop: '10px' }}>
                  Total Cost: ₹{selectedPurchase.totalAmount}
                </div>
                {selectedPurchase.notes && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', backgroundColor: 'var(--bg-tertiary)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                    Notes: {selectedPurchase.notes}
                  </div>
                )}
              </div>
            ) : (
              // 3. Ledger Period Transactions List View
              <>
                {/* Stats Summary Card inside Sheet */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Revenues</span>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>₹{selectedLedgerPeriod.sales.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>{activeTab === 'prepared' ? 'Ingredients Cost' : 'COGS'}</span>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>₹{selectedLedgerPeriod.cost.toFixed(2)}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Net Performance Margin</span>
                    <strong style={{ fontSize: '1.15rem', color: selectedLedgerPeriod.profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      ₹{selectedLedgerPeriod.profit.toFixed(2)}
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '350px', overflowY: 'auto', marginTop: '8px' }}>
                  {/* Sales Section */}
                  <div>
                    <h5 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                      Sales Transactions ({selectedLedgerPeriod.count})
                    </h5>
                    {sales.filter(s => 
                      reportEngine.isWithinRange(s.saleDate, selectedLedgerPeriod.range) && 
                      s.items.some(item => {
                        const prod = products.find(p => p.id === item.productId);
                        const cat = prod ? categories.find(c => c.id === prod.categoryId) : null;
                        return cat?.type === activeTab;
                      })
                    ).length === 0 ? (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', display: 'block', padding: '6px 0' }}>
                        No sales recorded in this period
                      </span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {sales.filter(s => 
                          reportEngine.isWithinRange(s.saleDate, selectedLedgerPeriod.range) && 
                          s.items.some(item => {
                            const prod = products.find(p => p.id === item.productId);
                            const cat = prod ? categories.find(c => c.id === prod.categoryId) : null;
                            return cat?.type === activeTab;
                          })
                        ).map(s => (
                          <SaleCard 
                            key={s.id} 
                            sale={s} 
                            onViewDetails={() => setSelectedSale(s)} 
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Purchases Section (Only for Prepared Mode) */}
                  {activeTab === 'prepared' && (
                    <div>
                      <h5 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                        Prepared Ingredient Purchases
                      </h5>
                      {purchases.filter(p => 
                        p.type === 'prepared' && 
                        reportEngine.isWithinRange(p.purchaseDate, selectedLedgerPeriod.range) && 
                        categories.find(c => c.id === p.categoryId)?.type === 'prepared'
                      ).length === 0 ? (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', display: 'block', padding: '6px 0' }}>
                          No ingredient purchases logged in this period
                        </span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {purchases.filter(p => 
                            p.type === 'prepared' && 
                            reportEngine.isWithinRange(p.purchaseDate, selectedLedgerPeriod.range) && 
                            categories.find(c => c.id === p.categoryId)?.type === 'prepared'
                          ).map(p => (
                            <PurchaseCard 
                              key={p.id} 
                              purchase={p} 
                              onViewDetails={() => setSelectedPurchase(p)} 
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
export default ReportsPage;
