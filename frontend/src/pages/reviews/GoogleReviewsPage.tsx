import React, { useEffect, useState } from 'react';
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
import { GoogleReview, Employee } from '../../types';
import api from '../../api/client';

export const GoogleReviewsPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
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

  const openEditReview = (rev: GoogleReview) => {
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
  };

  // Image Preview Modal
  const [viewImageModalUrl, setViewImageModalUrl] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GoogleReview | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

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

  const fetchEmployees = async () => {
    try {
      const res = await api.get<Employee[]>('/api/v1/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [ratingFilter, employeeFilter, statusFilter]);

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

  const avgRating =
    reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '5.0';

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Plum Wine Hero Banner (Matching Sidebar Theme) */}
      <div className="relative bg-gradient-to-br from-[#6B4657] via-[#5C3B4A] to-[#482D3A] border border-[#523341] rounded-3xl p-6 sm:p-8 shadow-sm text-white overflow-hidden">
        {/* Ambient Radial Lighting */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            {/* Showroom Badge & Rating */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-white border border-white/20 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E9D9A8] animate-pulse" />
                <span>Customer Feedback</span>
              </span>

              <div className="flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-white text-[#6B4657] font-bold shadow-2xs">
                <Star className="w-3.5 h-3.5 fill-[#C6A45C] text-[#C6A45C]" />
                <span>{avgRating} Average Rating</span>
              </div>
            </div>

            {/* Title & Subtitle in Clean White */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
                <Star className="w-6 h-6 text-[#E9D9A8] fill-[#E9D9A8]" />
                <span>Customer Google Reviews</span>
              </h1>
              <p className="text-xs sm:text-sm text-white/80 font-medium mt-1 max-w-2xl">
                Verified customer testimonials, showroom satisfaction ratings, and 5-star Google review logs for <span className="font-bold text-white underline decoration-[#E9D9A8]/50 underline-offset-2">Showroom Staff</span>
              </p>
            </div>
          </div>

          {/* Quick Action in White */}
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF4F8] text-[#6B4657] text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 text-[#6B4657]" />
              <span>+ Log Google Review</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E6E2D8] rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-[#737373]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search review text or customer..."
            className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAF9F6] border border-[#E8E6E1] rounded-xl text-xs text-[#171717] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#171717] focus:ring-2 focus:ring-[#171717]/5 transition-all font-medium"
          />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#737373]">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="bg-[#FAF9F6] border border-[#E8E6E1] rounded-xl px-3 py-2.5 text-xs text-[#171717] focus:outline-none focus:border-[#171717] font-medium cursor-pointer"
          >
            <option value="all">All Star Ratings</option>
            <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
            <option value="4">⭐⭐⭐⭐ 4 Stars</option>
            <option value="3">⭐⭐⭐ 3 Stars</option>
          </select>

          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="bg-[#FAF9F6] border border-[#E8E6E1] rounded-xl px-3 py-2.5 text-xs text-[#171717] focus:outline-none focus:border-[#171717] font-medium cursor-pointer"
          >
            <option value="all">All Staff Members</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id.toString()}>
                {emp.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reviews Grid */}
      {isLoading ? (
        <div className="py-20 flex justify-center bg-white border border-[#E8E6E1] rounded-2xl shadow-2xs">
          <LoadingSpinner message="Loading customer reviews..." />
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          title="No reviews logged yet."
          description="Record 5-star customer Google reviews to highlight staff excellence."
          icon={Star}
          actionText="Log Google Review"
          onAction={() => setShowAddModal(true)}
          actionIcon={<Plus className="w-4 h-4" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white border border-[#E8E6E1] rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[#C9A227]">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#C9A227]" />
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditReview(rev)}
                      className="text-[#737373] hover:text-[#536B8A] p-1 rounded-md hover:bg-[#F0F4F8] transition-colors"
                      title="Edit Review"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(rev)}
                      className="text-[#A3A3A3] hover:text-[#C24141] p-1 rounded-md hover:bg-[#FDECEC] transition-colors"
                      title="Delete Review"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[#171717] font-medium italic leading-relaxed">
                  "{rev.review_text}"
                </p>
              </div>

              <div className="pt-3 border-t border-[#F0EFEA] flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-[#171717]">{rev.customer_name}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F0F4F8] text-[#536B8A] font-bold">
                      {rev.customers_count || 1} Cust
                    </span>
                  </div>
                  <p className="text-[10px] text-[#737373]">
                    Staff: {rev.employee_name || 'Showroom Floor'}
                  </p>
                </div>
                <span className="text-[10px] text-[#A3A3A3] font-medium">{rev.review_date}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Review */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Record Google Customer Review"
        subtitle="Log 5-star customer review for showroom staff"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateReview} isLoading={isSubmitting}>
              Save Review
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

      {/* Modal: Edit Review */}
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
    </div>
  );
};
