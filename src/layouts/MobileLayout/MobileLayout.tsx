import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import MobileHeader from './MobileHeader';
import BottomNavigation from './BottomNavigation';
import MobileDrawer from './MobileDrawer';
import FloatingActionButton from './FloatingActionButton';
import QuickActionSheet, { QuickActionType } from './QuickActionSheet';
import BottomSheet from '../../components/common/BottomSheet';
import { useDashboard } from '../../hooks/useDashboard';
import { 
  AlertTriangle, Package, CheckCircle2, Clock, 
  LayoutDashboard, Tags, FolderTree, ShoppingBag, Layers, 
  ArrowDownCircle, ArrowUpRight, Wallet, FileText, 
  BarChart3, Users, Settings, Database, LogOut, Plus, Moon, Sun, Bell 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { toggleTheme, selectTheme } from '../../features/settings/settingsSlice';
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

// Lazy load forms to avoid circular dependencies
import SaleForm from '../../components/forms/SaleForm';
import PurchaseForm from '../../components/forms/PurchaseForm';
import ExpenseForm from '../../components/forms/ExpenseForm';
import ProductForm from '../../components/forms/ProductForm';

export const MobileLayout: React.FC = () => {
  const location = useLocation();
  const { notifications, markAsRead } = useDashboard();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<QuickActionType | null>(null);
  
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);
  const { user, logoutUser } = useAuth();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { name: 'Dashboard', path: ROUTES.DASHBOARD, icon: <LayoutDashboard size={18} /> },
    { name: 'Categories', path: ROUTES.CATEGORIES, icon: <Tags size={18} /> },
    { name: 'Subcategories', path: ROUTES.SUBCATEGORIES, icon: <FolderTree size={18} /> },
    { name: 'Products', path: ROUTES.PRODUCTS, icon: <ShoppingBag size={18} /> },
    { name: 'Variants', path: ROUTES.VARIANTS, icon: <Layers size={18} /> },
    { name: 'Purchases', path: ROUTES.PURCHASES, icon: <ArrowDownCircle size={18} /> },
    { name: 'Sales', path: ROUTES.SALES, icon: <ArrowUpRight size={18} /> },
    { name: 'Expenses', path: ROUTES.EXPENSES, icon: <Wallet size={18} /> },
    { name: 'Inventory', path: ROUTES.INVENTORY, icon: <Package size={18} /> },
    { name: 'Reports', path: ROUTES.REPORTS, icon: <FileText size={18} /> },
    { name: 'Analytics', path: ROUTES.ANALYTICS, icon: <BarChart3 size={18} /> },
    { name: 'Users', path: ROUTES.USERS, icon: <Users size={18} /> },
    { name: 'Settings', path: ROUTES.SETTINGS, icon: <Settings size={18} /> },
    { name: 'Backup & Restore', path: ROUTES.BACKUP_RESTORE, icon: <Database size={18} /> },
  ];
  const [localNotifications, setLocalNotifications] = useState<typeof notifications>([]);

  // Capture notifications snapshot only when drawer is opened (retaining history)
  useEffect(() => {
    if (isNotificationsOpen) {
      setLocalNotifications(notifications.slice(0, 20));
    }
  }, [isNotificationsOpen]);

  // Auto-mark notifications as read when the drawer is opened
  useEffect(() => {
    if (isNotificationsOpen && localNotifications.length > 0) {
      const unreadIds = localNotifications.filter(n => !n.isRead).map(n => n.id);
      if (unreadIds.length > 0) {
        markAsRead(unreadIds);
        
        // Dynamically update the read state of local notifications so they transition
        // instantly to read styles (faded) without vanishing from the drawer screen.
        setLocalNotifications(prev =>
          prev.map(n => unreadIds.includes(n.id) ? { ...n, isRead: true } : n)
        );
      }
    }
  }, [isNotificationsOpen, localNotifications, markAsRead]);

  // Map route paths to screen titles
  const getHeaderTitle = (path: string): string => {
    if (path.startsWith('/dashboard')) return 'Dashboard';
    if (path.startsWith('/quick-sale')) return 'Quick Sale POS';
    if (path.startsWith('/products')) return 'Product Catalog';
    if (path.startsWith('/inventory')) return 'Inventory Tracker';
    if (path.startsWith('/more')) return 'More Menu';
    if (path.startsWith('/categories')) return 'Categories Manager';
    if (path.startsWith('/subcategories')) return 'Subcategories';
    if (path.startsWith('/variants')) return 'Product Variants';
    if (path.startsWith('/purchases')) return 'Purchases Log';
    if (path.startsWith('/sales')) return 'Sales Logs';
    if (path.startsWith('/expenses')) return 'Expense Book';
    if (path.startsWith('/reports')) return 'Reports & Exports';
    if (path.startsWith('/analytics')) return 'Business Insights';
    if (path.startsWith('/users')) return 'Staff Roles';
    if (path.startsWith('/settings')) return 'Settings';
    if (path.startsWith('/backup-restore')) return 'Backup Manager';
    return 'Business Tracker';
  };

  // Determine if FAB should be shown (e.g. hides in Auth/POS pages to save space)
  const isFABVisible = !['/login', '/register', '/onboarding', '/quick-sale'].includes(location.pathname);

  const handleQuickAction = (type: QuickActionType) => {
    setActiveForm(type);
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  if (isDesktop) {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    return (
      <div className="desktop-layout-container">
        {/* Left Sidebar */}
        <aside className="desktop-sidebar">
          {/* Shop branding / logo */}
          <div className="sidebar-header">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
              {user?.shopName || 'Ayyappa Super Mart'}
            </h2>
            <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>
              {user?.name} ({user?.role?.toUpperCase()})
            </span>
            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
              {user?.businessType || 'Retail'}
            </span>
          </div>
          
          {/* Quick Action Button */}
          <div style={{ padding: '16px 12px 0 12px' }}>
            <button
              onClick={() => setIsActionSheetOpen(true)}
              style={{
                width: '100%',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-sm)',
                transition: 'background-color 0.2s'
              }}
              className="interactive"
            >
              <Plus size={16} />
              <span>Quick Action</span>
            </button>
          </div>
          
          {/* Nav links */}
          <nav className="sidebar-nav">
            {menuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--primary-soft)' : 'transparent',
                  fontSize: '0.92rem',
                  fontWeight: isActive ? 600 : 500,
                  marginBottom: '4px',
                  textDecoration: 'none',
                  transition: 'all var(--transition-fast)'
                })}
                className="interactive"
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
          
          {/* Logout button at bottom */}
          <div className="sidebar-footer">
            <button
              onClick={logoutUser}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: 'var(--danger)',
                fontSize: '0.92rem',
                fontWeight: 600,
                width: '100%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
              className="interactive"
            >
              <LogOut size={18} />
              <span>Log Out</span>
            </button>
          </div>
        </aside>
        
        {/* Right Content Pane */}
        <div className="desktop-main-pane">
          {/* Top Navbar */}
          <header className="desktop-navbar">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-title)', margin: 0 }}>
              {getHeaderTitle(location.pathname)}
            </h2>
            <div className="flex-align-center" style={{ gap: '16px' }}>
              {/* Theme toggle */}
              <button 
                onClick={() => dispatch(toggleTheme())}
                className="interactive"
                style={{ padding: '8px', color: 'var(--text-secondary)', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center' }}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              
              {/* Notifications bell */}
              <button 
                onClick={() => setIsNotificationsOpen(true)}
                className="interactive"
                style={{ padding: '8px', color: 'var(--text-secondary)', position: 'relative', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center' }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    backgroundColor: 'var(--danger)',
                    color: '#ffffff',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </header>
          
          {/* Scrollable content pane */}
          <main className="desktop-scroll-content">
            <Outlet />
          </main>
        </div>

        {/* Quick Actions overlay */}
        <QuickActionSheet 
          isOpen={isActionSheetOpen}
          onClose={() => setIsActionSheetOpen(false)}
          onActionClick={handleQuickAction}
        />

        {/* Reusable Forms Modal Wrapper */}
        <BottomSheet 
          isOpen={activeForm !== null}
          onClose={() => setActiveForm(null)}
          title={
            activeForm === 'sale' ? 'Record New Sale' :
            activeForm === 'purchase' ? 'Record Stock Purchase' :
            activeForm === 'expense' ? 'Log Expense' :
            activeForm === 'product' ? 'Create New Product' : 'Quick Action'
          }
        >
          {activeForm === 'sale' && <SaleForm onSuccess={() => setActiveForm(null)} />}
          {activeForm === 'purchase' && <PurchaseForm onSuccess={() => setActiveForm(null)} />}
          {activeForm === 'expense' && <ExpenseForm onSuccess={() => setActiveForm(null)} />}
          {activeForm === 'product' && <ProductForm onSuccess={() => setActiveForm(null)} />}
        </BottomSheet>

        {/* System Notifications Drawer Modal */}
        <BottomSheet
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          title="Recent Notifications"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '450px', overflowY: 'auto', padding: '2px 4px' }}>
            {localNotifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No recent notifications
              </div>
            ) : (
              localNotifications.map((notif) => {
                const borderLeftColor = 
                  notif.type === 'stock_alert' 
                    ? 'var(--warning)' 
                    : notif.type === 'purchase_alert' 
                      ? 'var(--info)' 
                      : 'var(--success)';
                      
                const iconColor = 
                  notif.type === 'stock_alert' 
                    ? 'var(--warning)' 
                    : notif.type === 'purchase_alert' 
                      ? 'var(--info)' 
                      : 'var(--success)';

                const iconSoftBg = 
                  notif.type === 'stock_alert' 
                    ? 'var(--warning-soft)' 
                    : notif.type === 'purchase_alert' 
                      ? 'var(--info-soft)' 
                      : 'var(--success-soft)';

                return (
                  <div 
                    key={notif.id} 
                    style={{ 
                      padding: '12px 14px', 
                      backgroundColor: 'var(--bg-secondary)', 
                      border: '1px solid var(--border-color)', 
                      borderLeft: `4px solid ${borderLeftColor}`,
                      borderRadius: 'var(--radius-md)',
                      opacity: notif.isRead ? 0.65 : 1,
                      transition: 'all var(--transition-normal)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{
                      backgroundColor: iconSoftBg,
                      color: iconColor,
                      padding: '6px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '2px'
                    }}>
                      {notif.type === 'stock_alert' && <AlertTriangle size={16} />}
                      {notif.type === 'purchase_alert' && <Package size={16} />}
                      {notif.type === 'sale_alert' && <CheckCircle2 size={16} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ 
                          fontWeight: 700, 
                          color: 'var(--text-primary)', 
                          fontSize: '0.85rem',
                          fontFamily: 'var(--font-title)'
                        }}>
                          {notif.title}
                        </span>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          whiteSpace: 'nowrap'
                        }}>
                          <Clock size={10} /> {formatRelativeTime(notif.timestamp)}
                        </span>
                      </div>
                      <p style={{ 
                        fontSize: '0.8rem', 
                        color: 'var(--text-secondary)', 
                        marginTop: '4px',
                        lineHeight: '1.35'
                      }}>
                        {notif.message}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </BottomSheet>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Header */}
      <MobileHeader 
        title={getHeaderTitle(location.pathname)}
        onMenuClick={() => setIsDrawerOpen(true)}
        onNotificationsClick={() => setIsNotificationsOpen(true)}
      />

      {/* Hamburger Drawer */}
      <MobileDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />

      {/* Main Outlet / Scroll area */}
      <main className="scroll-content">
        <Outlet />
      </main>

      {/* FAB to open Quick Action Sheet */}
      <FloatingActionButton 
        onClick={() => setIsActionSheetOpen(true)} 
        visible={isFABVisible}
      />

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Bottom Sheet for Action Selection */}
      <QuickActionSheet 
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        onActionClick={handleQuickAction}
      />

      {/* Reusable Forms Sheet Wrapper */}
      <BottomSheet 
        isOpen={activeForm !== null}
        onClose={() => setActiveForm(null)}
        title={
          activeForm === 'sale' ? 'Record New Sale' :
          activeForm === 'purchase' ? 'Record Stock Purchase' :
          activeForm === 'expense' ? 'Log Expense' :
          activeForm === 'product' ? 'Create New Product' : 'Quick Action'
        }
      >
        {activeForm === 'sale' && <SaleForm onSuccess={() => setActiveForm(null)} />}
        {activeForm === 'purchase' && <PurchaseForm onSuccess={() => setActiveForm(null)} />}
        {activeForm === 'expense' && <ExpenseForm onSuccess={() => setActiveForm(null)} />}
        {activeForm === 'product' && <ProductForm onSuccess={() => setActiveForm(null)} />}
      </BottomSheet>

      {/* System Notifications Drawer / Sheet */}
      <BottomSheet
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        title="Recent Notifications"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '450px', overflowY: 'auto', padding: '2px 4px' }}>
          {localNotifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No recent notifications
            </div>
          ) : (
            localNotifications.map((notif) => {
              const borderLeftColor = 
                notif.type === 'stock_alert' 
                  ? 'var(--warning)' 
                  : notif.type === 'purchase_alert' 
                    ? 'var(--info)' 
                    : 'var(--success)';
                    
              const iconColor = 
                notif.type === 'stock_alert' 
                  ? 'var(--warning)' 
                  : notif.type === 'purchase_alert' 
                    ? 'var(--info)' 
                    : 'var(--success)';

              const iconSoftBg = 
                notif.type === 'stock_alert' 
                  ? 'var(--warning-soft)' 
                  : notif.type === 'purchase_alert' 
                    ? 'var(--info-soft)' 
                    : 'var(--success-soft)';

              return (
                <div 
                  key={notif.id} 
                  style={{ 
                    padding: '12px 14px', 
                    backgroundColor: 'var(--bg-secondary)', 
                    border: '1px solid var(--border-color)', 
                    borderLeft: `4px solid ${borderLeftColor}`,
                    borderRadius: 'var(--radius-md)',
                    opacity: notif.isRead ? 0.65 : 1,
                    transition: 'all var(--transition-normal)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{
                    backgroundColor: iconSoftBg,
                    color: iconColor,
                    padding: '6px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '2px'
                  }}>
                    {notif.type === 'stock_alert' && <AlertTriangle size={16} />}
                    {notif.type === 'purchase_alert' && <Package size={16} />}
                    {notif.type === 'sale_alert' && <CheckCircle2 size={16} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ 
                        fontWeight: 700, 
                        color: 'var(--text-primary)', 
                        fontSize: '0.85rem',
                        fontFamily: 'var(--font-title)'
                      }}>
                        {notif.title}
                      </span>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        whiteSpace: 'nowrap'
                      }}>
                        <Clock size={10} /> {formatRelativeTime(notif.timestamp)}
                      </span>
                    </div>
                    <p style={{ 
                      fontSize: '0.8rem', 
                      color: 'var(--text-secondary)', 
                      marginTop: '4px',
                      lineHeight: '1.35'
                    }}>
                      {notif.message}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </BottomSheet>
    </div>
  );
};
export default MobileLayout;
