import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building2,
  Calendar,
  RefreshCw,
  Search,
  MessageSquare,
  MapPin,
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { EmployeeLeaveRequest } from '../../types';

export const HrLeavesPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [leaves, setLeaves] = useState<EmployeeLeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  // Reject Modal
  const [rejectTarget, setRejectTarget] = useState<EmployeeLeaveRequest | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fetchLeaves = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/api/v1/hr/leaves');
      setLeaves(res.data || []);
    } catch (err: any) {
      console.error('Failed to load leaves for HR:', err);
      toastError('Could not load leave requests.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleApprove = async (leave: EmployeeLeaveRequest) => {
    try {
      setIsProcessing(true);
      await api.post(`/api/v1/hr/leaves/${leave.id}/review`, {
        status: 'APPROVED',
      });
      success(`Leave request for ${leave.employee_name} approved.`);
      fetchLeaves();
    } catch (err: any) {
      toastError('Failed to approve leave request.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTarget) return;
    try {
      setIsProcessing(true);
      await api.post(`/api/v1/hr/leaves/${rejectTarget.id}/review`, {
        status: 'REJECTED',
        rejection_reason: rejectReason.trim() || 'Declined by HR',
      });
      success(`Leave request for ${rejectTarget.employee_name} rejected.`);
      setRejectTarget(null);
      setRejectReason('');
      fetchLeaves();
    } catch (err: any) {
      toastError('Failed to reject leave request.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredLeaves = leaves.filter((req) => {
    if (branchFilter !== 'ALL' && (req.branch_code || '').toUpperCase() !== branchFilter.toUpperCase()) {
      return false;
    }
    if (statusFilter !== 'ALL' && req.status !== statusFilter) {
      return false;
    }
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      req.employee_name?.toLowerCase().includes(q) ||
      req.employee_code?.toLowerCase().includes(q) ||
      req.subject?.toLowerCase().includes(q) ||
      req.message?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 sm:p-8 shadow-[0_4px_18px_rgba(40,35,25,0.045)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Leave Administration</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1D1D1B] tracking-tight">
            Employee Leave Approvals
          </h1>
          <p className="text-xs sm:text-sm text-[#5E5A52] font-medium mt-1">
            Review, approve, or reject employee leave applications submitted by showroom staff.
          </p>
        </div>

        <button
          onClick={fetchLeaves}
          className="p-2.5 rounded-xl bg-white border border-[#E4DFD4] hover:bg-[#FAF8F3] text-[#536B8A] transition-colors self-start md:self-auto cursor-pointer"
          title="Refresh Leaves"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Segregated Branches & Status Filters */}
      <div className="bg-white border border-[#E4DFD4] rounded-2xl p-3 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Branch filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-[#8A8479] uppercase tracking-wider px-1">
              Branch:
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

          {/* Status filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-[#8A8479] uppercase tracking-wider px-1">
              Status:
            </span>
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#21845F] text-white shadow-2xs'
                    : 'bg-[#FAF8F3] hover:bg-[#F2EDE4] text-[#5E5A52] border border-[#E4DFD4]'
                }`}
              >
                {st === 'ALL' ? 'All' : st}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#8A8479] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff, subject, reason..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl focus:outline-none focus:border-[#21845F] focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Leaves Cards / Table */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl overflow-hidden shadow-[0_4px_18px_rgba(40,35,25,0.045)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F3] border-b border-[#EBE6DC] text-[#6B6559] uppercase font-bold text-[10px] tracking-wider">
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Branch</th>
                <th className="px-5 py-3.5">Leave Type & Subject</th>
                <th className="px-5 py-3.5">Dates & Duration</th>
                <th className="px-5 py-3.5">Reason / Message</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE1]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[#8A8479]">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#D97706]" />
                    <span className="block mt-2 font-semibold">Loading leave requests...</span>
                  </td>
                </tr>
              ) : filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[#8A8479]">
                    <p className="font-bold text-sm text-[#1D1D1B]">No leave requests found.</p>
                    <p className="text-xs mt-1">Leave applications submitted by employees will appear here.</p>
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((req) => {
                  const isPending = req.status === 'PENDING';
                  const isApproved = req.status === 'APPROVED';
                  const isRejected = req.status === 'REJECTED';

                  return (
                    <tr key={req.id} className="hover:bg-[#FAF9F5] transition-colors">
                      {/* Employee */}
                      <td className="px-5 py-3.5">
                        <div className="font-extrabold text-[#1D1D1B] text-sm">{req.employee_name}</div>
                        <div className="text-[10.5px] font-mono text-[#536B8A]">{req.employee_code}</div>
                        <div className="text-[10px] text-[#8A8479]">{req.employee_designation || 'Staff'}</div>
                      </td>

                      {/* Branch */}
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF8F3] border border-[#E4DFD4] text-[#536B8A]">
                          {req.branch_name || 'Showroom'}
                        </span>
                      </td>

                      {/* Subject & Type */}
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8]">
                          {req.leave_type}
                        </span>
                        <div className="font-bold text-[#1D1D1B] mt-1 text-xs">{req.subject}</div>
                      </td>

                      {/* Duration */}
                      <td className="px-5 py-3.5 font-mono text-xs">
                        <div className="font-bold text-[#1D1D1B]">
                          {req.from_date} {req.to_date && req.to_date !== req.from_date ? `to ${req.to_date}` : ''}
                        </div>
                        <span className="text-[11px] text-[#21845F] font-bold">
                          {req.days_count} {req.days_count === 1 ? 'Day' : 'Days'}
                        </span>
                      </td>

                      {/* Message */}
                      <td className="px-5 py-3.5 max-w-xs">
                        <p className="text-xs text-[#5E5A52] line-clamp-2" title={req.message}>
                          {req.message}
                        </p>
                        {req.rejection_reason && (
                          <p className="text-[10px] text-[#DC2626] font-medium mt-1">
                            Declined: {req.rejection_reason}
                          </p>
                        )}
                        {req.reviewed_by_name && (
                          <span className="text-[10px] text-[#8A8479] block mt-0.5">
                            Reviewed by: {req.reviewed_by_name}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
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
                          <span>{req.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApprove(req)}
                              disabled={isProcessing}
                              className="px-2.5 py-1 rounded-lg bg-[#21845F] hover:bg-[#1A6B4C] text-white text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectTarget(req)}
                              disabled={isProcessing}
                              className="px-2.5 py-1 rounded-lg bg-white border border-[#FECACA] hover:bg-[#FEE2E2] text-[#DC2626] text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#8A8479] italic">Processed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1D1D1B]">Reject Leave Request</h3>
                <p className="text-xs text-[#6B6559]">For {rejectTarget.employee_name}</p>
              </div>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1">
                  Reason for Rejection *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Critical showroom event, insufficient staff on selected dates"
                  className="w-full p-3 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs focus:outline-none focus:border-red-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectTarget(null)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#E4DFD4] text-xs font-bold text-[#5E5A52]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-sm"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
