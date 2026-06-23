import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { deleteExpense } from '../../db/dbSlice';
import ExpenseCard from '../../../components/cards/ExpenseCard';
import ExpenseForm from '../../../components/forms/ExpenseForm';
import SearchBar from '../../../components/common/SearchBar';
import BottomSheet from '../../../components/common/BottomSheet';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import Button from '../../../components/common/Button';
import SegmentedControl from '../../../components/common/SegmentedControl';

export const ExpensesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const expenses = useAppSelector(state => state.db.expenses);
  
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingExpId, setDeletingExpId] = useState<string | null>(null);

  const filtered = expenses.filter(e => {
    // 1. Search filter
    const matchesSearch = e.category.toLowerCase().includes(search.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;

    // 2. Date preset filter
    const expenseDate = new Date(e.expenseDate);
    const now = new Date();
    if (dateFilter === 'today') {
      if (expenseDate.toDateString() !== now.toDateString()) return false;
    } else if (dateFilter === 'week') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      if (expenseDate < sevenDaysAgo) return false;
    } else if (dateFilter === 'month') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      if (expenseDate < thirtyDaysAgo) return false;
    }

    return true;
  });

  const handleDelete = () => {
    if (deletingExpId) {
      dispatch(deleteExpense(deletingExpId));
      setDeletingExpId(null);
    }
  };

  const totalExpenseSum = filtered.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="animate-fade-in">
      <div className="flex-between">
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cost Book</span>
          <h3 style={{ fontSize: '1.25rem', marginTop: '2px', fontWeight: 800 }}>Expenses Log</h3>
        </div>
        <Button onClick={() => setIsAddOpen(true)} size="sm">
          + Log Expense
        </Button>
      </div>

      <SegmentedControl
        options={[
          { value: 'all', label: 'All Time' },
          { value: 'today', label: 'Today' },
          { value: 'week', label: 'This Week' },
          { value: 'month', label: 'This Month' }
        ]}
        value={dateFilter}
        onChange={(val) => setDateFilter(val as any)}
      />

      {/* Expense Summary Capital */}
      <div className="card flex-between" style={{ padding: '14px', backgroundColor: 'var(--danger-soft)', borderColor: 'var(--danger)', marginTop: '-4px' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {dateFilter === 'all' ? 'Total Outflow (All Time)' : `Total Outflow (${dateFilter.toUpperCase()})`}
        </span>
        <strong style={{ fontSize: '1.25rem', color: 'var(--danger)', fontFamily: 'var(--font-title)' }}>
          ₹{totalExpenseSum.toFixed(2)}
        </strong>
      </div>

      <SearchBar 
        value={search}
        onChange={setSearch}
        placeholder="Search by category or description..."
      />

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
          No expense entries found
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(exp => (
            <ExpenseCard
              key={exp.id}
              expense={exp}
              onDelete={() => setDeletingExpId(exp.id)}
            />
          ))}
        </div>
      )}

      {/* Add expense sheet */}
      <BottomSheet isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Log Outgoing Expense">
        <ExpenseForm onSuccess={() => setIsAddOpen(false)} />
      </BottomSheet>

      {/* Delete dialog */}
      <ConfirmDialog
        isOpen={deletingExpId !== null}
        title="Delete Expense Record?"
        message="This will permanently delete this expense log from your accounting ledger. Action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeletingExpId(null)}
        isDanger
      />
    </div>
  );
};

export default ExpensesPage;
