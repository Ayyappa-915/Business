import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Zap, ShoppingBag, Package, MoreHorizontal } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export const BottomNavigation: React.FC = () => {
  const tabs = [
    { name: 'Dashboard', path: ROUTES.DASHBOARD, icon: <LayoutDashboard size={20} /> },
    { name: 'Quick Sale', path: ROUTES.QUICK_SALE, icon: <Zap size={20} /> },
    { name: 'Products', path: ROUTES.PRODUCTS, icon: <ShoppingBag size={20} /> },
    { name: 'Inventory', path: ROUTES.INVENTORY, icon: <Package size={20} /> },
    { name: 'More', path: ROUTES.MORE, icon: <MoreHorizontal size={20} /> },
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 'var(--bottom-nav-height)',
      backgroundColor: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-color)',
      boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 100,
      paddingBottom: 'var(--safe-area-bottom)'
    }}>
      {tabs.map((tab) => (
        <NavLink
          key={tab.name}
          to={tab.path}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
            fontSize: '0.72rem',
            fontWeight: isActive ? 600 : 500,
            textDecoration: 'none',
            flex: 1,
            height: '100%',
          })}
          className="interactive"
        >
          {tab.icon}
          <span>{tab.name}</span>
        </NavLink>
      ))}
    </nav>
  );
};
export default BottomNavigation;
