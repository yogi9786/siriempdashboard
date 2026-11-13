import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Upload,
  Calendar,
  User,
  Building2,
  DollarSign,
  Download,
  Eye,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
  Search,
  Plus,
  MapPin,
  Filter,
  Edit2,
  X,
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { EmployeePaySlip } from '../../types';
import { getMediaUrl, triggerFileDownload } from '../../utils/media';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

export const HrPaySlipsPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const years = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

  const currentMonth = months[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  const [payslips, setPayslips] = useState<EmployeePaySlip[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedBranch, setSelectedBranch] = useState<string>('YELAHANKA');
  const [search, setSearch] = useState<string>('');

  // Form State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [month, setMonth] = useState<string>(currentMonth);
  const [year, setYear] = useState<number>(currentYear);
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [fileUrl, setFileUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Directory Filters: Month, Year & Employee Filter
  const [filterMonth, setFilterMonth] = useState<string>('ALL');
  const [filterYear, setFilterYear] = useState<string>('ALL');
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>('ALL');

  // Preview Lightbox
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Edit Payslip Modal State
  const [editingSlip, setEditingSlip] = useState<EmployeePaySlip | null>(null);
  const [editMonth, setEditMonth] = useState<string>(currentMonth);
  const [editYear, setEditYear] = useState<number>(currentYear);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editFileUrl, setEditFileUrl] = useState<string>('');
  const [editFileName, setEditFileName] = useState<string>('');
  const [isEditUploading, setIsEditUploading] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Delete Confirm Dialog State
  const [deleteTargetSlip, setDeleteTargetSlip] = useState<EmployeePaySlip | null>(null);
  const [isDeletingSlip, setIsDeletingSlip] = useState<boolean>(false);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/api/v1/hr/employees');
      setEmployees(res.data || []);
      const branchEmps = (res.data || []).filter(
        (e: any) => (e.branch_code || '').toUpperCase() === selectedBranch.toUpperCase()
      );
      if (branchEmps.length > 0) {
        setSelectedEmployeeId(branchEmps[0].id);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  const fetchPayslips = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/api/v1/hr/payslips');
      setPayslips(res.data || []);
    } catch (err) {
      console.error('Failed to load payslips:', err);
      toastError('Could not load payslips.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchPayslips();
  }, []);

  const handleBranchChange = (code: string) => {
    setSelectedBranch(code);
    const branchEmps = employees.filter(
      (e) => (e.branch_code || '').toUpperCase() === code.toUpperCase()
    );
    if (branchEmps.length > 0) {
      setSelectedEmployeeId(branchEmps[0].id);
    } else {
      setSelectedEmployeeId('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toastError('File exceeds 10MB limit.');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/v1/hr/upload-payslip', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFileUrl(res.data.file_url || res.data.url);
      setFileName(file.name);
      success('Pay slip document uploaded successfully.');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to upload payslip document.';
      toastError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toastError('File exceeds 10MB limit.');
      return;
    }

    try {
      setIsEditUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/v1/hr/upload-payslip', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setEditFileUrl(res.data.file_url || res.data.url);
      setEditFileName(file.name);
      success('Updated pay slip document uploaded.');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to upload payslip document.';
      toastError(msg);
    } finally {
      setIsEditUploading(false);
    }
  };

  const handleSubmitPayslip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      toastError('Please select an employee.');
      return;
    }
    if (!fileUrl) {
      toastError('Please upload the payslip image or PDF document.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        employee_id: Number(selectedEmployeeId),
        month,
        year: Number(year),
        pay_period: `${month} ${year}`,
        amount: amount ? parseFloat(amount) : 0,
        notes: notes.trim(),
        file_url: fileUrl,
      };

      const res = await api.post('/api/v1/hr/payslips', payload);
      success(res.data.message || 'Pay slip issued successfully.');

      // Reset form fields
      setAmount('');
      setNotes('');
      setFileUrl('');
      setFileName('');
      fetchPayslips();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to issue payslip.';
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (slip: EmployeePaySlip) => {
    setEditingSlip(slip);
    setEditMonth(slip.month || currentMonth);
    setEditYear(slip.year || currentYear);
    setEditAmount(slip.amount ? String(slip.amount) : '');
    setEditNotes(slip.notes || '');
    setEditFileUrl(slip.file_url || '');
    setEditFileName(slip.file_url ? slip.file_url.split('/').pop() || 'Existing File' : '');
  };

  const handleSaveEditPayslip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlip) return;

    try {
      setIsUpdating(true);
      const payload = {
        employee_id: editingSlip.employee_id,
        month: editMonth,
        year: Number(editYear),
        pay_period: `${editMonth} ${editYear}`,
        amount: editAmount ? parseFloat(editAmount) : 0,
        notes: editNotes.trim(),
        file_url: editFileUrl,
      };

      await api.put(`/api/v1/hr/payslips/${editingSlip.id}`, payload);
      success('Pay slip updated successfully.');
      setEditingSlip(null);
      fetchPayslips();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to update payslip.';
      toastError(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetSlip) return;
    try {
      setIsDeletingSlip(true);
      await api.delete(`/api/v1/hr/payslips/${deleteTargetSlip.id}`);
      success('Pay slip deleted successfully.');
      setPayslips(payslips.filter((p) => p.id !== deleteTargetSlip.id));
      setDeleteTargetSlip(null);
    } catch (err: any) {
      toastError('Failed to delete payslip.');
    } finally {
      setIsDeletingSlip(false);
    }
  };

  const branchEmployees = employees.filter(
    (e) => (e.branch_code || '').toUpperCase() === selectedBranch.toUpperCase()
  );

  const filteredPayslips = payslips.filter((slip) => {
    // 1. Month Filter
    if (filterMonth !== 'ALL') {
      const m = (slip.month || '').trim().toLowerCase();
      if (m !== filterMonth.toLowerCase()) return false;
    }

    // 2. Year Filter
    if (filterYear !== 'ALL') {
      if (String(slip.year) !== String(filterYear)) return false;
    }

    // 3. Employee Filter
    if (filterEmployeeId !== 'ALL') {
      if (slip.employee_id !== Number(filterEmployeeId)) return false;
    }

    // 4. Search Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        slip.employee_name?.toLowerCase().includes(q) ||
        slip.employee_code?.toLowerCase().includes(q) ||
        slip.pay_period?.toLowerCase().includes(q) ||
        slip.branch_name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 sm:p-8 shadow-[0_4px_18px_rgba(40,35,25,0.045)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#E8F4EE] border border-[#C5E3D5] text-[#21845F] flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5" />
              <span>Payroll Management</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1D1D1B] tracking-tight">
            Add & Manage Pay Slips
          </h1>
          <p className="text-xs sm:text-sm text-[#5E5A52] font-medium mt-1">
            Issue monthly salary slips for individual employees across showrooms. Employees can view and download their slips instantly.
          </p>
        </div>

        <button
          onClick={fetchPayslips}
          className="p-2.5 rounded-xl bg-white border border-[#E4DFD4] hover:bg-[#FAF8F3] text-[#536B8A] transition-colors self-start md:self-auto cursor-pointer"
          title="Refresh List"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 2-Column Layout: Left = Add Pay Slip Form; Right = Summary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORM: Issue New Pay Slip (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-[#E4DFD4] rounded-3xl p-6 sm:p-7 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#F0ECE1] mb-5">
            <div className="w-8 h-8 rounded-xl bg-[#21845F]/10 border border-[#A7F3D0] text-[#21845F] flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1D1D1B]">Issue Pay Slip to Employee</h2>
              <p className="text-xs text-[#6B6559]">Select employee, period, net amount, and upload document</p>
            </div>
          </div>

          <form onSubmit={handleSubmitPayslip} className="space-y-4">
            {/* Branch Selection */}
            <div>
              <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1">
                1. Select Showroom Branch *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['YELAHANKA', 'KOLAR', 'UDUPI'].map((bCode) => (
                  <button
                    key={bCode}
                    type="button"
                    onClick={() => handleBranchChange(bCode)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      selectedBranch === bCode
                        ? 'bg-[#18181B] text-white border-[#18181B] shadow-2xs'
                        : 'bg-[#FAF8F3] hover:bg-[#F2EDE4] text-[#5E5A52] border-[#E4DFD4]'
                    }`}
                  >
                    {bCode === 'YELAHANKA' ? 'Yelahanka' : bCode === 'KOLAR' ? 'Kolar' : 'Udupi'}
                  </button>
                ))}
              </div>
            </div>

            {/* Employee Selection */}
            <div>
              <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1">
                2. Select Employee ({branchEmployees.length} Available in {selectedBranch}) *
              </label>
              <select
                required
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs font-bold text-[#1D1D1B] focus:outline-none focus:border-[#21845F] focus:bg-white"
              >
                {branchEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.employee_code}) — {emp.designation || 'Sales Staff'}
                  </option>
                ))}
              </select>
            </div>

            {/* Pay Period: Month & Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1">
                  Pay Month *
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs font-semibold text-[#1D1D1B] focus:outline-none focus:border-[#21845F] focus:bg-white"
                >
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1">
                  Pay Year *
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  min={2020}
                  max={2030}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs font-mono font-bold text-[#1D1D1B] focus:outline-none focus:border-[#21845F] focus:bg-white"
                />
              </div>
            </div>

            {/* Net Amount & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1">
                  Net Salary Amount (₹)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 25000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs font-mono font-bold text-[#21845F] focus:outline-none focus:border-[#21845F] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1">
                  Salary Notes / Remarks (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Performance Incentive Included"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs text-[#1D1D1B] focus:outline-none focus:border-[#21845F] focus:bg-white"
                />
              </div>
            </div>

            {/* Document / Image Upload */}
            <div>
              <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1">
                Upload Payslip Document (Image or PDF up to 10MB) *
              </label>

              {fileUrl ? (
                <div className="p-3.5 rounded-2xl bg-[#E8F4EE] border border-[#C5E3D5] flex items-center justify-between">
                  <div className="flex items-center gap-2.5 truncate">
                    <CheckCircle2 className="w-5 h-5 text-[#21845F] shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-bold text-[#166534] truncate">{fileName || 'Payslip Document'}</p>
                      <p className="text-[10px] text-[#21845F] font-mono">Ready for dispatch</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewUrl(fileUrl)}
                      className="px-2.5 py-1 rounded-lg bg-white text-[#21845F] text-xs font-bold border border-[#A7F3D0] hover:bg-[#FAF8F3] cursor-pointer"
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFileUrl('');
                        setFileName('');
                      }}
                      className="text-xs text-red-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative border-2 border-dashed border-[#D5CFC4] hover:border-[#21845F] rounded-2xl p-6 text-center bg-[#FAF8F3] transition-colors">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                  <div className="flex flex-col items-center gap-2 pointer-events-none">
                    <div className="w-10 h-10 rounded-2xl bg-white border border-[#E4DFD4] text-[#21845F] flex items-center justify-center shadow-2xs">
                      {isUploading ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1D1D1B]">
                        {isUploading ? 'Uploading document...' : 'Click or Drag & Drop Payslip to Upload'}
                      </p>
                      <p className="text-[10px] text-[#8A8479] mt-0.5">
                        Accepts PNG, JPG, WebP images or PDF documents up to 10MB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting || !fileUrl || isUploading}
                className="w-full py-3 rounded-xl bg-[#21845F] hover:bg-[#1A6B4C] text-white text-xs font-extrabold shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all hover:scale-[1.01]"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Issuing Pay Slip...</span>
                  </>
                ) : (
                  <>
                    <Receipt className="w-4 h-4" />
                    <span>Issue Pay Slip to {employees.find((e) => e.id === selectedEmployeeId)?.full_name || 'Staff'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* SUMMARY / QUICK TIPS (1 Col) */}
        <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-[#1D1D1B]">Payslip Instructions</h3>
            </div>
            <ul className="space-y-2.5 text-xs text-[#5E5A52] leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#21845F] mt-1.5 shrink-0" />
                <span>Uploaded payslips are immediately available to that employee in their dashboard under the <strong>Pay Slips</strong> tab.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] mt-1.5 shrink-0" />
                <span>Employees can preview the full-resolution image and click <strong>Download Slip</strong> for their records.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] mt-1.5 shrink-0" />
                <span>You can delete or reissue a payslip at any time from the table below.</span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs">
            <span className="text-[10px] uppercase font-bold text-[#8A8479] block">Total Slips Issued</span>
            <div className="text-2xl font-black font-mono text-[#1D1D1B] mt-0.5">{payslips.length}</div>
            <p className="text-[11px] text-[#6B6559] mt-1">Across all showroom branches</p>
          </div>
        </div>
      </div>

      {/* ISSUED PAY SLIPS TABLE */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl overflow-hidden shadow-[0_4px_18px_rgba(40,35,25,0.045)] space-y-3">
        <div className="p-6 border-b border-[#EBE6DC] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-[#1D1D1B]">Issued Pay Slips Directory</h2>
            <p className="text-xs text-[#6B6559]">History of employee salary slips by month and showroom</p>
          </div>

          {/* DEDICATED FILTERS: Month Filter, Year Filter & Employee Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter 1: Month Filter */}
            <div className="relative min-w-[140px]">
              <Calendar className="w-3.5 h-3.5 text-[#21845F] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs font-bold bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-[#1D1D1B] focus:outline-none focus:border-[#21845F] focus:bg-white cursor-pointer"
                title="Filter by Month"
              >
                <option value="ALL">All Months</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 2: Year Filter */}
            <div className="relative min-w-[120px]">
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-[#1D1D1B] focus:outline-none focus:border-[#21845F] focus:bg-white cursor-pointer"
                title="Filter by Year"
              >
                <option value="ALL">All Years</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 3: Employee Filter */}
            <div className="relative min-w-[190px]">
              <User className="w-3.5 h-3.5 text-[#536B8A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={filterEmployeeId}
                onChange={(e) => setFilterEmployeeId(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs font-bold bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-[#1D1D1B] focus:outline-none focus:border-[#21845F] focus:bg-white cursor-pointer"
                title="Employee Filter"
              >
                <option value="ALL">All Employees ({employees.length})</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    👤 {emp.full_name} ({emp.employee_code || emp.branch_code || 'Staff'})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 text-[#8A8479] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, code..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl focus:outline-none focus:border-[#21845F] focus:bg-white"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F3] border-b border-[#EBE6DC] text-[#6B6559] uppercase font-bold text-[10px] tracking-wider">
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Branch</th>
                <th className="px-5 py-3.5">Pay Period</th>
                <th className="px-5 py-3.5">Net Salary (₹)</th>
                <th className="px-5 py-3.5">Issued Date</th>
                <th className="px-5 py-3.5">Document</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE1]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-[#8A8479]">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#21845F]" />
                    <span className="block mt-2 font-semibold">Loading payslips...</span>
                  </td>
                </tr>
              ) : filteredPayslips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-[#8A8479]">
                    <p className="font-bold text-sm text-[#1D1D1B]">No payslips match current filters.</p>
                    <p className="text-xs mt-1">Try resetting the date or employee filter above.</p>
                  </td>
                </tr>
              ) : (
                filteredPayslips.map((slip) => (
                  <tr key={slip.id} className="hover:bg-[#FAF9F5] transition-colors">
                    {/* Employee */}
                    <td className="px-5 py-3.5">
                      <div className="font-extrabold text-[#1D1D1B] text-sm">{slip.employee_name}</div>
                      <div className="text-[11px] font-mono text-[#536B8A]">{slip.employee_code}</div>
                    </td>

                    {/* Branch */}
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF8F3] border border-[#E4DFD4] text-[#536B8A]">
                        {slip.branch_name || 'Showroom'}
                      </span>
                    </td>

                    {/* Period */}
                    <td className="px-5 py-3.5 font-bold text-[#1D1D1B]">
                      <span className="px-2.5 py-1 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8]">
                        {slip.pay_period}
                      </span>
                    </td>

                    {/* Net Amount */}
                    <td className="px-5 py-3.5 font-mono font-bold text-[#21845F] text-sm">
                      {slip.amount > 0 ? `₹${slip.amount.toLocaleString('en-IN')}` : '—'}
                    </td>

                    {/* Issued Date */}
                    <td className="px-5 py-3.5 text-[#5E5A52] font-mono">
                      {slip.issued_date || '—'}
                    </td>

                    {/* Document link */}
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => setPreviewUrl(slip.file_url)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF8F3] hover:bg-[#F2EDE4] text-[#536B8A] font-bold border border-[#E4DFD4] transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(slip)}
                          className="p-1.5 text-[#536B8A] hover:text-[#21845F] hover:bg-[#E8F4EE] rounded-lg transition-colors cursor-pointer"
                          title="Edit Payslip Data"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            triggerFileDownload(
                              slip.file_url,
                              `Payslip_${slip.employee_code || slip.employee_name}_${slip.month}_${slip.year}`
                            )
                          }
                          className="p-1.5 text-[#536B8A] hover:text-[#1D1D1B] hover:bg-[#FAF8F3] rounded-lg transition-colors cursor-pointer"
                          title="Download Document"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetSlip(slip)}
                          className="p-1.5 text-[#8A8479] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Payslip"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT PAYSLIP MODAL */}
      {editingSlip && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setEditingSlip(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E4DFD4]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-[#FAF8F3] border-b border-[#EBE6DC] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-[#1D1D1B]">Edit Pay Slip Record</h3>
                <p className="text-xs text-[#6B6559]">
                  {editingSlip.employee_name} ({editingSlip.employee_code || 'Staff'})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSlip(null)}
                className="w-8 h-8 rounded-xl bg-white border border-[#E4DFD4] text-[#6B6559] hover:bg-[#F2EDE4] font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditPayslip} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1.5">
                    Month *
                  </label>
                  <select
                    value={editMonth}
                    onChange={(e) => setEditMonth(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-[#1D1D1B] focus:outline-none focus:border-[#21845F] focus:bg-white"
                  >
                    {months.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1.5">
                    Year *
                  </label>
                  <select
                    value={editYear}
                    onChange={(e) => setEditYear(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-bold bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-[#1D1D1B] focus:outline-none focus:border-[#21845F] focus:bg-white"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1.5">
                  Net Salary (₹)
                </label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="e.g. 28500"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs font-mono font-bold text-[#1D1D1B] focus:outline-none focus:border-[#21845F] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1.5">
                  HR Notes
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Optional notes or bonus memo"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs text-[#1D1D1B] focus:outline-none focus:border-[#21845F] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1.5">
                  Replace Document / Image (Optional)
                </label>
                <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-[#C5E3D5] bg-[#E8F4EE]/50 hover:bg-[#E8F4EE] text-[#21845F] text-xs font-bold cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>{isEditUploading ? 'Uploading file...' : editFileName ? `Selected: ${editFileName}` : 'Upload New Image or PDF (Up to 10MB)'}</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleEditFileUpload}
                    className="hidden"
                    disabled={isEditUploading}
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EBE6DC]">
                <button
                  type="button"
                  onClick={() => setEditingSlip(null)}
                  className="px-4 py-2 text-xs font-bold text-[#5E5A52] hover:bg-[#FAF8F3] rounded-xl border border-[#E4DFD4] cursor-pointer"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || isEditUploading}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#21845F] hover:bg-[#1A6B4C] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {isUpdating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation In-App Dialog (No native localhost popups) */}
      <ConfirmDialog
        isOpen={!!deleteTargetSlip}
        title="Delete Payslip Record"
        message={`Are you sure you want to delete the pay slip for "${deleteTargetSlip?.employee_name}" (${deleteTargetSlip?.pay_period})? It will be permanently removed and no longer visible in the employee's portal.`}
        confirmText="Delete Payslip"
        variant="danger"
        isLoading={isDeletingSlip}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTargetSlip(null)}
      />

      {/* Lightbox / Document Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-[#FAF8F3] border-b border-[#EBE6DC] flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#1D1D1B]">Payslip Document Preview</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => triggerFileDownload(previewUrl, 'payslip_document')}
                  className="px-3 py-1.5 rounded-xl bg-[#21845F] hover:bg-[#1A6B4C] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewUrl(null)}
                  className="w-8 h-8 rounded-xl bg-white border border-[#E4DFD4] text-[#6B6559] hover:bg-[#F2EDE4] font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-[#18181B]">
              {previewUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe src={getMediaUrl(previewUrl)} className="w-full h-[70vh] rounded-xl" title="Payslip PDF" />
              ) : (
                <img src={getMediaUrl(previewUrl)} alt="Payslip Preview" className="max-h-[75vh] object-contain rounded-xl shadow-lg" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

