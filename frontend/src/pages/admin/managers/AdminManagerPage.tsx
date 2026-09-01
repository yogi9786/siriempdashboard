import React, { useEffect, useState } from 'react';
import {
  Shield,
  Search,
  Building2,
  Mail,
  UserCheck,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { AdminManager } from '../../../types';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useToast } from '../../../context/ToastContext';
import { useAdminBranch } from '../../../context/AdminBranchContext';
import api from '../../../api/client';

export const AdminManagerPage: React.FC = () => {
  const { branches } = useAdminBranch();
  const { error: toastError } = useToast();

  const [managers, setManagers] = useState<AdminManager[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchManagers = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (branchFilter !== 'all') params.branch_id = parseInt(branchFilter);
      if (statusFilter !== 'all') params.is_active = statusFilter === 'active';

      const res = await api.get<AdminManager[]>('/api/v1/admin/managers', { params });
      setManagers(res.data);
    } catch (err) {
      console.error('Failed to load managers:', err);
      toastError('Failed to fetch managers list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, [searchTerm, branchFilter, statusFilter]);

  return (
    <div className="space-y-7 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBE6DC] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#D97706] bg-[#FEF3C7] px-2.5 py-1 rounded-full border border-[#FDE68A]">
              Showroom Leadership
            </span>
            <span className="text-xs text-[#8A8479] font-medium">{managers.length} Active Managers</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1D1D1B] tracking-tight mt-1">
            Showroom Managers Directory
          </h1>
          <p className="text-xs text-[#8A8479] font-medium mt-0.5">
            Active showroom managerial accounts across Yelahanka, Kolar, and Udupi branches (Read-Only Overview)
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#FAF8F3] border border-[#E4DFD4] text-[#5E5A52] text-xs font-bold shadow-2xs">
          <Lock className="w-4 h-4 text-[#D97706]" />
          <span>System Environment Managed</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white border border-[#E4DFD4] rounded-2xl shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#8A8479] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search managers by name, username, or branch..."
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs text-neutral-900 placeholder:text-[#8A8479] focus:border-[#7E22CE] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-bold text-[#1D1D1B] focus:outline-none cursor-pointer"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id.toString()}>
                {b.name} Showroom
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-bold text-[#1D1D1B] focus:outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Managers Table */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 shadow-[0_4px_18px_rgba(40,35,25,0.045)]">
        {isLoading ? (
          <LoadingSpinner message="Loading managers..." />
        ) : managers.length === 0 ? (
          <EmptyState
            title="No managers found"
            description="No showroom managers matched your search criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase font-bold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Manager Name</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Assigned Branch</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE6DC] font-medium">
                {managers.map((m) => (
                  <tr key={m.id} className="hover:bg-[#FAF5FF] transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] flex items-center justify-center font-bold text-xs shrink-0">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-[#1D1D1B] block">{m.full_name}</span>
                          <span className="text-[10px] font-mono font-bold text-[#536B8A]">
                            {m.manager_code ? `Manager ID #${m.manager_code}` : `ID #${m.id}`}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[#8A8479]">@{m.username}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-full bg-[#FAF8F3] border border-[#D8B4FE] text-[#7E22CE] font-bold text-[10px]">
                        {m.branch_name} ({m.branch_code})
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-[#1D1D1B]">Showroom Branch Manager</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-[10px] ${
                          m.is_active
                            ? 'bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]'
                            : 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
                        }`}
                      >
                        {m.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {m.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
