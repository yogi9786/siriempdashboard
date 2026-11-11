import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Search,
  Building2,
  Calendar,
  Phone,
  User,
  Eye,
  RefreshCw,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { CustomerActivity } from '../../types';
import { CustomerActivityViewModal } from '../../components/customers/CustomerActivityViewModal';

export const HrCustomersPage: React.FC = () => {
  const { error: toastError } = useToast();

  const [activities, setActivities] = useState<CustomerActivity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // View Modal
  const [viewingActivity, setViewingActivity] = useState<CustomerActivity | null>(null);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const params: any = { limit: 200 };
      if (branchFilter !== 'ALL') {
        params.branch_code = branchFilter;
      }
      if (statusFilter !== 'ALL') {
        params.status_filter = statusFilter;
      }
      if (search.trim()) {
        params.search = search.trim();
      }
      const res = await api.get('/api/v1/hr/customers', { params });
      setActivities(res.data || []);
    } catch (err: any) {
      console.error('Failed to load customers for HR:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [branchFilter, statusFilter]);

  const filteredActivities = activities.filter((act) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      act.customer_name?.toLowerCase().includes(q) ||
      act.phone_number?.includes(q) ||
      act.employee_name?.toLowerCase().includes(q) ||
      act.employee_code?.toLowerCase().includes(q) ||
      act.status?.toLowerCase().includes(q) ||
      act.notes?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 sm:p-8 shadow-[0_4px_18px_rgba(40,35,25,0.045)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Showroom Customer Directory</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1D1D1B] tracking-tight">
            Customer Activity & Leads
          </h1>
          <p className="text-xs sm:text-sm text-[#5E5A52] font-medium mt-1">
            Complete showroom customer logs across all 3 branches: Yelahanka, Kolar, and Udupi.
          </p>
        </div>

        <button
          onClick={fetchActivities}
          className="p-2.5 rounded-xl bg-white border border-[#E4DFD4] hover:bg-[#FAF8F3] text-[#536B8A] transition-colors self-start md:self-auto cursor-pointer"
          title="Refresh List"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Segregated Branches & Filters Bar */}
      <div className="bg-white border border-[#E4DFD4] rounded-2xl p-3 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Branch Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-[#8A8479] uppercase tracking-wider px-1">
              Branches:
            </span>
            <button
              onClick={() => setBranchFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                branchFilter === 'ALL'
                  ? 'bg-[#18181B] text-white shadow-2xs'
                  : 'bg-[#FAF8F3] hover:bg-[#F2EDE4] text-[#5E5A52] border border-[#E4DFD4]'
              }`}
            >
              All Showrooms
            </button>
            <button
              onClick={() => setBranchFilter('YELAHANKA')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                branchFilter === 'YELAHANKA'
                  ? 'bg-[#D97706] text-white shadow-2xs'
                  : 'bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#92400E] border border-[#FDE68A]'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span>Yelahanka</span>
            </button>
            <button
              onClick={() => setBranchFilter('KOLAR')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                branchFilter === 'KOLAR'
                  ? 'bg-[#0284C7] text-white shadow-2xs'
                  : 'bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0369A1] border border-[#BAE6FD]'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span>Kolar</span>
            </button>
            <button
              onClick={() => setBranchFilter('UDUPI')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                branchFilter === 'UDUPI'
                  ? 'bg-[#059669] text-white shadow-2xs'
                  : 'bg-[#D1FAE5] hover:bg-[#A7F3D0] text-[#065F46] border border-[#A7F3D0]'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span>Udupi</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#8A8479] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, phone, staff..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl focus:outline-none focus:border-[#21845F] focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Customer Activities Table */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl overflow-hidden shadow-[0_4px_18px_rgba(40,35,25,0.045)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F3] border-b border-[#EBE6DC] text-[#6B6559] uppercase font-bold text-[10px] tracking-wider">
                <th className="px-5 py-3.5">Visit Date</th>
                <th className="px-5 py-3.5">Customer & Contact</th>
                <th className="px-5 py-3.5">Branch</th>
                <th className="px-5 py-3.5">Attended By Staff</th>
                <th className="px-5 py-3.5">Outcome</th>
                <th className="px-5 py-3.5">Value (₹)</th>
                <th className="px-5 py-3.5">Verification</th>
                <th className="px-5 py-3.5 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE1]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-[#8A8479]">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#1D4ED8]" />
                    <span className="block mt-2 font-semibold">Loading customer records...</span>
                  </td>
                </tr>
              ) : filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-[#8A8479]">
                    <p className="font-bold text-sm text-[#1D1D1B]">No customer interactions found.</p>
                    <p className="text-xs mt-1">Try switching showroom branches or clear the search query.</p>
                  </td>
                </tr>
              ) : (
                filteredActivities.map((act) => {
                  const outcome = act.status === 'Walkin' ? 'Window Shopping' : (act.status || 'Window Shopping');
                  const isApproved = act.approval_status === 'APPROVED';
                  const isPending = act.approval_status === 'PENDING';

                  return (
                    <tr key={act.id} className="hover:bg-[#FAF9F5] transition-colors">
                      {/* Date */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-[#1D1D1B]">
                          <Calendar className="w-3.5 h-3.5 text-[#536B8A]" />
                          <span>{act.activity_date}</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#8A8479]">#{act.id}</span>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-3.5">
                        <div className="font-extrabold text-[#1D1D1B] text-sm">
                          {act.customer_name || 'Walk-in Customer'}
                        </div>
                        {act.phone_number ? (
                          <div className="text-[11px] font-mono text-[#536B8A] flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#21845F]" />
                            <span>{act.phone_number}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#8A8479] italic">No phone provided</span>
                        )}
                      </td>

                      {/* Branch */}
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF8F3] border border-[#E4DFD4] text-[#536B8A]">
                          {act.branch_name || 'Showroom'}
                        </span>
                      </td>

                      {/* Attended Staff */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-[#1D1D1B]">{act.employee_name || 'Floor Staff'}</div>
                        <div className="text-[10px] font-mono text-[#8A8479]">{act.employee_code || ''}</div>
                      </td>

                      {/* Outcome */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
                            outcome === 'Sold'
                              ? 'bg-[#E8F4EE] text-[#21845F] border-[#C5E3D5]'
                              : outcome === 'Exchange'
                              ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                              : outcome === 'Window Shopping'
                              ? 'bg-[#FAF8F3] text-[#5E5A52] border-[#E4DFD4]'
                              : 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'
                          }`}
                        >
                          {outcome}
                        </span>
                      </td>

                      {/* Value */}
                      <td className="px-5 py-3.5 font-mono font-bold text-sm">
                        {act.product_value && act.product_value > 0 ? (
                          <span className="text-[#21845F]">
                            ₹{act.product_value.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-[#8A8479] font-normal">—</span>
                        )}
                      </td>

                      {/* Verification */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isApproved
                              ? 'bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]'
                              : isPending
                              ? 'bg-[#FEFCE8] text-[#854D0E] border border-[#FEF08A]'
                              : 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
                          }`}
                        >
                          {isApproved ? (
                            <CheckCircle2 className="w-3 h-3 text-[#21845F]" />
                          ) : isPending ? (
                            <Clock className="w-3 h-3 text-[#854D0E]" />
                          ) : (
                            <XCircle className="w-3 h-3 text-[#DC2626]" />
                          )}
                          <span>{act.approval_status || 'PENDING'}</span>
                        </span>
                      </td>

                      {/* View Single Action */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setViewingActivity(act)}
                          className="p-1.5 rounded-lg bg-[#FAF8F3] hover:bg-[#F2EDE4] text-[#536B8A] hover:text-[#1D1D1B] border border-[#E4DFD4] transition-colors cursor-pointer"
                          title="View Single Customer Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer View Modal */}
      <CustomerActivityViewModal
        isOpen={!!viewingActivity}
        onClose={() => setViewingActivity(null)}
        activity={viewingActivity}
      />
    </div>
  );
};

