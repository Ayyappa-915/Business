import React, { useState } from 'react';
import { useAppDispatch } from '../../app/hooks';
import { addExpense } from '../../features/db/dbSlice';
import Input from '../common/Input';
import Select from '../common/Select';
import TextArea from '../common/TextArea';
import Button from '../common/Button';
import { Expense } from '../../types/expense.types';

interface ExpenseFormProps {
  onSuccess: () => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSuccess }) => {
  const dispatch = useAppDispatch();
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  const [error, setError] = useState('');

  const categories = [
    { value: 'Rent', label: 'Rent' },
    { value: 'Utilities', label: 'Utilities (Electricity, Water)' },
    { value: 'Salary', label: 'Staff Salaries' },
    { value: 'Logistics', label: 'Transport & Logistics' },
    { value: 'Marketing', label: 'Marketing & Promo' },
    { value: 'Others', label: 'Others / Miscellaneous' },
  ];

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'upi', label: 'UPI / PhonePe / GPay' },
    { value: 'card', label: 'Card / POS Terminal' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      setError('Please select a category.');
      return;
    }
    const amtVal = parseFloat(amount);
    if (isNaN(amtVal) || amtVal <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    const newExpense: Expense = {
      id: 'exp_' + Math.random().toString(36).substr(2, 9),
      category,
      amount: amtVal,
      description,
      paymentMethod,
      expenseDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    dispatch(addExpense(newExpense));
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600 }}>{error}</div>}
      
      <Select
        label="Category"
        options={categories}
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="Choose expense type..."
      />

      <Input
        label="Amount (₹)"
        type="number"
        placeholder="Enter expense amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        min="1"
        required
      />

      <Select
        label="Payment Method"
        options={paymentMethods}
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value as any)}
      />

      <TextArea
        label="Description / Notes"
        placeholder="Add details (e.g., Shop rent for June)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Button type="submit" fullWidth style={{ marginTop: '16px' }}>
        Save Expense Record
      </Button>
    </form>
  );
};
export default ExpenseForm;
