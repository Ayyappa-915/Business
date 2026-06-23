import { BaseEntity } from './common.types';

export interface Expense extends BaseEntity {
  category: string; // e.g. "Rent", "Utilities", "Salary", "Custom..."
  amount: number;
  expenseDate: string;
  paymentMethod: 'cash' | 'upi' | 'card';
  description?: string;
}
