import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Percent, TrendingUp, AlertTriangle, ArrowRight, Wallet, ShoppingBag, CreditCard, Truck, Activity, Package, Clock, CheckCircle2 } from 'lucide-react';
import { useDashboard } from '../../../hooks/useDashboard';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { analyticsEngine } from '../../../services/analytics/analyticsEngine';
import DashboardCard from '../../../components/cards/DashboardCard';
import SalesChart from '../../../components/charts/SalesChart';
import { ROUTES } from '../../../constants/routes';
import Button from '../../../components/common/Button';
import SegmentedControl from '../../../components/common/SegmentedControl';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<'exchanged' | 'prepared'>('exchanged');
  const { sales, purchases, products, variants, categories, stats, notifications } = useDashboard();
  const [notifPreset, setNotifPreset] = React.useState<'today' | 'week' | 'all'>('week');

  const filteredNotifications = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    return notifications.filter(notif => {
      const date = new Date(notif.timestamp);
      if (notifPreset === 'today') {
        return date >= today;
      }
      if (notifPreset === 'week') {
        return date >= weekAgo;
      }
      return true;
    });
  }, [notifications, notifPreset]);

  const formatActivityTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const groupedNotifications = React.useMemo(() => {
    const groups: { [key: string]: typeof filteredNotifications } = {};
    
    filteredNotifications.forEach(notif => {
      const date = new Date(notif.timestamp);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      
      let groupKey = '';
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else {
        groupKey = date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notif);
    });
    
    return groups;
  }, [filteredNotifications]);

  // Compute stats and breakdowns for the active mode
  const modeStats = analyticsEngine.getModeDashboardStats(
    activeTab,
    sales,
    purchases,
    variants,
    products,
    categories
  );

  const categoryBreakdown = analyticsEngine.getModeCategoryBreakdown(
    activeTab,
    sales,
    purchases,
    variants,
    products,
    categories
  );

  const salesData = analyticsEngine.getModeSalesTrend(
    activeTab,
    sales,
    products,
    categories,
    7
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
      
      {/* Today Summary Header */}
      <div className="flex-between" style={{ alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Today's Performance</span>
          <h3 style={{ fontSize: '1.25rem', marginTop: '2px', fontWeight: 800 }}>Summary</h3>
        </div>
      </div>

      <SegmentedControl
        options={[
          { value: 'exchanged', label: 'Exchanged Items', icon: <ShoppingBag size={15} /> },
          { value: 'prepared', label: 'Prepared Items', icon: <TrendingUp size={15} /> }
        ]}
        value={activeTab}
        onChange={(val) => setActiveTab(val as any)}
      />

      {/* General Context / Transactions Badge Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
        padding: '0 4px',
        marginTop: '-4px',
        marginBottom: '6px'
      }}>
        {/* Expenses Card */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderBottom: '3px solid var(--danger)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all var(--transition-fast)'
        }} className="interactive">
          <div className="flex-align-center" style={{ gap: '6px' }}>
            <div style={{
              backgroundColor: 'var(--danger-soft)',
              color: 'var(--danger)',
              borderRadius: '50%',
              width: '22px',
              height: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CreditCard size={12} />
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase' }}>Expenses</span>
          </div>
          <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontFamily: 'var(--font-title)', fontWeight: 800 }}>₹{stats.todayExpenses}</strong>
        </div>

        {/* Purchases Card */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderBottom: '3px solid var(--primary)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all var(--transition-fast)'
        }} className="interactive">
          <div className="flex-align-center" style={{ gap: '6px' }}>
            <div style={{
              backgroundColor: 'var(--primary-soft)',
              color: 'var(--primary)',
              borderRadius: '50%',
              width: '22px',
              height: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Truck size={12} />
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase' }}>Purchases</span>
          </div>
          <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontFamily: 'var(--font-title)', fontWeight: 800 }}>₹{modeStats.todayPurchases}</strong>
        </div>

        {/* Transactions Card */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderBottom: '3px solid var(--success)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all var(--transition-fast)'
        }} className="interactive">
          <div className="flex-align-center" style={{ gap: '6px' }}>
            <div style={{
              backgroundColor: 'var(--success-soft)',
              color: 'var(--success)',
              borderRadius: '50%',
              width: '22px',
              height: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Activity size={12} />
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase' }}>Tx Count</span>
          </div>
          <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontFamily: 'var(--font-title)', fontWeight: 800 }}>{modeStats.todayTransactionsCount}</strong>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <DashboardCard
          title="Today Sales"
          value={`₹${modeStats.todaySales}`}
          icon={<DollarSign size={18} />}
          trend={modeStats.salesGrowthPercentage}
          color="var(--success)"
        />
        <DashboardCard
          title="Today Profit"
          value={`₹${modeStats.todayProfit}`}
          icon={<Percent size={18} />}
          trend={modeStats.profitGrowthPercentage}
          color="var(--primary)"
        />
        <DashboardCard
          title={activeTab === 'prepared' ? "Purchases Cost" : "COGS / Sales Cost"}
          value={`₹${modeStats.todayCost}`}
          icon={<Wallet size={18} />}
          color="var(--danger)"
        />
        <DashboardCard
          title={activeTab === 'prepared' ? "Prepared Categories" : "Low Stock Alerts"}
          value={modeStats.statusValue}
          icon={activeTab === 'prepared' ? <TrendingUp size={18} /> : <AlertTriangle size={18} />}
          color={activeTab === 'prepared' ? 'var(--info)' : (modeStats.statusValue > 0 ? 'var(--warning)' : 'var(--text-muted)')}
          trendLabel={activeTab === 'prepared' ? 'active models' : 'requires stock-in'}
        />
      </div>

      {/* Fast POS Navigation Banner */}
      <div className="card flex-between" style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #1e3a8a 100%)',
        color: '#ffffff',
        border: 'none'
      }}>
        <div>
          <h4 style={{ fontSize: '1.02rem', fontWeight: 800 }}>Fast POS Checkout</h4>
          <span style={{ fontSize: '0.78rem', opacity: 0.9 }}>Sell items and print invoice receipts in seconds</span>
        </div>
        <Button 
          onClick={() => navigate(ROUTES.QUICK_SALE)}
          variant="secondary"
          size="sm"
          style={{ backgroundColor: '#ffffff', color: 'var(--primary)', border: 'none' }}
        >
          <ArrowRight size={16} />
        </Button>
      </div>

      {/* Responsive Dashboard Grid Wrapper */}
      <div className="dashboard-charts-grid">
        {/* Left Column: Category Breakdown & Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', minWidth: 0 }}>
          {/* Category Breakdown Table */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="flex-between">
              <h5 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0 }}>
                {activeTab === 'prepared' ? 'Prepared Categories Breakdown' : 'Exchanged Categories Breakdown'}
              </h5>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Today</span>
            </div>

            {categoryBreakdown.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No categories created yet of this type
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {categoryBreakdown.map((cat) => {
                  const profitColor = cat.profit > 0 ? 'var(--success)' : cat.profit < 0 ? 'var(--danger)' : 'var(--text-secondary)';
                  const profitPrefix = cat.profit > 0 ? '+' : '';
                  
                  // Calculate sales percentage for bar
                  const maxSales = Math.max(...categoryBreakdown.map(c => c.sales), 1);
                  const percentage = Math.round((cat.sales / maxSales) * 100);

                  return (
                    <div 
                      key={cat.categoryId}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-secondary)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div className="flex-between" style={{ alignItems: 'center' }}>
                        <div className="flex-align-center" style={{ gap: '8px' }}>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: cat.color || 'var(--primary)'
                          }} />
                          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {cat.categoryName}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: profitColor }}>
                          ₹{profitPrefix}{cat.profit}
                        </span>
                      </div>

                      <div className="flex-between" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        <span>Sales: <strong>₹{cat.sales}</strong></span>
                        <span>{activeTab === 'prepared' ? 'Purchased Cost' : 'COGS'}: <strong>₹{cat.cost}</strong></span>
                      </div>

                      {/* Visual contribution bar */}
                      <div style={{
                        width: '100%',
                        height: '5px',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden',
                        marginTop: '2px'
                      }}>
                        <div style={{
                          width: `${percentage}%`,
                          height: '100%',
                          backgroundColor: cat.color || 'var(--primary)',
                          borderRadius: 'var(--radius-full)',
                          transition: 'width var(--transition-normal)'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Weekly Sales Chart */}
          <SalesChart 
            data={salesData} 
            title={`${activeTab === 'prepared' ? 'Prepared' : 'Exchanged'} Weekly Sales (₹)`}
            color={activeTab === 'prepared' ? 'var(--info)' : 'var(--success)'}
          />
        </div>

        {/* Right Column: Recent Activities */}
        <div style={{ width: '100%', minWidth: 0 }}>
          {/* Recent Alerts & Updates */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '0px' }}>
            <div className="flex-between" style={{ alignItems: 'center' }}>
              <h5 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Recent Activities & Alerts</h5>
              <div style={{ display: 'flex', gap: '4px' }}>
                {(['today', 'week', 'all'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNotifPreset(p)}
                    style={{
                      padding: '3px 8px',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      backgroundColor: notifPreset === p ? 'var(--primary)' : 'var(--bg-secondary)',
                      color: notifPreset === p ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    {p === 'today' ? 'Today' : p === 'week' ? '7 Days' : 'All'}
                  </button>
                ))}
              </div>
            </div>
            {filteredNotifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-muted)', fontSize: '0.85rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                No recent activities
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px', 
                maxHeight: '430px', 
                overflowY: 'auto',
                paddingRight: '6px' 
              }}>
                {Object.keys(groupedNotifications).map((groupKey) => (
                  <div key={groupKey} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '0.68rem', 
                      color: 'var(--text-muted)', 
                      fontWeight: 800, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.05em',
                      marginTop: '6px',
                      paddingLeft: '4px',
                      borderLeft: '2px solid var(--border-color)',
                      display: 'block'
                    }}>
                      {groupKey}
                    </span>
                    
                    {groupedNotifications[groupKey].map((notif) => {
                      const accentColor = 
                        notif.type === 'stock_alert' 
                          ? 'var(--warning)' 
                          : notif.type === 'purchase_alert' 
                            ? 'var(--info)' 
                            : 'var(--success)';

                      const softBg = 
                        notif.type === 'stock_alert' 
                          ? 'var(--warning-soft)' 
                          : notif.type === 'purchase_alert' 
                            ? 'var(--info-soft)' 
                            : 'var(--success-soft)';

                      return (
                        <div 
                          key={notif.id} 
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            padding: '12px',
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderLeft: `3px solid ${accentColor}`,
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-sm)',
                            transition: 'transform var(--transition-fast)'
                          }}
                          className="card-clickable"
                        >
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: softBg,
                            color: accentColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: '2px',
                            flexShrink: 0
                          }}>
                            {notif.type === 'stock_alert' && <AlertTriangle size={14} />}
                            {notif.type === 'purchase_alert' && <Package size={14} />}
                            {notif.type === 'sale_alert' && <CheckCircle2 size={14} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                              <strong style={{ 
                                fontSize: '0.82rem', 
                                color: 'var(--text-primary)', 
                                fontWeight: 700,
                                fontFamily: 'var(--font-title)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {notif.title}
                              </strong>
                              <span style={{ 
                                fontSize: '0.7rem', 
                                color: 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}>
                                <Clock size={10} /> {formatActivityTime(notif.timestamp)}
                              </span>
                            </div>
                            <p style={{ 
                              fontSize: '0.78rem', 
                              color: 'var(--text-secondary)', 
                              marginTop: '3px',
                              lineHeight: '1.3'
                            }}>
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
export default DashboardPage;
