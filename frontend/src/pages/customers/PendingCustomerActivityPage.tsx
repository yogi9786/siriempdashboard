import React, { useEffect, useState, useRef } from 'react';
import { CustomerActivityModal } from '../../components/customers/CustomerActivityModal';
import { getMediaUrl } from '../../utils/media';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  User,
  Phone,
  Calendar,
  IndianRupee,
  Sparkles,
  AlertCircle,
  Eye,
  RefreshCw,
  Gift,
  Star,
  MessageSquareHeart,
  Award,
  Users,
  Loader2,
  ArrowUpDown,
  Video,
  Edit2,
  Trash2,
  FileImage,
} from 'lucide-react';
import api from '../../api/client';
import { CustomerActivity, Employee } from '../../types';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.97.53 1.83.812 2.796.813 3.179 0 5.767-2.587 5.768-5.766.001-3.181-2.587-5.766-5.768-5.766zm3.376 8.212c-.144.405-.837.774-1.17.824-.312.045-.717.067-1.168-.08-.288-.094-.658-.236-1.144-.45-2.072-.913-3.414-3.033-3.518-3.173-.104-.14-1.01-1.344-1.01-2.564 0-1.22.637-1.82.863-2.066.226-.246.495-.308.66-.308.165 0 .33.003.475.01.153.008.358-.058.56.427.207.497.708 1.724.77 1.849.062.125.104.271.021.437-.083.165-.124.27-.247.416-.124.145-.262.325-.374.436-.125.124-.255.26-.11.51.145.249.645 1.062 1.385 1.722.953.849 1.756 1.112 2.004 1.237.248.125.394.104.539-.063.145-.166.621-.726.786-.975.166-.249.331-.208.558-.125.228.083 1.446.682 1.694.807.248.124.414.186.475.29.063.104.063.602-.081 1.007zM12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.98-1.306A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
  </svg>
);

const getSubrecordDetails = (breakdownStr?: string | null) => {
  let hasScheme = false;
  let schemePlan = '';
  let schemeMonthly: string | number = '';
  let hasReview = false;
  let reviewRating = 5;
  let reviewText = '';
  let reviewScreenshot = '';
  let hasFeedback = false;
  let feedbackRating = 5;
  let feedbackText = '';
  let hasVideoReview = false;
  let videosCount = 1;
  let videoTitle = '';
  let videoScreenshot = '';
  let productId = '';

  if (breakdownStr) {
    try {
      const parsed = JSON.parse(breakdownStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        for (const item of parsed) {
          if (!productId && item.product_id) productId = item.product_id;
          if (!hasScheme && (item.has_scheme || item.scheme_name)) {
            hasScheme = true;
            schemePlan = item.scheme_name || '';
            schemeMonthly = item.scheme_amount || '';
          }
          if (!hasReview && (item.has_google_review || item.google_review_text || item.google_review_screenshot)) {
            hasReview = true;
            reviewRating = item.google_review_rating || 5;
            reviewText = item.google_review_text || '';
            reviewScreenshot = item.google_review_screenshot || item.screenshot_url || '';
          }
          if (!hasFeedback && (item.has_customer_feedback || item.feedback_text)) {
            hasFeedback = true;
            feedbackRating = item.feedback_rating || 5;
            feedbackText = item.feedback_text || '';
          }
          if (!hasVideoReview && (item.has_video_review || item.video_title || item.video_screenshot)) {
            hasVideoReview = true;
            videosCount = item.videos_count ? Number(item.videos_count) : 1;
            videoTitle = item.video_title || '';
            videoScreenshot = item.video_screenshot || item.screenshot_url || '';
          }
        }
      } else if (typeof parsed === 'object') {
        productId = parsed.product_id || '';
        hasScheme = Boolean(parsed.goldScheme?.enrolled);
        schemePlan = parsed.goldScheme?.planName || '';
        schemeMonthly = parsed.goldScheme?.monthlyAmount || '';
        hasReview = Boolean(parsed.googleReview?.submitted);
        reviewRating = parsed.googleReview?.rating || 5;
        reviewText = parsed.googleReview?.reviewText || '';
        reviewScreenshot = parsed.googleReview?.screenshot_url || '';
        hasFeedback = Boolean(parsed.feedback?.rating);
        feedbackRating = parsed.feedback?.rating || 5;
        feedbackText = parsed.feedback?.comments || '';
      }
    } catch {}
  }
  return {
    hasScheme,
    schemePlan,
    schemeMonthly,
    hasReview,
    reviewRating,
    reviewText,
    reviewScreenshot,
    hasFeedback,
    feedbackRating,
    feedbackText,
    hasVideoReview,
    videosCount,
    videoTitle,
    videoScreenshot,
    productId,
  };
};

const hasQueuedWhatsapp = (act: CustomerActivity): boolean => {
  if (act.notes && act.notes.includes('[WhatsApp Dispatch Queued on Manager Approval]')) {
    return true;
  }
  if (act.breakdown) {
    try {
      const parsed = JSON.parse(act.breakdown);
      if (Array.isArray(parsed)) {
        return parsed.some((p: any) => p.send_whatsapp_on_approval || p.queued_whatsapp);
      }
    } catch {}
  }
  return false;
};

