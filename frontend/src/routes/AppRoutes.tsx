import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminProtectedRoute } from './AdminProtectedRoute';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { AdminLayout } from '../components/admin/layout/AdminLayout';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

// Auth Pages
const LoginPage = lazy(() => import('../pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const AdminLoginPage = lazy(() => import('../pages/admin/auth/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));

// Manager Module Pages
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const EmployeeListPage = lazy(() => import('../pages/employees/EmployeeListPage').then(m => ({ default: m.EmployeeListPage })));
const EmployeeAddPage = lazy(() => import('../pages/employees/EmployeeAddPage').then(m => ({ default: m.EmployeeAddPage })));
const EmployeeDetailPage = lazy(() => import('../pages/employees/EmployeeDetailPage').then(m => ({ default: m.EmployeeDetailPage })));
const CustomerActivityPage = lazy(() => import('../pages/customers/CustomerActivityPage').then(m => ({ default: m.CustomerActivityPage })));
const GalleryPage = lazy(() => import('../pages/gallery/GalleryPage').then(m => ({ default: m.GalleryPage })));
const GoogleReviewsPage = lazy(() => import('../pages/reviews/GoogleReviewsPage').then(m => ({ default: m.GoogleReviewsPage })));
const AttirePage = lazy(() => import('../pages/attire/AttirePage').then(m => ({ default: m.AttirePage })));
const OutdoorMarketingPage = lazy(() => import('../pages/outdoor/OutdoorMarketingPage').then(m => ({ default: m.OutdoorMarketingPage })));
const AccountSettingsPage = lazy(() => import('../pages/account/AccountSettingsPage').then(m => ({ default: m.AccountSettingsPage })));
const ShowroomCustomerLogPage = lazy(() => import('../pages/customers/ShowroomCustomerLogPage').then(m => ({ default: m.ShowroomCustomerLogPage })));
const OutdoorCustomerLeadsPage = lazy(() => import('../pages/outdoor/OutdoorCustomerLeadsPage').then(m => ({ default: m.OutdoorCustomerLeadsPage })));
const PendingCustomerActivityPage = lazy(() => import('../pages/customers/PendingCustomerActivityPage').then(m => ({ default: m.PendingCustomerActivityPage })));
const WhatsAppTemplatesPage = lazy(() => import('../pages/whatsapp/WhatsAppTemplatesPage').then(m => ({ default: m.WhatsAppTemplatesPage })));
const BranchRevenuePage = lazy(() => import('../pages/revenue/BranchRevenuePage').then(m => ({ default: m.BranchRevenuePage })));

// HR Management Portal Pages & Guard
import { HrProtectedRoute } from './HrProtectedRoute';
import { HrLayout } from '../components/hr/layout/HrLayout';
const HrDashboardPage = lazy(() => import('../pages/hr/HrDashboardPage').then(m => ({ default: m.HrDashboardPage })));
const HrEmployeesPage = lazy(() => import('../pages/hr/HrEmployeesPage').then(m => ({ default: m.HrEmployeesPage })));
const HrPaySlipsPage = lazy(() => import('../pages/hr/HrPaySlipsPage').then(m => ({ default: m.HrPaySlipsPage })));
const HrCustomersPage = lazy(() => import('../pages/hr/HrCustomersPage').then(m => ({ default: m.HrCustomersPage })));
const HrRevenuePage = lazy(() => import('../pages/hr/HrRevenuePage').then(m => ({ default: m.HrRevenuePage })));
const HrLeavesPage = lazy(() => import('../pages/hr/HrLeavesPage').then(m => ({ default: m.HrLeavesPage })));

// Employee Module Pages & Guard
import { EmployeeProtectedRoute } from './EmployeeProtectedRoute';
const EmployeePortalPage = lazy(() => import('../pages/employee/EmployeePortalPage').then(m => ({ default: m.EmployeePortalPage })));

