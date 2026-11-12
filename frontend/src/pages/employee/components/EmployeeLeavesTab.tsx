import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { EmployeeLeaveRequest } from '../../../types';
import api from '../../../api/client';
import { useToast } from '../../../context/ToastContext';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

interface EmployeeLeavesTabProps {
  leaves: EmployeeLeaveRequest[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const EmployeeLeavesTab: React.FC<EmployeeLeavesTabProps> = ({
  leaves,
  isLoading,
  onRefresh,
}) => {
  const { success, error: toastError } = useToast();

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [form, setForm] = useState({
    subject: '',
    from_date: new Date().toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0],
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim()) {
      toastError('Please enter a subject or title for the leave request.');
      return;
    }
    if (!form.from_date || !form.to_date) {
      toastError('Please select both from and to dates.');
      return;
    }
    if (form.from_date > form.to_date) {
      toastError('From date cannot be after to date.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        leave_type: 'Leave Request',
        subject: form.subject.trim(),
        from_date: form.from_date,
        to_date: form.to_date,
        reason: form.message.trim(),
      };

      const res = await api.post('/api/v1/employee/leaves', payload);
      success(res.data.message || 'Leave request submitted to manager & HR successfully.');
      setForm({
        subject: '',
        from_date: new Date().toISOString().split('T')[0],
        to_date: new Date().toISOString().split('T')[0],
        message: '',
      });
      onRefresh();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to submit leave request.';
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl p-5 sm:p-7 shadow-[0_4px_18px_rgba(40,35,25,0.045)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Leave Application & Tracking</span>
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-[#1D1D1B] tracking-tight">
            Leave Updates & Requests
          </h3>
          <p className="text-xs text-[#6B6559] mt-0.5">
            Submit upcoming planned leaves. Your showroom manager and HR will be notified immediately for approval.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="p-2.5 rounded-xl bg-white border border-[#E4DFD4] hover:bg-[#FAF8F3] text-[#5E5A52] transition-colors self-start sm:self-auto cursor-pointer shadow-2xs"
          title="Refresh leave requests"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E4DFD4] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-[#EBE6DC] pb-3">
            <h4 className="text-sm font-black text-[#1D1D1B] uppercase tracking-wider">
              Submit Future Leave Update
            </h4>
            <p className="text-[11px] text-[#8A8479] mt-0.5">
              Fill in your leave dates, reason, and subject.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Subject (Leave Type has been removed per request) */}
            <div>
              <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1.5">
                Subject / Brief *
              </label>
              <input
                type="text"
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Sister wedding ceremony in hometown"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs font-medium text-[#1D1D1B] focus:outline-none focus:border-[#D97706] focus:bg-white"
              />
            </div>

            {/* Dates Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1.5">
                  From Date *
                </label>
                <input
                  type="date"
                  required
                  value={form.from_date}
                  onChange={(e) => setForm({ ...form, from_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs font-bold text-[#1D1D1B] focus:outline-none focus:border-[#D97706] focus:bg-white cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1.5">
                  To Date *
                </label>
                <input
                  type="date"
                  required
                  value={form.to_date}
                  min={form.from_date}
                  onChange={(e) => setForm({ ...form, to_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs font-bold text-[#1D1D1B] focus:outline-none focus:border-[#D97706] focus:bg-white cursor-pointer"
                />
              </div>
            </div>

            {/* Message / Reason */}
            <div>
              <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1.5">
                Message / Reason *
              </label>
              <textarea
                required
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Describe the reason for leave and handoff details..."
                className="w-full p-3 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs font-medium text-[#1D1D1B] focus:outline-none focus:border-[#D97706] focus:bg-white resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CalendarDays className="w-4 h-4" />
              )}
              <span>Submit Leave Request</span>
            </button>

            <p className="text-[10px] text-[#8A8479] text-center leading-relaxed">
              A notification will be sent immediately to your Showroom Manager and HR department. Live status will update below once reviewed.
            </p>
          </form>
        </div>

        {/* Right Column: History & Status (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between border-b border-[#E6E1D6] pb-2">
            <h4 className="text-sm font-black text-[#1D1D1B] uppercase tracking-wider">
              My Leave History
            </h4>
            <span className="text-xs text-[#8A8479]">
              {leaves.length} {leaves.length === 1 ? 'Record' : 'Records'}
            </span>
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center bg-white rounded-3xl border border-[#E4DFD4]">
              <LoadingSpinner message="Loading leave history..." />
            </div>
          ) : leaves.length === 0 ? (
            <div className="bg-white border border-[#E4DFD4] rounded-3xl p-10 text-center space-y-2">
              <CalendarDays className="w-8 h-8 text-[#8A8479] mx-auto" />
              <p className="text-xs font-bold text-[#1D1D1B]">No Leave Requests Yet</p>
              <p className="text-[11px] text-[#8A8479]">
                Submit a leave application when you plan to take time off.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaves.map((leave) => {
                const isPending = leave.status === 'PENDING';
                const isApproved = leave.status === 'APPROVED';
                const isRejected = leave.status === 'REJECTED';

                return (
                  <div
                    key={leave.id}
                    className="bg-white border border-[#E4DFD4] rounded-2xl p-4 shadow-xs space-y-2.5 hover:border-[#D97706]/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-mono text-[#8A8479]">
                            {leave.from_date} {leave.to_date && leave.to_date !== leave.from_date ? `to ${leave.to_date}` : ''} ({leave.days_count} {leave.days_count === 1 ? 'day' : 'days'})
                          </span>
                        </div>
                        <h5 className="text-xs font-extrabold text-[#1D1D1B] mt-1 truncate">
                          {leave.subject || 'Leave Application'}
                        </h5>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black shrink-0 ${
                          isPending
                            ? 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
                            : isApproved
                            ? 'bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]'
                            : 'bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]'
                        }`}
                      >
                        {isPending && <Clock className="w-3 h-3" />}
                        {isApproved && <CheckCircle2 className="w-3 h-3" />}
                        {isRejected && <XCircle className="w-3 h-3" />}
                        <span>{leave.status}</span>
                      </span>
                    </div>

                    {leave.message && (
                      <p className="text-xs text-[#5E5A52] bg-[#FAF8F3] p-2.5 rounded-xl border border-[#EBE6DC] leading-relaxed">
                        {leave.message}
                      </p>
                    )}

                    {leave.rejection_reason && (
                      <div className="text-[11px] p-2 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]">
                        <span className="font-bold">Manager Remark: </span>
                        {leave.rejection_reason}
                      </div>
                    )}

                    <div className="text-[10px] text-[#8A8479] flex items-center justify-between border-t border-[#F0ECE1] pt-2">
                      <span>Submitted: {leave.created_at?.slice(0, 10)}</span>
                      {leave.reviewed_by_name && (
                        <span>Reviewed by: {leave.reviewed_by_name}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
