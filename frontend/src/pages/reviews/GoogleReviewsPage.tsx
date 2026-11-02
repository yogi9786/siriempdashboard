import React, { useEffect, useState, useCallback } from 'react';
import {
  Star,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Image as ImageIcon,
  User,
  Calendar,
  Eye,
  Camera,
  RotateCcw,
  MessageSquare,
  Building2,
  Sparkles,
  Phone,
  CheckCircle2,
  Award,
  Video,
  Play,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  FileImage,
  Trophy,
  UploadCloud,
  ExternalLink,
  Check,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { GoogleReview, VideoReview, Employee, CustomerFeedback } from '../../types';
import { getMediaUrl } from '../../utils/media';
import api from '../../api/client';

export const GoogleReviewsPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [activeMainTab, setActiveMainTab] = useState<'google_reviews' | 'video_reviews' | 'customer_feedback'>('google_reviews');

  // Common State
  const [employees, setEmployees] = useState<Employee[]>([]);

  // -----------------------------------------------------------------
  // Google Reviews State
  // -----------------------------------------------------------------
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Add Review Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [customersCount, setCustomersCount] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>('');
  const [reviewDate, setReviewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [statusVal, setStatusVal] = useState<string>('Published');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Edit Review Modal State
  const [editingReview, setEditingReview] = useState<GoogleReview | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [viewImageModalUrl, setViewImageModalUrl] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GoogleReview | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // -----------------------------------------------------------------
  // Video Reviews State (1 Video = 1 Pt, 2 Videos = 2 Pts)
  // -----------------------------------------------------------------
  const [videoReviews, setVideoReviews] = useState<VideoReview[]>([]);
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false);
  const [videoSearchTerm, setVideoSearchTerm] = useState<string>('');
  const [videoEmployeeFilter, setVideoEmployeeFilter] = useState<string>('all');
  const [videoStatusFilter, setVideoStatusFilter] = useState<string>('all');

  // Video Review Add/Edit Modal
  const [showAddVideoModal, setShowAddVideoModal] = useState<boolean>(false);
  const [editingVideoReview, setEditingVideoReview] = useState<VideoReview | null>(null);
  const [showEditVideoModal, setShowEditVideoModal] = useState<boolean>(false);
  const [vCustomerName, setVCustomerName] = useState<string>('');
  const [vVideosCount, setVVideosCount] = useState<number>(1);
  const [vVideoTitle, setVVideoTitle] = useState<string>('');
  const [vVideoUrl, setVVideoUrl] = useState<string>('');
  const [vReviewDate, setVReviewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [vEmployeeId, setVEmployeeId] = useState<string>('');
  const [vNotes, setVNotes] = useState<string>('');
  const [vScreenshotUrl, setVScreenshotUrl] = useState<string>('');
  const [vSelectedFile, setVSelectedFile] = useState<File | null>(null);
  const [vPreviewUrl, setVPreviewUrl] = useState<string | null>(null);
  const [isSubmittingVideo, setIsSubmittingVideo] = useState<boolean>(false);
  const [deleteVideoTarget, setDeleteVideoTarget] = useState<VideoReview | null>(null);

  // Manager Rejection Modal State
  const [rejectTarget, setRejectTarget] = useState<{
    type: 'GOOGLE' | 'VIDEO';
    id: number;
    customerName: string;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isSubmittingStatus, setIsSubmittingStatus] = useState<boolean>(false);

  // -----------------------------------------------------------------
  // Customer Feedback State
  // -----------------------------------------------------------------
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>([]);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState<boolean>(false);
  const [feedbackSearch, setFeedbackSearch] = useState<string>('');
  const [feedbackCategoryFilter, setFeedbackCategoryFilter] = useState<string>('all');
  const [feedbackRatingFilter, setFeedbackRatingFilter] = useState<string>('all');
  const [feedbackEmployeeFilter, setFeedbackEmployeeFilter] = useState<string>('all');

  // Feedback Modal State
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [editingFeedback, setEditingFeedback] = useState<CustomerFeedback | null>(null);
  const [fbEmployeeId, setFbEmployeeId] = useState<string>('');
  const [fbCustomerName, setFbCustomerName] = useState<string>('');
  const [fbCustomerPhone, setFbCustomerPhone] = useState<string>('');
  const [fbDate, setFbDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fbRating, setFbRating] = useState<number>(5);
  const [fbCategory, setFbCategory] = useState<string>('Showroom Experience');
  const [fbText, setFbText] = useState<string>('');
  const [fbNotes, setFbNotes] = useState<string>('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);
  const [deleteFeedbackTarget, setDeleteFeedbackTarget] = useState<CustomerFeedback | null>(null);

  // Fetch Reviews and Employees
  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (ratingFilter !== 'all') params.rating = parseInt(ratingFilter);
      if (employeeFilter !== 'all') params.employee_id = parseInt(employeeFilter);
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await api.get<GoogleReview[]>('/api/v1/google-reviews', { params });
      setReviews(res.data);
    } catch (err) {
      console.error('Failed to load Google reviews:', err);
      toastError('Failed to fetch Google reviews.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFeedbacks = useCallback(async () => {
    setIsFeedbackLoading(true);
    try {
      const params: Record<string, any> = {};
      if (feedbackRatingFilter !== 'all') params.rating = parseInt(feedbackRatingFilter);
      if (feedbackEmployeeFilter !== 'all') params.employee_id = parseInt(feedbackEmployeeFilter);

      const res = await api.get<CustomerFeedback[]>('/api/v1/feedback', { params });
      setFeedbacks(res.data || []);
    } catch (err) {
      console.error('Failed to load customer feedback:', err);
      toastError('Failed to fetch customer feedback.');
    } finally {
      setIsFeedbackLoading(false);
    }
  }, [feedbackRatingFilter, feedbackEmployeeFilter]);

  const fetchEmployees = async () => {
    try {
      const res = await api.get<Employee[]>('/api/v1/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  // Fetch Video Reviews
  const fetchVideoReviews = async () => {
    setIsVideoLoading(true);
    try {
      const params: Record<string, any> = {};
      if (videoSearchTerm.trim()) params.search = videoSearchTerm.trim();
      if (videoEmployeeFilter !== 'all') params.employee_id = parseInt(videoEmployeeFilter);
      if (videoStatusFilter !== 'all') params.status = videoStatusFilter;

      const res = await api.get<VideoReview[]>('/api/v1/video-reviews', { params });
      setVideoReviews(res.data || []);
    } catch (err) {
      console.error('Failed to load video reviews:', err);
      toastError('Failed to fetch video reviews.');
    } finally {
      setIsVideoLoading(false);
    }
  };

  // Manager Approve Google Review
  const handleApproveGoogleReview = async (id: number) => {
    try {
      await api.patch(`/api/v1/google-reviews/${id}/status`, { status: 'APPROVED' });
      success('Google Review verified & approved! 1 point credited to employee.');
      fetchReviews();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to approve review.');
    }
  };

  // Manager Approve Video Review
  const handleApproveVideoReview = async (id: number, count: number = 1) => {
    try {
      await api.patch(`/api/v1/video-reviews/${id}/status`, { status: 'APPROVED' });
      success(`Video Review verified & approved! ${count} point${count > 1 ? 's' : ''} credited to employee.`);
      fetchVideoReviews();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to approve video review.');
    }
  };

  // Manager Reject with reason
  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    if (!rejectionReason.trim()) {
      toastError('Please enter a rejection reason.');
      return;
    }

    try {
      setIsSubmittingStatus(true);
      if (rejectTarget.type === 'GOOGLE') {
        await api.patch(`/api/v1/google-reviews/${rejectTarget.id}/status`, {
          status: 'REJECTED',
          rejection_reason: rejectionReason.trim(),
        });
        success('Google Review marked as rejected.');
        fetchReviews();
      } else {
        await api.patch(`/api/v1/video-reviews/${rejectTarget.id}/status`, {
          status: 'REJECTED',
          rejection_reason: rejectionReason.trim(),
        });
        success('Video Review marked as rejected.');
        fetchVideoReviews();
      }
      setRejectTarget(null);
      setRejectionReason('');
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to reject review.');
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  // Video Review Submit
  const handleCreateVideoReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vCustomerName.trim()) {
      toastError('Please provide the customer name.');
      return;
    }
    if (!vSelectedFile && !vScreenshotUrl.trim()) {
      toastError('Please upload photo proof of the video review.');
      return;
    }

    setIsSubmittingVideo(true);
    try {
      let finalScreenshotUrl = vScreenshotUrl.trim();
      if (vSelectedFile) {
        const formData = new FormData();
        formData.append('file', vSelectedFile);
        const uploadRes = await api.post('/api/v1/video-reviews/upload-screenshot', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        finalScreenshotUrl = uploadRes.data.screenshot_url || uploadRes.data.url;
      }

      await api.post('/api/v1/video-reviews', {
        customer_name: vCustomerName.trim(),
        videos_count: Number(vVideosCount),
        video_title: vVideoTitle.trim() || `${vCustomerName} Video Review`,
        video_url: vVideoUrl.trim() || null,
        review_date: vReviewDate,
        employee_id: vEmployeeId ? parseInt(vEmployeeId) : null,
        notes: vNotes.trim() || null,
        screenshot_url: finalScreenshotUrl || null,
        status: 'APPROVED',
      });

      success(`Video review (${vVideosCount} video${vVideosCount > 1 ? 's' : ''}) recorded! Points credited.`);
      setShowAddVideoModal(false);
      setVCustomerName('');
      setVVideosCount(1);
      setVVideoTitle('');
      setVVideoUrl('');
      setVNotes('');
      setVScreenshotUrl('');
      setVSelectedFile(null);
      setVPreviewUrl(null);
      fetchVideoReviews();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to record video review.');
    } finally {
      setIsSubmittingVideo(false);
    }
  };

  // Video Review Update
  const handleUpdateVideoReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideoReview || !vCustomerName.trim()) {
      toastError('Please provide the customer name.');
      return;
    }

    setIsSubmittingVideo(true);
    try {
      let finalScreenshotUrl = vScreenshotUrl.trim();
      if (vSelectedFile) {
        const formData = new FormData();
        formData.append('file', vSelectedFile);
        const uploadRes = await api.post('/api/v1/video-reviews/upload-screenshot', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        finalScreenshotUrl = uploadRes.data.screenshot_url || uploadRes.data.url;
      }

      await api.patch(`/api/v1/video-reviews/${editingVideoReview.id}`, {
        customer_name: vCustomerName.trim(),
        videos_count: Number(vVideosCount),
        video_title: vVideoTitle.trim() || `${vCustomerName} Video Review`,
        video_url: vVideoUrl.trim() || null,
        review_date: vReviewDate,
        employee_id: vEmployeeId ? parseInt(vEmployeeId) : null,
        notes: vNotes.trim() || null,
        screenshot_url: finalScreenshotUrl || null,
      });

      success('Video review updated successfully.');
      setShowEditVideoModal(false);
      setEditingVideoReview(null);
      fetchVideoReviews();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to update video review.');
    } finally {
      setIsSubmittingVideo(false);
    }
  };

  // Delete Video Review
  const handleDeleteVideo = async () => {
    if (!deleteVideoTarget) return;
    try {
      await api.delete(`/api/v1/video-reviews/${deleteVideoTarget.id}`);
      success('Video review deleted.');
      setDeleteVideoTarget(null);
      fetchVideoReviews();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to delete video review.');
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchReviews();
    fetchVideoReviews();
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  useEffect(() => {
    fetchReviews();
  }, [ratingFilter, employeeFilter, statusFilter]);

  useEffect(() => {
    fetchVideoReviews();
  }, [videoEmployeeFilter, videoStatusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReviews();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) {
      toastError('Please provide review text.');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalScreenshotUrl = screenshotUrl.trim();

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await api.post('/api/v1/google-reviews/upload-screenshot', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        finalScreenshotUrl = uploadRes.data.screenshot_url;
      }

      await api.post('/api/v1/google-reviews', {
        customer_name: customerName.trim() || `Customer Review (${customersCount})`,
        customers_count: customersCount,
        rating,
        review_date: reviewDate,
        review_text: reviewText.trim(),
        employee_id: selectedEmployeeId ? parseInt(selectedEmployeeId) : null,
        notes: notes.trim() || null,
        status: statusVal,
        screenshot_url: finalScreenshotUrl || null,
      });

      success('Google review recorded.');
      setShowAddModal(false);
      setCustomersCount(1);
      setCustomerName('');
      setReviewText('');
      setNotes('');
      setScreenshotUrl('');
      setSelectedFile(null);
      setPreviewUrl(null);
      fetchReviews();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to record Google review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview || !reviewText.trim()) {
      toastError('Please provide review text.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.patch(`/api/v1/google-reviews/${editingReview.id}`, {
        customer_name: customerName.trim() || `Customer Review (${customersCount})`,
        customers_count: customersCount,
        rating,
        review_date: reviewDate,
        review_text: reviewText.trim(),
        employee_id: selectedEmployeeId ? parseInt(selectedEmployeeId) : null,
        notes: notes.trim() || null,
        status: statusVal,
      });

      success('Google review updated successfully.');
      setShowEditModal(false);
      setEditingReview(null);
      fetchReviews();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to update Google review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/v1/google-reviews/${deleteTarget.id}`);
      success('Review removed.');
      setDeleteTarget(null);
      fetchReviews();
    } catch (err) {
      toastError('Failed to delete review.');
    } finally {
      setIsDeleting(false);
    }
  };

  // -----------------------------------------------------------------
  // Customer Feedback Handlers
  // -----------------------------------------------------------------
  const openAddFeedbackModal = () => {
    setEditingFeedback(null);
    setFbEmployeeId(employees[0]?.id?.toString() || '');
    setFbCustomerName('');
    setFbCustomerPhone('');
    setFbDate(new Date().toISOString().split('T')[0]);
    setFbRating(5);
    setFbCategory('Showroom Experience');
    setFbText('');
    setFbNotes('');
    setShowFeedbackModal(true);
  };

  const openEditFeedbackModal = (fb: CustomerFeedback) => {
    setEditingFeedback(fb);
    setFbEmployeeId(fb.employee_id.toString());
    setFbCustomerName(fb.customer_name);
    setFbCustomerPhone(fb.customer_phone || '');
    setFbDate(fb.feedback_date);
    setFbRating(fb.rating);
    setFbCategory(fb.category);
    setFbText(fb.feedback_text);
    setFbNotes(fb.notes || '');
    setShowFeedbackModal(true);
  };

  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbEmployeeId) {
      toastError('Please select the employee this feedback is linked to.');
      return;
    }
    if (!fbCustomerName.trim()) {
      toastError('Please provide the customer name.');
      return;
    }
    if (!fbText.trim()) {
      toastError('Please provide customer feedback remarks.');
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const payload = {
        employee_id: parseInt(fbEmployeeId),
        customer_name: fbCustomerName.trim(),
        customer_phone: fbCustomerPhone.trim() || undefined,
        feedback_date: fbDate,
        rating: fbRating,
        category: fbCategory,
        feedback_text: fbText.trim(),
        notes: fbNotes.trim() || undefined,
      };

      if (editingFeedback) {
        await api.put(`/api/v1/feedback/${editingFeedback.id}`, payload);
        success('Customer feedback updated successfully!');
      } else {
        await api.post('/api/v1/feedback', payload);
        success('Customer feedback logged and linked to employee!');
      }

      setShowFeedbackModal(false);
      setEditingFeedback(null);
      fetchFeedbacks();
    } catch (err: any) {
      console.error('Failed to save feedback:', err);
      toastError(err.response?.data?.detail || 'Failed to save customer feedback.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleDeleteFeedback = async () => {
    if (!deleteFeedbackTarget) return;
    try {
      await api.delete(`/api/v1/feedback/${deleteFeedbackTarget.id}`);
      success('Customer feedback removed.');
      setDeleteFeedbackTarget(null);
      fetchFeedbacks();
    } catch (err) {
      toastError('Failed to delete customer feedback.');
    }
  };

  const avgRating =
    reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '5.0';

  const avgFeedbackRating =
    feedbacks.length > 0 ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1) : '5.0';

  const filteredFeedbacks = feedbacks.filter((fb) => {
    const matchesSearch =
      fb.customer_name.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
      (fb.employee_name || '').toLowerCase().includes(feedbackSearch.toLowerCase()) ||
      fb.feedback_text.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
      (fb.customer_phone || '').includes(feedbackSearch);
    const matchesCategory = feedbackCategoryFilter === 'all' || fb.category === feedbackCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Points Calculations
  const isApprovedStatus = (st?: string | null) => {
    const s = (st || '').toUpperCase();
    return s === 'APPROVED' || s === 'VERIFIED' || s === 'PUBLISHED';
  };

  const totalGooglePoints = reviews
    .filter((r) => isApprovedStatus(r.status))
    .reduce((acc, r) => acc + (r.points ?? (r.customers_count || 1)), 0);

  const totalVideoPoints = videoReviews
    .filter((v) => isApprovedStatus(v.status))
    .reduce((acc, v) => acc + (v.points ?? ((v.videos_count || 1) * 5)), 0);

  const pendingGoogleCount = reviews.filter((r) => (r.status || '').toUpperCase() === 'PENDING').length;
  const pendingVideoCount = videoReviews.filter((v) => (v.status || '').toUpperCase() === 'PENDING').length;
  const totalPendingQueue = pendingGoogleCount + pendingVideoCount;
  const totalPointsAwarded = totalGooglePoints + totalVideoPoints;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Hero Banner */}
      <div className="relative bg-linear-to-br from-[#6B4657] via-[#5C3B4A] to-[#482D3A] border border-[#523341] rounded-3xl p-6 sm:p-8 shadow-sm text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-white border border-white/20 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E9D9A8] animate-pulse" />
                <span>Customer Intelligence & Reputation</span>
              </span>

              <div className="flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-white text-[#6B4657] font-bold shadow-2xs">
                <Star className="w-3.5 h-3.5 fill-[#C6A45C] text-[#C6A45C]" />
                <span>
                  {activeMainTab === 'google_reviews' ? `${avgRating} Google Rating` : `${avgFeedbackRating} Showroom Rating`}
                </span>
              </div>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
                {activeMainTab === 'google_reviews' ? (
                  <>
                    <Star className="w-6 h-6 text-[#E9D9A8] fill-[#E9D9A8]" />
                    <span>Customer Google Reviews</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-6 h-6 text-[#E9D9A8]" />
                    <span>Customer Review & Employee Feedback</span>
                  </>
                )}
              </h1>
              <p className="text-xs sm:text-sm text-white/80 font-medium mt-1 max-w-2xl">
                {activeMainTab === 'google_reviews'
                  ? 'Verified Google Maps reviews, 5-star rating photo proof, and staff credit logs.'
                  : 'Direct in-showroom customer reviews and staff service ratings updated by showroom managers, synced live to Admin.'}
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            {activeMainTab === 'google_reviews' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF4F8] text-[#6B4657] text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4 text-[#6B4657]" />
                <span>+ Log Google Review</span>
              </button>
            )}
            {activeMainTab === 'video_reviews' && (
              <button
                onClick={() => {
                  setEditingVideoReview(null);
                  setVCustomerName('');
                  setVVideosCount(1);
                  setVVideoTitle('');
                  setVVideoUrl('');
                  setVReviewDate(new Date().toISOString().split('T')[0]);
                  setVEmployeeId(employees[0]?.id?.toString() || '');
                  setVNotes('');
                  setVScreenshotUrl('');
                  setVSelectedFile(null);
                  setVPreviewUrl(null);
                  setShowAddVideoModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF4F8] text-[#7E22CE] text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4 text-[#7E22CE]" />
                <span>+ Log Video Review</span>
              </button>
            )}
            {activeMainTab === 'customer_feedback' && (
              <button
                onClick={openAddFeedbackModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF4F8] text-[#23815F] text-xs font-extrabold shadow-md transition-all cursor-pointer hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4 text-[#23815F]" />
                <span>+ Log Customer Feedback</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Top Points & Verification Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#FDE68A] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-[#92400E] uppercase">Total Staff Points</span>
            <Trophy className="w-4 h-4 text-[#D97706]" />
          </div>
          <span className="text-2xl font-black text-[#D97706] font-mono mt-1 block">
            {totalPointsAwarded} <span className="text-xs font-bold text-[#92400E]">Pts</span>
          </span>
          <span className="text-[10px] text-[#8A8479] mt-0.5 block">Approved employee credits</span>
        </div>

        <div className="bg-white border border-[#E6E1D6] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-[#7E22CE] uppercase">Google Review Points</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <span className="text-2xl font-black text-[#7E22CE] font-mono mt-1 block">
            {totalGooglePoints} <span className="text-xs font-bold text-[#7E22CE]">Pts</span>
          </span>
          <span className="text-[10px] text-[#8A8479] mt-0.5 block">1 customer review = 1 point</span>
        </div>

        <div className="bg-white border border-[#E6E1D6] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-[#2563EB] uppercase">Video Review Points</span>
            <Video className="w-4 h-4 text-[#2563EB]" />
          </div>
          <span className="text-2xl font-black text-[#2563EB] font-mono mt-1 block">
            {totalVideoPoints} <span className="text-xs font-bold text-[#2563EB]">Pts</span>
          </span>
          <span className="text-[10px] text-[#8A8479] mt-0.5 block">5 points per video review</span>
        </div>

        <div className="bg-white border border-[#FEF08A] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-[#854D0E] uppercase">Pending Verifications</span>
            <Clock className="w-4 h-4 text-[#B45309]" />
          </div>
          <span className="text-2xl font-black text-[#B45309] font-mono mt-1 block">
            {totalPendingQueue} <span className="text-xs font-bold text-[#854D0E]">Queue</span>
          </span>
          <span className="text-[10px] text-[#8A8479] mt-0.5 block">
            {pendingGoogleCount} Google • {pendingVideoCount} Video pending
          </span>
        </div>
      </div>

      {/* 2. Main Tab Switcher */}
      <div className="flex items-center gap-3 border-b border-[#E8E6E1] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveMainTab('google_reviews')}
          className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeMainTab === 'google_reviews'
              ? 'bg-[#6B4657] text-white shadow-xs'
              : 'bg-white text-[#5E5A52] hover:bg-[#FAF8F3] border border-[#E8E6E1]'
          }`}
        >
          <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
          <span>Google Maps Reviews ({reviews.length})</span>
          {pendingGoogleCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black text-[10px] font-black">
              {pendingGoogleCount} pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveMainTab('video_reviews')}
          className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeMainTab === 'video_reviews'
              ? 'bg-[#7E22CE] text-white shadow-xs'
              : 'bg-white text-[#5E5A52] hover:bg-[#FAF8F3] border border-[#E8E6E1]'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Video Reviews ({videoReviews.length})</span>
          {pendingVideoCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black text-[10px] font-black">
              {pendingVideoCount} pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveMainTab('customer_feedback')}
          className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeMainTab === 'customer_feedback'
              ? 'bg-[#23815F] text-white shadow-xs'
              : 'bg-white text-[#5E5A52] hover:bg-[#FAF8F3] border border-[#E8E6E1]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Customer Direct Feedback ({feedbacks.length})</span>
        </button>
      </div>

      {/* -------------------------------------------------------------
          TAB 1: GOOGLE MAPS REVIEWS
      ------------------------------------------------------------- */}
      {activeMainTab === 'google_reviews' && (
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <div className="bg-white border border-[#E6E2D8] rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-[#737373]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search review text or customer..."
                className="w-full pl-9 pr-3.5 py-2.5 input-luxury-review rounded-xl text-xs transition-all font-medium"
              />
            </form>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#737373]">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter:</span>
              </div>

              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="select-luxury-neutral rounded-xl px-3 py-2.5 text-xs font-medium cursor-pointer"
              >
                <option value="all">All Star Ratings</option>
                <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                <option value="3">⭐⭐⭐ 3 Stars</option>
              </select>

              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="select-luxury-neutral rounded-xl px-3 py-2.5 text-xs font-medium cursor-pointer"
              >
                <option value="all">All Staff Members</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id.toString()}>
                    {emp.full_name}
                  </option>
                ))}
              </select>

              <button
                onClick={fetchReviews}
                className="p-2.5 rounded-xl border border-[#E6E2D8] text-[#525252] hover:bg-[#FAF8F3] hover:text-[#171717] transition-colors cursor-pointer"
                title="Refresh reviews"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Reviews Grid */}
          {isLoading ? (
            <div className="p-16 flex items-center justify-center bg-white border border-[#E6E2D8] rounded-3xl">
              <LoadingSpinner message="Loading customer Google reviews..." />
            </div>
          ) : reviews.length === 0 ? (
            <EmptyState
              title="No Google reviews found"
              description="Record verified 5-star Google Map customer reviews here."
              actionText="+ Log First Google Review"
              onAction={() => setShowAddModal(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white border border-[#E6E2D8] rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-mono text-[#8A8479]">{rev.review_date}</span>
                    </div>

                    <div className="font-extrabold text-[#1D1D1B] text-xs flex items-center justify-between">
                      <span>{rev.customer_name || 'Customer'}</span>
                      {rev.employee_name && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5]">
                          Assigned: {rev.employee_name}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#5E5A52] italic leading-relaxed">
                      "{rev.review_text}"
                    </p>

                    {rev.screenshot_url && (
                      <div
                        onClick={() => setViewImageModalUrl(rev.screenshot_url || null)}
                        className="relative rounded-xl overflow-hidden border border-[#E6E2D8] cursor-pointer group h-28 bg-gray-50 flex items-center justify-center"
                      >
                        <img
                          src={rev.screenshot_url}
                          alt="Photo Proof"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                          <Eye className="w-4 h-4" />
                          <span>View Proof</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Points attribution badge */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#F0EBE0]">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-[#D97706]" />
                        +{(rev.points ?? (rev.customers_count || 1))} Pt
                      </span>

                      {isApprovedStatus(rev.status) ? (
                        <span className="text-[10px] font-bold text-[#21845F] flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-[#21845F]" />
                          Approved
                        </span>
                      ) : (rev.status || '').toUpperCase() === 'PENDING' ? (
                        <span className="text-[10px] font-bold text-[#B45309] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#B45309]" />
                          Pending Approval
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-[#C24141] flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-[#C24141]" />
                          Rejected
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingReview(rev);
                          setCustomersCount(rev.customers_count || 1);
                          setCustomerName(rev.customer_name || '');
                          setReviewDate(rev.review_date);
                          setRating(rev.rating);
                          setReviewText(rev.review_text);
                          setSelectedEmployeeId(rev.employee_id ? rev.employee_id.toString() : '');
                          setNotes(rev.notes || '');
                          setStatusVal(rev.status || 'Published');
                          setShowEditModal(true);
                        }}
                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                        title="Edit Review"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(rev)}
                        className="p-1 rounded-lg hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                        title="Delete Review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Manager Instant Approval Bar for Pending submissions */}
                  {(rev.status || '').toUpperCase() === 'PENDING' && (
                    <div className="pt-2 border-t border-[#F0EBE0] flex items-center gap-2">
                      <button
                        onClick={() => handleApproveGoogleReview(rev.id)}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-[#23815F] hover:bg-[#1C694D] text-white text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Verify & Approve (+1 Pt)</span>
                      </button>
                      <button
                        onClick={() => setRejectTarget({ type: 'GOOGLE', id: rev.id, customerName: rev.customer_name || 'Customer' })}
                        className="py-1.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-[#C24141] text-xs font-bold transition-all border border-red-200 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}

                  {(rev.status || '').toUpperCase() === 'REJECTED' && rev.rejection_reason && (
                    <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-[11px] text-[#C24141]">
                      <strong>Rejected:</strong> {rev.rejection_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB: VIDEO REVIEWS & EMPLOYEE ATTRIBUTION (1-2 POINTS)
      ------------------------------------------------------------- */}
      {activeMainTab === 'video_reviews' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white border border-[#E6E2D8] rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="w-full md:w-80 relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-[#737373]" />
              <input
                type="text"
                value={videoSearchTerm}
                onChange={(e) => setVideoSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchVideoReviews()}
                placeholder="Search customer, video title, or notes..."
                className="w-full pl-9 pr-3.5 py-2.5 input-luxury-review rounded-xl text-xs transition-all font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#737373]">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter:</span>
              </div>

              <select
                value={videoStatusFilter}
                onChange={(e) => setVideoStatusFilter(e.target.value)}
                className="select-luxury-neutral rounded-xl px-3 py-2.5 text-xs font-medium cursor-pointer"
              >
                <option value="all">All Verification Statuses</option>
                <option value="APPROVED">Approved / Verified</option>
                <option value="PENDING">Pending Approval</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <select
                value={videoEmployeeFilter}
                onChange={(e) => setVideoEmployeeFilter(e.target.value)}
                className="select-luxury-neutral rounded-xl px-3 py-2.5 text-xs font-medium cursor-pointer"
              >
                <option value="all">All Staff Members</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id.toString()}>
                    {emp.full_name}
                  </option>
                ))}
              </select>

              <button
                onClick={fetchVideoReviews}
                className="p-2.5 rounded-xl border border-[#E6E2D8] text-[#525252] hover:bg-[#FAF8F3] hover:text-[#171717] transition-colors cursor-pointer"
                title="Refresh video reviews"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Video Reviews Grid */}
          {isVideoLoading ? (
            <div className="p-16 flex items-center justify-center bg-white border border-[#E6E2D8] rounded-3xl">
              <LoadingSpinner message="Loading video reviews..." />
            </div>
          ) : videoReviews.length === 0 ? (
            <div className="bg-white border border-[#E6E2D8] rounded-3xl p-12">
              <EmptyState
                icon={Video}
                title="No Video Reviews Found"
                description="No video reviews have been recorded matching your search. Click '+ Log Video Review' to add customer video reviews and credit points to employees."
                actionText="+ Log Video Review"
                onAction={() => {
                  setEditingVideoReview(null);
                  setVCustomerName('');
                  setVVideosCount(1);
                  setVVideoTitle('');
                  setVVideoUrl('');
                  setVReviewDate(new Date().toISOString().split('T')[0]);
                  setVEmployeeId(employees[0]?.id?.toString() || '');
                  setVNotes('');
                  setVScreenshotUrl('');
                  setVSelectedFile(null);
                  setVPreviewUrl(null);
                  setShowAddVideoModal(true);
                }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {videoReviews.map((v) => {
                const isApproved = isApprovedStatus(v.status);
                const isPending = (v.status || '').toUpperCase() === 'PENDING';
                const isRejected = (v.status || '').toUpperCase() === 'REJECTED';

                return (
                  <div
                    key={v.id}
                    className="bg-white border border-[#E6E2D8] rounded-2xl p-5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Header with Video Tag & Points */}
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#F3E8FF] text-[#7E22CE] border border-[#D8B4FE] flex items-center gap-1">
                          <Video className="w-3 h-3 text-[#7E22CE]" />
                          {v.videos_count} Video{v.videos_count > 1 ? 's' : ''} ({(v.videos_count || 1) * 5} Pts)
                        </span>
                        <span className="text-[11px] font-mono text-[#8A8479]">{v.review_date}</span>
                      </div>

                      {/* Customer & Staff */}
                      <div className="font-extrabold text-[#1D1D1B] text-xs flex items-center justify-between">
                        <span className="truncate max-w-[180px]">{v.customer_name || 'Customer'}</span>
                        {v.employee_name && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5] truncate max-w-[130px]">
                            {v.employee_name}
                          </span>
                        )}
                      </div>

                      {/* Video Title & Link */}
                      <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#F0ECE1] space-y-1">
                        <div className="text-xs font-bold text-[#1D1D1B] flex items-center gap-1.5">
                          <Play className="w-3.5 h-3.5 text-[#7E22CE] shrink-0" />
                          <span className="truncate">{v.video_title || 'Customer Review Video'}</span>
                        </div>
                        {v.video_url && (
                          <a
                            href={v.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-[#2563EB] font-bold hover:underline flex items-center gap-1 truncate"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span className="truncate">{v.video_url}</span>
                          </a>
                        )}
                        {v.notes && (
                          <p className="text-[10px] text-[#8A8479] italic truncate">Note: {v.notes}</p>
                        )}
                      </div>

                      {/* Screenshot Proof */}
                      {v.screenshot_url && (
                        <div
                          onClick={() => setViewImageModalUrl(getMediaUrl(v.screenshot_url))}
                          className="relative rounded-xl overflow-hidden border border-[#E6E2D8] cursor-pointer group h-28 bg-gray-50 flex items-center justify-center"
                        >
                          <img
                            src={getMediaUrl(v.screenshot_url)}
                            alt="Photo Proof"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                            <Eye className="w-4 h-4" />
                            <span>View Proof</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer with Status & Actions */}
                    <div className="space-y-2 pt-2 border-t border-[#F0EBE0]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-[#D97706]" />
                            +{v.points ?? ((v.videos_count || 1) * 5)} Pts
                          </span>

                          {isApproved ? (
                            <span className="text-[10px] font-bold text-[#21845F] flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-[#21845F]" />
                              Approved
                            </span>
                          ) : isPending ? (
                            <span className="text-[10px] font-bold text-[#B45309] flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#B45309]" />
                              Pending Approval
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-[#C24141] flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-[#C24141]" />
                              Rejected
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingVideoReview(v);
                              setVCustomerName(v.customer_name || '');
                              setVVideosCount(v.videos_count || 1);
                              setVVideoTitle(v.video_title || '');
                              setVVideoUrl(v.video_url || '');
                              setVReviewDate(v.review_date);
                              setVEmployeeId(v.employee_id ? v.employee_id.toString() : '');
                              setVNotes(v.notes || '');
                              setVScreenshotUrl(v.screenshot_url || '');
                              setVSelectedFile(null);
                              setVPreviewUrl(null);
                              setShowEditVideoModal(true);
                            }}
                            className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                            title="Edit Video Review"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteVideoTarget(v)}
                            className="p-1 rounded-lg hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                            title="Delete Video Review"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Manager Verification Buttons */}
                      {isPending && (
                        <div className="pt-2 border-t border-[#F0EBE0] flex items-center gap-2">
                          <button
                            onClick={() => handleApproveVideoReview(v.id, (v.videos_count || 1) * 5)}
                            className="flex-1 py-1.5 px-3 rounded-xl bg-[#23815F] hover:bg-[#1C694D] text-white text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Verify & Approve (+{(v.videos_count || 1) * 5} Pts)</span>
                          </button>
                          <button
                            onClick={() => setRejectTarget({ type: 'VIDEO', id: v.id, customerName: v.customer_name || 'Customer' })}
                            className="py-1.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-[#C24141] text-xs font-bold transition-all border border-red-200 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}

                      {isRejected && v.rejection_reason && (
                        <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-[11px] text-[#C24141]">
                          <strong>Rejected:</strong> {v.rejection_reason}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 2: CUSTOMER DIRECT FEEDBACK & STAFF REVIEWS
      ------------------------------------------------------------- */}
      {activeMainTab === 'customer_feedback' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-[#C5E3D5] rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-bold text-[#5E5A52] uppercase block">Total Direct Feedback</span>
              <span className="text-xl font-extrabold text-[#1D1D1B] mt-1 block">{feedbacks.length}</span>
            </div>

            <div className="bg-white border border-[#C5E3D5] rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-bold text-[#23815F] uppercase block">Average Staff Rating</span>
              <span className="text-xl font-extrabold text-[#23815F] mt-1 block">
                {avgFeedbackRating} ★
              </span>
            </div>

            <div className="bg-white border border-[#C5E3D5] rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-bold text-amber-600 uppercase block">5-Star Feedback</span>
              <span className="text-xl font-extrabold text-amber-600 mt-1 block">
                {feedbacks.filter((f) => f.rating === 5).length}
              </span>
            </div>

            <div className="bg-white border border-[#C5E3D5] rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-bold text-[#9A782F] uppercase block">Staff Covered</span>
              <span className="text-xl font-extrabold text-[#9A782F] mt-1 block">
                {new Set(feedbacks.map((f) => f.employee_id)).size} Staff Members
              </span>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white border border-[#C5E3D5] rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="w-full md:w-80 relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-[#8A8479]" />
              <input
                type="text"
                value={feedbackSearch}
                onChange={(e) => setFeedbackSearch(e.target.value)}
                placeholder="Search customer, staff, remarks..."
                className="w-full pl-9 pr-3.5 py-2 input-luxury-beige rounded-xl text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
              <select
                value={feedbackRatingFilter}
                onChange={(e) => setFeedbackRatingFilter(e.target.value)}
                className="select-luxury-slate rounded-xl px-3 py-2 text-xs font-bold cursor-pointer"
              >
                <option value="all">All Ratings</option>
                <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                <option value="3">⭐⭐⭐ 3 Stars</option>
                <option value="2">⭐⭐ 2 Stars</option>
                <option value="1">⭐ 1 Star</option>
              </select>

              <select
                value={feedbackCategoryFilter}
                onChange={(e) => setFeedbackCategoryFilter(e.target.value)}
                className="select-luxury-slate rounded-xl px-3 py-2 text-xs font-bold cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="Showroom Experience">Showroom Experience</option>
                <option value="Sales Service">Sales Service</option>
                <option value="Jewellery Design">Jewellery Design</option>
                <option value="Scheme Explanation">Scheme Explanation</option>
                <option value="After-Sales Service">After-Sales Service</option>
                <option value="General Feedback">General Feedback</option>
              </select>

              <select
                value={feedbackEmployeeFilter}
                onChange={(e) => setFeedbackEmployeeFilter(e.target.value)}
                className="select-luxury-slate rounded-xl px-3 py-2 text-xs font-bold cursor-pointer"
              >
                <option value="all">All Staff</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id.toString()}>
                    {emp.full_name} ({emp.employee_code})
                  </option>
                ))}
              </select>

              <Button
                size="sm"
                onClick={openAddFeedbackModal}
                className="bg-[#23815F] hover:bg-[#1B694C] text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Log Feedback</span>
              </Button>
            </div>
          </div>

          {/* Feedback Cards Grid */}
          {isFeedbackLoading ? (
            <div className="p-16 flex items-center justify-center bg-white border border-[#C5E3D5] rounded-3xl">
              <LoadingSpinner message="Loading customer direct feedback..." />
            </div>
          ) : filteredFeedbacks.length === 0 ? (
            <EmptyState
              title="No customer feedback recorded"
              description="Record showroom customer feedback and reviews linked to employees here."
              actionText="+ Log First Customer Feedback"
              onAction={openAddFeedbackModal}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFeedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="bg-white border-2 border-[#C5E3D5] hover:border-[#23815F] rounded-2xl p-4 shadow-2xs transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    {/* Header: Rating & Category Badge */}
                    <div className="flex items-center justify-between gap-2">
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

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF6EB] text-[#9A782F] border border-[#C6A45C]/30">
                        {fb.category}
                      </span>
                    </div>

                    {/* Customer Info */}
                    <div className="flex items-center justify-between text-xs font-bold text-[#1D1D1B]">
                      <span>{fb.customer_name}</span>
                      <span className="text-[10px] font-mono text-[#8A8479] font-normal">{fb.feedback_date}</span>
                    </div>

                    {fb.customer_phone && (
                      <div className="text-[11px] font-mono text-[#5E5A52] flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#23815F]" />
                        <span>{fb.customer_phone}</span>
                      </div>
                    )}

                    {/* Staff Rep */}
                    <div className="p-2 rounded-xl bg-[#E8F4EE] border border-[#C5E3D5] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#23815F]" />
                        <span className="font-extrabold text-[#23815F]">{fb.employee_name || 'Staff Rep'}</span>
                      </div>
                      {fb.employee_code && (
                        <span className="font-mono text-[10px] font-bold text-[#1B694C] bg-white px-1.5 py-0.5 rounded">
                          {fb.employee_code}
                        </span>
                      )}
                    </div>

                    {/* Feedback Quote */}
                    <p className="text-xs text-[#1D1D1B] font-medium italic bg-[#FAF8F3] p-2.5 rounded-xl border border-[#E4DFD4]">
                      "{fb.feedback_text}"
                    </p>

                    {fb.notes && (
                      <p className="text-[11px] text-[#5E5A52] italic">
                        Manager note: {fb.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#E8E6E1]">
                    <span className="text-[10px] font-bold text-[#8A8479]">
                      Logged for Employee Evaluation
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditFeedbackModal(fb)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                        title="Edit Feedback"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteFeedbackTarget(fb)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                        title="Delete Feedback"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: LOG / EDIT CUSTOMER FEEDBACK
      ------------------------------------------------------------- */}
      <Modal
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setEditingFeedback(null);
        }}
        title={editingFeedback ? 'Edit Customer Feedback' : 'Log Showroom Customer Feedback'}
        subtitle="Record direct customer review and link to specific showroom staff"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowFeedbackModal(false);
                setEditingFeedback(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveFeedback}
              isLoading={isSubmittingFeedback}
              className="bg-[#23815F] hover:bg-[#1B694C] text-white font-bold"
            >
              {editingFeedback ? 'Update Feedback' : 'Save Customer Feedback'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveFeedback} className="space-y-4">
          <div>
            <label className="text-xs font-extrabold text-[#1D1D1B] block mb-1">
              Select Showroom Employee (Credit Link) <span className="text-[#C24141]">*</span>
            </label>
            <select
              value={fbEmployeeId}
              onChange={(e) => setFbEmployeeId(e.target.value)}
              className="w-full px-3 py-2 select-luxury-slate rounded-xl text-xs font-bold"
              required
            >
              <option value="">-- Choose Employee --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id.toString()}>
                  {emp.full_name} ({emp.employee_code} • {emp.designation})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-extrabold text-[#1D1D1B] block mb-1">
                Customer Name <span className="text-[#C24141]">*</span>
              </label>
              <input
                type="text"
                value={fbCustomerName}
                onChange={(e) => setFbCustomerName(e.target.value)}
                placeholder="e.g. Ramesh Hegde"
                className="w-full px-3 py-1.5 input-luxury-beige rounded-xl text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#5E5A52] block mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={fbCustomerPhone}
                onChange={(e) => setFbCustomerPhone(e.target.value)}
                placeholder="e.g. 9845012345"
                className="w-full px-3 py-1.5 input-luxury-beige rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-extrabold text-[#1D1D1B] block mb-1">
                Star Rating <span className="text-[#C24141]">*</span>
              </label>
              <select
                value={fbRating}
                onChange={(e) => setFbRating(parseInt(e.target.value) || 5)}
                className="w-full px-3 py-2 select-luxury-slate rounded-xl text-xs font-bold"
              >
                <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                <option value="3">⭐⭐⭐ (3 Stars)</option>
                <option value="2">⭐⭐ (2 Stars)</option>
                <option value="1">⭐ (1 Star)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-extrabold text-[#1D1D1B] block mb-1">
                Feedback Category <span className="text-[#C24141]">*</span>
              </label>
              <select
                value={fbCategory}
                onChange={(e) => setFbCategory(e.target.value)}
                className="w-full px-3 py-2 select-luxury-slate rounded-xl text-xs font-bold"
              >
                <option value="Showroom Experience">Showroom Experience</option>
                <option value="Sales Service">Sales Service</option>
                <option value="Jewellery Design">Jewellery Design</option>
                <option value="Scheme Explanation">Scheme Explanation</option>
                <option value="After-Sales Service">After-Sales Service</option>
                <option value="General Feedback">General Feedback</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#5E5A52] block mb-1">
                Date
              </label>
              <input
                type="date"
                value={fbDate}
                onChange={(e) => setFbDate(e.target.value)}
                className="w-full px-3 py-1.5 input-luxury-beige rounded-xl text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-extrabold text-[#1D1D1B] block mb-1">
              Customer Feedback Remarks / Review <span className="text-[#C24141]">*</span>
            </label>
            <textarea
              rows={3}
              value={fbText}
              onChange={(e) => setFbText(e.target.value)}
              placeholder="e.g. Executive Anand explained the bridal collection very patiently and helped us find the right design."
              className="w-full px-3 py-2 input-luxury-beige rounded-xl text-xs resize-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#5E5A52] block mb-1">
              Manager Internal Notes / Action Taken
            </label>
            <input
              type="text"
              value={fbNotes}
              onChange={(e) => setFbNotes(e.target.value)}
              placeholder="e.g. Commended in daily morning briefing"
              className="w-full px-3 py-1.5 input-luxury-beige rounded-xl text-xs"
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Feedback Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteFeedbackTarget}
        title="Delete Customer Feedback"
        message="Are you sure you want to delete this customer feedback entry?"
        confirmText="Delete Feedback"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteFeedback}
        onClose={() => setDeleteFeedbackTarget(null)}
      />

      {/* Modal: Google Review Add */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Log Customer Google Review"
        subtitle="Upload verified photo proof and star rating for employee attribution"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateReview} isLoading={isSubmitting}>
              Save Google Review
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateReview} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Number of Customers *"
              value={customersCount.toString()}
              onChange={(e) => setCustomersCount(parseInt(e.target.value))}
              options={Array.from({ length: 10 }, (_, i) => ({
                value: (i + 1).toString(),
                label: `${i + 1} Customer${i > 0 ? 's' : ''}`,
              }))}
            />

            <Select
              label="Star Rating *"
              value={rating.toString()}
              onChange={(e) => setRating(parseInt(e.target.value))}
              options={[
                { value: '5', label: '⭐⭐⭐⭐⭐ 5 Stars (Excellent)' },
                { value: '4', label: '⭐⭐⭐⭐ 4 Stars (Good)' },
                { value: '3', label: '⭐⭐⭐ 3 Stars (Average)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Customer Name (Optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Priya Sharma"
            />

            <Select
              label="Staff Member (Attribution)"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              options={[
                { value: '', label: 'General Showroom Review' },
                ...employees.map((emp) => ({
                  value: emp.id.toString(),
                  label: emp.full_name,
                })),
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Review Date"
              type="date"
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
            />
            <Select
              label="Status"
              value={statusVal}
              onChange={(e) => setStatusVal(e.target.value)}
              options={[
                { value: 'Published', label: 'Published on Google' },
                { value: 'Verified', label: 'Verified by Manager' },
              ]}
            />
          </div>

          <Input
            label="Review Text *"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="e.g. Excellent collection and helpful showroom executives!"
            required
          />

          <div>
            <label className="text-xs font-bold text-[#1D1D1B] block mb-1">
              Upload Photo Proof
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="text-xs text-[#5E5A52] file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#E8F4EE] file:text-[#23815F] hover:file:bg-[#D4EBDD] cursor-pointer"
            />
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                className="mt-2 w-32 h-20 object-cover rounded-xl border border-[#C5E3D5]"
              />
            )}
          </div>

          <Input
            label="Manager Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Remarks or customer feedback"
          />
        </form>
      </Modal>

      {/* Modal: Google Review Edit */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingReview(null);
        }}
        title="Edit Google Customer Review"
        subtitle="Update review text, rating, or customer details"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowEditModal(false);
                setEditingReview(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleUpdateReview} isLoading={isSubmitting}>
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateReview} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Number of Customers *"
              value={customersCount.toString()}
              onChange={(e) => setCustomersCount(parseInt(e.target.value))}
              options={Array.from({ length: 10 }, (_, i) => ({
                value: (i + 1).toString(),
                label: `${i + 1} Customer${i > 0 ? 's' : ''}`,
              }))}
            />

            <Select
              label="Star Rating *"
              value={rating.toString()}
              onChange={(e) => setRating(parseInt(e.target.value))}
              options={[
                { value: '5', label: '⭐⭐⭐⭐⭐ 5 Stars (Excellent)' },
                { value: '4', label: '⭐⭐⭐⭐ 4 Stars (Good)' },
                { value: '3', label: '⭐⭐⭐ 3 Stars (Average)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Customer Name (Optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Ananya Sharma"
            />

            <Select
              label="Staff Member (Optional)"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              options={[
                { value: '', label: 'General Showroom Review' },
                ...employees.map((emp) => ({
                  value: emp.id.toString(),
                  label: emp.full_name,
                })),
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Review Date"
              type="date"
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
            />
            <Select
              label="Status"
              value={statusVal}
              onChange={(e) => setStatusVal(e.target.value)}
              options={[
                { value: 'Published', label: 'Published on Google' },
                { value: 'Verified', label: 'Verified by Manager' },
              ]}
            />
          </div>

          <Input
            label="Review Text *"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="e.g. Excellent collection and helpful showroom executives!"
            required
          />

          <Input
            label="Manager Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Remarks or customer feedback"
          />
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Google Review"
        message="Are you sure you want to delete this customer review record?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Modal: Add Video Review */}
      <Modal
        isOpen={showAddVideoModal}
        onClose={() => setShowAddVideoModal(false)}
        title="Log Customer Video Review"
        subtitle="Record customer video review (exactly 5 points per video)"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowAddVideoModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateVideoReview} isLoading={isSubmittingVideo}>
              Save Video Review (+{vVideosCount * 5} Pts)
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateVideoReview} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Customer Name *"
              value={vCustomerName}
              onChange={(e) => setVCustomerName(e.target.value)}
              placeholder="e.g. Ananya Rao"
              required
            />

            <Select
              label="Number of Videos *"
              value={vVideosCount.toString()}
              onChange={(e) => setVVideosCount(parseInt(e.target.value))}
              options={[
                { value: '1', label: '1 Video Review (+5 Points)' },
                { value: '2', label: '2 Video Reviews (+10 Points)' },
                { value: '3', label: '3 Video Reviews (+15 Points)' },
                { value: '4', label: '4 Video Reviews (+20 Points)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Video Title / Topic"
              value={vVideoTitle}
              onChange={(e) => setVVideoTitle(e.target.value)}
              placeholder="e.g. Customer Bridal Set Review"
            />

            <Select
              label="Attributed Staff Member"
              value={vEmployeeId}
              onChange={(e) => setVEmployeeId(e.target.value)}
              options={[
                { value: '', label: 'General Showroom Review' },
                ...employees.map((emp) => ({
                  value: emp.id.toString(),
                  label: emp.full_name,
                })),
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Review Date *"
              type="date"
              value={vReviewDate}
              onChange={(e) => setVReviewDate(e.target.value)}
              required
            />

            <Input
              label="Video URL / Cloud Link (Optional)"
              value={vVideoUrl}
              onChange={(e) => setVVideoUrl(e.target.value)}
              placeholder="e.g. https://instagram.com/reel/..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1D1D1B] mb-1">
              Upload Photo Proof * (Required)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setVSelectedFile(file);
                  setVPreviewUrl(URL.createObjectURL(file));
                }
              }}
              className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#F3E8FF] file:text-[#7E22CE] hover:file:bg-[#E9D5FF] cursor-pointer"
            />
            {vPreviewUrl && (
              <div className="mt-2 relative rounded-xl overflow-hidden border border-[#E6E2D8] max-h-36 flex items-center justify-center bg-gray-50">
                <img src={vPreviewUrl} alt="Preview" className="max-h-36 object-contain" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5E5A52] mb-1">Internal Notes</label>
            <input
              type="text"
              value={vNotes}
              onChange={(e) => setVNotes(e.target.value)}
              placeholder="e.g. Customer recorded testimonial for diamond collection"
              className="w-full px-3 py-1.5 input-luxury-beige rounded-xl text-xs"
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Video Review */}
      <Modal
        isOpen={showEditVideoModal}
        onClose={() => setShowEditVideoModal(false)}
        title="Edit Customer Video Review"
        subtitle="Update video review details or staff attribution"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowEditVideoModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleUpdateVideoReview} isLoading={isSubmittingVideo}>
              Update Video Review
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateVideoReview} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Customer Name *"
              value={vCustomerName}
              onChange={(e) => setVCustomerName(e.target.value)}
              placeholder="e.g. Ananya Rao"
              required
            />

            <Select
              label="Number of Videos *"
              value={vVideosCount.toString()}
              onChange={(e) => setVVideosCount(parseInt(e.target.value))}
              options={[
                { value: '1', label: '1 Video Review (+5 Points)' },
                { value: '2', label: '2 Video Reviews (+10 Points)' },
                { value: '3', label: '3 Video Reviews (+15 Points)' },
                { value: '4', label: '4 Video Reviews (+20 Points)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Video Title"
              value={vVideoTitle}
              onChange={(e) => setVVideoTitle(e.target.value)}
            />

            <Select
              label="Attributed Staff Member"
              value={vEmployeeId}
              onChange={(e) => setVEmployeeId(e.target.value)}
              options={[
                { value: '', label: 'General Showroom Review' },
                ...employees.map((emp) => ({
                  value: emp.id.toString(),
                  label: emp.full_name,
                })),
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Review Date *"
              type="date"
              value={vReviewDate}
              onChange={(e) => setVReviewDate(e.target.value)}
              required
            />

            <Input
              label="Video URL (Optional)"
              value={vVideoUrl}
              onChange={(e) => setVVideoUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5E5A52] mb-1">Internal Notes</label>
            <input
              type="text"
              value={vNotes}
              onChange={(e) => setVNotes(e.target.value)}
              className="w-full px-3 py-1.5 input-luxury-beige rounded-xl text-xs"
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Video Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteVideoTarget}
        title="Delete Video Review"
        message={`Are you sure you want to delete the video review for ${deleteVideoTarget?.customer_name}?`}
        confirmText="Delete Video Review"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteVideo}
        onClose={() => setDeleteVideoTarget(null)}
      />

      {/* Modal: Manager Rejection Reason */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E4DFD4] rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-[#1D1D1B]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200 text-[#C24141] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1D1D1B]">Reject Review Submission</h3>
                <p className="text-xs text-[#8A8479]">{rejectTarget.customerName}'s {rejectTarget.type.toLowerCase()} review</p>
              </div>
            </div>

            <p className="text-xs text-[#6B6559] mb-4 leading-relaxed">
              Please enter the reason why this submission is rejected. The staff member will see this reason on their dashboard.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1D1D1B] mb-1">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Photo proof is blurry, reviewer name doesn't match, or duplicate submission..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#CBD5E1] rounded-xl p-3 text-xs text-[#1D1D1B] placeholder-[#8A8479] focus:outline-hidden focus:border-red-500 focus:ring-2 focus:ring-red-500/10 shadow-inner"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-[#EBE6DC]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRejectTarget(null);
                  setRejectionReason('');
                }}
                disabled={isSubmittingStatus}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmReject}
                disabled={isSubmittingStatus}
                className="bg-[#C24141] hover:bg-red-700 text-white text-xs font-bold rounded-xl"
              >
                {isSubmittingStatus ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Lightbox Modal */}
      {viewImageModalUrl && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl overflow-hidden max-w-xl w-full p-2">
            <button
              onClick={() => setViewImageModalUrl(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              ✕
            </button>
            <img src={viewImageModalUrl} alt="Google Review Photo Proof" className="w-full h-auto rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
};
