import React, { useEffect, useState } from 'react';
import {
  Image as ImageIcon,
  Camera,
  Search,
  Filter,
  Trash2,
  Eye,
  Plus,
  Calendar,
  User,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { FormMedia, Employee } from '../../types';
import api from '../../api/client';
import { getMediaUrl } from '../../utils/media';

export const GalleryPage: React.FC = () => {
  const { user, selectedBranch } = useAuth();
  const { success, error: toastError } = useToast();

  const [mediaList, setMediaList] = useState<FormMedia[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [formTypeFilter, setFormTypeFilter] = useState<string>('all');

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadEmployeeId, setUploadEmployeeId] = useState<string>('');
  const [uploadFormType, setUploadFormType] = useState<string>('Daily Closing Form');
  const [uploadNotes, setUploadNotes] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // View / Delete State
  const [viewImageModalUrl, setViewImageModalUrl] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FormMedia | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Fetch Media and Employees
  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (employeeFilter !== 'all') params.employee_id = parseInt(employeeFilter);
      if (formTypeFilter !== 'all') params.form_type = formTypeFilter;

      const res = await api.get<FormMedia[]>('/api/v1/gallery', { params });
      setMediaList(res.data);
    } catch (err) {
      console.error('Failed to load gallery media:', err);
      toastError('Failed to fetch forms media.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get<Employee[]>('/api/v1/employees');
      setEmployees(res.data);
      if (res.data.length > 0 && !uploadEmployeeId) {
        setUploadEmployeeId(res.data[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load employees for gallery:', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [employeeFilter, formTypeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMedia();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxBytes = 2.5 * 1024 * 1024; // 2.5 MB
      if (file.size > maxBytes) {
        toastError('Image size exceeds 2.5 MB limit. Please select or capture an image under 2.5 MB.');
        e.target.value = '';
        setSelectedFile(null);
        setPreviewUrl(null);
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadEmployeeId || !selectedFile) {
      toastError('Please select a staff member and choose/capture an image.');
      return;
    }

    const maxBytes = 2.5 * 1024 * 1024;
    if (selectedFile.size > maxBytes) {
      toastError('File size exceeds 2.5 MB. Please choose a smaller image.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('employee_id', uploadEmployeeId);
      formData.append('form_type', uploadFormType);
      if (uploadNotes.trim()) formData.append('notes', uploadNotes.trim());
      formData.append('file', selectedFile);

      await api.post('/api/v1/forms/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      success('Closing form uploaded successfully.');
      setShowUploadModal(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadNotes('');
      fetchMedia();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to upload form.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/v1/gallery/${deleteTarget.id}`);
      success('Form document deleted.');
      setDeleteTarget(null);
      fetchMedia();
    } catch (err) {
      toastError('Failed to delete form document.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Warm Terracotta Light Hero Banner */}
      <div className="relative bg-linear-to-br from-[#FAF8F3] via-white to-[#FAF1EC] border border-[#ECCFC0] rounded-3xl p-6 sm:p-8 shadow-xs text-[#1D1D1B] overflow-hidden">
        {/* Ambient Subtle Radial Lighting */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#B97855]/6 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            {/* Showroom Badge */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#FAF1EC] text-[#B97855] border border-[#ECCFC0] flex items-center gap-2 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#B97855] animate-pulse" />
                <span>Closing Records</span>
              </span>

              <span className="text-xs font-bold px-3 py-1 rounded-full bg-white text-[#B97855] border border-[#ECCFC0] shadow-2xs">
                {mediaList.length} Uploaded Forms
              </span>
            </div>

            {/* Title & Subtitle */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1B] tracking-tight flex items-center gap-2.5">
                <FileText className="w-6 h-6 text-[#B97855]" />
                <span>Daily Closing & Forms Gallery</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#5E5A52] font-medium mt-1 max-w-2xl">
                Archived counter closing reports, gold appraisal records, and customer inquiry sheets for <span className="font-bold text-[#B97855] underline decoration-[#B97855]/30 underline-offset-2">{selectedBranch?.name || 'Showroom'}</span>
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#B97855] hover:bg-[#A36443] text-white text-xs font-bold shadow-sm transition-all cursor-pointer hover:scale-[1.02]"
            >
              <Camera className="w-4 h-4 text-white" />
              <span>+ Upload Form Photo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#ECCFC0] rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="w-full lg:w-80 relative flex items-center shrink-0">
          <Search className="absolute left-3.5 w-4 h-4 text-[#B97855]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notes or staff..."
            className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs text-[#1D1D1B] focus:outline-none focus:ring-2 focus:ring-[#B97855]/10 transition-all font-medium shadow-2xs"
          />
        </form>

        {/* Filters */}
        <div className="w-full lg:w-auto flex-1 grid grid-cols-1 sm:grid-cols-2 lg:flex items-center gap-2.5 lg:justify-end">
          <select
            value={formTypeFilter}
            onChange={(e) => setFormTypeFilter(e.target.value)}
            className="w-full lg:w-auto bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl px-3 py-2.5 text-xs text-[#1D1D1B] focus:outline-none font-semibold cursor-pointer shadow-2xs"
          >
            <option value="all">All Form Types</option>
            <option value="Daily Closing Form">Daily Closing Form</option>
            <option value="Customer Inquiry Form">Customer Inquiry Form</option>
            <option value="Gold Appraisal Sheet">Gold Appraisal Sheet</option>
            <option value="Stock Inspection Report">Stock Inspection Report</option>
          </select>

          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="w-full lg:w-auto bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl px-3 py-2.5 text-xs text-[#1D1D1B] focus:outline-none font-semibold cursor-pointer shadow-2xs"
          >
            <option value="all">All Staff Members</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id.toString()}>
                {emp.full_name}
              </option>
            ))}
          </select>

          <button
            onClick={fetchMedia}
            title="Fetch and reload latest form records"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#B97855] bg-[#FAF1EC] border border-[#ECCFC0] hover:bg-[#F5E2D6] transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Fetch / Refresh</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="py-20 flex justify-center bg-white border border-[#ECCFC0] rounded-2xl shadow-2xs">
          <LoadingSpinner message="Loading gallery forms..." />
        </div>
      ) : mediaList.length === 0 ? (
        <EmptyState
          title="No form images uploaded yet."
          description="Upload daily closing records, counter tallies, and gold appraisal sheets."
          icon={FileText}
          actionText="Upload Form Photo"
          onAction={() => setShowUploadModal(true)}
          actionIcon={<Plus className="w-4 h-4" />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {mediaList.map((m) => (
            <div
              key={m.id}
              className="bg-white border border-[#ECCFC0] rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group"
            >
              {/* Image Preview Container */}
              <div
                className="aspect-video bg-[#FAF8F3] relative overflow-hidden cursor-pointer flex items-center justify-center"
                onClick={() => setViewImageModalUrl(m.file_url)}
              >
                <img
                  src={getMediaUrl(m.file_url)}
                  alt={m.form_type}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <div className="p-2 rounded-full bg-white/80 text-black shadow-xs">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                    {m.form_type}
                  </span>
                </div>
              </div>

              {/* Card Meta Body */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-[#1D1D1B] mb-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-[#B97855]" />
                      <span>{m.employee_name || 'Staff Member'}</span>
                    </span>
                    <span className="text-[10px] text-[#8A8479] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{m.upload_date}</span>
                    </span>
                  </div>
                  {m.notes && (
                    <p className="text-xs text-[#5E5A52] font-medium line-clamp-2 italic">
                      "{m.notes}"
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-[#FAF1EC] flex items-center justify-between text-xs">
                  <span className="text-[10px] text-[#8A8479] font-medium">
                    {m.file_size ? `${(m.file_size / 1024).toFixed(1)} KB` : ''}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewImageModalUrl(m.file_url)}
                      title="View full size image"
                      className="p-1.5 rounded-lg hover:bg-[#FAF1EC] text-[#5E5A52] hover:text-[#B97855] transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(m)}
                      title="Delete form media"
                      className="p-1.5 rounded-lg hover:bg-red-50 text-[#8A8479] hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => !isUploading && setShowUploadModal(false)}
        title="Upload Counter Form / Document"
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUploadModal(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpload}
              isLoading={isUploading}
            >
              Upload Form Photo
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <Select
            label="Staff Member *"
            value={uploadEmployeeId}
            onChange={(e) => setUploadEmployeeId(e.target.value)}
            options={employees.map((emp) => ({
              value: emp.id.toString(),
              label: `${emp.full_name} (${emp.employee_code})`,
            }))}
            required
          />

          <Select
            label="Form / Report Type *"
            value={uploadFormType}
            onChange={(e) => setUploadFormType(e.target.value)}
            options={[
              { value: 'Daily Closing Form', label: 'Daily Closing Form' },
              { value: 'Customer Inquiry Form', label: 'Customer Inquiry Form' },
              { value: 'Gold Appraisal Sheet', label: 'Gold Appraisal Sheet' },
              { value: 'Stock Inspection Report', label: 'Stock Inspection Report' },
            ]}
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#1D1D1B]">Capture / Choose Image *</label>
              <span className="text-[10px] font-bold text-[#B97855] bg-[#FAF1EC] px-2 py-0.5 rounded-md">Max 2.5 MB</span>
            </div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="w-full border border-[#ECCFC0] rounded-xl p-2 bg-[#FAF8F3] text-xs"
              required
            />
          </div>

          {previewUrl && (
            <div className="rounded-xl border border-[#ECCFC0] overflow-hidden aspect-video max-h-48 bg-[#FAF8F3] flex items-center justify-center">
              <img src={previewUrl} alt="Preview" className="h-full w-full object-contain" />
            </div>
          )}

          <Input
            label="Remarks / Notes (Optional)"
            value={uploadNotes}
            onChange={(e) => setUploadNotes(e.target.value)}
            placeholder="e.g. End of day cash & gold count"
          />
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Form Document"
        message="Are you sure you want to permanently delete this form document?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Image Preview Modal */}
      {viewImageModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-[#18181B]/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setViewImageModalUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl p-3 border border-[#ECCFC0]" onClick={(e) => e.stopPropagation()}>
            <img src={getMediaUrl(viewImageModalUrl)} alt="Full size" className="max-h-[80vh] w-auto mx-auto object-contain rounded-2xl" />
            <div className="p-3 text-right">
              <button
                onClick={() => setViewImageModalUrl(null)}
                className="px-4 py-1.5 rounded-xl bg-[#FAF8F3] hover:bg-[#FAF1EC] text-[#B97855] font-bold text-xs border border-[#ECCFC0] cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
