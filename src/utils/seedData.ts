import { Category } from '../types/category.types';
import { Subcategory } from '../types/subcategory.types';
import { Unit } from '../types/unit.types';
import { Product } from '../types/product.types';
import { ProductVariant } from '../types/variant.types';
import { Sale } from '../types/sale.types';
import { Purchase } from '../types/purchase.types';
import { Expense } from '../types/expense.types';
import { User } from '../types/auth.types';

// Mock Users (Retained so that demo logins continue to function seamlessly)
export const SEED_USERS: User[] = [
  {
    id: 'user_owner',
    name: 'Ramanjaneyulu',
    email: 'owner@biztracker.com',
    role: 'owner',
    phone: '+91 98765 43210',
    shopName: 'Ramanjaneyulu Super Mart',
    businessType: 'Retail Grocery',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'user_cashier',
    name: 'Ravi Kumar',
    email: 'cashier@biztracker.com',
    role: 'cashier',
    phone: '+91 99988 87766',
    shopName: 'Ramanjaneyulu Super Mart',
    businessType: 'Retail Grocery',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

// Seed Units (Retained as core standard system units for catalog configuration)
export const SEED_UNITS: Unit[] = [
  { id: 'pcs', name: 'Pieces', abbreviation: 'pcs', isDecimalAllowed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'kg', name: 'Kilograms', abbreviation: 'kg', isDecimalAllowed: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ltr', name: 'Liters', abbreviation: 'ltr', isDecimalAllowed: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'box', name: 'Boxes', abbreviation: 'box', isDecimalAllowed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

// Clean Empty Seed Lists for catalog and transactions
export const SEED_CATEGORIES: Category[] = [];
export const SEED_SUBCATEGORIES: Subcategory[] = [];
export const SEED_PRODUCTS: Product[] = [];
export const SEED_VARIANTS: ProductVariant[] = [];
export const SEED_PURCHASES: Purchase[] = [];
export const SEED_SALES: Sale[] = [];
export const SEED_EXPENSES: Expense[] = [];
