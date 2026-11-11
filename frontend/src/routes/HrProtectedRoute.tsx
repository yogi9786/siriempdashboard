import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const HrProtectedRoute: React.FC = () => {
  const { isAuthenticated, isHR, isSuperAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-[#D97706] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-[#536B8A] tracking-wider uppercase">Loading HR Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (!isHR && !isSuperAdmin)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
