import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { GoogleReview } from '../../../types';
import { AdminKPICard } from '../../../components/admin/ui/AdminKPICard';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Modal } from '../../../components/ui/Modal';
import { useAdminBranch } from '../../../context/AdminBranchContext';
import { useToast } from '../../../context/ToastContext';
import api from '../../../api/client';
import { getMediaUrl } from '../../../utils/media';

export const AdminGoogleReviewsPage: React.FC = () => {
  const { branches, selectedBranchId } = useAdminBranch();
  const { error: toastError } = useToast();

  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [averageRating, setAverageRating] = useState<number>(5.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>(selectedBranchId?.toString() || 'all');
  const [previewReview, setPreviewReview] = useState<GoogleReview | null>(null);

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

  useEffect(() => {
    fetchReviews();
  }, [searchTerm, branchFilter]);

  const fiveStarCount = reviews.filter((r) => r.rating === 5).length;
  const fiveStarPct = totalReviews > 0 ? Math.round((fiveStarCount / totalReviews) * 100) : 100;

  return (
    <div className="space-y-7 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBE6DC] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#B97855] bg-[#FAF1EC] px-2.5 py-1 rounded-full border border-[#ECCFC0]">
              Brand Reputation Management
            </span>
            <span className="text-xs text-[#8A8479] font-medium">{totalReviews} Verified Public Reviews</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1D1D1B] tracking-tight mt-1">
            Google Reviews & Customer Feedback
          </h1>
          <p className="text-xs text-[#8A8479] font-medium mt-0.5">
            Multi-branch verified Google Maps ratings, employee credits, and screenshot verifications
          </p>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKPICard
          title="Overall Showroom Rating"
          value={`${averageRating.toFixed(1)} ★`}
          subtitle="Google Maps Verified"
          icon={<Star className="w-5 h-5 fill-[#B97855] text-[#B97855]" />}
          iconBgColor="bg-[#FAF1EC] border-[#ECCFC0] text-[#B97855]"
        />

        <AdminKPICard
          title="Total Public Reviews"
          value={totalReviews}
          subtitle="Cumulative Customer Ratings"
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
          subtitle="5.0 ★ Rating Score"
          icon={<Building2 className="w-5 h-5 text-[#3B82F6]" />}
          iconBgColor="bg-[#EFF6FF] border-[#BFDBFE] text-[#3B82F6]"
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
            placeholder="Search by reviewer name, credited employee, or comment..."
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

      {/* Reviews Table */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 shadow-[0_4px_18px_rgba(40,35,25,0.045)]">
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
