import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Tags, FolderTree, Layers, ArrowDownCircle, ArrowUpRight, 
  Wallet, FileSpreadsheet, BarChart3, Users, Settings, Database 
} from 'lucide-react';
import { ROUTES } from '../../../constants/routes';

export const MorePage: React.FC = () => {
  const navigate = useNavigate();

  const links = [
    { name: 'Categories', desc: 'Create & group types', path: ROUTES.CATEGORIES, icon: <Tags size={22} />, color: '#10b981' },
    { name: 'Subcategories', desc: 'Detailed catalog splits', path: ROUTES.SUBCATEGORIES, icon: <FolderTree size={22} />, color: '#3b82f6' },
    { name: 'Product Variants', desc: 'Manage prices & sizes', path: ROUTES.VARIANTS, icon: <Layers size={22} />, color: '#8b5cf6' },
    { name: 'Purchases Log', desc: 'Stock-in invoice items', path: ROUTES.PURCHASES, icon: <ArrowDownCircle size={22} />, color: '#0ea5e9' },
    { name: 'Sales Logs', desc: 'Check receipt history', path: ROUTES.SALES, icon: <ArrowUpRight size={22} />, color: '#10b981' },
    { name: 'Expense Book', desc: 'Log monthly costs', path: ROUTES.EXPENSES, icon: <Wallet size={22} />, color: '#ef4444' },
    { name: 'Reports & Exports', desc: 'Download CSV datasets', path: ROUTES.REPORTS, icon: <FileSpreadsheet size={22} />, color: '#ff5722' },
    { name: 'Business Insights', desc: 'Sales & profits charts', path: ROUTES.ANALYTICS, icon: <BarChart3 size={22} />, color: '#ffaa00' },
    { name: 'Staff roles', desc: 'Manage cashier permissions', path: ROUTES.USERS, icon: <Users size={22} />, color: '#607d8b' },
    { name: 'Backup & JSON DB', desc: 'Import or export state', path: ROUTES.BACKUP_RESTORE, icon: <Database size={22} />, color: '#9c27b0' },
    { name: 'Settings profile', desc: 'Theme & measurement units', path: ROUTES.SETTINGS, icon: <Settings size={22} />, color: '#3f51b5' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} className="animate-fade-in">
      <div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>More Modules</span>
        <h3 style={{ fontSize: '1.25rem', marginTop: '2px', fontWeight: 800 }}>App Modules</h3>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        paddingBottom: '30px'
      }}>
        {links.map((link) => (
          <div
            key={link.name}
            onClick={() => navigate(link.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '14px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              gap: '10px',
              transition: 'transform var(--transition-fast), border-color var(--transition-fast)'
            }}
            className="interactive card-clickable"
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: `${link.color}15`,
              color: link.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {link.icon}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {link.name}
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: '1.2' }}>
                {link.desc}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default MorePage;
