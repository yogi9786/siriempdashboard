import React, { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  Calendar,
  Phone,
  User,
  Heart,
  Cake,
  IndianRupee,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  Star,
  MessageSquareHeart,
  RotateCcw,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { CustomerActivity, Employee, CustomerDetailItem } from '../../types';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { CustomerActivityModal } from '../../components/customers/CustomerActivityModal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { parseCustomerBreakdown } from '../../utils/customerUtils';
import { SCHEMES } from '../../constants/schemes';
import api from '../../api/client';

export interface FlattenedCustomerRow {
  rowKey: string;
  activityId: number;
  activityDate: string;
  branchId: number;
  branchName: string;
  // Employee details
  employeeId: number;
  employeeName: string;
  employeeCode?: string;
  // Customer details
  sequenceNumber: number;
  customerName: string;
  phone: string;
  dob: string;
  anniversary: string;
  status: string;
  productValue: number | string;
  // Scheme details
  hasScheme: boolean;
  schemeName: string;
  schemeAmount: number | string;
  // Google Review
  hasGoogleReview: boolean;
  googleReviewRating: number;
  googleReviewText: string;
  // Direct Feedback
  hasCustomerFeedback: boolean;
  feedbackRating: number;
  feedbackText: string;
  // Notes
  notes: string;
  parentActivity: CustomerActivity;
}

export const ShowroomCustomerLogPage: React.FC = () => {
  const { selectedBranch } = useAuth();
  const { success, error: toastError } = useToast();

  const [activities, setActivities] = useState<CustomerActivity[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedEmpFilter, setSelectedEmpFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedSchemeFilter, setSelectedSchemeFilter] = useState<string>('all');
  const [reviewFilter, setReviewFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Modals & Actions
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingActivity, setEditingActivity] = useState<CustomerActivity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerActivity | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {};
      if (dateFilter && dateFilter !== 'all' && dateFilter !== 'custom') {
        params.date_filter = dateFilter;
      }
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;

      const [actRes, empRes] = await Promise.all([
        api.get<CustomerActivity[]>('/api/v1/customers', { params }),
        api.get<Employee[]>('/api/v1/employees'),
      ]);
      setActivities(actRes.data || []);
      setEmployees(empRes.data || []);
    } catch (err) {
      console.error('Failed to load showroom customer log:', err);
      toastError('Failed to fetch customer activities.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateFilter, fromDate, toDate]);

  // Flatten every individual customer entry from customer activities
  const allCustomerRows: FlattenedCustomerRow[] = useMemo(() => {
    const rows: FlattenedCustomerRow[] = [];
    activities.forEach((act) => {
      const items = parseCustomerBreakdown(
        act.breakdown,
        act.customers_count || 1,
        act.status,
        act.customer_name,
        act.phone_number
      );

      items.forEach((item, idx) => {
        const cName = item.name.trim() || act.customer_name || `Customer #${item.id || idx + 1}`;
        const cPhone = item.phone.trim() || (idx === 0 ? act.phone_number || '' : '');
        const cDob = item.dob || '';
        const cAnniv = item.anniversary || '';
        const cStatus = item.status || act.status || 'Walkin';
        const cVal = item.product_value !== '' && item.product_value !== undefined ? item.product_value : (idx === 0 && act.product_value ? act.product_value : '');
        const cScheme = item.has_scheme || Boolean(item.scheme_name);
        const cSchemeName = item.scheme_name || (cScheme ? SCHEMES[0] : '');
        const cSchemeAmt = item.scheme_amount || '';
        const cReview = item.has_google_review || Boolean(item.google_review_text);
        const cReviewRating = item.google_review_rating || 5;
        const cReviewText = item.google_review_text || '';
        const cFeedback = item.has_customer_feedback || Boolean(item.feedback_text);
        const cFeedbackRating = item.feedback_rating || 5;
        const cFeedbackText = item.feedback_text || '';
        const cNotes = item.notes || (idx === 0 ? act.notes || '' : '');

        rows.push({
          rowKey: `${act.id}_${item.id || idx + 1}`,
          activityId: act.id,
          activityDate: act.activity_date,
          branchId: act.branch_id,
          branchName: act.branch_name || selectedBranch?.name || 'Showroom',
          employeeId: act.employee_id,
          employeeName: act.employee_name || 'Staff Representative',
          employeeCode: act.employee_code || (employees.find((e) => e.id === act.employee_id)?.employee_code || ''),
          sequenceNumber: idx + 1,
          customerName: cName,
          phone: cPhone,
          dob: cDob,
          anniversary: cAnniv,
          status: cStatus,
          productValue: cVal,
          hasScheme: cScheme,
          schemeName: cSchemeName,
          schemeAmount: cSchemeAmt,
          hasGoogleReview: cReview,
          googleReviewRating: cReviewRating,
          googleReviewText: cReviewText,
          hasCustomerFeedback: cFeedback,
          feedbackRating: cFeedbackRating,
          feedbackText: cFeedbackText,
          notes: cNotes,
          parentActivity: act,
        });
      });
    });
    return rows;
  }, [activities, employees, selectedBranch]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return allCustomerRows.filter((r) => {
      // 1. Employee
      if (selectedEmpFilter !== 'all' && r.employeeId.toString() !== selectedEmpFilter) {
        return false;
      }

      // 2. Status
      if (selectedStatusFilter !== 'all' && r.status.toLowerCase() !== selectedStatusFilter.toLowerCase()) {
        return false;
      }

      // 3. Scheme
      if (selectedSchemeFilter !== 'all') {
        if (selectedSchemeFilter === 'has_scheme') {
          if (!r.hasScheme) return false;
        } else if (selectedSchemeFilter === 'no_scheme') {
          if (r.hasScheme) return false;
        } else {
          if (!r.hasScheme || r.schemeName !== selectedSchemeFilter) return false;
        }
      }

      // 4. Google Review
      if (reviewFilter === 'reviewed' && !r.hasGoogleReview) return false;
      if (reviewFilter === '5stars' && (!r.hasGoogleReview || r.googleReviewRating !== 5)) return false;

      // 5. Text Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = r.customerName.toLowerCase().includes(q);
        const matchesPhone = r.phone.toLowerCase().includes(q);
        const matchesNotes = r.notes.toLowerCase().includes(q);
        const matchesEmp = r.employeeName.toLowerCase().includes(q) || (r.employeeCode && r.employeeCode.toLowerCase().includes(q));
        const matchesScheme = r.schemeName.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesNotes && !matchesEmp && !matchesScheme) {
          return false;
        }
      }

      return true;
    });
  }, [allCustomerRows, selectedEmpFilter, selectedStatusFilter, selectedSchemeFilter, reviewFilter, searchTerm]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalCustomers = allCustomerRows.length;
    const convertedCount = allCustomerRows.filter((r) => r.status.toLowerCase().includes('converted') || r.status.toLowerCase().includes('billing')).length;
    const schemesList = allCustomerRows.filter((r) => r.hasScheme);
    const schemesCount = schemesList.length;
    const schemesValue = schemesList.reduce((acc, r) => acc + (Number(r.schemeAmount) || 0), 0);
    const googleReviewsCount = allCustomerRows.filter((r) => r.hasGoogleReview).length;
    const conversionRate = totalCustomers > 0 ? Math.round((convertedCount / totalCustomers) * 100) : 0;

    return {
      totalCustomers,
      convertedCount,
      conversionRate,
      schemesCount,
      schemesValue,
      googleReviewsCount,
    };
  }, [allCustomerRows]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredRows.length === 0) {
      toastError('No customer records to export.');
      return;
    }

    const headers = [
      'Customer Name',
      'Phone Number',
      'Date of Birth (DOB)',
      'Wedding Anniversary',
      'Status / Outcome',
      'Product Value (INR)',
      'Scheme Enrolled?',
      'Scheme Plan Name',
      'Scheme Amount (INR)',
      'Google Review Given?',
      'Google Review Rating',
      'Google Review Text',
      'Customer Feedback Rating',
      'Customer Feedback Notes',
      'Customer Notes',
      'Assigned Employee Name',
      'Employee Code',
      'Showroom Branch',
      'Activity Date',
    ];

    const csvRows: string[][] = [headers];

    filteredRows.forEach((r) => {
      csvRows.push([
        `"${r.customerName.replace(/"/g, '""')}"`,
        `"${r.phone.replace(/"/g, '""')}"`,
        r.dob || '',
        r.anniversary || '',
        `"${r.status}"`,
        r.productValue ? r.productValue.toString() : '',
        r.hasScheme ? 'Yes' : 'No',
        r.hasScheme ? `"${r.schemeName}"` : '',
        r.schemeAmount ? r.schemeAmount.toString() : '',
        r.hasGoogleReview ? 'Yes' : 'No',
        r.hasGoogleReview ? r.googleReviewRating.toString() : '',
        r.hasGoogleReview ? `"${r.googleReviewText.replace(/"/g, '""')}"` : '',
        r.hasCustomerFeedback ? r.feedbackRating.toString() : '',
        r.hasCustomerFeedback ? `"${r.feedbackText.replace(/"/g, '""')}"` : '',
        `"${r.notes.replace(/"/g, '""')}"`,
        `"${r.employeeName.replace(/"/g, '""')}"`,
        r.employeeCode || '',
        `"${r.branchName}"`,
        r.activityDate,
      ]);
    });

    const csvContent = csvRows.map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Showroom_Customer_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    success(`Exported ${filteredRows.length} customer records to CSV!`);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedEmpFilter('all');
    setSelectedStatusFilter('all');
    setSelectedSchemeFilter('all');
    setReviewFilter('all');
    setDateFilter('all');
    setFromDate('');
    setToDate('');
  };

  const handleDeleteActivity = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await api.delete(`/api/v1/customers/${deleteTarget.id}`);
      success('Customer activity record deleted.');
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to delete activity.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E8E6E1] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#0369A1] bg-[#E0F2FE] px-2.5 py-0.5 rounded-full border border-[#BAE6FD]">
              Showroom Engagement Ledger
            </span>
            <span className="text-xs font-semibold text-[#8A8479]">
              {selectedBranch?.name || 'Showroom'}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1D1D1B] tracking-tight mt-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#0284C7]" />
            <span>Showroom Customer Log & Staff Assignments</span>
          </h1>
          <p className="text-xs text-[#8A8479] font-medium mt-0.5">
            Full ledger of every customer updated in customer logs, assigned salesperson details in every row, savings schemes, and Google reviews.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 cursor-pointer shadow-2xs border-[#E4DFD4] text-[#1D1D1B] hover:bg-[#FAF8F3]"
          >
            <Download className="w-4 h-4 text-[#0284C7]" />
            <span>Export Customer CSV ({filteredRows.length})</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 cursor-pointer shadow-xs bg-[#0284C7] hover:bg-[#0369A1]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Log Customer Interaction</span>
          </Button>
        </div>
      </div>

      {/* 2. Top 4 Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E8E6E1] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#8A8479] uppercase tracking-wider block">
              Total Customers Logged
            </span>
            <div className="text-2xl font-black text-[#1D1D1B] mt-1">{stats.totalCustomers}</div>
            <span className="text-[11px] font-semibold text-[#0369A1]">Across Showroom Visits</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7]">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E8E6E1] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#8A8479] uppercase tracking-wider block">
              Converted Customers
            </span>
            <div className="text-2xl font-black text-[#21845F] mt-1">{stats.convertedCount}</div>
            <span className="text-[11px] font-semibold text-[#21845F]">
              {stats.conversionRate}% Conversion Rate
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#E8F4EE] border border-[#C5E3D5] flex items-center justify-center text-[#21845F]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E8E6E1] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#8A8479] uppercase tracking-wider block">
              Gold Schemes Closed
            </span>
            <div className="text-2xl font-black text-[#7E22CE] mt-1">{stats.schemesCount}</div>
            <span className="text-[11px] font-semibold text-[#7E22CE]">
              ₹{stats.schemesValue.toLocaleString('en-IN')} Total Booking
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#F3E8FF] border border-[#D8B4FE] flex items-center justify-center text-[#7E22CE]">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E8E6E1] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#8A8479] uppercase tracking-wider block">
              Google 5-Star Reviews
            </span>
            <div className="text-2xl font-black text-[#D97706] mt-1">{stats.googleReviewsCount}</div>
            <span className="text-[11px] font-semibold text-[#D97706]">Ratings & Feedback Logged</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#D97706]">
            <Star className="w-6 h-6 fill-current" />
          </div>
        </div>
      </div>

      {/* 3. Comprehensive Filter Toolbar */}
      <div className="p-4 bg-white border border-[#E4DFD4] rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          {/* Live Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#8A8479] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer name, phone, notes, scheme, or staff name..."
              className="w-full pl-10 pr-4 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs text-[#1D1D1B] placeholder-[#8A8479] focus:outline-none focus:border-[#0284C7]"
            />
          </div>

          {/* Assigned Staff Filter */}
          <div className="flex items-center gap-1.5 w-full lg:w-auto">
            <select
              value={selectedEmpFilter}
              onChange={(e) => setSelectedEmpFilter(e.target.value)}
              className="w-full lg:w-48 px-3 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-bold text-[#1D1D1B] focus:outline-none cursor-pointer"
            >
              <option value="all">All Sales Staff ({employees.length})</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id.toString()}>
                  {emp.full_name} {emp.employee_code ? `(#${emp.employee_code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Status Filter */}
          <div className="flex items-center gap-1.5 w-full lg:w-auto">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full lg:w-36 px-3 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-bold text-[#1D1D1B] focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Walkin">Walk-in</option>
              <option value="Interested">Interested</option>
              <option value="Converted">Converted</option>
              <option value="Billed">Billed</option>
              <option value="Follow-up">Follow-up</option>
            </select>
          </div>

          {/* Scheme Filter (The 3 schemes) */}
          <div className="flex items-center gap-1.5 w-full lg:w-auto">
            <select
              value={selectedSchemeFilter}
              onChange={(e) => setSelectedSchemeFilter(e.target.value)}
              className="w-full lg:w-56 px-3 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-bold text-[#7E22CE] focus:outline-none cursor-pointer"
            >
              <option value="all">All Schemes / Any</option>
              <option value="has_scheme">✨ Any Scheme Closed</option>
              {SCHEMES.map((sch) => (
                <option key={sch} value={sch}>
                  {sch}
                </option>
              ))}
              <option value="no_scheme">No Scheme</option>
            </select>
          </div>
        </div>

        {/* Date Filter & Clear row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#F2EEE9]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-[#8A8479]">Date Period:</span>
            {['all', 'today', 'yesterday', 'this_week', 'this_month'].map((df) => (
              <button
                key={df}
                onClick={() => {
                  setDateFilter(df);
                  setFromDate('');
                  setToDate('');
                }}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                  dateFilter === df && !fromDate
                    ? 'bg-[#0284C7] border-[#0284C7] text-white shadow-2xs'
                    : 'bg-[#FAF8F3] border-[#E4DFD4] text-[#5E5A52] hover:bg-white'
                }`}
              >
                {df === 'all'
                  ? 'All Time'
                  : df === 'today'
                  ? 'Today'
                  : df === 'yesterday'
                  ? 'Yesterday'
                  : df === 'this_week'
                  ? 'This Week'
                  : 'This Month'}
              </button>
            ))}

            {/* Custom Range */}
            <div className="flex items-center gap-1 ml-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setDateFilter('custom');
                }}
                className="px-2 py-1 text-xs bg-[#FAF8F3] border border-[#E4DFD4] rounded-lg font-medium text-[#1D1D1B]"
                placeholder="From"
              />
              <span className="text-xs text-[#8A8479]">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setDateFilter('custom');
                }}
                className="px-2 py-1 text-xs bg-[#FAF8F3] border border-[#E4DFD4] rounded-lg font-medium text-[#1D1D1B]"
                placeholder="To"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8A8479] font-medium">
              Showing <b className="text-[#1D1D1B]">{filteredRows.length}</b> customer entries
            </span>
            {(searchTerm || selectedEmpFilter !== 'all' || selectedStatusFilter !== 'all' || selectedSchemeFilter !== 'all' || reviewFilter !== 'all' || dateFilter !== 'all' || fromDate) && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-[#C24141] hover:underline flex items-center gap-1 cursor-pointer ml-2"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Customer Rows Table */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl shadow-[0_4px_18px_rgba(40,35,25,0.045)] overflow-hidden">
        {isLoading ? (
          <div className="p-12">
            <LoadingSpinner message="Loading customer log records..." />
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No customer log records found"
              description="No customers matched your selected filters or search terms."
              actionText="+ Log New Interaction"
              onAction={() => setShowAddModal(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Customer Contact & Dates</th>
                  <th className="px-4 py-3.5">Attending Salesperson</th>
                  <th className="px-4 py-3.5">Showroom Outcome / Value</th>
                  <th className="px-4 py-3.5">Enrolled Jewellery Scheme</th>
                  <th className="px-4 py-3.5">Google Review / Feedback</th>
                  <th className="px-4 py-3.5">Interaction Notes</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE6DC] font-medium text-[#1D1D1B]">
                {filteredRows.map((row) => (
                  <tr key={row.rowKey} className="hover:bg-[#FAF9F6] transition-colors group">
                    {/* 1. Customer Details */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-extrabold text-[#1D1D1B] text-sm flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-full bg-[#E0F2FE] text-[#0284C7] font-bold text-xs flex items-center justify-center shrink-0">
                          {row.sequenceNumber}
                        </span>
                        <span>{row.customerName}</span>
                      </div>

                      {/* Phone */}
                      {row.phone ? (
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-[#0284C7] font-semibold">
                          <Phone className="w-3 h-3 text-[#0284C7]" />
                          <span>{row.phone}</span>
                          <a
                            href={`https://wa.me/91${row.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Chat on WhatsApp"
                            className="text-[#25D366] hover:opacity-80 p-0.5 rounded"
                          >
                            💬
                          </a>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#A1A1AA] italic">No phone provided</span>
                      )}

                      {/* Birthday & Anniversary Pills */}
                      {(row.dob || row.anniversary) && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                          {row.dob && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#FAF1EC] border border-[#ECCFC0] text-[#B97855] text-[10px] font-bold">
                              <Cake className="w-2.5 h-2.5" />
                              <span>DOB: {row.dob}</span>
                            </span>
                          )}
                          {row.anniversary && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#FCE7F3] border border-[#FBCFE8] text-[#BE185D] text-[10px] font-bold">
                              <Heart className="w-2.5 h-2.5 fill-current" />
                              <span>Anniv: {row.anniversary}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* 2. Attending Salesperson / Employee */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-[#0284C7] font-bold text-xs flex items-center justify-center shrink-0">
                          {row.employeeName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-[#1D1D1B] block">{row.employeeName}</span>
                          <div className="flex items-center gap-1.5 text-[10px] text-[#8A8479]">
                            {row.employeeCode && (
                              <span className="font-mono font-bold bg-[#F2EEE9] px-1 rounded text-[#5E5A52]">
                                #{row.employeeCode}
                              </span>
                            )}
                            <span>•</span>
                            <span className="truncate max-w-[120px]">{row.branchName}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-[#8A8479] mt-1.5 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-[#A1A1AA]" />
                        <span>Date: {row.activityDate}</span>
                      </div>
                    </td>

                    {/* 3. Outcome & Product Value */}
                    <td className="px-4 py-3.5 align-top">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          row.status.toLowerCase().includes('converted') || row.status.toLowerCase().includes('billing')
                            ? 'bg-[#E8F4EE] border-[#C5E3D5] text-[#21845F]'
                            : row.status.toLowerCase().includes('interested')
                            ? 'bg-[#E0F2FE] border-[#BAE6FD] text-[#0284C7]'
                            : 'bg-[#F2EEE9] border-[#E4DFD4] text-[#5E5A52]'
                        }`}
                      >
                        {row.status}
                      </span>
                      {row.productValue ? (
                        <div className="mt-1 font-bold text-sm text-[#1D1D1B] flex items-center gap-0.5">
                          <span className="text-xs text-[#8A8479]">₹</span>
                          <span>{Number(row.productValue).toLocaleString('en-IN')}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#8A8479] block mt-1">No ticket value</span>
                      )}
                    </td>

                    {/* 4. Enrolled Jewellery Scheme */}
                    <td className="px-4 py-3.5 align-top">
                      {row.hasScheme ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] font-bold text-[10px]">
                            <Award className="w-3 h-3 text-[#D97706]" />
                            <span>{row.schemeName}</span>
                          </span>
                          {row.schemeAmount && (
                            <div className="text-xs font-bold text-[#7E22CE] pl-0.5 font-mono">
                              ₹{Number(row.schemeAmount).toLocaleString('en-IN')} / mo
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#A1A1AA] italic">—</span>
                      )}
                    </td>

                    {/* 5. Google Review / Feedback */}
                    <td className="px-4 py-3.5 align-top max-w-[200px]">
                      {row.hasGoogleReview ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-[#D97706] font-bold text-[11px]">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{row.googleReviewRating} Star Review</span>
                          </div>
                          {row.googleReviewText && (
                            <p className="text-[11px] text-[#5E5A52] italic truncate" title={row.googleReviewText}>
                              "{row.googleReviewText}"
                            </p>
                          )}
                        </div>
                      ) : row.hasCustomerFeedback ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-[#0284C7] font-bold text-[11px]">
                            <MessageSquareHeart className="w-3.5 h-3.5" />
                            <span>Direct Rating: {row.feedbackRating}/5</span>
                          </div>
                          {row.feedbackText && (
                            <p className="text-[11px] text-[#5E5A52] truncate" title={row.feedbackText}>
                              {row.feedbackText}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#A1A1AA] italic">None logged</span>
                      )}
                    </td>

                    {/* 6. Customer Notes */}
                    <td className="px-4 py-3.5 align-top max-w-[220px]">
                      <p className="text-xs text-[#5E5A52] line-clamp-2" title={row.notes}>
                        {row.notes || <span className="text-[#A1A1AA] italic">—</span>}
                      </p>
                    </td>

                    {/* 7. Row Actions */}
                    <td className="px-4 py-3.5 align-top text-right shrink-0">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingActivity(row.parentActivity)}
                          title="Edit Customer Log Activity"
                          className="p-1.5 text-[#8A8479] hover:text-[#0284C7] hover:bg-[#E0F2FE] rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(row.parentActivity)}
                          title="Delete Activity Record"
                          className="p-1.5 text-[#8A8479] hover:text-[#C24141] hover:bg-[#FEE2E2] rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Activity Modal for Adding / Editing */}
      <CustomerActivityModal
        isOpen={showAddModal || !!editingActivity}
        onClose={() => {
          setShowAddModal(false);
          setEditingActivity(null);
        }}
        onSaved={() => {
          setShowAddModal(false);
          setEditingActivity(null);
          fetchData();
        }}
        initialData={editingActivity}
        employeesList={employees}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Customer Log Activity"
        message={`Are you sure you want to delete the activity log for "${deleteTarget?.customer_name || 'Customer'}"? All breakdown entries under this activity will be removed.`}
        confirmText="Delete Record"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteActivity}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
