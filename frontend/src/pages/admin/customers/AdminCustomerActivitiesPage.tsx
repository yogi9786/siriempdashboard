import React, { useEffect, useState } from 'react';
import {
  UserCheck,
  Search,
  Filter,
  Building2,
  Calendar,
  Phone,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { CustomerActivity } from '../../../types';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useAdminBranch } from '../../../context/AdminBranchContext';
import { useToast } from '../../../context/ToastContext';
import api from '../../../api/client';

export const AdminCustomerActivitiesPage: React.FC = () => {
  const { branches, selectedBranchId } = useAdminBranch();
  const { error: toastError } = useToast();

  const [activities, setActivities] = useState<CustomerActivity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>(selectedBranchId?.toString() || 'all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (branchFilter !== 'all') params.branch_id = parseInt(branchFilter);
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await api.get<CustomerActivity[]>('/api/v1/admin/customer-activities', { params });
      setActivities(res.data);
    } catch (err) {
      console.error('Failed to load customer activities:', err);
      toastError('Failed to fetch walk-ins and inquiries.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [searchTerm, branchFilter, statusFilter]);

  const getClosedCount = (act: CustomerActivity): number => {
    if (act.breakdown) {
      const parts = act.breakdown.split('|');
      const closedInBreakdown = parts.filter(
        (p) => p.toLowerCase().includes(': closed') || p.trim().toLowerCase() === 'closed'
      ).length;
      if (closedInBreakdown > 0) return closedInBreakdown;
    }
    return act.status === 'Closed' ? (act.customers_count || 1) : 0;
  };

  const totalFootfall = activities.reduce((sum, a) => sum + (a.customers_count || 1), 0);
  const totalClosed = activities.reduce((sum, a) => sum + getClosedCount(a), 0);
  const conversionPct = totalFootfall > 0 ? Math.round((totalClosed / totalFootfall) * 100) : 0;

  return (
    <div className="space-y-7 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBE6DC] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#526F91] bg-[#EDF2F8] px-2.5 py-1 rounded-full border border-[#C6D4E3]">
              Showroom Footfall & Walk-ins
            </span>
            <span className="text-xs text-[#8A8479] font-medium">{totalFootfall} Total Customers Attended</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1D1D1B] tracking-tight mt-1">
            Customer Inquiries & Floor Engagement
          </h1>
          <p className="text-xs text-[#8A8479] font-medium mt-0.5">
            Real-time multi-branch customer inquiry logging, attending sales staff, and closing ratios
          </p>
        </div>

        {/* Quick Summary Pill */}
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-[#E4DFD4] shadow-2xs">
          <span className="text-xs font-bold text-[#1D1D1B]">{totalFootfall} Customers</span>
          <span className="text-[#8A8479]">•</span>
          <span className="text-xs font-bold text-[#21845F]">{totalClosed} Closed ({conversionPct}%)</span>
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
            placeholder="Search by customer name, phone number, or attending salesperson..."
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs text-[#1D1D1B] placeholder-[#8A8479] focus:outline-none focus:border-[#7E22CE]"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-bold text-[#1D1D1B] focus:outline-none cursor-pointer"
          >
            <option value="all">All Showrooms</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id.toString()}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-bold text-[#1D1D1B] focus:outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="Inquiry">Inquiry</option>
            <option value="Attended">Attended</option>
            <option value="Closed">Closed Deal</option>
            <option value="Lost">Lost</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 shadow-[0_4px_18px_rgba(40,35,25,0.045)]">
        {isLoading ? (
          <LoadingSpinner message="Loading customer walk-in records..." />
        ) : activities.length === 0 ? (
          <EmptyState
            title="No activity records found"
            description="No walk-in logs match your criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase font-bold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Customers Count</th>
                  <th className="px-4 py-3">Customer Info</th>
                  <th className="px-4 py-3">Showroom Branch</th>
                  <th className="px-4 py-3">Attending Staff</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Engagement Status / Breakdown</th>
                  <th className="px-4 py-3">Notes & Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE6DC] font-medium">
                {activities.map((a) => {
                  const count = a.customers_count || 1;
                  return (
                    <tr key={a.id} className="hover:bg-[#FAF5FF] transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#F3E8FF] border border-[#D8B4FE] text-[#7E22CE] font-bold text-[11px]">
                          {count} Customer{count > 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#1D1D1B]">
                        <div>{a.customer_name || 'Walk-in Group'}</div>
                        {a.phone_number && <div className="font-mono text-[10px] text-[#8A8479] font-normal">{a.phone_number}</div>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 rounded-full bg-[#FAF8F3] border border-[#D8B4FE] text-[#7E22CE] font-bold text-[10px]">
                          {a.branch_name}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[#5E5A52] font-semibold">{a.employee_name || 'Floor Staff'}</td>
                      <td className="px-4 py-3.5 text-[#8A8479] font-mono">{a.activity_date}</td>
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                              a.status === 'Closed'
                                ? 'bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]'
                                : a.status === 'Attended'
                                ? 'bg-[#F3E8FF] text-[#7E22CE] border border-[#D8B4FE]'
                                : a.status === 'Lost'
                                ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
                                : 'bg-[#FAF1EC] text-[#B97855] border border-[#ECCFC0]'
                            }`}
                          >
                            {a.status === 'Closed' && <CheckCircle2 className="w-3 h-3" />}
                            {a.status}
                          </span>
                          {a.breakdown && (
                            <p className="text-[10px] text-[#8A8479] font-normal line-clamp-2 max-w-xs">{a.breakdown}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[#5E5A52] max-w-xs truncate">{a.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
