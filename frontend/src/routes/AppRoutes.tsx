import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminProtectedRoute } from './AdminProtectedRoute';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { AdminLayout } from '../components/admin/layout/AdminLayout';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { AdminLoginPage } from '../pages/admin/auth/AdminLoginPage';

// Manager Module Pages
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { EmployeeListPage } from '../pages/employees/EmployeeListPage';
import { EmployeeAddPage } from '../pages/employees/EmployeeAddPage';
import { EmployeeDetailPage } from '../pages/employees/EmployeeDetailPage';
import { GalleryPage } from '../pages/gallery/GalleryPage';
import { GoogleReviewsPage } from '../pages/reviews/GoogleReviewsPage';
import { AttirePage } from '../pages/attire/AttirePage';
import { OutdoorMarketingPage } from '../pages/outdoor/OutdoorMarketingPage';

// Super Admin Enterprise Module Pages
import { AdminDashboardPage } from '../pages/admin/dashboard/AdminDashboardPage';
import { AdminBranchListPage } from '../pages/admin/branches/AdminBranchListPage';
import { AdminBranchDetailPage } from '../pages/admin/branches/AdminBranchDetailPage';
import { AdminManagerPage } from '../pages/admin/managers/AdminManagerPage';
import { AdminEmployeeListPage } from '../pages/admin/employees/AdminEmployeeListPage';
import { AdminPerformancePage } from '../pages/admin/performance/AdminPerformancePage';
import { AdminCustomerPage } from '../pages/admin/customers/AdminCustomerPage';
import { AdminCustomerActivitiesPage } from '../pages/admin/customers/AdminCustomerActivitiesPage';
import { AdminGoldSchemesPage } from '../pages/admin/schemes/AdminGoldSchemesPage';
import { AdminOutdoorMarketingPage } from '../pages/admin/outdoor/AdminOutdoorMarketingPage';
import { AdminGoogleReviewsPage } from '../pages/admin/reviews/AdminGoogleReviewsPage';
import { AdminAttirePage } from '../pages/admin/attire/AdminAttirePage';
import { AdminGalleryPage } from '../pages/admin/gallery/AdminGalleryPage';
import { AdminReportsPage } from '../pages/admin/reports/AdminReportsPage';
import { AdminAuditLogsPage } from '../pages/admin/audit/AdminAuditLogsPage';
import { AdminSettingsPage } from '../pages/admin/settings/AdminSettingsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* First Page / Authentication Routes */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

      {/* Protected Showroom Manager Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/employees" element={<EmployeeListPage />} />
          <Route path="/employees/add" element={<EmployeeAddPage />} />
          <Route path="/employees/:id" element={<EmployeeDetailPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/google-reviews" element={<GoogleReviewsPage />} />
          <Route path="/attire" element={<AttirePage />} />
          <Route path="/outdoor-marketing" element={<OutdoorMarketingPage />} />
        </Route>
      </Route>

      {/* Protected Super Admin Enterprise Routes */}
      <Route element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/branches" element={<AdminBranchListPage />} />
          <Route path="/admin/branches/:id" element={<AdminBranchDetailPage />} />
          <Route path="/admin/managers" element={<AdminManagerPage />} />
          <Route path="/admin/employees" element={<AdminEmployeeListPage />} />
          <Route path="/admin/performance" element={<AdminPerformancePage />} />
          <Route path="/admin/customers" element={<AdminCustomerPage />} />
          <Route path="/admin/customer-activities" element={<AdminCustomerActivitiesPage />} />
          <Route path="/admin/gold-schemes" element={<AdminGoldSchemesPage />} />
          <Route path="/admin/outdoor-marketing" element={<AdminOutdoorMarketingPage />} />
          <Route path="/admin/google-reviews" element={<AdminGoogleReviewsPage />} />
          <Route path="/admin/attire" element={<AdminAttirePage />} />
          <Route path="/admin/gallery" element={<AdminGalleryPage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
