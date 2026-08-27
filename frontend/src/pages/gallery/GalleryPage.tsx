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
      <div className="relative bg-gradient-to-br from-[#FAF8F3] via-white to-[#FAF1EC] border border-[#ECCFC0] rounded-3xl p-6 sm:p-8 shadow-xs text-[#1D1D1B] overflow-hidden">
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
            className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs text-[#1D1D1B] placeholder:text-[#8A8479] focus:outline-none focus:border-[#B97855] focus:ring-2 focus:ring-[#B97855]/10 transition-all font-medium shadow-2xs"
          />
        </form>

        {/* Filters */}
        <div className="w-full lg:w-auto flex-1 grid grid-cols-1 sm:grid-cols-2 lg:flex items-center gap-2.5 lg:justify-end">
          <select
            value={formTypeFilter}
            onChange={(e) => setFormTypeFilter(e.target.value)}
            className="w-full lg:w-auto bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl px-3 py-2.5 text-xs text-[#1D1D1B] focus:outline-none focus:border-[#B97855] font-semibold cursor-pointer shadow-2xs"
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
            className="w-full lg:w-auto bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl px-3 py-2.5 text-xs text-[#1D1D1B] focus:outline-none focus:border-[#B97855] font-semibold cursor-pointer shadow-2xs"
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

      {/* Grid */}
      {isLoading ? (
        <div className="py-20 flex justify-center bg-white border border-[#ECCFC0] rounded-2xl shadow-2xs">
          <LoadingSpinner message="Loading gallery forms..." />
        </div>
      ) : mediaList.length === 0 ? (
        <EmptyState
          title="No form images found."
          description="Upload daily closing sheets and reports for staff verification."
          icon={FileText}
          actionText="Upload Form Photo"
          onAction={() => setShowUploadModal(true)}
          actionIcon={<Camera className="w-4 h-4" />}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaList.map((m) => (
            <div
              key={m.id}
              onClick={() => setViewImageModalUrl(m.file_url)}
              className="bg-white border border-[#ECCFC0] rounded-2xl overflow-hidden shadow-2xs group cursor-pointer hover:border-[#B97855] hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div className="aspect-4/3 bg-[#FAF8F3] overflow-hidden relative">
                <img
                  src={m.file_url}
                  alt={m.form_type}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-[#1D1D1B]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                  View Full Size
                </div>
              </div>
              <div className="p-3.5 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-bold text-[#1D1D1B] truncate">{m.form_type}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(m);
                    }}
                    className="text-[#8A8479] hover:text-[#DC2626] p-1 rounded-md hover:bg-[#FEF2F2] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-[#B97855] font-semibold truncate">{m.employee_name || 'Staff'}</p>
                <p className="text-[10px] text-[#8A8479]">{m.upload_date}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Daily Closing Form"
        subtitle="Capture or select closing sheets and verification forms"
        footer={
          <>
            <button
              onClick={() => setShowUploadModal(false)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#5E5A52] hover:bg-[#FAF8F3] border border-[#E4DFD4] cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#B97855] hover:bg-[#A36443] text-white shadow-xs cursor-pointer disabled:opacity-60"
            >
              {isUploading ? 'Uploading...' : 'Upload Form Photo'}
            </button>
          </>
        }
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <Select
            label="Staff Representative *"
            value={uploadEmployeeId}
            onChange={(e) => setUploadEmployeeId(e.target.value)}
            options={employees.map((emp) => ({
              value: emp.id.toString(),
              label: `${emp.full_name} (${emp.employee_code})`,
            }))}
            required
          />

          <Select
            label="Form Type *"
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
            <label className="block text-xs font-semibold text-[#1D1D1B] mb-1.5">Capture / Choose Image *</label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="w-full text-xs text-[#5E5A52] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#FAF1EC] file:text-[#B97855] hover:file:bg-[#F5E2D6] file:cursor-pointer border border-[#ECCFC0] rounded-xl p-2 bg-[#FAF8F3]"
              required
            />
          </div>

          {previewUrl && (
            <div className="rounded-xl border border-[#ECCFC0] overflow-hidden aspect-16/9 max-h-48 bg-[#FAF8F3] flex items-center justify-center">
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
            <img src={viewImageModalUrl} alt="Full size" className="max-h-[80vh] w-auto mx-auto object-contain rounded-2xl" />
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
