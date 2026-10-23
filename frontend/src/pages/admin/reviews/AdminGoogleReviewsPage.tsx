import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star,
  Search,
  Filter,
  Building2,
  Calendar,
  Eye,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  MessageSquare,
  User,
  Phone,
  RotateCcw,
} from 'lucide-react';
import { GoogleReview, AdminFeedbackOverview, CustomerFeedback } from '../../../types';
import { AdminKPICard } from '../../../components/admin/ui/AdminKPICard';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Modal } from '../../../components/ui/Modal';
import { useAdminBranch } from '../../../context/AdminBranchContext';
import { useToast } from '../../../context/ToastContext';
import api from '../../../api/client';
import { getMediaUrl } from '../../../utils/media';

export const AdminGoogleReviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const { branches, selectedBranchId, setSelectedBranchId } = useAdminBranch();
  const { error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'google_reviews' | 'direct_feedback'>('google_reviews');

  // Google Reviews State
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [averageRating, setAverageRating] = useState<number>(5.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>(selectedBranchId?.toString() || 'all');
  const [previewReview, setPreviewReview] = useState<GoogleReview | null>(null);

  // Customer Feedback State
  const [feedbackOverview, setFeedbackOverview] = useState<AdminFeedbackOverview | null>(null);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState<boolean>(false);
  const [feedbackSearch, setFeedbackSearch] = useState<string>('');
  const [feedbackCategoryFilter, setFeedbackCategoryFilter] = useState<string>('all');
  const [feedbackRatingFilter, setFeedbackRatingFilter] = useState<string>('all');

  // Sync branchFilter with context
  useEffect(() => {
    if (selectedBranchId !== null) {
      setBranchFilter(selectedBranchId.toString());
    } else {
      setBranchFilter('all');
    }
  }, [selectedBranchId]);

  const handleBranchChange = (newVal: string) => {
    setBranchFilter(newVal);
    if (newVal === 'all') {
      setSelectedBranchId(null);
    } else {
      setSelectedBranchId(parseInt(newVal));
    }
  };

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (branchFilter !== 'all') params.branch_id = parseInt(branchFilter);

      const res = await api.get<any>('/api/v1/admin/google-reviews', { params });
      setReviews(res.data.reviews || []);
      setTotalReviews(res.data.total_reviews || 0);
      setAverageRating(res.data.average_rating || 5.0);
    } catch (err) {
      console.error('Failed to load Google reviews:', err);
      toastError('Failed to fetch Google reviews.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDirectFeedback = useCallback(async () => {
    try {
      setIsFeedbackLoading(true);
      const params: Record<string, any> = {};
      if (branchFilter !== 'all') params.branch_id = parseInt(branchFilter);

      const res = await api.get<AdminFeedbackOverview>('/api/v1/feedback/admin/all', { params });
      setFeedbackOverview(res.data);
    } catch (err) {
      console.error('Failed to load customer direct feedback:', err);
      toastError('Failed to fetch customer feedback overview.');
    } finally {
      setIsFeedbackLoading(false);
    }
  }, [branchFilter]);

  useEffect(() => {
    fetchReviews();
    fetchDirectFeedback();
  }, [branchFilter]);

  useEffect(() => {
    fetchReviews();
  }, [searchTerm]);

  const fiveStarCount = reviews.filter((r) => r.rating === 5).length;
  const fiveStarPct = totalReviews > 0 ? Math.round((fiveStarCount / totalReviews) * 100) : 100;

  const feedbacks = feedbackOverview?.records || feedbackOverview?.feedbacks || [];
  const filteredFeedbacks = feedbacks.filter((fb) => {
    const matchesSearch =
      fb.customer_name.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
      (fb.employee_name || '').toLowerCase().includes(feedbackSearch.toLowerCase()) ||
      (fb.branch_name || '').toLowerCase().includes(feedbackSearch.toLowerCase()) ||
      fb.feedback_text.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
      (fb.customer_phone || '').includes(feedbackSearch);
    const matchesCategory = feedbackCategoryFilter === 'all' || fb.category === feedbackCategoryFilter;
    const matchesRating = feedbackRatingFilter === 'all' || fb.rating === parseInt(feedbackRatingFilter);
    return matchesSearch && matchesCategory && matchesRating;
  });

  return (
    <div className="space-y-7 pb-16 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBE6DC] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#B97855] bg-[#FAF1EC] px-2.5 py-1 rounded-full border border-[#ECCFC0]">
              Brand Reputation & Customer Sentiment
            </span>
            <span className="text-xs text-[#8A8479] font-medium">
              {totalReviews} Google Reviews • {feedbackOverview?.total_feedbacks || 0} Showroom Feedback Logs
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1D1D1B] tracking-tight mt-1">
            Customer Reviews & Direct Feedback
          </h1>
          <p className="text-xs text-[#8A8479] font-medium mt-0.5">
            Verified Google Maps reviews and in-showroom customer feedback linked to sales staff across all showrooms
          </p>
        </div>

        {/* Branch Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#5E5A52]">Showroom:</span>
          <select
            value={branchFilter}
            onChange={(e) => handleBranchChange(e.target.value)}
            className="select-luxury-slate rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer"
          >
            <option value="all">All Branches ({branches.length})</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id.toString()}>
                {b.name} Showroom
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-3 border-b border-[#E8E6E1] pb-2">
        <button
          onClick={() => setActiveTab('google_reviews')}
          className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'google_reviews'
              ? 'bg-[#B97855] text-white shadow-xs'
              : 'bg-white text-[#5E5A52] hover:bg-[#FAF8F3] border border-[#E8E6E1]'
          }`}
        >
          <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
          <span>⭐ Google Maps Online Reviews ({totalReviews})</span>
        </button>

        <button
          onClick={() => setActiveTab('direct_feedback')}
          className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'direct_feedback'
              ? 'bg-[#23815F] text-white shadow-xs'
              : 'bg-white text-[#5E5A52] hover:bg-[#FAF8F3] border border-[#E8E6E1]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>💬 Customer Direct Feedback & Staff Ratings ({feedbackOverview?.total_feedbacks || 0})</span>
        </button>
      </div>

      {/* -------------------------------------------------------------
          TAB 1: GOOGLE MAPS REVIEWS
      ------------------------------------------------------------- */}
      {activeTab === 'google_reviews' && (
        <div className="space-y-6">
          {/* 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AdminKPICard
              title="Google Maps Overall Rating"
              value={`${averageRating.toFixed(1)} ★`}
              subtitle="Google Maps Verified"
              icon={<Star className="w-5 h-5 fill-[#B97855] text-[#B97855]" />}
              iconBgColor="bg-[#FAF1EC] border-[#ECCFC0] text-[#B97855]"
            />

            <AdminKPICard
              title="Total Public Reviews"
              value={totalReviews}
              subtitle="Cumulative Public Ratings"
              icon={<Sparkles className="w-5 h-5 text-[#7E22CE]" />}
              iconBgColor="bg-[#F3E8FF] border-[#D8B4FE] text-[#7E22CE]"
            />

            <AdminKPICard
              title="5-Star Reviews Ratio"
              value={`${fiveStarPct}%`}
              subtitle={`${fiveStarCount} Perfect 5-Star Reviews`}
              icon={<CheckCircle2 className="w-5 h-5 text-[#21845F]" />}
              iconBgColor="bg-[#E8F4EE] border-[#C5E3D5] text-[#21845F]"
            />

            <AdminKPICard
              title="Top Rated Showroom"
              value="Yelahanka"
              subtitle="5.0 ★ Google Score"
              icon={<Building2 className="w-5 h-5 text-[#3B82F6]" />}
              iconBgColor="bg-[#EFF6FF] border-[#BFDBFE] text-[#3B82F6]"
            />
          </div>

          {/* Search Bar */}
          <div className="p-4 bg-white border border-[#E4DFD4] rounded-2xl shadow-xs flex items-center justify-between gap-3">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 text-[#8A8479] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by reviewer name, credited employee, or comment..."
                className="w-full pl-10 pr-4 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs text-[#1D1D1B] placeholder-[#8A8479] focus:outline-none focus:border-[#7E22CE]"
              />
            </div>
            <span className="text-xs text-[#8A8479] font-medium">
              Showing {reviews.length} reviews
            </span>
          </div>

          {/* Reviews Table */}
          <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 shadow-xs">
            {isLoading ? (
              <LoadingSpinner message="Loading Google reviews..." />
            ) : reviews.length === 0 ? (
              <EmptyState
                title="No reviews found"
                description="No Google reviews matched your search criteria."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase font-bold text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Customer Reviewer</th>
                      <th className="px-4 py-3">Rating</th>
                      <th className="px-4 py-3">Showroom Branch</th>
                      <th className="px-4 py-3">Credited Staff</th>
                      <th className="px-4 py-3">Review Date</th>
                      <th className="px-4 py-3">Review Feedback</th>
                      <th className="px-4 py-3 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBE6DC] font-medium">
                    {reviews.map((r) => (
                      <tr key={r.id} className="hover:bg-[#FAF5FF] transition-colors">
                        <td className="px-4 py-3.5 font-bold text-[#1D1D1B]">{r.reviewer_name}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: r.rating }).map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2.5 py-1 rounded-full bg-[#FAF8F3] border border-[#D8B4FE] text-[#7E22CE] font-bold text-[10px]">
                            {r.branch_name}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[#5E5A52] font-semibold">{r.employee_name || 'Staff'}</td>
                        <td className="px-4 py-3.5 text-[#8A8479] font-mono">{r.review_date}</td>
                        <td className="px-4 py-3.5 text-[#5E5A52] max-w-sm truncate">{r.review_text || '—'}</td>
                        <td className="px-4 py-3.5 text-right">
                          {r.screenshot_url ? (
                            <button
                              onClick={() => setPreviewReview(r)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#7E22CE] hover:underline cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Proof</span>
                            </button>
                          ) : (
                            <span className="text-[#8A8479] text-[11px]">Direct Log</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 2: CUSTOMER DIRECT FEEDBACK & STAFF RATINGS
      ------------------------------------------------------------- */}
      {activeTab === 'direct_feedback' && (
        <div className="space-y-6">
          {/* KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AdminKPICard
              title="Showroom Satisfaction Score"
              value={`${(feedbackOverview?.average_rating || 5.0).toFixed(1)} ★`}
              subtitle="Direct Customer Survey"
              icon={<Star className="w-5 h-5 fill-[#23815F] text-[#23815F]" />}
              iconBgColor="bg-[#E8F4EE] border-[#C5E3D5] text-[#23815F]"
            />

            <AdminKPICard
              title="Direct Customer Feedbacks"
              value={feedbackOverview?.total_feedbacks || 0}
              subtitle="Recorded by Showroom Managers"
              icon={<MessageSquare className="w-5 h-5 text-[#23815F]" />}
              iconBgColor="bg-[#E8F4EE] border-[#C5E3D5] text-[#23815F]"
            />

            <AdminKPICard
              title="5-Star Feedback Ratio"
              value={`${
                feedbackOverview && feedbackOverview.total_feedbacks > 0
                  ? Math.round(
                      (feedbacks.filter((f) => f.rating === 5).length /
                        feedbackOverview.total_feedbacks) *
                        100
                    )
                  : 100
              }%`}
              subtitle="Excellent Service Scores"
              icon={<CheckCircle2 className="w-5 h-5 text-[#23815F]" />}
              iconBgColor="bg-[#E8F4EE] border-[#C5E3D5] text-[#23815F]"
            />

            <AdminKPICard
              title="Showroom Staff Evaluated"
              value={new Set(feedbacks.map((f) => f.employee_id)).size}
              subtitle="Staff with Customer Ratings"
              icon={<User className="w-5 h-5 text-[#7E22CE]" />}
              iconBgColor="bg-[#F3E8FF] border-[#D8B4FE] text-[#7E22CE]"
            />
          </div>

          {/* Filter Toolbar */}
          <div className="p-4 bg-white border border-[#E4DFD4] rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-[#8A8479] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={feedbackSearch}
                onChange={(e) => setFeedbackSearch(e.target.value)}
                placeholder="Search customer name, staff rep, or remarks..."
                className="w-full pl-10 pr-4 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs text-[#1D1D1B] placeholder-[#8A8479] focus:outline-none focus:border-[#23815F]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={feedbackRatingFilter}
                onChange={(e) => setFeedbackRatingFilter(e.target.value)}
                className="px-3 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-bold text-[#1D1D1B] cursor-pointer"
              >
                <option value="all">All Star Ratings</option>
                <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                <option value="3">⭐⭐⭐ 3 Stars</option>
                <option value="2">⭐⭐ 2 Stars</option>
                <option value="1">⭐ 1 Star</option>
              </select>

              <select
                value={feedbackCategoryFilter}
                onChange={(e) => setFeedbackCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-bold text-[#1D1D1B] cursor-pointer"
              >
                <option value="all">All Feedback Categories</option>
                <option value="Showroom Experience">Showroom Experience</option>
                <option value="Sales Service">Sales Service</option>
                <option value="Jewellery Design">Jewellery Design</option>
                <option value="Scheme Explanation">Scheme Explanation</option>
                <option value="After-Sales Service">After-Sales Service</option>
                <option value="General Feedback">General Feedback</option>
              </select>
            </div>
          </div>

          {/* Feedback Table */}
          <div className="bg-white border border-[#C5E3D5] rounded-3xl p-6 shadow-xs">
            {isFeedbackLoading ? (
              <LoadingSpinner message="Loading customer feedback logs..." />
            ) : filteredFeedbacks.length === 0 ? (
              <EmptyState
                title="No customer feedback records found"
                description="Showroom managers record direct customer ratings and reviews in the Manager portal."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#FAF8F3] border-b border-[#C5E3D5] text-[#5E5A52] uppercase font-bold text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Showroom</th>
                      <th className="px-4 py-3">Customer Name</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Rating</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Credited Staff Rep</th>
                      <th className="px-4 py-3">Customer Remarks</th>
                      <th className="px-4 py-3">Manager Notes</th>
                      <th className="px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBF3EE] font-medium">
                    {filteredFeedbacks.map((fb) => (
                      <tr key={fb.id} className="hover:bg-[#F0F7F4]/60 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FAF8F3] text-[#5E5A52] border border-[#E4DFD4]">
                            {fb.branch_name || 'Showroom'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[#1D1D1B]">{fb.customer_name}</td>
                        <td className="px-4 py-3.5 text-[#5E5A52] font-mono">{fb.customer_phone || '—'}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 text-amber-500">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < fb.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                                }`}
                              />
                            ))}
                            <span className="text-xs font-bold text-[#1D1D1B] ml-1">{fb.rating}.0</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF6EB] text-[#9A782F] border border-[#C6A45C]/30">
                            {fb.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => navigate(`/admin/employees/${fb.employee_id}`)}
                            className="text-xs font-extrabold text-[#23815F] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>{fb.employee_name || 'Staff'}</span>
                            {fb.employee_code && (
                              <span className="text-[10px] font-mono text-[#5E5A52]">
                                ({fb.employee_code})
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3.5 text-[#1D1D1B] italic max-w-xs truncate">
                          "{fb.feedback_text}"
                        </td>
                        <td className="px-4 py-3.5 text-[#5E5A52] text-[11px] max-w-xs truncate">
                          {fb.notes || '—'}
                        </td>
                        <td className="px-4 py-3.5 text-[#8A8479] font-mono">{fb.feedback_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Proof Modal */}
      {previewReview && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewReview(null)}
          title={`Google Review Proof: ${previewReview.reviewer_name}`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#1D1D1B]">Rating: {previewReview.rating} ★★★★★</span>
              <span className="text-[#7E22CE]">{previewReview.branch_name}</span>
            </div>
            {previewReview.review_text && (
              <p className="text-xs text-[#5E5A52] bg-[#FAF8F3] p-3 rounded-xl border border-[#E4DFD4] italic">
                "{previewReview.review_text}"
              </p>
            )}
            {previewReview.screenshot_url && (
              <div className="rounded-2xl border border-[#E4DFD4] overflow-hidden max-h-96 flex items-center justify-center bg-black/5">
                <img
                  src={getMediaUrl(previewReview.screenshot_url)}
                  alt="Review Proof"
                  className="max-h-96 w-full object-contain"
                />
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
