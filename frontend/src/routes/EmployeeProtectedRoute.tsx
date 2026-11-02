import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const EmployeeProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading, isEmployee } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullPage message="Authenticating employee session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If a manager or admin attempts to access employee-only activity page, route them to dashboard
  if (!isEmployee) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
