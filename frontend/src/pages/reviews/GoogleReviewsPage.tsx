import React, { useEffect, useState } from 'react';
import {
  Trophy,
  Award,
  Star,
  Video,
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Search,
  Filter,
  RotateCcw,
  ChevronRight,
  Eye,
  ExternalLink,
  X,
  User,
  Image as ImageIcon,
  Check,
  Building2,
  Calendar,
  MessageSquare,
  UploadCloud,
  FileImage,
  Phone,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { GoogleReview, VideoReview, Employee } from '../../types';
import { getMediaUrl } from '../../utils/media';
import api from '../../api/client';

export const GoogleReviewsPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  // Data State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [videoReviews, setVideoReviews] = useState<VideoReview[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'with_points' | 'pending'>('all');

  // Selected Employee for Detail Modal
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeDetailTab, setEmployeeDetailTab] = useState<'google' | 'video'>('google');

  // Add Google Review Modal State
  const [showAddGoogleModal, setShowAddGoogleModal] = useState<boolean>(false);
  const [gCustomerName, setGCustomerName] = useState<string>('');
  const [gCustomersCount, setGCustomersCount] = useState<number>(1);
  const [gReviewDate, setGReviewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [gRating, setGRating] = useState<number>(5);
  const [gReviewText, setGReviewText] = useState<string>('');
  const [gSelectedEmployeeId, setGSelectedEmployeeId] = useState<string>('');
  const [gNotes, setGNotes] = useState<string>('');
  const [gSelectedFile, setGSelectedFile] = useState<File | null>(null);
  const [gPreviewUrl, setGPreviewUrl] = useState<string | null>(null);
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState<boolean>(false);

  // Add Video Review Modal State
  const [showAddVideoModal, setShowAddVideoModal] = useState<boolean>(false);
  const [vCustomerName, setVCustomerName] = useState<string>('');
  const [vVideosCount, setVVideosCount] = useState<number>(1);
  const [vVideoTitle, setVVideoTitle] = useState<string>('');
  const [vVideoUrl, setVVideoUrl] = useState<string>('');
  const [vReviewDate, setVReviewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [vSelectedEmployeeId, setVSelectedEmployeeId] = useState<string>('');
  const [vNotes, setVNotes] = useState<string>('');
  const [vSelectedFile, setVSelectedFile] = useState<File | null>(null);
  const [vPreviewUrl, setVPreviewUrl] = useState<string | null>(null);
  const [isSubmittingVideo, setIsSubmittingVideo] = useState<boolean>(false);

  // Rejection Modal State
  const [rejectTarget, setRejectTarget] = useState<{
    type: 'GOOGLE' | 'VIDEO';
    id: number;
    employeeName: string;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isSubmittingReject, setIsSubmittingReject] = useState<boolean>(false);

  // Full Image Preview Modal
  const [viewImageModalUrl, setViewImageModalUrl] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Data Fetching
  // -------------------------------------------------------------------------
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [empRes, revRes, vidRes] = await Promise.all([
        api.get<Employee[]>('/api/v1/employees'),
        api.get<GoogleReview[]>('/api/v1/google-reviews'),
        api.get<VideoReview[]>('/api/v1/video-reviews'),
      ]);
      setEmployees(empRes.data || []);
      setReviews(revRes.data || []);
      setVideoReviews(vidRes.data || []);
    } catch (err) {
      console.error('Failed to load reviews and employee points data:', err);
      toastError('Failed to fetch employee points and review records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // -------------------------------------------------------------------------
  // Helper calculations for points
  // -------------------------------------------------------------------------
  const isApprovedStatus = (st?: string | null) => {
    const s = (st || '').toUpperCase();
    return s === 'APPROVED' || s === 'VERIFIED' || s === 'PUBLISHED';
  };

  const getEmployeeGoogleReviews = (empId: number) => {
    return reviews.filter((r) => r.employee_id === empId);
  };

  const getEmployeeVideoReviews = (empId: number) => {
    return videoReviews.filter((v) => v.employee_id === empId);
  };

  const getEmployeeGooglePoints = (empId: number) => {
    const empReviews = getEmployeeGoogleReviews(empId);
    return empReviews
      .filter((r) => isApprovedStatus(r.status))
      .reduce((sum, r) => sum + (r.points ?? (r.customers_count || 1)), 0);
  };

  const getEmployeeVideoPoints = (empId: number) => {
    const empVideos = getEmployeeVideoReviews(empId);
    return empVideos
      .filter((v) => isApprovedStatus(v.status))
      .reduce((sum, v) => sum + (v.points ?? ((v.videos_count || 1) * 5)), 0);
  };

  const getEmployeeTotalPoints = (emp: Employee) => {
    const gPts = getEmployeeGooglePoints(emp.id);
    const vPts = getEmployeeVideoPoints(emp.id);
    const computed = gPts + vPts;
    if (reviews.length > 0 || videoReviews.length > 0) return computed;
    return emp.total_points ?? computed;
  };

  const getEmployeePendingCount = (empId: number) => {
    const gPending = getEmployeeGoogleReviews(empId).filter((r) => (r.status || '').toUpperCase() === 'PENDING').length;
    const vPending = getEmployeeVideoReviews(empId).filter((v) => (v.status || '').toUpperCase() === 'PENDING').length;
    return gPending + vPending;
  };

  // Rank all employees descending by total points (highest on top!)
  const rankedEmployees = [...employees].sort((a, b) => {
    const ptsA = getEmployeeTotalPoints(a);
    const ptsB = getEmployeeTotalPoints(b);
    if (ptsB !== ptsA) return ptsB - ptsA;
    return a.full_name.localeCompare(b.full_name);
  });

  // Filtered employees for display
  const filteredEmployees = rankedEmployees.filter((emp) => {
    if (filterType === 'with_points' && getEmployeeTotalPoints(emp) === 0) {
      return false;
    }
    if (filterType === 'pending' && getEmployeePendingCount(emp.id) === 0) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = emp.full_name.toLowerCase().includes(q);
      const matchCode = (emp.employee_code || '').toLowerCase().includes(q);
      const matchDesig = (emp.designation || '').toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchDesig) return false;
    }
    return true;
  });

  // Summary Metrics
  const totalApprovedGooglePoints = reviews
    .filter((r) => isApprovedStatus(r.status))
    .reduce((sum, r) => sum + (r.points ?? (r.customers_count || 1)), 0);

  const totalApprovedVideoPoints = videoReviews
    .filter((v) => isApprovedStatus(v.status))
    .reduce((sum, v) => sum + (v.points ?? ((v.videos_count || 1) * 5)), 0);

  const totalShowroomPoints = totalApprovedGooglePoints + totalApprovedVideoPoints;
  const totalPendingQueue =
    reviews.filter((r) => (r.status || '').toUpperCase() === 'PENDING').length +
    videoReviews.filter((v) => (v.status || '').toUpperCase() === 'PENDING').length;

  const topPerformer = rankedEmployees.length > 0 && getEmployeeTotalPoints(rankedEmployees[0]) > 0
    ? rankedEmployees[0]
    : null;

  // -------------------------------------------------------------------------
  // Approval / Rejection Handlers
  // -------------------------------------------------------------------------
  const handleApproveGoogleReview = async (id: number) => {
    try {
      await api.patch(`/api/v1/google-reviews/${id}/status`, { status: 'APPROVED' });
      success('Google Review verified & approved! +1 point credited.');
      fetchData();
    } catch (err: any) {
      toastError(err?.response?.data?.detail || 'Failed to approve review.');
    }
  };

  const handleApproveVideoReview = async (id: number) => {
    try {
      await api.patch(`/api/v1/video-reviews/${id}/status`, { status: 'APPROVED' });
      success('Video Review verified & approved! +5 points credited.');
      fetchData();
    } catch (err: any) {
      toastError(err?.response?.data?.detail || 'Failed to approve video review.');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    if (!rejectionReason.trim()) {
      toastError('Please enter a rejection reason.');
      return;
    }

    try {
      setIsSubmittingReject(true);
      if (rejectTarget.type === 'GOOGLE') {
        await api.patch(`/api/v1/google-reviews/${rejectTarget.id}/status`, {
          status: 'REJECTED',
          rejection_reason: rejectionReason.trim(),
        });
        success('Google Review marked as rejected.');
      } else {
        await api.patch(`/api/v1/video-reviews/${rejectTarget.id}/status`, {
          status: 'REJECTED',
          rejection_reason: rejectionReason.trim(),
        });
        success('Video Review marked as rejected.');
      }
      setRejectTarget(null);
      setRejectionReason('');
      fetchData();
    } catch (err: any) {
      toastError(err?.response?.data?.detail || 'Failed to reject review.');
    } finally {
      setIsSubmittingReject(false);
    }
  };

  // -------------------------------------------------------------------------
  // Add Google Review Form
  // -------------------------------------------------------------------------
  const handleCreateGoogleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gSelectedEmployeeId) {
      toastError('Please select an employee.');
      return;
    }
    if (!gReviewText.trim()) {
      toastError('Please provide review text.');
      return;
    }

    setIsSubmittingGoogle(true);
    try {
      let finalScreenshotUrl = '';
      if (gSelectedFile) {
        const formData = new FormData();
        formData.append('file', gSelectedFile);
        const uploadRes = await api.post('/api/v1/google-reviews/upload-screenshot', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        finalScreenshotUrl = uploadRes.data.screenshot_url || uploadRes.data.url;
      }

      await api.post('/api/v1/google-reviews', {
        employee_id: parseInt(gSelectedEmployeeId),
        customer_name: gCustomerName.trim() || `Customer Review (${gCustomersCount})`,
        customers_count: gCustomersCount,
        rating: gRating,
        review_date: gReviewDate,
        review_text: gReviewText.trim(),
        notes: gNotes.trim() || null,
        status: 'APPROVED',
        screenshot_url: finalScreenshotUrl || null,
      });

      success('Google Review recorded and points awarded to employee!');
      setShowAddGoogleModal(false);
      setGCustomerName('');
      setGReviewText('');
      setGNotes('');
      setGSelectedFile(null);
      setGPreviewUrl(null);
      fetchData();
    } catch (err: any) {
      toastError(err?.response?.data?.detail || 'Failed to record Google review.');
    } finally {
      setIsSubmittingGoogle(false);
    }
  };

  // -------------------------------------------------------------------------
  // Add Video Review Form
  // -------------------------------------------------------------------------
  const handleCreateVideoReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vSelectedEmployeeId) {
      toastError('Please select an employee.');
      return;
    }
    if (!vCustomerName.trim()) {
      toastError('Please provide customer name.');
      return;
    }
    if (!vSelectedFile) {
      toastError('Please upload photo/video proof thumbnail.');
      return;
    }

    setIsSubmittingVideo(true);
    try {
      let finalScreenshotUrl = '';
      if (vSelectedFile) {
        const formData = new FormData();
        formData.append('file', vSelectedFile);
        const uploadRes = await api.post('/api/v1/video-reviews/upload-screenshot', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        finalScreenshotUrl = uploadRes.data.screenshot_url || uploadRes.data.url;
      }

      await api.post('/api/v1/video-reviews', {
        employee_id: parseInt(vSelectedEmployeeId),
        customer_name: vCustomerName.trim(),
        videos_count: vVideosCount,
        video_title: vVideoTitle.trim() || 'Showroom Customer Video Review',
        video_url: vVideoUrl.trim() || null,
        review_date: vReviewDate,
        notes: vNotes.trim() || null,
        status: 'APPROVED',
        screenshot_url: finalScreenshotUrl || null,
      });

      success('Video Review recorded and points awarded to employee!');
      setShowAddVideoModal(false);
      setVCustomerName('');
      setVVideoTitle('');
      setVVideoUrl('');
      setVNotes('');
      setVSelectedFile(null);
      setVPreviewUrl(null);
      fetchData();
    } catch (err: any) {
      toastError(err?.response?.data?.detail || 'Failed to record video review.');
    } finally {
      setIsSubmittingVideo(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-linear-to-r from-[#FEF3C7] to-[#FDE68A] text-[#92400E] border border-[#F59E0B] shadow-xs">
          <Trophy className="w-3.5 h-3.5 text-[#D97706] fill-[#D97706]" />
          <span className="font-extrabold text-xs">#1 Top Performer</span>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-linear-to-r from-[#F1F5F9] to-[#E2E8F0] text-[#334155] border border-[#94A3B8] shadow-xs">
          <Award className="w-3.5 h-3.5 text-[#64748B]" />
          <span className="font-extrabold text-xs">#2 Runner Up</span>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-linear-to-r from-[#FFEDD5] to-[#FED7AA] text-[#9A3412] border border-[#FB923C] shadow-xs">
          <Award className="w-3.5 h-3.5 text-[#EA580C]" />
          <span className="font-extrabold text-xs">#3 Rank</span>
        </div>
      );
    }
    return (
      <div className="px-2.5 py-1 rounded-full bg-[#FAF8F5] text-[#6B6559] border border-[#E6E1D6] font-mono font-extrabold text-xs">
        #{rank}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* 1. Hero Banner */}
      <div className="relative bg-linear-to-br from-[#18181B] via-[#222226] to-[#27272A] border border-[#3F3F46] rounded-3xl p-6 sm:p-8 shadow-sm text-white overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-[#F59E0B] to-transparent opacity-80 animate-pulse" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 text-[#FDE68A] border border-[#F59E0B]/40 flex items-center gap-2 shadow-2xs">
                <Trophy className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
                <span>Showroom Staff Points Leaderboard</span>
              </span>

              <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/5 text-[#E5C378] border border-white/10 shadow-2xs">
                {employees.length} Showroom Staff
              </span>

              {totalPendingQueue > 0 && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#B45309]/30 text-[#FDE68A] border border-[#F59E0B]/50 animate-pulse">
                  {totalPendingQueue} Pending Verification
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Reviews & Employee Points
              </h1>
              <p className="text-xs sm:text-sm text-[#A1A1AA] font-medium mt-1 max-w-2xl">
                Showroom staff ranked by total verified points earned from Google Maps reviews (1 pt each) and Customer Video reviews (5 pts each). Click any employee to view their detailed review proofs and point sources.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => {
                setGSelectedEmployeeId(employees[0]?.id?.toString() || '');
                setShowAddGoogleModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold text-white bg-linear-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] shadow-md shadow-[#D97706]/20 transition-all cursor-pointer"
            >
              <Star className="w-3.5 h-3.5 fill-white text-white" />
              <span>+ Log Google Review</span>
            </button>

            <button
              onClick={() => {
                setVSelectedEmployeeId(employees[0]?.id?.toString() || '');
                setShowAddVideoModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold text-white bg-linear-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] shadow-md shadow-[#2563EB]/20 transition-all cursor-pointer"
            >
              <Video className="w-3.5 h-3.5" />
              <span>+ Log Video Review</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Points Awarded */}
        <div className="bg-white border border-[#E4DFD4] hover:border-[#F59E0B] rounded-2xl p-4 shadow-2xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#92400E] uppercase tracking-wider">
              Total Points Awarded
            </span>
            <Trophy className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#D97706] font-mono mt-1">
            {totalShowroomPoints} <span className="text-xs font-bold text-[#92400E]">Pts</span>
          </div>
          <span className="text-[10px] text-[#8A8479]">Showroom lifetime points</span>
        </div>

        {/* Google Review Points */}
        <div className="bg-white border border-[#E4DFD4] hover:border-[#D97706] rounded-2xl p-4 shadow-2xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#7E22CE] uppercase tracking-wider">
              Google Maps Points
            </span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#7E22CE] font-mono mt-1">
            {totalApprovedGooglePoints} <span className="text-xs font-bold text-[#7E22CE]">Pts</span>
          </div>
          <span className="text-[10px] text-[#8A8479]">1 verified review = 1 point</span>
        </div>

        {/* Video Review Points */}
        <div className="bg-white border border-[#E4DFD4] hover:border-[#2563EB] rounded-2xl p-4 shadow-2xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#1E40AF] uppercase tracking-wider">
              Video Review Points
            </span>
            <Video className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#1E40AF] font-mono mt-1">
            {totalApprovedVideoPoints} <span className="text-xs font-bold text-[#1E40AF]">Pts</span>
          </div>
          <span className="text-[10px] text-[#8A8479]">1 video review = 5 points</span>
        </div>

        {/* Top Performer #1 */}
        <div className="bg-linear-to-br from-[#FFFBEB] to-[#FEF3C7] border border-[#FDE68A] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-[#92400E] uppercase tracking-wider">
              Showroom #1 Leader
            </span>
            <Sparkles className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="text-lg sm:text-xl font-black text-[#1D1D1B] truncate mt-1">
            {topPerformer ? topPerformer.full_name : 'No points yet'}
          </div>
          <span className="text-[10px] font-bold text-[#D97706]">
            {topPerformer ? `${getEmployeeTotalPoints(topPerformer)} Points Earned` : 'Log reviews to award points'}
          </span>
        </div>
      </div>

      {/* 3. Filter & Search Toolbar */}
      <div className="bg-white border border-[#E4DFD4] rounded-2xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
        {/* Search */}
        <div className="w-full sm:w-80 relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-[#8A8479]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search employee by name, code, designation..."
            className="w-full pl-9 pr-3.5 py-2.5 input-luxury-beige rounded-xl text-xs font-medium"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {[
            { id: 'all', label: `All Staff (${employees.length})` },
            { id: 'with_points', label: 'With Points Only' },
            { id: 'pending', label: totalPendingQueue > 0 ? `Pending (${totalPendingQueue})` : 'Pending' },
          ].map((tab) => {
            const isSelected = filterType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#18181B] text-white border-[#18181B] shadow-xs'
                    : 'bg-[#FAF8F5] text-[#6B6559] border-[#E6E1D6] hover:bg-[#F0EDE6]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}

          <button
            onClick={fetchData}
            title="Refresh Points Data"
            className="p-2.5 rounded-xl text-[#536B8A] bg-[#EDF2F7] border border-[#C5D5E6] hover:bg-[#E2E8F0] transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4. Ranked Employees List (Leaderboard sorted top to bottom) */}
      {isLoading ? (
        <div className="py-20 flex justify-center bg-white border border-[#E4DFD4] rounded-3xl shadow-2xs">
          <LoadingSpinner message="Loading employee points leaderboard..." />
        </div>
      ) : filteredEmployees.length === 0 ? (
        <EmptyState
          title="No employees found"
          description="Adjust your search or filter criteria to see showroom employees."
          icon={User}
        />
      ) : (
        <div className="space-y-3">
          {filteredEmployees.map((emp) => {
            const rank = rankedEmployees.findIndex((e) => e.id === emp.id) + 1;
            const totalPoints = getEmployeeTotalPoints(emp);
            const googlePts = getEmployeeGooglePoints(emp.id);
            const videoPts = getEmployeeVideoPoints(emp.id);
            const gReviews = getEmployeeGoogleReviews(emp.id);
            const vReviews = getEmployeeVideoReviews(emp.id);
            const pendingCount = getEmployeePendingCount(emp.id);

            const isTop1 = rank === 1 && totalPoints > 0;
            const isTop2 = rank === 2 && totalPoints > 0;
            const isTop3 = rank === 3 && totalPoints > 0;

            return (
              <div
                key={emp.id}
                onClick={() => {
                  setSelectedEmployee(emp);
                  setEmployeeDetailTab(gReviews.length > 0 || vReviews.length === 0 ? 'google' : 'video');
                }}
                className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all duration-200 cursor-pointer shadow-[0_2px_12px_rgba(40,35,25,0.035)] hover:shadow-md hover:scale-[1.008] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group ${
                  isTop1
                    ? 'border-[#F59E0B] bg-linear-to-r from-[#FFFDF7] via-white to-[#FEF9E7]'
                    : isTop2
                    ? 'border-[#CBD5E1] bg-linear-to-r from-[#F8FAFC] via-white to-[#F1F5F9]'
                    : isTop3
                    ? 'border-[#FDBA74] bg-linear-to-r from-[#FFF9F5] via-white to-[#FFF4EB]'
                    : 'border-[#E4DFD4] hover:border-[#C5D5E6]'
                }`}
              >
                {/* Left: Rank, Avatar, Name & Code */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Rank Badge */}
                  <div className="shrink-0">{getRankBadge(rank)}</div>

                  {/* Profile Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-[#18181B] to-[#27272A] text-white flex items-center justify-center font-black text-sm border border-[#3F3F46] shadow-xs overflow-hidden">
                      {emp.profile_photo_url ? (
                        <img
                          src={emp.profile_photo_url.startsWith('http') ? emp.profile_photo_url : getMediaUrl(emp.profile_photo_url)}
                          alt={emp.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        emp.full_name.charAt(0)
                      )}
                    </div>
                    {isTop1 && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#F59E0B] text-white flex items-center justify-center text-[10px] shadow-xs">
                        👑
                      </span>
                    )}
                  </div>

                  {/* Name, Designation, Code */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-sm sm:text-base text-[#1D1D1B] group-hover:text-[#D97706] transition-colors truncate">
                        {emp.full_name}
                      </h3>
                      <span className="font-mono text-[10px] font-bold text-[#536B8A] px-2 py-0.5 rounded-md bg-[#EDF2F7] border border-[#C5D5E6]">
                        {emp.employee_code || `#${emp.id}`}
                      </span>
                      {emp.is_outdoor_marketing_employee && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                          Outdoor
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#71717A] font-medium truncate mt-0.5">
                      {emp.designation || 'Sales Executive'} • {emp.department || 'Showroom Sales'}
                    </p>
                  </div>
                </div>

                {/* Right: Point Sources & Action Link */}
                <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-[#F0EFEA]">
                  {/* Point Breakdown Pills */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-[#FAF8F5] text-[#7E22CE] border border-[#E6E1D6]">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{googlePts} Pts ({gReviews.length} Reviews)</span>
                    </span>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-[#FAF8F5] text-[#1E40AF] border border-[#E6E1D6]">
                      <Video className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>{videoPts} Pts ({vReviews.length} Videos)</span>
                    </span>

                    {pendingCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] animate-pulse">
                        <Clock className="w-3 h-3 text-[#D97706]" />
                        <span>{pendingCount} Pending</span>
                      </span>
                    )}
                  </div>

                  {/* Total Points Large Badge */}
                  <div className="text-right shrink-0">
                    <div className="text-xl sm:text-2xl font-black text-[#D97706] font-mono tracking-tight">
                      {totalPoints} <span className="text-xs font-extrabold text-[#92400E]">Pts</span>
                    </div>
                    <div className="text-[10px] font-bold text-[#8A8479] flex items-center gap-1 justify-end group-hover:text-[#D97706] transition-colors">
                      <span>View details</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. EMPLOYEE DETAIL MODAL (Shows where they got points from)           */}
      {/* ===================================================================== */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-[#E4DFD4] overflow-hidden">
            {/* Modal Header with Employee Profile */}
            <div className="px-5 sm:px-6 py-4 bg-linear-to-r from-[#18181B] via-[#222226] to-[#27272A] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-[#3B0764] to-[#7E22CE] text-white flex items-center justify-center font-black text-base border border-[#A855F7]/40 shadow-xs overflow-hidden shrink-0">
                  {selectedEmployee.profile_photo_url ? (
                    <img
                      src={selectedEmployee.profile_photo_url.startsWith('http') ? selectedEmployee.profile_photo_url : getMediaUrl(selectedEmployee.profile_photo_url)}
                      alt={selectedEmployee.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    selectedEmployee.full_name.charAt(0)
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-white truncate">
                      {selectedEmployee.full_name}
                    </h2>
                    <span className="font-mono text-[10px] font-bold text-[#E5C378] px-2 py-0.5 rounded-md bg-white/10 border border-white/15">
                      {selectedEmployee.employee_code || `#${selectedEmployee.id}`}
                    </span>
                  </div>
                  <p className="text-xs text-[#A1A1AA] font-medium mt-0.5 truncate">
                    {selectedEmployee.designation || 'Sales Executive'} • Rank #{rankedEmployees.findIndex((e) => e.id === selectedEmployee.id) + 1} on Leaderboard
                  </p>
                </div>
              </div>

              {/* Points badge & Close */}
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <div className="text-right">
                  <span className="text-[10px] text-[#A1A1AA] uppercase font-bold block">Total Points</span>
                  <span className="text-xl sm:text-2xl font-black text-[#F59E0B] font-mono">
                    {getEmployeeTotalPoints(selectedEmployee)} Pts
                  </span>
                </div>

                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="p-2 rounded-xl text-[#A1A1AA] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* Point Source KPI Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#FAF8F5] border border-[#E6E1D6] rounded-2xl p-3 text-center">
                  <span className="text-[10px] font-bold text-[#7E22CE] uppercase block">Google Reviews</span>
                  <span className="text-lg sm:text-xl font-black text-[#7E22CE] font-mono mt-0.5 block">
                    {getEmployeeGooglePoints(selectedEmployee.id)} <span className="text-xs font-bold">Pts</span>
                  </span>
                  <span className="text-[10px] text-[#8A8479] block">
                    {getEmployeeGoogleReviews(selectedEmployee.id).length} recorded (1 pt each)
                  </span>
                </div>

                <div className="bg-[#FAF8F5] border border-[#E6E1D6] rounded-2xl p-3 text-center">
                  <span className="text-[10px] font-bold text-[#1E40AF] uppercase block">Video Reviews</span>
                  <span className="text-lg sm:text-xl font-black text-[#1E40AF] font-mono mt-0.5 block">
                    {getEmployeeVideoPoints(selectedEmployee.id)} <span className="text-xs font-bold">Pts</span>
                  </span>
                  <span className="text-[10px] text-[#8A8479] block">
                    {getEmployeeVideoReviews(selectedEmployee.id).length} recorded (5 pts each)
                  </span>
                </div>

                <div className="bg-[#FAF8F5] border border-[#E6E1D6] rounded-2xl p-3 text-center">
                  <span className="text-[10px] font-bold text-[#D97706] uppercase block">Pending Review</span>
                  <span className="text-lg sm:text-xl font-black text-[#D97706] font-mono mt-0.5 block">
                    {getEmployeePendingCount(selectedEmployee.id)} <span className="text-xs font-bold">Items</span>
                  </span>
                  <span className="text-[10px] text-[#8A8479] block">Awaiting approval</span>
                </div>
              </div>

              {/* Tabs: Google Reviews vs Video Reviews */}
              <div className="flex items-center gap-2 border-b border-[#E8E6E1] pb-2">
                <button
                  type="button"
                  onClick={() => setEmployeeDetailTab('google')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                    employeeDetailTab === 'google'
                      ? 'bg-[#18181B] text-white shadow-xs'
                      : 'bg-[#FAF8F5] text-[#525252] hover:bg-[#F0EDE6] border border-[#E6E1D6]'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>Google Reviews ({getEmployeeGoogleReviews(selectedEmployee.id).length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEmployeeDetailTab('video')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                    employeeDetailTab === 'video'
                      ? 'bg-[#18181B] text-white shadow-xs'
                      : 'bg-[#FAF8F5] text-[#525252] hover:bg-[#F0EDE6] border border-[#E6E1D6]'
                  }`}
                >
                  <Video className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Video Reviews ({getEmployeeVideoReviews(selectedEmployee.id).length})</span>
                </button>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* TAB 1: GOOGLE REVIEWS LIST FOR SELECTED EMPLOYEE              */}
              {/* ------------------------------------------------------------- */}
              {employeeDetailTab === 'google' && (
                <div className="space-y-3">
                  {getEmployeeGoogleReviews(selectedEmployee.id).length === 0 ? (
                    <div className="text-center py-10 bg-[#FAF8F5] border border-[#E6E1D6] rounded-2xl p-6">
                      <Star className="w-8 h-8 text-[#D97706] mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-bold text-[#1D1D1B]">No Google Reviews Credited Yet</p>
                      <p className="text-[11px] text-[#71717A] mt-1">
                        No verified Google Map reviews recorded yet for {selectedEmployee.full_name}.
                      </p>
                    </div>
                  ) : (
                    getEmployeeGoogleReviews(selectedEmployee.id).map((rev) => {
                      const isApproved = isApprovedStatus(rev.status);
                      const isPending = (rev.status || '').toUpperCase() === 'PENDING';
                      const isRejected = (rev.status || '').toUpperCase() === 'REJECTED';

                      return (
                        <div
                          key={rev.id}
                          className="bg-white border border-[#E4DFD4] rounded-2xl p-4 shadow-2xs space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 text-amber-500">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3.5 h-3.5 ${
                                      i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                                    }`}
                                  />
                                ))}
                                <span className="font-bold text-xs text-[#1D1D1B] ml-1">
                                  {rev.rating}★ Review
                                </span>
                              </div>

                              <div className="text-xs font-bold text-[#1D1D1B] mt-1">
                                Customer: {rev.customer_name || 'Google Reviewer'}
                              </div>
                              <span className="text-[11px] text-[#8A8479] font-mono">
                                Date: {rev.review_date}
                              </span>
                            </div>

                            {/* Status Badge */}
                            <div>
                              {isApproved ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                                  <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
                                  <span>+1 Pt Approved</span>
                                </span>
                              ) : isPending ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                                  <Clock className="w-3 h-3 text-[#D97706]" />
                                  <span>Pending Approval</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
                                  <XCircle className="w-3 h-3 text-[#DC2626]" />
                                  <span>Rejected</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Review Content */}
                          <p className="text-xs text-[#525252] italic bg-[#FAF8F5] p-3 rounded-xl border border-[#E6E1D6] leading-relaxed">
                            "{rev.review_text}"
                          </p>

                          {/* Screenshot / Proof Image */}
                          {rev.screenshot_url && (
                            <div className="flex items-center gap-3">
                              <div
                                onClick={() => setViewImageModalUrl(rev.screenshot_url || null)}
                                className="relative w-28 h-20 rounded-xl overflow-hidden border border-[#E6E1D6] cursor-pointer group bg-gray-50 flex items-center justify-center shrink-0"
                              >
                                <img
                                  src={rev.screenshot_url.startsWith('http') ? rev.screenshot_url : getMediaUrl(rev.screenshot_url)}
                                  alt="Google Review Proof"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                                  <Eye className="w-3 h-3" />
                                  <span>View Proof</span>
                                </div>
                              </div>
                              <div className="text-[11px] text-[#71717A]">
                                <span className="font-bold text-[#1D1D1B] block">Photo Proof Attached</span>
                                <span>Click thumbnail to inspect 5-star Google Maps review screenshot</span>
                              </div>
                            </div>
                          )}

                          {/* Manager Approval Actions if Pending */}
                          {isPending && (
                            <div className="pt-2 border-t border-[#F0EFEA] flex items-center justify-end gap-2">
                              <button
                                onClick={() =>
                                  setRejectTarget({
                                    type: 'GOOGLE',
                                    id: rev.id,
                                    employeeName: selectedEmployee.full_name,
                                  })
                                }
                                className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleApproveGoogleReview(rev.id)}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-[#16A34A] hover:bg-[#15803D] transition-colors cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve (+1 Pt)</span>
                              </button>
                            </div>
                          )}

                          {isRejected && rev.rejection_reason && (
                            <p className="text-[11px] text-[#DC2626] bg-[#FEF2F2] p-2 rounded-lg">
                              <strong>Rejection Reason:</strong> {rev.rejection_reason}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 2: VIDEO REVIEWS LIST FOR SELECTED EMPLOYEE               */}
              {/* ------------------------------------------------------------- */}
              {employeeDetailTab === 'video' && (
                <div className="space-y-3">
                  {getEmployeeVideoReviews(selectedEmployee.id).length === 0 ? (
                    <div className="text-center py-10 bg-[#FAF8F5] border border-[#E6E1D6] rounded-2xl p-6">
                      <Video className="w-8 h-8 text-[#2563EB] mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-bold text-[#1D1D1B]">No Video Reviews Credited Yet</p>
                      <p className="text-[11px] text-[#71717A] mt-1">
                        No customer video reviews recorded yet for {selectedEmployee.full_name}.
                      </p>
                    </div>
                  ) : (
                    getEmployeeVideoReviews(selectedEmployee.id).map((v) => {
                      const isApproved = isApprovedStatus(v.status);
                      const isPending = (v.status || '').toUpperCase() === 'PENDING';
                      const isRejected = (v.status || '').toUpperCase() === 'REJECTED';

                      return (
                        <div
                          key={v.id}
                          className="bg-white border border-[#E4DFD4] rounded-2xl p-4 shadow-2xs space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-extrabold text-xs sm:text-sm text-[#1D1D1B] flex items-center gap-1.5">
                                <Video className="w-4 h-4 text-[#2563EB]" />
                                <span>{v.video_title || 'Customer Video Review'}</span>
                              </div>
                              <div className="text-xs font-bold text-[#525252] mt-0.5">
                                Customer: {v.customer_name || 'Customer'}
                              </div>
                              <span className="text-[11px] text-[#8A8479] font-mono">
                                Date: {v.review_date}
                              </span>
                            </div>

                            {/* Status Badge */}
                            <div>
                              {isApproved ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]">
                                  <CheckCircle2 className="w-3 h-3 text-[#2563EB]" />
                                  <span>+{(v.videos_count || 1) * 5} Pts Approved</span>
                                </span>
                              ) : isPending ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                                  <Clock className="w-3 h-3 text-[#D97706]" />
                                  <span>Pending Approval</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
                                  <XCircle className="w-3 h-3 text-[#DC2626]" />
                                  <span>Rejected</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Video Link */}
                          {v.video_url && (
                            <a
                              href={v.video_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span className="truncate max-w-md">{v.video_url}</span>
                            </a>
                          )}

                          {v.notes && (
                            <p className="text-xs text-[#525252] italic bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E6E1D6]">
                              "{v.notes}"
                            </p>
                          )}

                          {/* Video Screenshot / Proof */}
                          {v.screenshot_url && (
                            <div className="flex items-center gap-3">
                              <div
                                onClick={() => setViewImageModalUrl(v.screenshot_url || null)}
                                className="relative w-28 h-20 rounded-xl overflow-hidden border border-[#E6E1D6] cursor-pointer group bg-gray-50 flex items-center justify-center shrink-0"
                              >
                                <img
                                  src={v.screenshot_url.startsWith('http') ? v.screenshot_url : getMediaUrl(v.screenshot_url)}
                                  alt="Video Proof"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                                  <Eye className="w-3 h-3" />
                                  <span>View Proof</span>
                                </div>
                              </div>
                              <div className="text-[11px] text-[#71717A]">
                                <span className="font-bold text-[#1D1D1B] block">Video Proof Photo Attached</span>
                                <span>Click thumbnail to inspect full customer video review recording proof</span>
                              </div>
                            </div>
                          )}

                          {/* Manager Approval Actions if Pending */}
                          {isPending && (
                            <div className="pt-2 border-t border-[#F0EFEA] flex items-center justify-end gap-2">
                              <button
                                onClick={() =>
                                  setRejectTarget({
                                    type: 'VIDEO',
                                    id: v.id,
                                    employeeName: selectedEmployee.full_name,
                                  })
                                }
                                className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleApproveVideoReview(v.id)}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-[#16A34A] hover:bg-[#15803D] transition-colors cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve (+5 Pts)</span>
                              </button>
                            </div>
                          )}

                          {isRejected && v.rejection_reason && (
                            <p className="text-[11px] text-[#DC2626] bg-[#FEF2F2] p-2 rounded-lg">
                              <strong>Rejection Reason:</strong> {v.rejection_reason}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 sm:px-6 py-3.5 bg-[#FAF8F5] border-t border-[#E6E1D6] flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#18181B] hover:bg-[#27272A] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. ADD GOOGLE REVIEW MODAL                                            */}
      {/* ===================================================================== */}
      {showAddGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-[#E4DFD4] overflow-hidden flex flex-col">
            <div className="px-5 sm:px-6 py-4 bg-linear-to-r from-[#18181B] to-[#27272A] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    Log Google Review (+1 Point)
                  </h3>
                  <p className="text-[11px] text-[#A1A1AA]">
                    Award points to showroom staff for verified Google Maps review
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddGoogleModal(false)}
                disabled={isSubmittingGoogle}
                className="p-1.5 rounded-xl text-[#A1A1AA] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoogleReview} className="p-5 sm:p-6 space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1D1D1B]">Assign to Staff Member *</label>
                <select
                  required
                  value={gSelectedEmployeeId}
                  onChange={(e) => setGSelectedEmployeeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#C5D5E6] bg-white text-xs font-semibold text-[#1D1D1B] focus:ring-2 focus:ring-[#D97706] outline-hidden cursor-pointer"
                >
                  <option value="">Select Employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id.toString()}>
                      {emp.full_name} ({emp.employee_code || `#${emp.id}`})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1D1D1B]">Customer Reviewer Name</label>
                  <input
                    type="text"
                    value={gCustomerName}
                    onChange={(e) => setGCustomerName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 rounded-xl border border-[#C5D5E6] text-xs font-medium text-[#1D1D1B] focus:ring-2 focus:ring-[#D97706] outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1D1D1B]">Review Date *</label>
                  <input
                    type="date"
                    required
                    value={gReviewDate}
                    onChange={(e) => setGReviewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#C5D5E6] text-xs font-medium text-[#1D1D1B] focus:ring-2 focus:ring-[#D97706] outline-hidden cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1D1D1B]">Google Star Rating</label>
                <div className="flex items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setGRating(star)}
                      className="cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= gRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-[#D97706] ml-2">{gRating} Stars</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1D1D1B]">Google Review Text *</label>
                <textarea
                  rows={3}
                  required
                  value={gReviewText}
                  onChange={(e) => setGReviewText(e.target.value)}
                  placeholder="Paste or write the customer's Google Maps review comment..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#C5D5E6] text-xs font-medium text-[#1D1D1B] focus:ring-2 focus:ring-[#D97706] outline-hidden"
                />
              </div>

              {/* Photo Proof Upload */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1D1D1B]">Screenshot Proof (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setGSelectedFile(file);
                      setGPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                  className="w-full text-xs text-[#525252] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#FAF8F5] file:text-[#D97706] hover:file:bg-[#F0EDE6] cursor-pointer"
                />
                {gPreviewUrl && (
                  <div className="mt-2 w-24 h-16 rounded-xl overflow-hidden border border-[#C5D5E6]">
                    <img src={gPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddGoogleModal(false)}
                  disabled={isSubmittingGoogle}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B6559] hover:bg-[#EAE5D9] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGoogle}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-linear-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingGoogle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Save & Credit Point</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 7. ADD VIDEO REVIEW MODAL                                             */}
      {/* ===================================================================== */}
      {showAddVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-[#E4DFD4] overflow-hidden flex flex-col">
            <div className="px-5 sm:px-6 py-4 bg-linear-to-r from-[#18181B] to-[#27272A] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    Log Video Review (+5 Points)
                  </h3>
                  <p className="text-[11px] text-[#A1A1AA]">
                    Award 5 points to showroom staff for customer video feedback
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddVideoModal(false)}
                disabled={isSubmittingVideo}
                className="p-1.5 rounded-xl text-[#A1A1AA] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVideoReview} className="p-5 sm:p-6 space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1D1D1B]">Assign to Staff Member *</label>
                <select
                  required
                  value={vSelectedEmployeeId}
                  onChange={(e) => setVSelectedEmployeeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#C5D5E6] bg-white text-xs font-semibold text-[#1D1D1B] focus:ring-2 focus:ring-[#2563EB] outline-hidden cursor-pointer"
                >
                  <option value="">Select Employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id.toString()}>
                      {emp.full_name} ({emp.employee_code || `#${emp.id}`})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1D1D1B]">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={vCustomerName}
                    onChange={(e) => setVCustomerName(e.target.value)}
                    placeholder="e.g. Ananya Rao"
                    className="w-full px-3 py-2 rounded-xl border border-[#C5D5E6] text-xs font-medium text-[#1D1D1B] focus:ring-2 focus:ring-[#2563EB] outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1D1D1B]">Review Date *</label>
                  <input
                    type="date"
                    required
                    value={vReviewDate}
                    onChange={(e) => setVReviewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#C5D5E6] text-xs font-medium text-[#1D1D1B] focus:ring-2 focus:ring-[#2563EB] outline-hidden cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1D1D1B]">Video Title / Description</label>
                <input
                  type="text"
                  value={vVideoTitle}
                  onChange={(e) => setVVideoTitle(e.target.value)}
                  placeholder="e.g. Customer Bridal Gold Feedback"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#C5D5E6] text-xs font-medium text-[#1D1D1B] focus:ring-2 focus:ring-[#2563EB] outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1D1D1B]">Video Link / URL (Optional)</label>
                <input
                  type="url"
                  value={vVideoUrl}
                  onChange={(e) => setVVideoUrl(e.target.value)}
                  placeholder="https://instagram.com/reel/... or Google Drive link"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#C5D5E6] text-xs font-mono text-[#1D1D1B] focus:ring-2 focus:ring-[#2563EB] outline-hidden"
                />
              </div>

              {/* Photo Proof Upload */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1D1D1B]">Video Screenshot / Proof Photo *</label>
                <input
                  type="file"
                  required
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setVSelectedFile(file);
                      setVPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                  className="w-full text-xs text-[#525252] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#FAF8F5] file:text-[#2563EB] hover:file:bg-[#F0EDE6] cursor-pointer"
                />
                {vPreviewUrl && (
                  <div className="mt-2 w-24 h-16 rounded-xl overflow-hidden border border-[#C5D5E6]">
                    <img src={vPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddVideoModal(false)}
                  disabled={isSubmittingVideo}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B6559] hover:bg-[#EAE5D9] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVideo}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-linear-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingVideo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Save & Credit 5 Points</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 8. REJECT REASON MODAL                                                */}
      {/* ===================================================================== */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-[#E4DFD4] overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-[#DC2626]">
              <div className="w-10 h-10 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center">
                <XCircle className="w-5 h-5 text-[#DC2626]" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-[#1D1D1B]">
                  Reject {rejectTarget.type === 'GOOGLE' ? 'Google' : 'Video'} Review
                </h3>
                <p className="text-[11px] text-[#71717A]">
                  For employee {rejectTarget.employeeName}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1D1D1B]">Rejection Reason *</label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this review proof is invalid or cannot be verified..."
                className="w-full px-3 py-2 rounded-xl border border-[#C5D5E6] text-xs font-medium text-[#1D1D1B] focus:ring-2 focus:ring-[#DC2626] outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectTarget(null);
                  setRejectionReason('');
                }}
                disabled={isSubmittingReject}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B6559] hover:bg-[#EAE5D9] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isSubmittingReject || !rejectionReason.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#DC2626] hover:bg-[#B91C1C] transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingReject ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 9. FULL IMAGE PROOF PREVIEW MODAL                                     */}
      {/* ===================================================================== */}
      {viewImageModalUrl && (
        <div
          onClick={() => setViewImageModalUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl max-h-[90vh] bg-black rounded-3xl overflow-hidden border border-white/20 shadow-2xl flex flex-col"
          >
            <button
              onClick={() => setViewImageModalUrl(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={viewImageModalUrl.startsWith('http') ? viewImageModalUrl : getMediaUrl(viewImageModalUrl)}
              alt="Review Proof Full"
              className="w-full h-full object-contain max-h-[85vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
