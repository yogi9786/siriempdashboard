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
  Download,
  IndianRupee,
  Gift,
  Heart,
  ArrowUpDown,
  Users,
} from 'lucide-react';
import { CustomerActivity } from '../../../types';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Button } from '../../../components/ui/Button';
import { useAdminBranch } from '../../../context/AdminBranchContext';
import { useToast } from '../../../context/ToastContext';
import {
  parseCustomerBreakdown,
  exportCustomerActivitiesToCSV,
} from '../../../utils/customerUtils';
import api from '../../../api/client';

export const AdminCustomerActivitiesPage: React.FC = () => {
  const { branches, selectedBranchId } = useAdminBranch();
  const { error: toastError } = useToast();

  const [activities, setActivities] = useState<CustomerActivity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>(
    selectedBranchId?.toString() || 'all'
  );
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (branchFilter !== 'all') params.branch_id = parseInt(branchFilter);
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await api.get<CustomerActivity[]>('/api/v1/admin/customer-activities', {
        params,
      });
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

  const totalFootfall = activities.reduce(
    (sum, a) => sum + (a.customers_count || 0),
    0
  );
  const totalSold = activities.reduce((sum, a) => {
    const items = parseCustomerBreakdown(a.breakdown, a.customers_count || 1, a.status);
    return sum + items.filter((i) => i.status === 'Sold').length;
  }, 0);
  const totalExchange = activities.reduce((sum, a) => {
    const items = parseCustomerBreakdown(a.breakdown, a.customers_count || 1, a.status);
    return sum + items.filter((i) => i.status === 'Exchange').length;
  }, 0);
  const totalInHold = activities.reduce((sum, a) => {
    const items = parseCustomerBreakdown(a.breakdown, a.customers_count || 1, a.status);
    return (
      sum +
      items.filter(
        (i) =>
          i.status === 'In Hold / Follow Up' ||
          i.status === 'In Hold' ||
          i.status === 'Follow Up'
      ).length
    );
  }, 0);
  const totalProductValue = activities.reduce((sum, a) => sum + (a.product_value || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Sold':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]">
            <CheckCircle2 className="w-3 h-3 text-[#21845F]" />
            <span>Sold</span>
          </span>
        );
      case 'Exchange':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
            <ArrowUpDown className="w-3 h-3 text-[#2563EB]" />
            <span>Exchange</span>
          </span>
        );
      case 'In Hold / Follow Up':
      case 'In Hold':
      case 'Follow Up':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
            <Clock className="w-3 h-3 text-[#D97706]" />
            <span>In Hold / Follow Up</span>
          </span>
        );
      case 'Lost':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]">
            <XCircle className="w-3 h-3 text-[#DC2626]" />
            <span>Lost</span>
          </span>
        );
      case 'Walkin':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F4F4F5] text-[#52525B] border border-[#E4E4E7]">
            <Users className="w-3 h-3 text-[#71717A]" />
            <span>Walkin</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-7 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBE6DC] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#526F91] bg-[#EDF2F8] px-2.5 py-1 rounded-full border border-[#C6D4E3]">
              Showroom Footfall & Walk-ins
            </span>
            <span className="text-xs text-[#8A8479] font-medium">
              {totalFootfall} Total Customers Attended
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1D1D1B] tracking-tight mt-1">
            Customer Inquiries & Floor Engagement
          </h1>
          <p className="text-xs text-[#8A8479] font-medium mt-0.5">
            Real-time multi-branch customer inquiry logging, attending sales staff, and closing values
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => exportCustomerActivitiesToCSV(activities, 'Siri_Samruddhi_Admin_Customers')}
            icon={<Download className="w-4 h-4 text-[#21845F]" />}
            className="border-[#C5E3D5] text-[#21845F] hover:bg-[#E8F4EE] cursor-pointer"
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-[#E4DFD4] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#8A8479]">
            <span className="text-[11px] font-bold uppercase">Total Customers</span>
            <Users className="w-4 h-4 text-[#7E22CE]" />
          </div>
          <p className="text-xl font-extrabold text-[#1D1D1B]">{totalFootfall}</p>
          <p className="text-[10px] text-[#8A8479]">Multi-branch Footfall</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#E8F4EE] border border-[#C5E3D5] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#21845F]">
            <span className="text-[11px] font-bold uppercase">Sold / Closed</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-xl font-extrabold text-[#21845F]">{totalSold}</p>
          <p className="text-[10px] text-[#21845F]/80">Deals Closed</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#2563EB]">
            <span className="text-[11px] font-bold uppercase">Exchange</span>
            <ArrowUpDown className="w-4 h-4" />
          </div>
          <p className="text-xl font-extrabold text-[#2563EB]">{totalExchange}</p>
          <p className="text-[10px] text-[#2563EB]/80">Gold Exchanges</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#D97706]">
            <span className="text-[11px] font-bold uppercase">In Hold / Follow Up</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-xl font-extrabold text-[#D97706]">{totalInHold}</p>
          <p className="text-[10px] text-[#D97706]/80">Active Inquiries</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E4DFD4] shadow-xs space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[#8A8479]">
            <span className="text-[11px] font-bold uppercase">Product Value</span>
            <IndianRupee className="w-4 h-4 text-[#D97706]" />
          </div>
          <p className="text-xl font-extrabold text-[#1D1D1B] truncate">
            ₹{totalProductValue.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-[#8A8479]">Closed Deals Value</p>
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
            placeholder="Search by customer name, phone number, staff, or notes..."
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs text-[#1D1D1B] placeholder-[#8A8479] focus:outline-none focus:border-[#7E22CE]"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
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
            <option value="Sold">Sold</option>
            <option value="Exchange">Exchange</option>
            <option value="In Hold / Follow Up">In Hold / Follow Up</option>
            <option value="Walkin">Walkin</option>
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
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer Info</th>
                  <th className="px-4 py-3">Showroom Branch</th>
                  <th className="px-4 py-3">Attending Staff</th>
                  <th className="px-4 py-3">DOB & Anniversary</th>
                  <th className="px-4 py-3">Outcome Status</th>
                  <th className="px-4 py-3">Product Value (₹)</th>
                  <th className="px-4 py-3">Notes & Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE6DC] font-medium">
                {activities.map((a) => {
                  const count = a.customers_count || 1;
                  const customerItems = parseCustomerBreakdown(
                    a.breakdown,
                    count,
                    a.status,
                    a.customer_name,
                    a.phone_number,
                    a.dob,
                    a.anniversary,
                    a.product_value
                  );

                  return (
                    <tr key={a.id} className="hover:bg-[#FAF5FF] transition-colors">
                      <td className="px-4 py-3.5 text-[#8A8479] font-mono whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-[#1D1D1B]">
                          <Calendar className="w-3.5 h-3.5 text-[#8A8479]" />
                          <span>{a.activity_date}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-bold text-[#1D1D1B]">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span>{a.customer_name || 'Walk-in Group'}</span>
                            {count > 1 && (
                              <span className="px-1.5 py-0.2 rounded-md bg-[#FAF5FF] border border-[#D8B4FE] text-[#7E22CE] text-[10px] font-bold">
                                {count} Cust
                              </span>
                            )}
                          </div>
                          {a.phone_number && (
                            <div className="font-mono text-[10px] text-[#8A8479] font-normal flex items-center gap-1">
                              <Phone className="w-3 h-3 text-[#8A8479]" />
                              <span>{a.phone_number}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 rounded-full bg-[#FAF8F3] border border-[#D8B4FE] text-[#7E22CE] font-bold text-[10px]">
                          {a.branch_name}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div>
                          <span className="font-bold text-[#1D1D1B] block">
                            {a.employee_name || 'Floor Staff'}
                          </span>
                          <span className="font-mono text-[10px] text-[#8A8479]">
                            {a.employee_code || `ID #${a.employee_id}`}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5 text-[11px]">
                          {a.dob && (
                            <span className="text-[#D97706] flex items-center gap-1 font-semibold">
                              <Gift className="w-3 h-3" /> {a.dob}
                            </span>
                          )}
                          {a.anniversary && (
                            <span className="text-[#E11D48] flex items-center gap-1 font-semibold">
                              <Heart className="w-3 h-3" /> {a.anniversary}
                            </span>
                          )}
                          {!a.dob && !a.anniversary && (
                            <span className="text-[#A1A1AA]">—</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <div>{getStatusBadge(a.status)}</div>
                          {customerItems.length > 1 && (
                            <div className="flex items-center gap-1 flex-wrap pt-0.5">
                              {customerItems.map((item, i) => (
                                <span
                                  key={i}
                                  className="text-[9px] font-bold px-1.5 py-0.2 rounded-sm bg-[#FAF8F3] border border-[#E4DFD4] text-[#5E5A52]"
                                  title={`${item.name || `Cust #${i + 1}`}: ${item.status}`}
                                >
                                  #{i + 1}: {item.status}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold text-[#1D1D1B]">
                        {a.product_value && a.product_value > 0 ? (
                          <span className="text-[#21845F]">
                            ₹{a.product_value.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-[#A1A1AA] font-normal">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-[#5E5A52] max-w-xs truncate">
                        {a.notes || '—'}
                      </td>
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
