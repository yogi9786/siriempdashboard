import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const AdminProtectedRoute: React.FC = () => {
  const { isAuthenticated, isSuperAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullPage message="Authenticating Enterprise Super Admin session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isSuperAdmin) {
    // If manager tries to access admin area, redirect to showroom manager portal
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