// Super Admin Enterprise Module Pages
const AdminDashboardPage = lazy(() => import('../pages/admin/dashboard/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const AdminBranchListPage = lazy(() => import('../pages/admin/branches/AdminBranchListPage').then(m => ({ default: m.AdminBranchListPage })));
const AdminBranchDetailPage = lazy(() => import('../pages/admin/branches/AdminBranchDetailPage').then(m => ({ default: m.AdminBranchDetailPage })));
const AdminManagerPage = lazy(() => import('../pages/admin/managers/AdminManagerPage').then(m => ({ default: m.AdminManagerPage })));
const AdminEmployeeListPage = lazy(() => import('../pages/admin/employees/AdminEmployeeListPage').then(m => ({ default: m.AdminEmployeeListPage })));
const AdminEmployeeDetailPage = lazy(() => import('../pages/admin/employees/AdminEmployeeDetailPage').then(m => ({ default: m.AdminEmployeeDetailPage })));
const AdminPerformancePage = lazy(() => import('../pages/admin/performance/AdminPerformancePage').then(m => ({ default: m.AdminPerformancePage })));
const AdminCustomerPage = lazy(() => import('../pages/admin/customers/AdminCustomerPage').then(m => ({ default: m.AdminCustomerPage })));
const AdminCustomerActivitiesPage = lazy(() => import('../pages/admin/customers/AdminCustomerActivitiesPage').then(m => ({ default: m.AdminCustomerActivitiesPage })));
const AdminGoldSchemesPage = lazy(() => import('../pages/admin/schemes/AdminGoldSchemesPage').then(m => ({ default: m.AdminGoldSchemesPage })));
const AdminOutdoorMarketingPage = lazy(() => import('../pages/admin/outdoor/AdminOutdoorMarketingPage').then(m => ({ default: m.AdminOutdoorMarketingPage })));
const AdminGoogleReviewsPage = lazy(() => import('../pages/admin/reviews/AdminGoogleReviewsPage').then(m => ({ default: m.AdminGoogleReviewsPage })));
const AdminAttirePage = lazy(() => import('../pages/admin/attire/AdminAttirePage').then(m => ({ default: m.AdminAttirePage })));
const AdminGalleryPage = lazy(() => import('../pages/admin/gallery/AdminGalleryPage').then(m => ({ default: m.AdminGalleryPage })));
const AdminReportsPage = lazy(() => import('../pages/admin/reports/AdminReportsPage').then(m => ({ default: m.AdminReportsPage })));
const AdminAuditLogsPage = lazy(() => import('../pages/admin/audit/AdminAuditLogsPage').then(m => ({ default: m.AdminAuditLogsPage })));
const AdminSettingsPage = lazy(() => import('../pages/admin/settings/AdminSettingsPage').then(m => ({ default: m.AdminSettingsPage })));

const SuspenseLoader: React.FC = () => (
  <LoadingSpinner fullPage message="Loading..." />
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<SuspenseLoader />}>
      <Routes>
        {/* First Page / Authentication Routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Protected Employee Portal Routes (Strictly Customer Logs & Call Logs) */}
        <Route element={<EmployeeProtectedRoute />}>
          <Route path="/employee" element={<Navigate to="/employee/activity" replace />} />
          <Route path="/employee/activity" element={<EmployeePortalPage />} />
        </Route>

        {/* Protected Showroom Manager Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/customer-logs" element={<ShowroomCustomerLogPage />} />
            <Route path="/pending-customer-activity" element={<PendingCustomerActivityPage />} />
            <Route path="/customers" element={<CustomerActivityPage />} />
            <Route path="/customer-activity" element={<Navigate to="/customer-logs" replace />} />
            <Route path="/whatsapp" element={<WhatsAppTemplatesPage />} />
            <Route path="/whatsapp-templates" element={<Navigate to="/whatsapp" replace />} />
            <Route path="/employees" element={<EmployeeListPage />} />
            <Route path="/employees/add" element={<EmployeeAddPage />} />
            <Route path="/employees/:id" element={<EmployeeDetailPage />} />
            <Route path="/attendance" element={<Navigate to="/dashboard" replace />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/google-reviews" element={<GoogleReviewsPage />} />
            <Route path="/outdoor-marketing" element={<OutdoorMarketingPage />} />
            <Route path="/outdoor-marketing/daily" element={<OutdoorMarketingPage />} />
            <Route path="/outdoor-customers" element={<Navigate to="/outdoor-marketing" replace />} />
            <Route path="/outdoor" element={<Navigate to="/outdoor-marketing" replace />} />
            <Route path="/revenue" element={<BranchRevenuePage />} />
            <Route path="/account" element={<AccountSettingsPage />} />

            <Route path="/profile" element={<Navigate to="/account" replace />} />
          </Route>
        </Route>

        {/* Protected HR Management Portal Routes */}
        <Route element={<HrProtectedRoute />}>
          <Route element={<HrLayout />}>
            <Route path="/hr" element={<Navigate to="/hr/dashboard" replace />} />
            <Route path="/hr/dashboard" element={<HrDashboardPage />} />
            <Route path="/hr/employees" element={<HrEmployeesPage />} />
            <Route path="/hr/employees/add" element={<HrEmployeesPage />} />
            <Route path="/hr/payslips" element={<HrPaySlipsPage />} />
            <Route path="/hr/customers" element={<HrCustomersPage />} />
            <Route path="/hr/revenue" element={<HrRevenuePage />} />
            <Route path="/hr/leaves" element={<HrLeavesPage />} />
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
            <Route path="/admin/employees/:id" element={<AdminEmployeeDetailPage />} />
            <Route path="/admin/attendance" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/performance" element={<AdminPerformancePage />} />
            <Route path="/admin/customers" element={<AdminCustomerPage />} />
            <Route path="/admin/customer-activities" element={<AdminCustomerActivitiesPage />} />
            <Route path="/admin/customer-logs" element={<ShowroomCustomerLogPage />} />
            <Route path="/admin/gold-schemes" element={<AdminGoldSchemesPage />} />
            <Route path="/admin/outdoor-marketing" element={<AdminOutdoorMarketingPage />} />
            <Route path="/admin/outdoor-customers" element={<OutdoorCustomerLeadsPage />} />
            <Route path="/admin/google-reviews" element={<AdminGoogleReviewsPage />} />
            <Route path="/admin/attire" element={<AdminAttirePage />} />
            <Route path="/admin/gallery" element={<AdminGalleryPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/whatsapp" element={<WhatsAppTemplatesPage />} />
            <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>

        {/* 404 Catch-All */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};
