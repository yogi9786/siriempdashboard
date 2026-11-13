import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileSpreadsheet,
  Search,
  Building2,
  Calendar,
  Phone,
  User,
  Eye,
  RefreshCw,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Filter,
  RotateCcw,
  CheckSquare,
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { CustomerActivity } from '../../types';
import { CustomerActivityViewModal } from '../../components/customers/CustomerActivityViewModal';

export const HrCustomersPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { success, error: toastError } = useToast();

  const [activities, setActivities] = useState<CustomerActivity[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>(
    searchParams.get('branch')?.toUpperCase() || 'ALL'
  );
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Date Filters
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Employee Filter
  const [employeeFilter, setEmployeeFilter] = useState<string>('ALL');

  // Selection for CSV Export
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // View Modal
  const [viewingActivity, setViewingActivity] = useState<CustomerActivity | null>(null);

  // Sync with URL query parameter ?branch=
  useEffect(() => {
    const b = searchParams.get('branch')?.toUpperCase();
    if (b) {
      setBranchFilter(b);
    }
  }, [searchParams]);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/api/v1/hr/employees');
      setEmployees(res.data || []);
    } catch (err) {
      console.error('Failed to load employees for HR:', err);
    }
  };

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const params: any = { limit: 500 };
      if (branchFilter !== 'ALL') {
        params.branch_code = branchFilter;
      }
      if (statusFilter !== 'ALL') {
        params.status_filter = statusFilter;
      }
      if (dateFilter && dateFilter !== 'all' && dateFilter !== 'custom') {
        params.date_filter = dateFilter;
      }
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      if (search.trim()) {
        params.search = search.trim();
      }
      const res = await api.get('/api/v1/hr/customers', { params });
      setActivities(res.data || []);
    } catch (err: any) {
      console.error('Failed to load customers for HR:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [branchFilter, statusFilter, dateFilter, fromDate, toDate]);

  // Date helper
  const pad = (n: number) => String(n).padStart(2, '0');
  const toLocalDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const matchesDate = (actDate?: string) => {
    if (!actDate) return false;
    const rowDate = actDate.slice(0, 10);
    if (fromDate && rowDate < fromDate) return false;
    if (toDate && rowDate > toDate) return false;

    if (dateFilter === 'all') return true;

    const now = new Date();
    const todayStr = toLocalDateStr(now);

    if (dateFilter === 'today') {
      return rowDate === todayStr;
    } else if (dateFilter === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      return rowDate === toLocalDateStr(yest);
    } else if (dateFilter === 'this_week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = toLocalDateStr(weekAgo);
      return rowDate >= weekAgoStr && rowDate <= todayStr;
    } else if (dateFilter === 'this_month') {
      const monthStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      return rowDate >= monthStart && rowDate <= todayStr;
    }
    return true;
  };

  const filteredActivities = activities.filter((act) => {
    // 1. Date filter
    if (!matchesDate(act.activity_date)) return false;

    // 2. Employee filter
    if (employeeFilter !== 'ALL') {
      const empMatch =
        (act.employee_name || '').toLowerCase() === employeeFilter.toLowerCase() ||
        (act.employee_code || '').toLowerCase() === employeeFilter.toLowerCase();
      if (!empMatch) return false;
    }

    // 3. Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        act.customer_name?.toLowerCase().includes(q) ||
        act.phone_number?.includes(q) ||
        act.employee_name?.toLowerCase().includes(q) ||
        act.employee_code?.toLowerCase().includes(q) ||
        act.status?.toLowerCase().includes(q) ||
        act.notes?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Selection helpers
  const isAllSelected =
    filteredActivities.length > 0 &&
    filteredActivities.every((act) => selectedIds.has(act.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      const next = new Set<number>();
      filteredActivities.forEach((act) => next.add(act.id));
      setSelectedIds(next);
    }
  };

  const handleToggleRow = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    const rowsToExport =
      selectedIds.size > 0
        ? filteredActivities.filter((act) => selectedIds.has(act.id))
        : filteredActivities;

    if (rowsToExport.length === 0) {
      toastError('No customer records to export.');
      return;
    }

    const headers = [
      'Visit Date',
      'Branch',
      'Customer Name',
      'Contact Number',
      'Outcome / Status',
      'Product Value (INR)',
      'Attended Staff',
      'Staff Code',
      'Approval Status',
      'Notes',
    ];

    const csvRows = rowsToExport.map((act) => [
      act.activity_date || '',
      `"${act.branch_name || ''}"`,
      `"${act.customer_name || 'Walk-in Customer'}"`,
      act.phone_number || '',
      `"${act.status === 'Walkin' ? 'Window Shopping' : act.status || 'Window Shopping'}"`,
      act.product_value || 0,
      `"${act.employee_name || ''}"`,
      `"${act.employee_code || ''}"`,
      `"${act.approval_status || 'PENDING'}"`,
      `"${(act.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `HR_Customers_${branchFilter}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success(`Exported ${rowsToExport.length} customer records to CSV.`);
  };

  const handleResetFilters = () => {
    setBranchFilter('ALL');
    setStatusFilter('ALL');
    setDateFilter('all');
    setFromDate('');
    setToDate('');
    setEmployeeFilter('ALL');
    setSearch('');
    setSelectedIds(new Set());
  };

  const hasActiveFilters =
    branchFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    dateFilter !== 'all' ||
    Boolean(fromDate) ||
    Boolean(toDate) ||
    employeeFilter !== 'ALL' ||
    Boolean(search.trim());

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 sm:p-8 shadow-[0_4px_18px_rgba(40,35,25,0.045)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Showroom Customer Directory</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1D1D1B] tracking-tight">
            Customer Activity & Leads
          </h1>
          <p className="text-xs sm:text-sm text-[#5E5A52] font-medium mt-1">
            Complete showroom customer logs across all 3 branches: Yelahanka, Kolar, and Udupi.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-white border border-[#C5E3D5] hover:border-[#21845F] text-[#21845F] hover:bg-[#E8F4EE] text-xs font-bold shadow-2xs flex items-center gap-2 cursor-pointer transition-all"
            title="Export filtered or selected customer rows to CSV"
          >
            <Download className="w-4 h-4 text-[#21845F]" />
            <span>
              {selectedIds.size > 0
                ? `Export Selected (${selectedIds.size}) CSV`
                : `Export All (${filteredActivities.length}) CSV`}
            </span>
          </button>
          <button
            onClick={fetchActivities}
            className="p-2.5 rounded-xl bg-white border border-[#E4DFD4] hover:bg-[#FAF8F3] text-[#536B8A] transition-colors self-start md:self-auto cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Segregated Branches & Filters Bar */}
      <div className="bg-white border border-[#E4DFD4] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
        {/* Row 1: Branches and Status */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Branch Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-[#8A8479] uppercase tracking-wider px-1">
              Branches:
            </span>
            <button
              onClick={() => setBranchFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                branchFilter === 'ALL'
                  ? 'bg-[#18181B] text-white shadow-2xs'
                  : 'bg-[#FAF8F3] hover:bg-[#F2EDE4] text-[#5E5A52] border border-[#E4DFD4]'
              }`}
            >
              All Showrooms
            </button>
            <button
              onClick={() => setBranchFilter('YELAHANKA')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                branchFilter === 'YELAHANKA'
                  ? 'bg-[#D97706] text-white shadow-2xs'
                  : 'bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#92400E] border border-[#FDE68A]'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span>Yelahanka</span>
            </button>
            <button
              onClick={() => setBranchFilter('KOLAR')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                branchFilter === 'KOLAR'
                  ? 'bg-[#0284C7] text-white shadow-2xs'
                  : 'bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0369A1] border border-[#BAE6FD]'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span>Kolar</span>
            </button>
            <button
              onClick={() => setBranchFilter('UDUPI')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                branchFilter === 'UDUPI'
                  ? 'bg-[#059669] text-white shadow-2xs'
                  : 'bg-[#D1FAE5] hover:bg-[#A7F3D0] text-[#065F46] border border-[#A7F3D0]'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span>Udupi</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#8A8479] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, phone, staff..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl focus:outline-none focus:border-[#21845F] focus:bg-white"
            />
          </div>
        </div>

        {/* Row 2: Date Filters & Employee Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F0ECE1]">
          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-[#8A8479] mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Date:</span>
            </span>
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setDateFilter(p.id);
                  setFromDate('');
                  setToDate('');
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  dateFilter === p.id && !fromDate && !toDate
                    ? 'bg-[#21845F] border-[#21845F] text-white shadow-2xs'
                    : 'bg-[#FAF8F3] border-[#E4DFD4] text-[#5E5A52] hover:bg-white'
                }`}
              >
                {p.label}
              </button>
            ))}

            {/* Custom Range */}
            <div className="flex items-center gap-1 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl px-2 py-0.5 ml-1">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setDateFilter('custom');
                }}
                className="px-1 text-[11px] bg-white border border-[#E4DFD4] rounded-md font-medium text-[#1D1D1B]"
                title="From Date"
              />
              <span className="text-[11px] text-[#8A8479]">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setDateFilter('custom');
                }}
                className="px-1 text-[11px] bg-white border border-[#E4DFD4] rounded-md font-medium text-[#1D1D1B]"
                title="To Date"
              />
            </div>
          </div>

          {/* Employee Filter & Reset */}
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#536B8A]" />
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="text-xs font-bold px-3 py-1.5 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-[#1D1D1B] focus:outline-none focus:border-[#21845F] cursor-pointer"
                title="Filter by Showroom Staff"
              >
                <option value="ALL">All Showroom Staff</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.full_name}>
                    {emp.full_name} ({emp.employee_code || emp.branch_code || 'Staff'})
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-[#C24141] hover:underline flex items-center gap-1 cursor-pointer transition-colors ml-1"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Customer Activities Table */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl overflow-hidden shadow-[0_4px_18px_rgba(40,35,25,0.045)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F3] border-b border-[#EBE6DC] text-[#6B6559] uppercase font-bold text-[10px] tracking-wider">
                {/* Select All Checkbox */}
                <th className="px-4 py-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded text-[#21845F] focus:ring-[#21845F] cursor-pointer"
                    title="Select All"
                  />
                </th>
                <th className="px-5 py-3.5">Visit Date</th>
                <th className="px-5 py-3.5">Customer & Contact</th>
                <th className="px-5 py-3.5">Branch</th>
                <th className="px-5 py-3.5">Attended By Staff</th>
                <th className="px-5 py-3.5">Outcome</th>
                <th className="px-5 py-3.5">Value (₹)</th>
                <th className="px-5 py-3.5">Verification</th>
                <th className="px-5 py-3.5 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE1]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-[#8A8479]">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#1D4ED8]" />
                    <span className="block mt-2 font-semibold">Loading customer records...</span>
                  </td>
                </tr>
              ) : filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-[#8A8479]">
                    <p className="font-bold text-sm text-[#1D1D1B]">No customer interactions found.</p>
                    <p className="text-xs mt-1">Try resetting the filters or change branch selection above.</p>
                  </td>
                </tr>
              ) : (
                filteredActivities.map((act) => {
                  const outcome = act.status === 'Walkin' ? 'Window Shopping' : (act.status || 'Window Shopping');
                  const isApproved = act.approval_status === 'APPROVED';
                  const isPending = act.approval_status === 'PENDING';
                  const isSelected = selectedIds.has(act.id);

                  return (
                    <tr
                      key={act.id}
                      className={`hover:bg-[#FAF9F5] transition-colors ${
                        isSelected ? 'bg-[#E8F4EE]/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRow(act.id)}
                          className="w-4 h-4 rounded text-[#21845F] focus:ring-[#21845F] cursor-pointer"
                        />
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-[#1D1D1B]">
                          <Calendar className="w-3.5 h-3.5 text-[#536B8A]" />
                          <span>{act.activity_date}</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#8A8479]">#{act.id}</span>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-3.5">
                        <div className="font-extrabold text-[#1D1D1B] text-sm">
                          {act.customer_name || 'Walk-in Customer'}
                        </div>
                        {act.phone_number ? (
                          <div className="text-[11px] font-mono text-[#536B8A] flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#21845F]" />
                            <span>{act.phone_number}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#8A8479] italic">No phone provided</span>
                        )}
                      </td>

                      {/* Branch */}
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF8F3] border border-[#E4DFD4] text-[#536B8A]">
                          {act.branch_name || 'Showroom'}
                        </span>
                      </td>

                      {/* Attended Staff */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-[#1D1D1B]">{act.employee_name || 'Floor Staff'}</div>
                        <div className="text-[10px] font-mono text-[#8A8479]">{act.employee_code || ''}</div>
                      </td>

                      {/* Outcome */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
                            outcome === 'Sold'
                              ? 'bg-[#E8F4EE] text-[#21845F] border-[#C5E3D5]'
                              : outcome === 'Exchange'
                              ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                              : outcome === 'Window Shopping'
                              ? 'bg-[#FAF8F3] text-[#5E5A52] border-[#E4DFD4]'
                              : 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'
                          }`}
                        >
                          {outcome}
                        </span>
                      </td>

                      {/* Value */}
                      <td className="px-5 py-3.5 font-mono font-bold text-sm">
                        {act.product_value && act.product_value > 0 ? (
                          <span className="text-[#21845F]">
                            ₹{act.product_value.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-[#8A8479] font-normal">—</span>
                        )}
                      </td>

                      {/* Verification */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isApproved
                              ? 'bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]'
                              : isPending
                              ? 'bg-[#FEFCE8] text-[#854D0E] border border-[#FEF08A]'
                              : 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
                          }`}
                        >
                          {isApproved ? (
                            <CheckCircle2 className="w-3 h-3 text-[#21845F]" />
                          ) : isPending ? (
                            <Clock className="w-3 h-3 text-[#854D0E]" />
                          ) : (
                            <XCircle className="w-3 h-3 text-[#DC2626]" />
                          )}
                          <span>{act.approval_status || 'PENDING'}</span>
                        </span>
                      </td>

                      {/* View Single Action */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setViewingActivity(act)}
                          className="p-1.5 rounded-lg bg-[#FAF8F3] hover:bg-[#F2EDE4] text-[#536B8A] hover:text-[#1D1D1B] border border-[#E4DFD4] transition-colors cursor-pointer"
                          title="View Single Customer Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer View Modal */}
      <CustomerActivityViewModal
        isOpen={!!viewingActivity}
        onClose={() => setViewingActivity(null)}
        activity={viewingActivity}
      />
    </div>
  );
};