export const PendingCustomerActivityPage: React.FC = () => {
  const { selectedBranch } = useAuth();
  const { success, error: toastError } = useToast();

  const [activities, setActivities] = useState<CustomerActivity[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [customerOutcomeFilter, setCustomerOutcomeFilter] = useState<'ALL' | 'Sold' | 'Exchange' | 'In Hold' | 'Interested' | 'Lost'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');

  // Status counts for the top 4 filter cards
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const initialAutoSwitchDone = useRef(false);

  // Edit / Delete / Lightbox State
  const [editingActivity, setEditingActivity] = useState<CustomerActivity | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);

  // Review state
  const [selectedForReview, setSelectedForReview] = useState<CustomerActivity | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [inspectActivity, setInspectActivity] = useState<CustomerActivity | null>(null);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const allParams: Record<string, any> = {
        status_filter: 'all',
      };
      if (selectedEmployeeId && selectedEmployeeId !== 'all') {
        allParams.employee_id = parseInt(selectedEmployeeId, 10);
      }

      // Fetch all customer submissions for this branch & employee to compute all filter card counts cleanly with 0 network errors
      const [allActRes, empRes] = await Promise.all([
        api.get<CustomerActivity[]>('/api/v1/customers/pending', { params: allParams }),
        api.get<Employee[]>('/api/v1/employees'),
      ]);

      const allItems = allActRes.data || [];
      const pendingCount = allItems.filter(
        (a) => (a.approval_status || '').toUpperCase() === 'PENDING'
      ).length;
      const approvedCount = allItems.filter(
        (a) => (a.approval_status || '').toUpperCase() === 'APPROVED'
      ).length;
      const rejectedCount = allItems.filter(
        (a) => (a.approval_status || '').toUpperCase() === 'REJECTED'
      ).length;

      setCounts({
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: allItems.length,
      });

      // Filter activities according to the selected tab statusFilter
      const filtered =
        statusFilter === 'ALL'
          ? allItems
          : allItems.filter(
              (a) => (a.approval_status || '').toUpperCase() === statusFilter.toUpperCase()
            );
      setActivities(filtered);
      setEmployees(empRes.data || []);

      // If on initial page load there are 0 pending items, but approved items exist, auto-switch to APPROVED so user sees them right away
      if (
        !initialAutoSwitchDone.current &&
        pendingCount === 0 &&
        approvedCount > 0 &&
        statusFilter === 'PENDING'
      ) {
        initialAutoSwitchDone.current = true;
        setStatusFilter('APPROVED');
      }
    } catch (err: any) {
      console.error('Failed to load pending customer activities:', err);
      toastError(err.response?.data?.detail || 'Failed to fetch customer activities for review.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [statusFilter, selectedEmployeeId]);

  const handleOpenReview = (activity: CustomerActivity, action: 'APPROVE' | 'REJECT') => {
    setSelectedForReview(activity);
    setReviewAction(action);
    setRejectionReason('');
  };

  const handleExecuteReview = async () => {
    if (!selectedForReview || !reviewAction) return;

    if (reviewAction === 'REJECT' && !rejectionReason.trim()) {
      toastError('Please provide a reason for rejecting this customer activity.');
      return;
    }

    try {
      setIsSubmittingReview(true);
      const waQueued = hasQueuedWhatsapp(selectedForReview);

      await api.post(`/api/v1/customers/${selectedForReview.id}/review`, {
        action: reviewAction,
        rejection_reason: reviewAction === 'REJECT' ? rejectionReason.trim() : null,
      });

      if (reviewAction === 'APPROVE') {
        if (waQueued) {
          success(`Approved ${selectedForReview.customer_name || 'customer log'}! WhatsApp notification dispatched to customer automatically.`);
        } else {
          success(`Successfully approved ${selectedForReview.customer_name || 'customer activity'}! Subrecords synced.`);
        }
      } else {
        success('Customer activity rejected.');
      }

      // Close modal and refresh
      setSelectedForReview(null);
      setReviewAction(null);
      setRejectionReason('');
      fetchActivities();
    } catch (err: any) {
      console.error('Review action failed:', err);
      toastError(err.response?.data?.detail || 'Failed to update review status.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteActivity = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this customer activity?')) return;
    try {
      await api.delete(`/api/v1/customers/${id}`);
      success('Customer activity deleted successfully.');
      fetchActivities();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to delete customer activity.');
    }
  };

  const filteredActivities = activities.filter((act) => {
    // 1. Customer Outcome Status Filter (Requirement 6: Sold, Interested, Lost)
    if (customerOutcomeFilter !== 'ALL') {
      const target = customerOutcomeFilter.toLowerCase();
      const checkStatus = (st: string) => {
        const s = (st || '').toLowerCase();
        if (target === 'sold') return s.includes('sold') || s.includes('closed') || s.includes('purchased');
        if (target === 'exchange') return s.includes('exchange');
        if (target === 'in hold' || target === 'hold') return s.includes('hold') || s.includes('follow');
        if (target === 'interested') return s.includes('interested');
        if (target === 'lost') return s.includes('lost');
        return s === target;
      };
      const matches = checkStatus(act.status) || (act.breakdown && act.breakdown.toLowerCase().includes(target));
      if (!matches) return false;
    }

    // 2. Search query filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (act.customer_name && act.customer_name.toLowerCase().includes(q)) ||
      (act.phone_number && act.phone_number.includes(q)) ||
      (act.employee_name && act.employee_name.toLowerCase().includes(q)) ||
      (act.employee_code && act.employee_code.toLowerCase().includes(q)) ||
      (act.notes && act.notes.toLowerCase().includes(q)) ||
      (act.breakdown && act.breakdown.toLowerCase().includes(q))
    );
  });

  // Calculate quick counts
  const pendingCount = activities.filter((a) => a.approval_status === 'PENDING').length;
  const approvedCount = activities.filter((a) => a.approval_status === 'APPROVED').length;
  const rejectedCount = activities.filter((a) => a.approval_status === 'REJECTED').length;

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Sold':
      case 'Purchased':
        return 'bg-[#E8F4EE] text-[#21845F] border-[#C5E3D5]';
      case 'Exchange':
        return 'bg-[#EDF2F7] text-[#536B8A] border-[#C5D5E6]';
      case 'In Hold / Follow Up':
      case 'In Hold':
      case 'Follow Up':
        return 'bg-[#FAF1EC] text-[#B97855] border-[#ECCFC0]';
      case 'Lost':
        return 'bg-[#FDECEC] text-[#C24141] border-[#F9C3C3]';
      case 'Walkin':
      default:
        return 'bg-[#FAF8F3] text-[#8A8479] border-[#E4DFD4]';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Top Banner & Header - Luxury Sand/Gold Site Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#FAF8F3] via-white to-[#F0F4F8] border border-[#C5D5E6] p-6 sm:p-8 shadow-xs">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-[#536B8A] to-transparent opacity-50" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#FDF6E2] text-[#9A782F] border border-[#DFCFA6] tracking-wider uppercase">
                Showroom Verification
              </span>
              <span className="text-xs text-[#6B6559] flex items-center gap-1 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[#9A782F]" />
                {selectedBranch?.name || 'Showroom'} Branch
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1B] tracking-tight">
              Pending Customer Activity
            </h1>
            <p className="text-xs sm:text-sm text-[#6B6559] mt-1 max-w-2xl">
              Review and approve showroom customer interactions submitted by employees. Upon approval, customer logs are verified and queued WhatsApp messages are dispatched automatically.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchActivities}
              className="bg-white hover:bg-[#FAF8F3] text-[#1D1D1B] border-[#D5CFC4] text-xs font-semibold shadow-2xs flex items-center gap-1.5 px-3.5 py-2 rounded-xl"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#9A782F]' : 'text-[#6B6559]'}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Status Count Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#E4DFD4]">
          <div
            onClick={() => setStatusFilter('PENDING')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              statusFilter === 'PENDING'
                ? 'bg-[#FEFCE8] border-[#EAB308] shadow-sm ring-2 ring-[#EAB308]/40'
                : 'bg-white/80 border-[#E4DFD4] hover:bg-white hover:border-[#EAB308]/60 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#854D0E]">Pending Review</span>
              <Clock className="w-4 h-4 text-[#CA8A04]" />
            </div>
            <div className="text-2xl font-black text-[#854D0E] mt-1">
              {counts.pending}
            </div>
            <p className="text-[11px] text-[#A16207] mt-0.5 font-medium">Awaiting Manager approval</p>
          </div>

          <div
            onClick={() => setStatusFilter('APPROVED')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              statusFilter === 'APPROVED'
                ? 'bg-[#F0FDF4] border-[#10B981] shadow-sm ring-2 ring-[#10B981]/40'
                : 'bg-white/80 border-[#E4DFD4] hover:bg-white hover:border-[#10B981]/60 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#166534]">Approved Logs</span>
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            </div>
            <div className="text-2xl font-black text-[#166534] mt-1">
              {counts.approved}
            </div>
            <p className="text-[11px] text-[#15803D] mt-0.5 font-medium">Verified & active in log</p>
          </div>

          <div
            onClick={() => setStatusFilter('REJECTED')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              statusFilter === 'REJECTED'
                ? 'bg-[#FEF2F2] border-[#EF4444] shadow-sm ring-2 ring-[#EF4444]/40'
                : 'bg-white/80 border-[#E4DFD4] hover:bg-white hover:border-[#EF4444]/60 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#991B1B]">Rejected Logs</span>
              <XCircle className="w-4 h-4 text-[#DC2626]" />
            </div>
            <div className="text-2xl font-black text-[#991B1B] mt-1">
              {counts.rejected}
            </div>
            <p className="text-[11px] text-[#B91C1C] mt-0.5 font-medium">Returned with reason</p>
          </div>

          <div
            onClick={() => setStatusFilter('ALL')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              statusFilter === 'ALL'
                ? 'bg-[#EFF6FF] border-[#3B82F6] shadow-sm ring-2 ring-[#3B82F6]/40'
                : 'bg-white/80 border-[#E4DFD4] hover:bg-white hover:border-[#3B82F6]/60 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1E40AF]">All Submissions</span>
              <Filter className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div className="text-2xl font-black text-[#1E40AF] mt-1">
              {counts.total}
            </div>
            <p className="text-[11px] text-[#1D4ED8] mt-0.5 font-medium">Total recorded by staff</p>
          </div>
        </div>
      </div>

      {/* Customer Status Quick Filters (Requirement 6: Lost, Interested, Sold, All) */}
      <div className="bg-[#FAF8F3] border border-[#E4DFD4] p-2.5 sm:p-3 rounded-2xl shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-xs font-bold text-[#6B6559] mr-1 uppercase tracking-wider text-[10px] shrink-0">
            Customer Status:
          </span>
          {[
            { id: 'ALL', label: 'All Statuses', color: 'text-[#1D1D1B] bg-white border-[#CBD5E1]' },
            { id: 'Sold', label: 'Sold', color: 'text-[#166534] bg-[#F0FDF4] border-[#BBF7D0]' },
            { id: 'Exchange', label: 'Exchange (Gold/Diamond/Silver)', color: 'text-[#1E40AF] bg-[#EFF6FF] border-[#BFDBFE]' },
            { id: 'In Hold', label: 'In Hold / Follow Up', color: 'text-[#B45309] bg-[#FFFBEB] border-[#FDE68A]' },
            { id: 'Interested', label: 'Interested', color: 'text-[#92400E] bg-[#FEF3C7] border-[#FDE68A]' },
            { id: 'Lost', label: 'Lost', color: 'text-[#991B1B] bg-[#FEF2F2] border-[#FECACA]' },
          ].map((sTab) => {
            const isSelected = customerOutcomeFilter === sTab.id;
            return (
              <button
                key={sTab.id}
                type="button"
                onClick={() => setCustomerOutcomeFilter(sTab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                  isSelected
                    ? 'ring-2 ring-[#9A782F] shadow-xs font-extrabold scale-102 ' + sTab.color
                    : 'bg-white text-[#6B6559] border-[#E4DFD4] hover:bg-[#FAF8F3]'
                }`}
              >
                <span>{sTab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E4DFD4] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8479]" />
          <input
            type="text"
            placeholder="Search customer, phone, or staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#FAF8F3] border border-[#D5CFC4] rounded-xl text-xs text-[#1D1D1B] placeholder-[#8A8479] focus:outline-hidden focus:border-[#9A782F] focus:ring-1 focus:ring-[#9A782F]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Employee Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#6B6559] whitespace-nowrap">Staff:</span>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="bg-[#FAF8F3] border border-[#D5CFC4] rounded-xl px-3 py-1.5 text-xs text-[#1D1D1B] font-semibold focus:outline-hidden focus:border-[#9A782F] cursor-pointer"
            >
              <option value="all">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.employee_code})
                </option>
              ))}
            </select>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center bg-[#FAF8F3] p-1 rounded-xl border border-[#E4DFD4]">
            {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-[#9A782F] text-white shadow-xs'
                    : 'text-[#6B6559] hover:text-[#1D1D1B]'
                }`}
              >
                {tab === 'PENDING' ? 'Pending' : tab === 'APPROVED' ? 'Approved' : tab === 'REJECTED' ? 'Rejected' : 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner message="Loading customer activities for manager review..." />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-16">
            <EmptyState
              title={
                statusFilter === 'PENDING'
                  ? 'No Pending Activities'
                  : 'No Activities Match Filters'
              }
              description={
                statusFilter === 'PENDING'
                  ? 'All employee customer interactions have been reviewed and approved! New submissions will appear here automatically.'
                  : 'Try modifying your search or clearing active filters.'
              }
              icon={CheckCircle2}
            />
          </div>
        ) : (
          <>
            {/* Mobile View: Pending Activity Cards (block sm:hidden) */}
            <div className="block sm:hidden space-y-3 p-3">
              {filteredActivities.map((act) => {
                const subrecords = getSubrecordDetails(act.breakdown);
                const isPending = act.approval_status === 'PENDING';
                const isApproved = act.approval_status === 'APPROVED';
                const isRejected = act.approval_status === 'REJECTED';
                const waQueued = hasQueuedWhatsapp(act);

                return (
                  <div
                    key={act.id}
                    className="bg-white border border-[#E4DFD4] rounded-2xl p-4 shadow-xs space-y-3"
                  >
                    {/* Header: Date, ID, Status & WhatsApp indicator */}
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#F0ECE1]">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#1D1D1B]">
                        <Calendar className="w-3.5 h-3.5 text-[#9A782F]" />
                        <span>{act.activity_date || 'Today'}</span>
                        <span className="text-[10px] text-[#8A8479] font-mono">#{act.id}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeStyle(act.status)}`}>
                          {act.status}
                        </span>
                        {waQueued && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#E8F8EE] text-[#1E7E34] border border-[#A6E7B9] text-[9px] font-bold">
                            <WhatsAppIcon className="w-2.5 h-2.5 text-[#25D366]" />
                            <span>WA</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Submitted By Staff */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#EDF2F7] border border-[#C5D5E6] flex items-center justify-center text-[#536B8A] font-bold text-[10px] shrink-0">
                          {act.employee_name?.charAt(0) || 'E'}
                        </div>
                        <div>
                          <span className="font-extrabold text-[#1D1D1B] block text-xs">{act.employee_name || 'Staff'}</span>
                          <span className="text-[9px] text-[#8A8479] font-mono">{act.employee_code || `EMP-${act.employee_id}`}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] font-bold text-[#8A8479] uppercase block">Value</span>
                        <span className="font-bold text-[#23815F] font-mono text-xs">
                          ₹{(act.product_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>

                    {/* Customer Details */}
                    <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EBE6DC] space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-extrabold text-[#1D1D1B] text-xs flex items-center gap-1">
                          <User className="w-3 h-3 text-[#536B8A]" />
                          <span>{act.customer_name || 'Walk-in Customer'}</span>
                        </h4>
                        {(act.customers_count || 1) > 1 && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#F3E8FF] text-[#7E22CE] font-bold">
                            {act.customers_count} People
                          </span>
                        )}
                      </div>
                      {act.phone_number ? (
                        <div className="text-[11px] text-[#536B8A] font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#8A8479]" />
                          <a href={`tel:${act.phone_number}`} className="hover:underline">{act.phone_number}</a>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#8A8479] italic block">No phone</span>
                      )}
                      {(act.dob || act.anniversary) && (
                        <div className="text-[9px] text-[#B97855] font-medium flex items-center gap-2">
                          {act.dob && <span>DOB: {act.dob}</span>}
                          {act.anniversary && <span>Anniv: {act.anniversary}</span>}
                        </div>
                      )}
                    </div>

                    {/* Schemes & Reviews badges */}
                    {(subrecords.hasScheme || subrecords.hasReview || subrecords.hasFeedback) && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {subrecords.hasScheme && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FDF6E2] text-[#9A782F] border border-[#DFCFA6] text-[10px] font-bold">
                            <Award className="w-2.5 h-2.5" />
                            <span>{subrecords.schemePlan || 'Scheme'}</span>
                          </span>
                        )}
                        {subrecords.hasReview && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] text-[10px] font-bold">
                            <Star className="w-2.5 h-2.5 text-[#F59E0B] fill-[#F59E0B]" />
                            <span>{subrecords.reviewRating}★ Google Review</span>
                          </span>
                        )}
                        {subrecords.hasVideoReview && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F3E8FF] text-[#7E22CE] border border-[#D8B4FE] text-[10px] font-bold">
                            <Video className="w-2.5 h-2.5 text-[#7E22CE]" />
                            <span>{subrecords.videosCount} Video(s) • +{subrecords.videosCount * 5} Pts</span>
                          </span>
                        )}
                        {subrecords.productId && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF5FF] text-[#7E22CE] border border-[#E9D5FF] text-[10px] font-mono font-bold">
                            <Sparkles className="w-2.5 h-2.5 text-[#D97706]" />
                            <span>Tag: {subrecords.productId}</span>
                          </span>
                        )}
                        {subrecords.hasFeedback && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F5EDF1] text-[#6B4657] border border-[#E5CFDB] text-[10px] font-bold">
                            <MessageSquareHeart className="w-2.5 h-2.5" />
                            <span>{subrecords.feedbackRating}★ Feedback</span>
                          </span>
                        )}
                      </div>
                    )}

                    {act.notes && (
                      <p className="text-[11px] text-[#6B6559] bg-[#FAF8F5] p-2 rounded-xl border border-[#EBE6DC] leading-relaxed">
                        {act.notes}
                      </p>
                    )}

                    {/* Status & Actions Footer (Mobile Optimized with Dedicated Approve/Reject Tier) */}
                    <div className="pt-2.5 border-t border-[#F0ECE1] space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {isPending && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FEFCE8] border border-[#FEF08A] text-[#854D0E] text-[10px] font-bold animate-pulse">
                              <Clock className="w-3 h-3 text-[#CA8A04] shrink-0" />
                              <span className="truncate">Pending Approval</span>
                            </div>
                          )}
                          {isApproved && (
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-[10px] font-bold max-w-[200px]">
                              <CheckCircle2 className="w-3 h-3 text-[#16A34A] shrink-0" />
                              <span className="truncate">Approved{act.reviewed_by_name ? ` by ${act.reviewed_by_name}` : ''}</span>
                            </div>
                          )}
                          {isRejected && (
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-[10px] font-bold max-w-[200px]">
                              <XCircle className="w-3 h-3 text-[#DC2626] shrink-0" />
                              <span className="truncate">Rejected{act.reviewed_by_name ? ` by ${act.reviewed_by_name}` : ''}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setInspectActivity(act)}
                            className="p-1.5 rounded-xl bg-[#FAF8F3] hover:bg-[#F2EDE4] text-[#6B6559] border border-[#E4DFD4] transition-colors cursor-pointer"
                            title="Inspect Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setEditingActivity(act);
                              setShowEditModal(true);
                            }}
                            className="p-1.5 rounded-xl bg-white hover:bg-[#F3E8FF] text-[#7E22CE] border border-[#E4DFD4] transition-colors cursor-pointer shadow-2xs"
                            title="Edit Customer Log"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteActivity(act.id)}
                            className="p-1.5 rounded-xl bg-white hover:bg-red-50 text-[#C24141] border border-[#E4DFD4] transition-colors cursor-pointer shadow-2xs"
                            title="Delete Customer Log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Prominent, Dedicated Two-Column Approve & Reject Buttons on Mobile */}
                      {isPending && (
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#F0ECE1]/80">
                          <button
                            onClick={() => handleOpenReview(act, 'REJECT')}
                            className="w-full py-2.5 px-3 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] active:bg-[#FECACA] text-[#991B1B] border border-[#FECACA] text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
                            title="Reject Customer Activity"
                          >
                            <XCircle className="w-3.5 h-3.5 text-[#DC2626]" />
                            <span>Reject</span>
                          </button>

                          <button
                            onClick={() => handleOpenReview(act, 'APPROVE')}
                            className="w-full py-2.5 px-3 rounded-xl bg-[#23815F] hover:bg-[#1C694D] active:bg-[#16563F] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
                            title="Approve Customer Activity"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tablet & Desktop Table (hidden sm:block) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs text-[#1D1D1B]">
              <thead className="bg-[#FAF8F3] text-[#6B6559] uppercase font-bold text-[11px] tracking-wider border-b border-[#E4DFD4]">
                <tr>
                  <th className="px-4 py-3.5">Activity Date</th>
                  <th className="px-4 py-3.5">Submitted By Staff</th>
                  <th className="px-4 py-3.5">Customer Details</th>
                  <th className="px-4 py-3.5">Interaction & Value</th>
                  <th className="px-4 py-3.5">Status & Tags</th>
                  <th className="px-4 py-3.5">Approval Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFECE3]">
                {filteredActivities.map((act) => {
                  const subrecords = getSubrecordDetails(act.breakdown);
                  const isPending = act.approval_status === 'PENDING';
                  const isApproved = act.approval_status === 'APPROVED';
                  const isRejected = act.approval_status === 'REJECTED';
                  const waQueued = hasQueuedWhatsapp(act);

                  return (
                    <tr
                      key={act.id}
                      className="hover:bg-[#FAF9F5] transition-colors group"
                    >
                      {/* Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#9A782F]" />
                          <span className="font-bold text-[#1D1D1B]">
                            {act.activity_date || 'Today'}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#8A8479] ml-5">
                          ID: #{act.id}
                        </span>
                      </td>

                      {/* Submitted By */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#EDF2F7] border border-[#C5D5E6] flex items-center justify-center text-[#536B8A] font-bold text-xs shrink-0">
                            {act.employee_name?.charAt(0) || 'E'}
                          </div>
                          <div>
                            <div className="font-bold text-[#1D1D1B] group-hover:text-[#9A782F] transition-colors">
                              {act.employee_name || 'Showroom Employee'}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-mono bg-[#FAF8F3] px-1.5 py-0.2 rounded-sm text-[#6B6559] border border-[#E4DFD4]">
                                {act.employee_code || `EMP-${act.employee_id}`}
                              </span>
                              <span className="text-[9px] text-[#8A8479] uppercase font-semibold">
                                Staff
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Customer Details */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-[#1D1D1B] flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#536B8A]" />
                          <span>{act.customer_name || 'Walk-in Customer'}</span>
                        </div>
                        {act.phone_number ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-[#536B8A] mt-1 font-mono font-semibold">
                            <Phone className="w-3 h-3 text-[#8A8479]" />
                            <span>{act.phone_number}</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-[#8A8479] italic mt-0.5">
                            No phone provided
                          </div>
                        )}
                        {(act.dob || act.anniversary) && (
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-[#B97855] font-medium">
                            {act.dob && (
                              <span className="flex items-center gap-0.5">
                                <Gift className="w-2.5 h-2.5" /> DOB: {act.dob}
                              </span>
                            )}
                            {act.anniversary && <span>Anniv: {act.anniversary}</span>}
                          </div>
                        )}
                      </td>

                      {/* Interaction & Value */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[#1D1D1B]">
                            {act.customers_count || 1} Customer{(act.customers_count || 1) > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 font-bold text-[#23815F] mt-0.5 text-xs">
                          <IndianRupee className="w-3 h-3 text-[#23815F]" />
                          <span>
                            {(act.product_value || 0).toLocaleString('en-IN', {
                              minimumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Status & Tags */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeStyle(
                              act.status
                            )}`}
                          >
                            {act.status}
                          </span>

                          {waQueued && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8F8EE] text-[#1E7E34] border border-[#A6E7B9] text-[10px] font-bold shadow-2xs"
                              title="Employee requested WhatsApp message to be sent once approved"
                            >
                              <WhatsAppIcon className="w-3 h-3 text-[#25D366]" />
                              <span>WhatsApp on Approval</span>
                            </span>
                          )}

                          {subrecords.hasScheme && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#FDF6E2] text-[#9A782F] border border-[#DFCFA6] text-[9px] font-bold">
                              <Award className="w-2.5 h-2.5" />
                              Scheme
                            </span>
                          )}

                          {subrecords.hasReview && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] text-[9px] font-bold">
                              <Star className="w-2.5 h-2.5 text-[#F59E0B] fill-[#F59E0B]" />
                              Review
                            </span>
                          )}
                          {subrecords.hasVideoReview && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#F3E8FF] text-[#7E22CE] border border-[#D8B4FE] text-[9px] font-bold">
                              <Video className="w-2.5 h-2.5 text-[#7E22CE]" />
                              {subrecords.videosCount} Video(s) • +{subrecords.videosCount * 5} Pts
                            </span>
                          )}
                          {subrecords.productId && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#FAF5FF] text-[#7E22CE] border border-[#E9D5FF] text-[9px] font-mono font-bold">
                              <Sparkles className="w-2.5 h-2.5 text-[#D97706]" />
                              Tag: {subrecords.productId}
                            </span>
                          )}

                          {subrecords.hasFeedback && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#F5EDF1] text-[#6B4657] border border-[#E5CFDB] text-[9px] font-bold">
                              <MessageSquareHeart className="w-2.5 h-2.5" />
                              {subrecords.feedbackRating}★
                            </span>
                          )}
                        </div>

                        {act.notes && (
                          <p className="text-[11px] text-[#6B6559] line-clamp-1 mt-1 max-w-xs" title={act.notes}>
                            {act.notes}
                          </p>
                        )}
                      </td>

                      {/* Approval Status Badge */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isPending && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEFCE8] border border-[#FEF08A] text-[#854D0E] text-[11px] font-bold shadow-2xs animate-pulse">
                            <Clock className="w-3.5 h-3.5 text-[#CA8A04]" />
                            <span>Pending Review</span>
                          </div>
                        )}
                        {isApproved && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                            <span>Approved{act.reviewed_by_name ? ` by ${act.reviewed_by_name}` : ''}</span>
                          </div>
                        )}
                        {isRejected && (
                          <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-[11px] font-bold">
                              <XCircle className="w-3.5 h-3.5 text-[#DC2626]" />
                              <span>Rejected{act.reviewed_by_name ? ` by ${act.reviewed_by_name}` : ''}</span>
                            </div>
                            {act.rejection_reason && (
                              <p className="text-[10px] text-[#991B1B] mt-1 max-w-[140px] truncate" title={act.rejection_reason}>
                                Reason: {act.rejection_reason}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setInspectActivity(act)}
                            className="p-1.5 rounded-xl bg-[#FAF8F3] hover:bg-[#F2EDE4] text-[#6B6559] hover:text-[#1D1D1B] border border-[#E4DFD4] transition-colors cursor-pointer"
                            title="Inspect Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setEditingActivity(act);
                              setShowEditModal(true);
                            }}
                            className="p-1.5 rounded-xl bg-white hover:bg-[#F3E8FF] text-[#7E22CE] hover:border-[#D8B4FE] border border-[#E4DFD4] transition-colors cursor-pointer shadow-2xs"
                            title="Edit Customer Log"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteActivity(act.id)}
                            className="p-1.5 rounded-xl bg-white hover:bg-red-50 text-[#C24141] hover:border-red-200 border border-[#E4DFD4] transition-colors cursor-pointer shadow-2xs"
                            title="Delete Customer Log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {isPending && (
                            <>
                              <button
                                onClick={() => handleOpenReview(act, 'APPROVE')}
                                className="px-3 py-1.5 rounded-xl bg-[#23815F] hover:bg-[#1C694D] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                                title="Approve Customer Activity"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>

                              <button
                                onClick={() => handleOpenReview(act, 'REJECT')}
                                className="px-3 py-1.5 rounded-xl bg-[#C24141] hover:bg-[#A33434] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                                title="Reject Customer Activity"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      </div>

      {/* Review Action Confirmation Modal */}
      {selectedForReview && reviewAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1C1A]/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E4DFD4] rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl relative text-[#1D1D1B]">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  reviewAction === 'APPROVE'
                    ? 'bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5]'
                    : 'bg-[#FDECEC] text-[#C24141] border border-[#F9C3C3]'
                }`}
              >
                {reviewAction === 'APPROVE' ? (
                  <CheckCircle2 className="w-5 h-5 text-[#23815F]" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-[#C24141]" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1D1D1B]">
                  {reviewAction === 'APPROVE'
                    ? 'Approve Customer Activity'
                    : 'Reject Customer Activity'}
                </h3>
                <p className="text-xs text-[#6B6559]">
                  Submitted by {selectedForReview.employee_name} ({selectedForReview.employee_code})
                </p>
              </div>
            </div>

            {/* Overview Box */}
            <div className="bg-[#FAF8F3] rounded-2xl p-4 border border-[#E4DFD4] space-y-2 text-xs text-[#1D1D1B] mb-4">
              <div className="flex justify-between">
                <span className="text-[#6B6559]">Customer:</span>
                <span className="font-bold text-[#1D1D1B]">{selectedForReview.customer_name}</span>
              </div>
              {selectedForReview.phone_number && (
                <div className="flex justify-between">
                  <span className="text-[#6B6559]">Phone:</span>
                  <span className="font-mono font-semibold text-[#536B8A]">{selectedForReview.phone_number}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#6B6559]">Status & Value:</span>
                <span className="font-bold text-[#23815F]">
                  {selectedForReview.status} — ₹{(selectedForReview.product_value || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6559]">Date:</span>
                <span className="font-semibold text-[#1D1D1B]">{selectedForReview.activity_date}</span>
              </div>
            </div>

            {hasQueuedWhatsapp(selectedForReview) && reviewAction === 'APPROVE' && (
              <div className="mb-4 p-3 rounded-2xl bg-[#E8F8EE] border border-[#A6E7B9] flex items-start gap-2.5 text-xs text-[#1E7E34]">
                <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">WhatsApp Queued for Dispatch</strong>
                  <span>Upon approving, WhatsApp notification greeting will be automatically dispatched to customer's mobile number via AiSensy.</span>
                </div>
              </div>
            )}

            {reviewAction === 'APPROVE' ? (
              <p className="text-xs text-[#6B6559] mb-6">
                Approving this record will mark it as <span className="text-[#23815F] font-bold">APPROVED</span>, integrate it into the permanent Showroom Customer Logs, and sync any associated Gold Schemes, Google Reviews, or Feedback.
              </p>
            ) : (
              <div className="mb-6 space-y-2">
                <label className="block text-xs font-bold text-[#1D1D1B]">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this entry is being rejected (e.g., duplicate customer, incorrect amount, missing contact details)..."
                  className="w-full bg-[#FAF8F3] border border-[#D5CFC4] rounded-xl p-3 text-xs text-[#1D1D1B] placeholder-[#8A8479] focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
                <p className="text-[11px] text-[#8A8479]">
                  The employee will see this feedback in their portal to correct and re-submit if needed.
                </p>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 pt-3 border-t border-[#E4DFD4]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedForReview(null);
                  setReviewAction(null);
                }}
                disabled={isSubmittingReview}
                className="w-full sm:w-auto bg-[#FAF8F3] hover:bg-[#F2EDE4] text-[#6B6559] border-[#D5CFC4] text-xs font-semibold px-4 py-2.5 sm:py-2 rounded-xl justify-center cursor-pointer"
              >
                Cancel
              </Button>

              <Button
                size="sm"
                onClick={handleExecuteReview}
                disabled={isSubmittingReview || (reviewAction === 'REJECT' && !rejectionReason.trim())}
                className={`w-full sm:w-auto text-xs font-bold px-4 py-2.5 sm:py-2 rounded-xl justify-center cursor-pointer ${
                  reviewAction === 'APPROVE'
                    ? 'bg-[#23815F] hover:bg-[#1C694D] text-white shadow-xs'
                    : 'bg-[#C24141] hover:bg-[#A33434] text-white shadow-xs'
                }`}
              >
                {isSubmittingReview ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Processing...
                  </span>
                ) : reviewAction === 'APPROVE' ? (
                  'Confirm & Approve'
                ) : (
                  'Confirm & Reject'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Activity Details Modal */}
      {inspectActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1C1A]/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E4DFD4] rounded-3xl w-full max-w-xl p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto text-[#1D1D1B]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E4DFD4]">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-[#FDF6E2] border border-[#DFCFA6] flex items-center justify-center text-[#9A782F]">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#1D1D1B]">
                    Customer Activity #{inspectActivity.id}
                  </h3>
                  <p className="text-xs text-[#6B6559]">
                    Logged on {inspectActivity.activity_date}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectActivity(null)}
                className="w-8 h-8 rounded-xl bg-[#FAF8F3] hover:bg-[#F2EDE4] text-[#6B6559] hover:text-[#1D1D1B] border border-[#E4DFD4] flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Employee attribution */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F3] border border-[#E4DFD4]">
                <span className="text-[10px] uppercase font-bold text-[#8A8479] tracking-wider">
                  Submitted By Employee
                </span>
                <div className="flex items-center justify-between mt-1">
                  <div className="font-bold text-[#1D1D1B] text-sm">
                    {inspectActivity.employee_name}
                  </div>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-white text-[#536B8A] font-bold border border-[#C5D5E6]">
                    {inspectActivity.employee_code}
                  </span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-[#FAF8F3] border border-[#E4DFD4]">
                  <span className="text-[10px] uppercase text-[#8A8479] font-bold">Customer Name</span>
                  <div className="text-[#1D1D1B] font-bold mt-0.5">{inspectActivity.customer_name}</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF8F3] border border-[#E4DFD4]">
                  <span className="text-[10px] uppercase text-[#8A8479] font-bold">Phone Number</span>
                  <div className="text-[#536B8A] font-mono font-bold mt-0.5">{inspectActivity.phone_number || 'N/A'}</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF8F3] border border-[#E4DFD4]">
                  <span className="text-[10px] uppercase text-[#8A8479] font-bold">Purchase Status</span>
                  <div className="text-[#1D1D1B] font-bold mt-0.5">{inspectActivity.status}</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF8F3] border border-[#E4DFD4]">
                  <span className="text-[10px] uppercase text-[#8A8479] font-bold">Product Value</span>
                  <div className="text-[#23815F] font-bold mt-0.5">
                    ₹{(inspectActivity.product_value || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* WhatsApp Queued indicator */}
              {hasQueuedWhatsapp(inspectActivity) && (
                <div className="p-3 rounded-2xl bg-[#E8F8EE] border border-[#A6E7B9] flex items-center gap-2 text-xs font-bold text-[#1E7E34]">
                  <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                  <span>WhatsApp message requested on manager approval</span>
                </div>
              )}

              {/* Additional breakdown metadata if available */}
              {(() => {
                const b = getSubrecordDetails(inspectActivity.breakdown);
                return (
                  <div className="space-y-3">
                    {b.hasScheme && (
                      <div className="p-3.5 rounded-2xl bg-[#FDF6E2] border border-[#DFCFA6]">
                        <span className="text-xs font-bold text-[#9A782F] flex items-center gap-1.5">
                          <Award className="w-4 h-4" />
                          Gold Scheme Enrollment
                        </span>
                        <div className="text-xs text-[#1D1D1B] mt-1 space-y-0.5">
                          <div>Plan: <strong>{b.schemePlan || 'Standard'}</strong></div>
                          <div>Monthly: <strong>₹{b.schemeMonthly || 0}</strong></div>
                        </div>
                      </div>
                    )}

                    {b.hasReview && (
                      <div className="p-3.5 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE]">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#1D4ED8] flex items-center gap-1.5">
                            <Star className="w-4 h-4 text-[#2563EB]" />
                            Google Review ({b.reviewRating || 5} Stars)
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            +1 Point on Approval
                          </span>
                        </div>
                        {b.reviewText && (
                          <p className="text-xs text-[#1D1D1B] mt-1.5 italic">
                            "{b.reviewText}"
                          </p>
                        )}
                        {b.reviewScreenshot && (
                          <div className="mt-2.5 pt-2 border-t border-blue-200">
                            <span className="text-[10px] uppercase font-bold text-blue-700 block mb-1">
                              Photo Proof Attached:
                            </span>
                            <a
                              href={b.reviewScreenshot}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-block"
                            >
                              <img
                                src={b.reviewScreenshot}
                                alt="Photo Proof"
                                className="max-h-36 rounded-xl border border-blue-200 object-contain hover:opacity-90"
                              />
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {b.hasFeedback && (
                      <div className="p-3.5 rounded-2xl bg-[#F5EDF1] border border-[#E5CFDB]">
                        <span className="text-xs font-bold text-[#6B4657] flex items-center gap-1.5">
                          <MessageSquareHeart className="w-4 h-4" />
                          Direct Customer Feedback ({b.feedbackRating || 5}★)
                        </span>
                        {b.feedbackText && (
                          <p className="text-xs text-[#1D1D1B] mt-1 italic">
                            "{b.feedbackText}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Notes */}
              {inspectActivity.notes && (
                <div className="p-3 rounded-2xl bg-[#FAF8F3] border border-[#E4DFD4]">
                  <span className="text-[10px] uppercase text-[#8A8479] font-bold">Activity Notes</span>
                  <p className="text-xs text-[#1D1D1B] mt-1 whitespace-pre-wrap">{inspectActivity.notes}</p>
                </div>
              )}

              {/* Approval status banner */}
              <div className="p-3 rounded-2xl bg-[#FAF8F3] border border-[#E4DFD4] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6B6559]">Current Status</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  inspectActivity.approval_status === 'PENDING'
                    ? 'bg-[#FEFCE8] text-[#854D0E] border-[#FEF08A]'
                    : inspectActivity.approval_status === 'APPROVED'
                      ? 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]'
                      : 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                }`}>
                  {inspectActivity.approval_status}{inspectActivity.reviewed_by_name && inspectActivity.approval_status !== 'PENDING' ? ` by ${inspectActivity.reviewed_by_name}` : ''}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#E4DFD4]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectActivity(null)}
                className="bg-[#FAF8F3] hover:bg-[#F2EDE4] text-[#6B6559] border-[#D5CFC4] text-xs font-semibold px-4 py-2 rounded-xl"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Manager Edit Customer Activity Modal */}
      {showEditModal && (
        <CustomerActivityModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingActivity(null);
          }}
          onSaved={() => {
            fetchActivities();
            success('Customer activity updated.');
          }}
          initialData={editingActivity}
          employeesList={employees}
          apiBaseUrl="/api/v1/customers"
        />
      )}

      {/* Lightbox Photo Proof Preview */}
      {viewProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <span className="text-sm font-bold flex items-center gap-2">
                <FileImage className="w-4 h-4 text-amber-400" />
                Review Verification Photo Proof
              </span>
              <button
                type="button"
                onClick={() => setViewProofUrl(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-white/10 shadow-2xl">
              <img
                src={viewProofUrl}
                alt="Photo Proof Full"
                className="max-h-[80vh] w-auto max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
