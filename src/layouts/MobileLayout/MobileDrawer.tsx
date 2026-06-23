import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Tags, FolderTree, ShoppingBag, Layers, 
  ArrowDownCircle, ArrowUpRight, Wallet, Package, 
  FileText, BarChart3, Users, Settings, Database, LogOut 
} from 'lucide-react';
import Drawer from '../../components/common/Drawer';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const { user, logoutUser } = useAuth();

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

  return (
    <Drawer isOpen={isOpen} onClose={onClose} position="left">
      {/* Drawer Header */}
      <div style={{
        padding: '24px 16px',
        background: 'linear-gradient(135deg, var(--primary) 0%, #1e3a8a 100%)',
        color: '#ffffff',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{user?.shopName || 'BizTracker'}</h2>
        <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>{user?.name} ({user?.role?.toUpperCase()})</span>
        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{user?.businessType || 'Retail'}</span>
      </div>

      {/* Drawer Menu List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 8px'
      }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={onClose}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'var(--primary-soft)' : 'transparent',
              fontSize: '0.9rem',
              fontWeight: isActive ? 600 : 500,
              marginBottom: '4px',
              transition: 'background-color 0.2s',
              textDecoration: 'none'
            })}
            className="interactive"
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>

      {/* Drawer Footer / Logout */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--border-color)',
        display: 'flex'
      }}>
        <button
          onClick={() => {
            onClose();
            logoutUser();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'var(--danger)',
            fontSize: '0.9rem',
            fontWeight: 600,
            width: '100%',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)'
          }}
          className="interactive"
        >
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </div>
    </Drawer>
  );
};
export default MobileDrawer;
