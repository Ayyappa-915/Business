import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

// Layouts
import AuthLayout from '../layouts/AuthLayout/AuthLayout';
import MobileLayout from '../layouts/MobileLayout/MobileLayout';

// Gates
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Feature Pages
import SplashPage from '../features/auth/pages/SplashPage';
import OnboardingPage from '../features/auth/pages/OnboardingPage';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';

import DashboardPage from '../features/dashboard/pages/DashboardPage';
import QuickSalePage from '../features/quick-sale/pages/QuickSalePage';
import ProductsPage from '../features/products/pages/ProductsPage';
import InventoryPage from '../features/inventory/pages/InventoryPage';
import MorePage from '../features/settings/pages/MorePage';

import CategoriesPage from '../features/categories/pages/CategoriesPage';
import SubcategoriesPage from '../features/subcategories/pages/SubcategoriesPage';
import VariantsPage from '../features/variants/pages/VariantsPage';
import PurchasesPage from '../features/purchases/pages/PurchasesPage';
import SalesPage from '../features/sales/pages/SalesPage';
import ExpensesPage from '../features/expenses/pages/ExpensesPage';
import ReportsPage from '../features/reports/pages/ReportsPage';
import AnalyticsPage from '../features/analytics/pages/AnalyticsPage';
import UsersPage from '../features/users/pages/UsersPage';
import SettingsPage from '../features/settings/pages/SettingsPage';
import BackupPage from '../features/settings/pages/BackupPage';

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Authentication Routes */}
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.SPLASH} element={<SplashPage />} />
          <Route path={ROUTES.ONBOARDING} element={<OnboardingPage />} />
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        </Route>

        {/* Private Protected Shop Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MobileLayout />}>
            {/* Primary Tab Pages */}
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.QUICK_SALE} element={<QuickSalePage />} />
            <Route path={ROUTES.PRODUCTS} element={<ProductsPage />} />
            <Route path={ROUTES.INVENTORY} element={<InventoryPage />} />
            <Route path={ROUTES.MORE} element={<MorePage />} />

            {/* General Drawer Pages */}
            <Route path={ROUTES.CATEGORIES} element={<CategoriesPage />} />
            <Route path={ROUTES.SUBCATEGORIES} element={<SubcategoriesPage />} />
            <Route path={ROUTES.VARIANTS} element={<VariantsPage />} />
            <Route path={ROUTES.PURCHASES} element={<PurchasesPage />} />
            <Route path={ROUTES.SALES} element={<SalesPage />} />
            <Route path={ROUTES.EXPENSES} element={<ExpensesPage />} />
            <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
            <Route path={ROUTES.ANALYTICS} element={<AnalyticsPage />} />
            
            {/* Owner/Manager Restricted Pages */}
            <Route element={<RoleRoute allowedRoles={['owner', 'manager']} />}>
              <Route path={ROUTES.USERS} element={<UsersPage />} />
              <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
              <Route path={ROUTES.BACKUP_RESTORE} element={<BackupPage />} />
            </Route>
          </Route>
        </Route>

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to={ROUTES.SPLASH} replace />} />
      </Routes>
    </BrowserRouter>
  );
};
export default AppRoutes;
