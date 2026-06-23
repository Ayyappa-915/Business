import React from 'react';
import { ArrowUpRight, ArrowDownCircle, Wallet, ShoppingBag } from 'lucide-react';
import BottomSheet from '../../components/common/BottomSheet';

export type QuickActionType = 'sale' | 'purchase' | 'expense' | 'product';

interface QuickActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onActionClick: (type: QuickActionType) => void;
}

export const QuickActionSheet: React.FC<QuickActionSheetProps> = ({
  isOpen,
  onClose,
  onActionClick
}) => {
  const actions = [
    { type: 'sale' as const, name: 'Record Sale', desc: 'Sell items to a customer', icon: <ArrowUpRight size={22} />, color: 'var(--success)' },
    { type: 'purchase' as const, name: 'Record Purchase', desc: 'Add stock from a supplier', icon: <ArrowDownCircle size={22} />, color: 'var(--primary)' },
    { type: 'expense' as const, name: 'Log Expense', desc: 'Record bills, salaries, rent', icon: <Wallet size={22} />, color: 'var(--danger)' },
    { type: 'product' as const, name: 'Add Product', desc: 'Create new catalog item', icon: <ShoppingBag size={22} />, color: 'var(--warning)' },
  ];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Quick Actions">
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '12px',
        padding: '8px 0'
      }}>
        {actions.map((act) => (
          <div
            key={act.type}
            onClick={() => {
              onActionClick(act.type);
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '14px',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'transform 0.15s, border-color 0.15s'
            }}
            className="interactive"
          >
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: `${act.color}15`,
              color: act.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {act.icon}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{act.name}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{act.desc}</span>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>❯</span>
          </div>
        ))}
      </div>
    </BottomSheet>
  );
};
export default QuickActionSheet;
