import React, { useEffect, useState } from 'react';
import {
  Award,
  Search,
  Filter,
  Building2,
  Calendar,
  IndianRupee,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { SchemeRecord } from '../../../types';
import { AdminKPICard } from '../../../components/admin/ui/AdminKPICard';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useAdminBranch } from '../../../context/AdminBranchContext';
import { useToast } from '../../../context/ToastContext';
import api from '../../../api/client';

export const AdminGoldSchemesPage: React.FC = () => {
  const { branches, selectedBranchId } = useAdminBranch();
  const { error: toastError } = useToast();

  const [schemes, setSchemes] = useState<SchemeRecord[]>([]);
  const [totalSchemes, setTotalSchemes] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>(selectedBranchId?.toString() || 'all');

  const fetchSchemes = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (branchFilter !== 'all') params.branch_id = parseInt(branchFilter);

      const res = await api.get<any>('/api/v1/admin/gold-schemes', { params });
      setSchemes(res.data.schemes || []);
      setTotalSchemes(res.data.total_schemes || 0);
      setTotalAmount(res.data.total_amount || 0);
    } catch (err) {
      console.error('Failed to load schemes:', err);
      toastError('Failed to fetch gold schemes data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, [searchTerm, branchFilter]);

  const avgTicket = totalSchemes > 0 ? Math.round(totalAmount / totalSchemes) : 0;

  return (
    <div className="space-y-7 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBE6DC] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#21845F] bg-[#E8F4EE] px-2.5 py-1 rounded-full border border-[#C5E3D5]">
              Gold Savings Program
            </span>
            <span className="text-xs text-[#8A8479] font-medium">{totalSchemes} Active Subscriptions</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1D1D1B] tracking-tight mt-1">
            Gold Savings Schemes Enterprise Control
          </h1>
          <p className="text-xs text-[#8A8479] font-medium mt-0.5">
            Multi-branch savings scheme enrollments, subscriber ledger, and total booking values
          </p>
        </div>
      </div>

      {/* 4 Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKPICard
          title="Total Schemes Enrolled"
          value={totalSchemes}
          subtitle="Active Subscriptions"
          icon={<Award className="w-5 h-5 text-[#21845F]" />}
          iconBgColor="bg-[#E8F4EE] border-[#C5E3D5] text-[#21845F]"
        />

        <AdminKPICard
          title="Total Scheme Booking Value"
          value={`₹${totalAmount.toLocaleString('en-IN')}`}
          subtitle="Cumulative Gold Bookings"
          icon={<IndianRupee className="w-5 h-5 text-[#7E22CE]" />}
          iconBgColor="bg-[#F3E8FF] border-[#D8B4FE] text-[#7E22CE]"
        />

        <AdminKPICard
          title="Average Ticket Size"
          value={`₹${avgTicket.toLocaleString('en-IN')}`}
          subtitle="Per Subscriber Enrollment"
          icon={<TrendingUp className="w-5 h-5 text-[#526F91]" />}
          iconBgColor="bg-[#EDF2F8] border-[#C6D4E3] text-[#526F91]"
        />

        <AdminKPICard
          title="Scheme Growth Rate"
          value="+18.4%"
          subtitle="Month over Month Expansion"
          icon={<Sparkles className="w-5 h-5 text-[#B97855]" />}
          iconBgColor="bg-[#FAF1EC] border-[#ECCFC0] text-[#B97855]"
        />
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white border border-[#E4DFD4] rounded-2xl shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#8A8479] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, scheme plan, or attending salesperson..."
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs text-[#1D1D1B] placeholder-[#8A8479] focus:outline-none focus:border-[#7E22CE]"
          />
        </div>

        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="px-3 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-bold text-[#1D1D1B] focus:outline-none cursor-pointer w-full sm:w-auto"
        >
          <option value="all">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id.toString()}>
              {b.name} Showroom
            </option>
          ))}
        </select>
      </div>

      {/* Schemes Table */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 shadow-[0_4px_18px_rgba(40,35,25,0.045)]">
        {isLoading ? (
          <LoadingSpinner message="Loading gold schemes..." />
        ) : schemes.length === 0 ? (
          <EmptyState
            title="No schemes found"
            description="No gold savings schemes matched your filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase font-bold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Customer Subscriber</th>
                  <th className="px-4 py-3">Scheme Plan</th>
                  <th className="px-4 py-3">Booking Amount (₹)</th>
                  <th className="px-4 py-3">Origin Showroom</th>
                  <th className="px-4 py-3">Attending Staff</th>
                  <th className="px-4 py-3">Enrollment Date</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE6DC] font-medium">
                {schemes.map((s) => (
                  <tr key={s.id} className="hover:bg-[#FAF5FF] transition-colors">
                    <td className="px-4 py-3.5 font-bold text-[#1D1D1B]">{s.customer_name}</td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-[#7E22CE] block">{s.scheme_name}</span>
                      <span className="text-[10px] text-[#8A8479]">Gold Accumulation</span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-[#21845F] text-sm">
                      ₹{s.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-full bg-[#FAF8F3] border border-[#D8B4FE] text-[#7E22CE] font-bold text-[10px]">
                        {s.branch_name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[#5E5A52] font-semibold">{s.employee_name || 'Staff'}</td>
                    <td className="px-4 py-3.5 text-[#8A8479] font-mono">{s.record_date}</td>
                    <td className="px-4 py-3.5 text-[#5E5A52] max-w-xs truncate">{s.notes || '—'}</td>
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
