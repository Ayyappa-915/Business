import React from 'react';
import { Calendar, CreditCard, DollarSign } from 'lucide-react';
import { Expense } from '../../types/expense.types';
import Badge from '../common/Badge';

interface ExpenseCardProps {
  expense: Expense;
  onDelete?: () => void;
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({
  expense,
  onDelete
}) => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="flex-between">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--danger-soft)',
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem'
          }}>
            💸
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h5 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{expense.category}</h5>
            {expense.description && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {expense.description}
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <span style={{
            fontSize: '1.15rem',
            fontWeight: 800,
            color: 'var(--danger)',
            fontFamily: 'var(--font-title)'
          }}>
            - ₹{expense.amount}
          </span>
          <Badge variant="danger">{expense.paymentMethod.toUpperCase()}</Badge>
        </div>
      </div>

      <div className="flex-between" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={12} /> {new Date(expense.expenseDate).toLocaleDateString()}
        </span>
        {onDelete && (
          <button onClick={onDelete} style={{ color: 'var(--danger)', fontWeight: 600 }} className="interactive">
            Delete
          </button>
        )}
      </div>
    </div>
  );
};
export default ExpenseCard;
