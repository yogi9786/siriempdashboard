import React, { useEffect, useState } from 'react';
import {
  Shirt,
  Plus,
  Search,
  Filter,
  Trash2,
  Image as ImageIcon,
  Camera,
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  XCircle,
  RotateCcw,
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
import { AttireRecord, Employee } from '../../types';
import api from '../../api/client';

export const AttirePage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [attireList, setAttireList] = useState<AttireRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Add Attire Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [checkDate, setCheckDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [statusVal, setStatusVal] = useState<string>('Proper');
  const [notes, setNotes] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Image Preview Modal
  const [viewImageModalUrl, setViewImageModalUrl] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AttireRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchAttire = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = {};
      if (employeeFilter !== 'all') params.employee_id = parseInt(employeeFilter);
      if (statusFilter !== 'all') params.status = statusFilter;
      if (dateFilter.trim()) params.date = dateFilter.trim();

      const res = await api.get<AttireRecord[]>('/api/v1/attire', { params });
      setAttireList(res.data);
    } catch (err) {
      console.error('Failed to load attire records:', err);
      toastError('Failed to fetch attire records.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get<Employee[]>('/api/v1/employees');
      setEmployees(res.data);
      if (res.data.length > 0 && !selectedEmployeeId) {
        setSelectedEmployeeId(res.data[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchAttire();
  }, [employeeFilter, statusFilter, dateFilter]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAddAttireSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      toastError('Please select an employee.');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalImageUrl: string | null = null;

      // Upload file if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await api.post('/api/v1/attire/upload-photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        finalImageUrl = uploadRes.data.image_url;
      }

      await api.post('/api/v1/attire', {
        employee_id: parseInt(selectedEmployeeId),
        check_date: checkDate,
        status: statusVal,
        notes: notes.trim() || null,
        image_url: finalImageUrl,
      });

      success('Attire inspection record saved.');
      setShowAddModal(false);
      setNotes('');
      setSelectedFile(null);
      setPreviewUrl(null);
      fetchAttire();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to save attire record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAttire = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/v1/attire/${deleteTarget.id}`);
      success('Attire record deleted.');
      setDeleteTarget(null);
      fetchAttire();
    } catch (err) {
      toastError('Failed to delete attire record.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
            Attire Compliance
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Track showroom staff uniform, grooming, and dress code standards
          </p>
        </div>

        <Button
          variant="black"
          size="sm"
          onClick={() => setShowAddModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          + Log Attire Check
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-neutral-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-neutral-600">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="bg-neutral-50 border border-neutral-300 rounded-md px-2.5 py-1.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="all">All Employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id.toString()}>
                {emp.full_name} ({emp.employee_code})
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-neutral-50 border border-neutral-300 rounded-md px-2.5 py-1.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="all">All Compliance Status</option>
            <option value="Proper">Proper</option>
            <option value="Needs Attention">Needs Attention</option>
            <option value="Not Proper">Not Proper</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-neutral-50 border border-neutral-300 rounded-md px-2 py-1 text-xs text-black focus:outline-none focus:ring-1 focus:ring-black"
          />

          {/* Quick Refresh / Fetch Button */}
          <button
            onClick={fetchAttire}
            title="Fetch and refresh attire compliance records"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-[#536B8A] bg-[#EDF2F7] border border-[#C5D5E6] hover:bg-[#E2E8F0] transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Fetch / Refresh</span>
          </button>

          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-neutral-500 hover:text-black underline"
            >
              Clear Date
            </button>
          )}
        </div>
      </div>

      {/* Main Table / List */}
      {isLoading ? (
        <div className="py-20 flex justify-center bg-white border border-neutral-200 rounded-lg">
          <LoadingSpinner message="Loading attire compliance logs..." />
        </div>
      ) : attireList.length === 0 ? (
        <EmptyState
          title="No attire records yet."
          description="Log daily uniform and grooming compliance inspections for showroom staff."
          icon={Shirt}
          actionText="Log Attire Check"
          onAction={() => setShowAddModal(true)}
          actionIcon={<Plus className="w-4 h-4" />}
        />
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Inspection Date</th>
                <th className="px-4 py-3">Attire Status</th>
                <th className="px-4 py-3">Notes / Comments</th>
                <th className="px-4 py-3">Evidence Photo</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {attireList.map((at) => (
                <tr key={at.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-black">
                    {at.employee_name || 'Employee'}
                  </td>
                  <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                    {at.check_date}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        at.status === 'Proper'
                          ? 'black'
                          : at.status === 'Needs Attention'
                          ? 'warning'
                          : 'danger'
                      }
                      size="sm"
                    >
                      {at.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-700 max-w-sm">
                    {at.notes || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {at.image_url ? (
                      <button
                        onClick={() => setViewImageModalUrl(at.image_url!)}
                        className="text-xs font-semibold text-black underline hover:text-neutral-600 inline-flex items-center gap-1"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>View Photo</span>
                      </button>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDeleteTarget(at)}
                      title="Delete Record"
                      className="p-1 text-neutral-400 hover:text-black transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Attire Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Log Attire Inspection Check"
        subtitle="Record uniform and dress code compliance"
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              variant="black"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleAddAttireSubmit}
            >
              Save Record
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddAttireSubmit} className="space-y-4">
          <Select
            label="Employee *"
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            options={employees.map((emp) => ({
              value: emp.id.toString(),
              label: `${emp.full_name} (${emp.employee_code})`,
            }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date"
              type="date"
              value={checkDate}
              onChange={(e) => setCheckDate(e.target.value)}
            />

            <Select
              label="Attire Status *"
              value={statusVal}
              onChange={(e) => setStatusVal(e.target.value)}
              options={[
                { value: 'Proper', label: 'Proper (Full Uniform & Grooming)' },
                { value: 'Needs Attention', label: 'Needs Attention (Minor Issue)' },
                { value: 'Not Proper', label: 'Not Proper (Non-compliant)' },
              ]}
            />
          </div>

          {/* Photo Evidence with Camera Capture */}
          <div>
            <label className="text-xs font-semibold text-neutral-800 uppercase tracking-wider block mb-1.5">
              Evidence Photo (Optional)
            </label>
            <div className="border-2 border-dashed border-neutral-300 rounded-lg p-3 text-center bg-neutral-50">
              <input
                type="file"
                id="attire-photo-input"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="attire-photo-input"
                className="cursor-pointer flex flex-col items-center justify-center gap-1"
              >
                {previewUrl ? (
                  <div className="space-y-1">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-36 rounded object-contain mx-auto border border-neutral-300"
                    />
                    <span className="text-xs font-semibold text-black underline block">
                      Change Photo
                    </span>
                  </div>
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-neutral-500" />
                    <span className="text-xs font-bold text-black">
                      Tap to take photo or choose image
                    </span>
                  </>
                )}
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-800 uppercase tracking-wider block mb-1">
              Notes / Comments
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Comments on name badge, uniform condition, grooming, etc..."
              className="w-full bg-white text-black border border-neutral-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
        </form>
      </Modal>

      {/* View Photo Modal */}
      {viewImageModalUrl && (
        <Modal
          isOpen={!!viewImageModalUrl}
          onClose={() => setViewImageModalUrl(null)}
          title="Attire Inspection Photo"
          size="lg"
          footer={
            <Button variant="black" size="sm" onClick={() => setViewImageModalUrl(null)}>
              Close
            </Button>
          }
        >
          <div className="flex justify-center p-2">
            <img
              src={viewImageModalUrl}
              alt="Attire Photo"
              className="max-h-[75vh] object-contain rounded border border-neutral-200"
            />
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Attire Record"
        message={`Are you sure you want to delete this attire inspection record for "${deleteTarget?.employee_name}"?`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteAttire}
      />
    </div>
  );
};
