import React, { useEffect, useState } from 'react';
import {
  UserCheck,
  Search,
  Plus,
  Download,
  Calendar,
  Phone,
  User,
  Heart,
  Gift,
  IndianRupee,
  CheckCircle2,
  Clock,
  XCircle,
  Edit2,
  Trash2,
  ArrowUpDown,
  Filter,
  Sparkles,
  Users,
  RotateCcw,
  Building2,
  FileText,
} from 'lucide-react';
import { CustomerActivity, Employee } from '../../types';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { CustomerActivityModal } from '../../components/customers/CustomerActivityModal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  parseCustomerBreakdown,
  exportCustomerActivitiesToCSV,
} from '../../utils/customerUtils';
import api from '../../api/client';

export const CustomerActivityPage: React.FC = () => {
  const { selectedBranch } = useAuth();
  const { success, error: toastError } = useToast();

  const [activities, setActivities] = useState<CustomerActivity[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedEmpFilter, setSelectedEmpFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingActivity, setEditingActivity] = useState<CustomerActivity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerActivity | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [actRes, empRes] = await Promise.all([
        api.get<CustomerActivity[]>('/api/v1/customers'),
        api.get<Employee[]>('/api/v1/employees'),
      ]);
      setActivities(actRes.data);
      setEmployees(empRes.data);
    } catch (err) {
      console.error('Failed to load customer activities:', err);
      toastError('Failed to fetch customer activities.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedEmpFilter('all');
    setSelectedStatusFilter('all');
    setDateFilter('all');
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedEmpFilter !== 'all' ||
    selectedStatusFilter !== 'all' ||
    dateFilter !== 'all';

  // Filtered Activities
  const filteredActivities = activities.filter((act) => {
    // 1. Employee filter
    if (selectedEmpFilter !== 'all' && act.employee_id.toString() !== selectedEmpFilter) {
      return false;
    }

    // 2. Status filter
    if (selectedStatusFilter !== 'all') {
      const breakdownItems = parseCustomerBreakdown(
        act.breakdown,
        act.customers_count || 1,
        act.status,
        act.customer_name,
        act.phone_number
      );
      const matchesStatus =
        act.status.toLowerCase() === selectedStatusFilter.toLowerCase() ||
        breakdownItems.some(
          (b) => b.status.toLowerCase() === selectedStatusFilter.toLowerCase()
        );
      if (!matchesStatus) return false;
    }

    // 3. Date filter
    if (dateFilter !== 'all') {
      const today = new Date().toISOString().split('T')[0];
      if (dateFilter === 'today' && act.activity_date !== today) {
        return false;
      }
      if (dateFilter === 'this_week') {
        const d = new Date(act.activity_date);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24));
        if (diffDays > 7 || diffDays < 0) return false;
      }
      if (dateFilter === 'this_month') {
        const d = new Date(act.activity_date);
        const now = new Date();
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) {
          return false;
        }
      }
    }

    // 4. Search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const nameMatch = (act.customer_name || '').toLowerCase().includes(term);
      const phoneMatch = (act.phone_number || '').includes(term);
      const empMatch = (act.employee_name || '').toLowerCase().includes(term);
      const empCodeMatch = (act.employee_code || '').toLowerCase().includes(term);
      const notesMatch = (act.notes || '').toLowerCase().includes(term);
      const breakdownMatch = (act.breakdown || '').toLowerCase().includes(term);
      if (
        !nameMatch &&
        !phoneMatch &&
        !empMatch &&
        !empCodeMatch &&
        !notesMatch &&
        !breakdownMatch
      ) {
        return false;
      }
    }

    return true;
  });

  // KPI Calculations
  const totalFootfall = activities.reduce((sum, a) => sum + (a.customers_count || 0), 0);
  const totalSold = activities.reduce((sum, a) => {
    const items = parseCustomerBreakdown(a.breakdown, a.customers_count || 1, a.status);
    return sum + items.filter((i) => i.status === 'Sold').length;
  }, 0);
  const totalExchange = activities.reduce((sum, a) => {
    const items = parseCustomerBreakdown(a.breakdown, a.customers_count || 1, a.status);
    return sum + items.filter((i) => i.status === 'Exchange').length;
  }, 0);
  const totalInHold = activities.reduce((sum, a) => {
    const items = parseCustomerBreakdown(a.breakdown, a.customers_count || 1, a.status);
    return (
      sum +
      items.filter(
        (i) =>
          i.status === 'In Hold / Follow Up' ||
          i.status === 'In Hold' ||
          i.status === 'Follow Up'
      ).length
    );
  }, 0);
  const totalProductValue = activities.reduce((sum, a) => sum + (a.product_value || 0), 0);

  // Handle Delete
  const handleDelete = async () => {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Sold':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]">
            <CheckCircle2 className="w-3 h-3 text-[#21845F]" />
            <span>Sold</span>
          </span>
        );
      case 'Exchange':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EDF2F7] text-[#536B8A] border border-[#C5D5E6]">
            <ArrowUpDown className="w-3 h-3 text-[#536B8A]" />
            <span>Exchange</span>
          </span>
        );
      case 'In Hold / Follow Up':
      case 'In Hold':
      case 'Follow Up':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF1EC] text-[#B97855] border border-[#ECCFC0]">
            <Clock className="w-3 h-3 text-[#B97855]" />
            <span>In Hold / Follow Up</span>
          </span>
        );
      case 'Lost':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FDECEC] text-[#C24141] border border-[#F9C3C3]">
            <XCircle className="w-3 h-3 text-[#C24141]" />
            <span>Lost</span>
          </span>
        );
      case 'Walkin':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF8F3] text-[#8A8479] border border-[#E4DFD4]">
            <Users className="w-3 h-3 text-[#8A8479]" />
            <span>Walkin</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Hero Banner Matching EmployeeListPage Style */}
      <div className="relative bg-linear-to-br from-[#FAF8F3] via-white to-[#F0F4F8] border border-[#C5D5E6] rounded-3xl p-6 sm:p-8 shadow-sm text-[#1D1D1B] overflow-hidden">
        {/* Subtle Ambient Blue Shimmer */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-[#536B8A] to-transparent opacity-60 animate-pulse" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            {/* Showroom Badge */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white backdrop-blur-xs text-[#536B8A] border border-[#C5D5E6] flex items-center gap-2 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#536B8A] animate-pulse" />
                <span>{selectedBranch?.name || 'Showroom'} Footfall</span>
              </span>

              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EDF2F7] text-[#536B8A] border border-[#C5D5E6] shadow-2xs">
                {activities.length} Activity Logs ({totalFootfall} Customers)
              </span>
            </div>

            {/* Title & Subtitle */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1D1D1B] tracking-tight flex items-center gap-2.5">
                <UserCheck className="w-6 h-6 text-[#536B8A]" />
                <span>Customers Directory & Activity</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#536B8A] font-medium mt-1 max-w-2xl">
                Log showroom customer walk-ins, sales closures, contacts, birthdays, anniversaries, and export records for <span className="font-bold text-[#1D1D1B] underline decoration-[#536B8A]/40 underline-offset-2">{selectedBranch?.name || 'Showroom'}</span>
              </p>
            </div>
          </div>

          {/* Quick Actions Header Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto shrink-0">
            {/* Export CSV Button */}
            <button
              onClick={() => exportCustomerActivitiesToCSV(filteredActivities)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#C5E3D5] hover:border-[#21845F] text-[#21845F] hover:bg-[#E8F4EE] text-xs font-bold shadow-2xs transition-all cursor-pointer hover:scale-[1.02]"
              title="Export filtered records to CSV"
            >
              <Download className="w-4 h-4 text-[#21845F]" />
              <span>Export CSV</span>
            </button>

            {/* + Log Customer Activity */}
            <button
              onClick={() => {
                setEditingActivity(null);
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#536B8A] hover:bg-[#40546D] text-white text-xs font-bold shadow-sm transition-all cursor-pointer hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>+ Log Customer Activity</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Metric KPI Cards (Cohesive Slate Sapphire & Gold Layout) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Footfall */}
        <div className="bg-white border border-[#C5D5E6] hover:border-[#536B8A] rounded-2xl p-4 sm:p-5 shadow-[0_4px_18px_rgba(40,35,25,0.045)] flex items-center justify-between transition-colors">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-[#536B8A] uppercase tracking-wider block mb-1">
              Total Footfall
            </span>
            <div className="text-xl sm:text-2xl font-bold text-[#1D1D1B]">{totalFootfall}</div>
            <span className="text-[10px] text-[#536B8A] font-medium">Attended Visitors</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EDF2F7] border border-[#C5D5E6] text-[#536B8A] flex items-center justify-center font-bold">
            <Users className="w-4 h-4" />
          </div>
        </div>

        {/* Sold / Closed (Green Accent) */}
        <div className="bg-white border border-[#E4DFD4] hover:border-[#C5E3D5] rounded-2xl p-4 sm:p-5 shadow-[0_4px_18px_rgba(40,35,25,0.045)] flex items-center justify-between transition-colors">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-[#21845F] uppercase tracking-wider block mb-1">
              Sold / Closed
            </span>
            <div className="text-xl sm:text-2xl font-bold text-[#21845F]">{totalSold}</div>
            <span className="text-[10px] text-[#21845F] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#21845F]" />
              {totalFootfall > 0 ? Math.round((totalSold / totalFootfall) * 100) : 0}% Conversion
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E8F4EE] border border-[#C5E3D5] text-[#21845F] flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Exchange (Slate Sapphire) */}
        <div className="bg-white border border-[#E4DFD4] hover:border-[#C5D5E6] rounded-2xl p-4 sm:p-5 shadow-[0_4px_18px_rgba(40,35,25,0.045)] flex items-center justify-between transition-colors">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-[#536B8A] uppercase tracking-wider block mb-1">
              Gold Exchange
            </span>
            <div className="text-xl sm:text-2xl font-bold text-[#536B8A]">{totalExchange}</div>
            <span className="text-[10px] text-[#536B8A] font-semibold">Exchanged Pieces</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EDF2F7] border border-[#C5D5E6] text-[#536B8A] flex items-center justify-center font-bold">
            <ArrowUpDown className="w-4 h-4 text-[#536B8A]" />
          </div>
        </div>

        {/* In Hold / Follow Up */}
        <div className="bg-white border border-[#E4DFD4] hover:border-[#ECCFC0] rounded-2xl p-4 sm:p-5 shadow-[0_4px_18px_rgba(40,35,25,0.045)] flex items-center justify-between transition-colors">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-[#B97855] uppercase tracking-wider block mb-1">
              In Hold / Follow Up
            </span>
            <div className="text-xl sm:text-2xl font-bold text-[#B97855]">{totalInHold}</div>
            <span className="text-[10px] text-[#B97855] font-semibold">Active Leads</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FAF1EC] border border-[#ECCFC0] text-[#B97855] flex items-center justify-center font-bold">
            <Clock className="w-4 h-4 text-[#B97855]" />
          </div>
        </div>

        {/* Deals Value (₹) */}
        <div className="bg-white border border-[#E4DFD4] hover:border-[#C5D5E6] rounded-2xl p-4 sm:p-5 shadow-[0_4px_18px_rgba(40,35,25,0.045)] flex items-center justify-between col-span-2 sm:col-span-2 lg:col-span-1 transition-colors">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-[#8A8479] uppercase tracking-wider block mb-1">
              Deals Value
            </span>
            <div className="text-xl sm:text-2xl font-bold text-[#1D1D1B] font-mono truncate">
              ₹{totalProductValue.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-[#8A8479] font-medium">Closed Purchases</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-[#8A8479] flex items-center justify-center font-bold">
            <IndianRupee className="w-4 h-4 text-[#536B8A]" />
          </div>
        </div>
      </div>

      {/* 3. Toolbar: Search & Filters (Responsive Layout) */}
      <div className="bg-white border border-[#E4DFD4] rounded-2xl p-3.5 sm:p-4 shadow-[0_4px_18px_rgba(40,35,25,0.045)] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="w-full lg:w-72 xl:w-80 relative flex items-center shrink-0">
          <Search className="absolute left-3.5 w-4 h-4 text-[#536B8A]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, phone, staff, notes..."
            className="w-full pl-9 pr-3.5 py-2.5 input-luxury-beige rounded-xl text-xs transition-all font-medium"
          />
        </div>

        {/* Filters Grid */}
        <div className="w-full lg:w-auto flex-1 grid grid-cols-1 sm:grid-cols-3 lg:flex items-center gap-2 lg:justify-end">
          {/* Staff Member Filter */}
          <select
            value={selectedEmpFilter}
            onChange={(e) => setSelectedEmpFilter(e.target.value)}
            className="w-full lg:w-auto select-luxury-slate rounded-xl px-3 py-2.5 text-xs font-semibold cursor-pointer"
          >
            <option value="all">All Staff Members</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id.toString()}>
                {emp.full_name} ({emp.employee_code})
              </option>
            ))}
          </select>

          {/* Outcome Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="w-full lg:w-auto select-luxury-slate rounded-xl px-3 py-2.5 text-xs font-semibold cursor-pointer"
          >
            <option value="all">All Outcomes</option>
            <option value="Sold">Sold (Purchased)</option>
            <option value="Exchange">Exchange</option>
            <option value="In Hold / Follow Up">In Hold / Follow Up</option>
            <option value="Walkin">Walkin (General)</option>
            <option value="Lost">Lost</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full lg:w-auto select-luxury-slate rounded-xl px-3 py-2.5 text-xs font-semibold cursor-pointer"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
          </select>

          {/* Quick Refresh / Fetch Data Button */}
          <button
            onClick={fetchData}
            title="Fetch and refresh latest customer activity logs"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#536B8A] bg-[#EDF2F7] border border-[#C5D5E6] hover:bg-[#E2E8F0] transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Fetch / Refresh</span>
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              title="Clear active filters"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#B97855] bg-[#FAF1EC] border border-[#ECCFC0] hover:bg-[#F5E2D6] transition-colors cursor-pointer shrink-0"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Customer Directory Records Table & Mobile Cards */}
      {isLoading ? (
        <div className="py-20 flex justify-center bg-white border border-[#E4DFD4] rounded-3xl shadow-2xs">
          <LoadingSpinner message="Loading showroom customer records..." />
        </div>
      ) : filteredActivities.length === 0 ? (
        <EmptyState
          title="No customer activity records found"
          description="Log showroom customer interactions, closed deals, or adjust your filters."
          icon={UserCheck}
          actionText="+ Log Customer Activity"
          onAction={() => {
            setEditingActivity(null);
            setShowAddModal(true);
          }}
          actionIcon={<Plus className="w-4 h-4" />}
        />
      ) : (
        <div className="bg-white border border-[#E4DFD4] rounded-3xl overflow-hidden shadow-[0_4px_18px_rgba(40,35,25,0.045)]">
          {/* Mobile Card View (< md) */}
          <div className="md:hidden divide-y divide-[#F0EFEA] p-4">
            {filteredActivities.map((act) => {
              const customerItems = parseCustomerBreakdown(
                act.breakdown,
                act.customers_count || 1,
                act.status,
                act.customer_name,
                act.phone_number,
                act.dob,
                act.anniversary,
                act.product_value
              );

              return (
                <div key={act.id} className="py-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#1D1D1B]">
                          {act.customer_name || 'Walk-in Customer'}
                        </span>
                        {(act.customers_count || 1) > 1 && (
                          <span className="px-2 py-0.5 rounded-full bg-[#EDF2F7] border border-[#C5D5E6] text-[#536B8A] text-[10px] font-bold">
                            {act.customers_count} Customers
                          </span>
                        )}
                      </div>
                      {act.phone_number ? (
                        <a
                          href={`tel:${act.phone_number}`}
                          className="text-xs text-[#536B8A] font-mono flex items-center gap-1 mt-0.5 hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{act.phone_number}</span>
                        </a>
                      ) : (
                        <p className="text-[11px] text-[#8A8479] mt-0.5">No phone provided</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {getStatusBadge(act.status)}
                      <button
                        onClick={() => {
                          setEditingActivity(act);
                          setShowAddModal(true);
                        }}
                        className="p-1.5 rounded-lg text-[#536B8A] hover:text-[#40546D] hover:bg-[#EDF2F7] transition-colors"
                        title="Edit Activity"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(act)}
                        className="p-1.5 rounded-lg text-[#8A8479] hover:text-[#C24141] hover:bg-[#FDECEC] transition-colors"
                        title="Delete Activity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Staff, Date & Value Bar */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#FAF8F3] p-3 rounded-xl border border-[#E4DFD4]">
                    <div>
                      <span className="text-[10px] font-bold text-[#8A8479] uppercase block">Attended By</span>
                      <span className="font-bold text-[#1D1D1B]">{act.employee_name || 'Floor Staff'}</span>
                      <span className="text-[10px] text-[#536B8A] block font-mono">{act.employee_code || ''}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#8A8479] uppercase block">Date & Value</span>
                      <span className="font-semibold text-[#1D1D1B] flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#8A8479]" />
                        {act.activity_date}
                      </span>
                      {act.product_value && act.product_value > 0 ? (
                        <span className="text-[11px] font-bold font-mono text-[#21845F]">
                          ₹{act.product_value.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#8A8479]">—</span>
                      )}
                    </div>
                  </div>

                  {/* DOB & Anniversary */}
                  {(act.dob || act.anniversary) && (
                    <div className="flex items-center gap-3 text-xs flex-wrap">
                      {act.dob && (
                        <span className="text-[#B97855] font-semibold flex items-center gap-1">
                          <Gift className="w-3.5 h-3.5" /> DOB: {act.dob}
                        </span>
                      )}
                      {act.anniversary && (
                        <span className="text-[#C24141] font-semibold flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5" /> Anniv: {act.anniversary}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Individual Customer Breakdown and Notes */}
                  {customerItems.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {customerItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-2 rounded-xl border border-[#E4DFD4] text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#536B8A]">
                              Customer #{idx + 1}: {item.name || 'Walk-in'}
                            </span>
                            <span className="text-[10px] font-bold text-[#8A8479] bg-[#FAF8F3] px-2 py-0.5 rounded-full border border-[#E4DFD4]">
                              {item.status}
                            </span>
                          </div>
                          {item.notes && (
                            <p className="text-[11px] text-[#525252] italic">
                              "{item.notes}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {act.notes && (
                    <p className="text-xs text-[#525252] bg-[#FAF8F3] p-2.5 rounded-xl border border-[#E4DFD4]">
                      <span className="font-bold text-[#1D1D1B] block text-[10px] uppercase">General Remarks:</span>
                      {act.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#8A8479] uppercase font-bold text-[11px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Customer Info</th>
                  <th className="px-5 py-3.5">Attended By (Staff)</th>
                  <th className="px-5 py-3.5">DOB & Anniversary</th>
                  <th className="px-5 py-3.5">Outcome Status</th>
                  <th className="px-5 py-3.5">Product Value (₹)</th>
                  <th className="px-5 py-3.5">Customer Notes & Inquiries</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EFEA] font-medium">
                {filteredActivities.map((act) => {
                  const customerItems = parseCustomerBreakdown(
                    act.breakdown,
                    act.customers_count || 1,
                    act.status,
                    act.customer_name,
                    act.phone_number,
                    act.dob,
                    act.anniversary,
                    act.product_value
                  );

                  return (
                    <tr key={act.id} className="hover:bg-[#F0F4F8] transition-colors">
                      {/* Date */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-[#1D1D1B]">
                          <Calendar className="w-3.5 h-3.5 text-[#8A8479]" />
                          <span>{act.activity_date}</span>
                        </div>
                      </td>

                      {/* Customer Details */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#1D1D1B]">
                              {act.customer_name || 'Walk-in Customer'}
                            </span>
                            {(act.customers_count || 1) > 1 && (
                              <span className="px-2 py-0.5 rounded-full bg-[#EDF2F7] border border-[#C5D5E6] text-[#536B8A] text-[10px] font-bold">
                                {act.customers_count} Cust
                              </span>
                            )}
                          </div>
                          {act.phone_number ? (
                            <a
                              href={`tel:${act.phone_number}`}
                              className="text-[11px] text-[#536B8A] flex items-center gap-1 font-mono hover:underline"
                            >
                              <Phone className="w-3 h-3 text-[#8A8479]" />
                              <span>{act.phone_number}</span>
                            </a>
                          ) : (
                            <span className="text-[11px] text-[#8A8479]">No phone provided</span>
                          )}
                        </div>
                      </td>

                      {/* Attended By Staff */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#EDF2F7] border border-[#C5D5E6] text-[#536B8A] flex items-center justify-center font-bold text-xs shrink-0">
                            {act.employee_name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <span className="font-bold text-[#1D1D1B] block">
                              {act.employee_name || 'Showroom Staff'}
                            </span>
                            <span className="font-mono text-[10px] text-[#536B8A]">
                              {act.employee_code || `ID #${act.employee_id}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* DOB & Anniversary */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="space-y-0.5 text-[11px]">
                          {act.dob ? (
                            <p className="text-[#B97855] font-semibold flex items-center gap-1">
                              <Gift className="w-3 h-3" />
                              <span>DOB: {act.dob}</span>
                            </p>
                          ) : null}
                          {act.anniversary ? (
                            <p className="text-[#C24141] font-semibold flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              <span>Anniv: {act.anniversary}</span>
                            </p>
                          ) : null}
                          {!act.dob && !act.anniversary && (
                            <span className="text-[#8A8479] text-[11px]">—</span>
                          )}
                        </div>
                      </td>

                      {/* Outcome Status & Multi-Customer Badges */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div>{getStatusBadge(act.status)}</div>
                          {customerItems.length > 1 && (
                            <div className="flex items-center gap-1 flex-wrap pt-0.5 max-w-xs">
                              {customerItems.map((item, i) => (
                                <span
                                  key={i}
                                  className="text-[9px] font-bold px-1.5 py-0.2 rounded-sm bg-[#FAF8F3] border border-[#E4DFD4] text-[#525252]"
                                  title={`${item.name || `Cust #${i + 1}`}: ${item.status} ${item.notes ? `(${item.notes})` : ''}`}
                                >
                                  #{i + 1}: {item.status}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Product Value (₹) */}
                      <td className="px-5 py-4 font-mono font-bold text-[#1D1D1B] whitespace-nowrap">
                        {act.product_value && act.product_value > 0 ? (
                          <span className="text-[#21845F]">
                            ₹{act.product_value.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-[#8A8479] font-normal">—</span>
                        )}
                      </td>

                      {/* Customer Notes & Inquiries */}
                      <td className="px-5 py-4 max-w-xs">
                        <div className="space-y-1">
                          {/* Individual Customer Notes */}
                          {customerItems.some((c) => c.notes) ? (
                            customerItems
                              .filter((c) => c.notes)
                              .map((c, i) => (
                                <p key={i} className="text-xs text-[#525252] truncate">
                                  <span className="font-bold text-[#536B8A]">
                                    {c.name || `Cust #${c.id || i + 1}`}:
                                  </span>{' '}
                                  {c.notes}
                                </p>
                              ))
                          ) : act.notes ? (
                            <p className="text-xs text-[#525252] truncate">{act.notes}</p>
                          ) : (
                            <span className="text-xs text-[#8A8479]">—</span>
                          )}
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingActivity(act);
                              setShowAddModal(true);
                            }}
                            className="p-2 rounded-xl text-[#536B8A] hover:text-[#40546D] hover:bg-[#EDF2F7] transition-colors cursor-pointer"
                            title="Edit Activity"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeleteTarget(act)}
                            className="p-2 rounded-xl text-[#8A8479] hover:text-[#C24141] hover:bg-[#FDECEC] transition-colors cursor-pointer"
                            title="Delete Activity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Activity Modal */}
      {showAddModal && (
        <CustomerActivityModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingActivity(null);
          }}
          onSaved={fetchData}
          initialData={editingActivity}
          employeesList={employees}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmDialog
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete Customer Activity Record"
          message={`Are you sure you want to delete the customer activity record for ${deleteTarget.customer_name || 'Customer Walk-in'
            } on ${deleteTarget.activity_date}? This action cannot be undone.`}
          confirmText="Delete Activity"
          variant="danger"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};
