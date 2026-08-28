import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api/client';
import { Branch } from '../types';

interface AdminBranchContextType {
  selectedBranchId: number | null; // null represents "All Branches"
  selectedBranch: Branch | null;
  branches: Branch[];
  dateRange: string;
  setSelectedBranchId: (id: number | null) => void;
  setDateRange: (range: string) => void;
  refreshBranches: () => Promise<void>;
  isLoadingBranches: boolean;
}

const AdminBranchContext = createContext<AdminBranchContextType | undefined>(undefined);

export const AdminBranchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(() => {
    const saved = localStorage.getItem('siri_admin_branch_id');
    return saved !== null && saved !== 'all' ? parseInt(saved, 10) : null;
  });
  const [dateRange, setDateRange] = useState<string>(() => {
    return localStorage.getItem('siri_admin_date_range') || 'all';
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState<boolean>(true);

  const refreshBranches = async () => {
    try {
      setIsLoadingBranches(true);
      const res = await api.get<Branch[]>('/api/v1/auth/branches');
      setBranches(res.data);
    } catch (err) {
      console.error('Failed to load branches in AdminBranchContext:', err);
    } finally {
      setIsLoadingBranches(false);
    }
  };

  useEffect(() => {
    refreshBranches();
  }, []);

  const handleSetSelectedBranchId = (id: number | null) => {
    setSelectedBranchId(id);
    if (id === null) {
      localStorage.setItem('siri_admin_branch_id', 'all');
    } else {
      localStorage.setItem('siri_admin_branch_id', id.toString());
    }
  };

  const handleSetDateRange = (range: string) => {
    setDateRange(range);
    localStorage.setItem('siri_admin_date_range', range);
  };

  const selectedBranch = selectedBranchId
    ? branches.find((b) => b.id === selectedBranchId) || null
    : null;

  return (
    <AdminBranchContext.Provider
      value={{
        selectedBranchId,
        selectedBranch,
        branches,
        dateRange,
        setSelectedBranchId: handleSetSelectedBranchId,
        setDateRange: handleSetDateRange,
        refreshBranches,
        isLoadingBranches,
      }}
    >
      {children}
    </AdminBranchContext.Provider>
  );
};

export const useAdminBranch = (): AdminBranchContextType => {
  const context = useContext(AdminBranchContext);
  if (!context) {
    throw new Error('useAdminBranch must be used within an AdminBranchProvider');
  }
  return context;
};
