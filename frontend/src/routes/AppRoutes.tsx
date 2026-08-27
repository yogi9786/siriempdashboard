import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '../components/layout/DashboardLayout';

// Auth Page
import { LoginPage } from '../pages/auth/LoginPage';

// Manager Module Pages
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { EmployeeListPage } from '../pages/employees/EmployeeListPage';
import { EmployeeAddPage } from '../pages/employees/EmployeeAddPage';
import { EmployeeDetailPage } from '../pages/employees/EmployeeDetailPage';
import { GalleryPage } from '../pages/gallery/GalleryPage';
import { GoogleReviewsPage } from '../pages/reviews/GoogleReviewsPage';
import { AttirePage } from '../pages/attire/AttirePage';
import { OutdoorMarketingPage } from '../pages/outdoor/OutdoorMarketingPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* First Page / Authentication Routes */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Manager Management Routes */}
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

      {/* 404 Catch-All */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
