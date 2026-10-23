import React, { useEffect, useState, useMemo } from 'react';
import {
  Compass,
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
  MapPin,
  RotateCcw,
  Plus,
  Edit2,
  Trash2,
  Users,
  ShieldCheck,
  Building2,
  Gem,
} from 'lucide-react';
import { OutdoorMarketingCustomer, Employee } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { SCHEMES, DEFAULT_SCHEME } from '../../constants/schemes';
import api from '../../api/client';

export const OutdoorCustomerLeadsPage: React.FC = () => {
  const { selectedBranch } = useAuth();
  const { success, error: toastError } = useToast();

  const [customers, setCustomers] = useState<OutdoorMarketingCustomer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedEmpFilter, setSelectedEmpFilter] = useState<string>('all');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('all');
  const [selectedSchemeFilter, setSelectedSchemeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [reviewFilter, setReviewFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Modals & Action States
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<OutdoorMarketingCustomer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OutdoorMarketingCustomer | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<{
    customer_name: string;
    phone: string;
    dob: string;
    anniversary_date: string;
    marketing_employee_id: string;
    area_name: string;
    scheme_name: string;
    status: string;
    interested_gold: boolean;
    interested_diamond: boolean;
    interested_silver: boolean;
    has_google_review: boolean;
    google_review_rating: number;
    google_review_text: string;
    date: string;
    notes: string;
  }>({
    customer_name: '',
    phone: '',
    dob: '',
    anniversary_date: '',
    marketing_employee_id: '',
    area_name: '',
    scheme_name: DEFAULT_SCHEME,
    status: 'Lead',
    interested_gold: false,
    interested_diamond: false,
    interested_silver: false,
    has_google_review: false,
    google_review_rating: 5,
    google_review_text: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {};
      if (selectedEmpFilter !== 'all') params.employee_id = parseInt(selectedEmpFilter);
      if (selectedStatusFilter !== 'all') params.status = selectedStatusFilter;
      if (selectedAreaFilter !== 'all') params.area = selectedAreaFilter;
      if (selectedSchemeFilter !== 'all') params.scheme_name = selectedSchemeFilter;
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const [custRes, empRes] = await Promise.all([
        api.get<OutdoorMarketingCustomer[]>('/api/v1/outdoor-marketing/customers', { params }),
        api.get<Employee[]>('/api/v1/outdoor-marketing/employees'),
      ]);

      setCustomers(custRes.data || []);
      setEmployees(empRes.data || []);
      if (!formData.marketing_employee_id && empRes.data.length > 0) {
        setFormData((prev) => ({ ...prev, marketing_employee_id: empRes.data[0].id.toString() }));
      }
    } catch (err) {
      console.error('Failed to load outdoor customer leads:', err);
      toastError('Failed to fetch outdoor customer leads.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedEmpFilter, selectedStatusFilter, selectedAreaFilter, selectedSchemeFilter, fromDate, toDate]);

  // Unique campaign areas list for filter dropdown
  const uniqueAreas = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      if (c.area_name && c.area_name.trim()) set.add(c.area_name.trim());
    });
    return Array.from(set).sort();
  }, [customers]);

  // Client-side instant filtering (for fast search & reviews)
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Review filter
      if (reviewFilter === 'reviewed' && !c.has_google_review) return false;
      if (reviewFilter === '5stars' && (!c.has_google_review || c.google_review_rating !== 5)) return false;

      // Text search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = c.customer_name?.toLowerCase().includes(q);
        const matchesPhone = c.phone?.toLowerCase().includes(q);
        const matchesArea = c.area_name?.toLowerCase().includes(q);
        const matchesScheme = c.scheme_name?.toLowerCase().includes(q);
        const matchesNotes = c.notes?.toLowerCase().includes(q);
        const matchesEmp = c.marketing_employee_name?.toLowerCase().includes(q) || (c.marketing_employee_code && c.marketing_employee_code.toLowerCase().includes(q));
        if (!matchesName && !matchesPhone && !matchesArea && !matchesScheme && !matchesNotes && !matchesEmp) {
          return false;
        }
      }

      return true;
    });
  }, [customers, reviewFilter, searchTerm]);

  // Analytics Metrics
  const stats = useMemo(() => {
    const totalLeads = customers.length;
    const convertedCount = customers.filter((c) => c.is_converted || c.status.toLowerCase().includes('converted') || c.status.toLowerCase().includes('closed')).length;
    const conversionRate = totalLeads > 0 ? Math.round((convertedCount / totalLeads) * 100) : 0;
    const schemesCount = customers.filter((c) => c.scheme_name && c.scheme_name.trim()).length;
    const googleReviewsCount = customers.filter((c) => c.has_google_review).length;

    return {
      totalLeads,
      convertedCount,
      conversionRate,
      schemesCount,
      googleReviewsCount,
    };
  }, [customers]);

  // Open Add Modal
  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      customer_name: '',
      phone: '',
      dob: '',
      anniversary_date: '',
      marketing_employee_id: employees[0]?.id?.toString() || '',
      area_name: '',
      scheme_name: DEFAULT_SCHEME,
      status: 'Lead',
      interested_gold: false,
      interested_diamond: false,
      interested_silver: false,
      has_google_review: false,
      google_review_rating: 5,
      google_review_text: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowAddModal(true);
  };

  // Open Edit Modal
  const openEditModal = (c: OutdoorMarketingCustomer) => {
    setEditingCustomer(c);
    const intStr = (c.interested_in || '').toLowerCase();
    setFormData({
      customer_name: c.customer_name,
      phone: c.phone || '',
      dob: c.dob || '',
      anniversary_date: c.anniversary_date || '',
      marketing_employee_id: c.marketing_employee_id?.toString() || employees[0]?.id?.toString() || '',
      area_name: c.area_name || '',
      scheme_name: c.scheme_name || DEFAULT_SCHEME,
      status: c.status || 'Lead',
      interested_gold: intStr.includes('gold'),
      interested_diamond: intStr.includes('diamond'),
      interested_silver: intStr.includes('silver'),
      has_google_review: Boolean(c.has_google_review),
      google_review_rating: c.google_review_rating || 5,
      google_review_text: c.google_review_text || '',
      date: c.date || new Date().toISOString().split('T')[0],
      notes: c.notes || '',
    });
    setShowAddModal(true);
  };

  // Save Lead Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name.trim()) {
      toastError('Please enter the customer name.');
      return;
    }
    if (!formData.marketing_employee_id) {
      toastError('Please select the assisting outdoor marketer.');
      return;
    }

    const interestedArr: string[] = [];
    if (formData.interested_gold) interestedArr.push('Gold');
    if (formData.interested_diamond) interestedArr.push('Diamond');
    if (formData.interested_silver) interestedArr.push('Silver');

    const payload = {
      marketing_employee_id: parseInt(formData.marketing_employee_id),
      customer_name: formData.customer_name.trim(),
      phone: formData.phone.trim() || undefined,
      dob: formData.dob || undefined,
      anniversary_date: formData.anniversary_date || undefined,
      area_name: formData.area_name.trim() || undefined,
      scheme_name: formData.scheme_name || undefined,
      status: formData.status,
      interested_in: interestedArr.join(', ') || undefined,
      has_google_review: formData.has_google_review,
      google_review_rating: formData.has_google_review ? formData.google_review_rating : undefined,
      google_review_text: formData.has_google_review && formData.google_review_text.trim() ? formData.google_review_text.trim() : undefined,
      date: formData.date,
      notes: formData.notes.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      if (editingCustomer) {
        await api.put(`/api/v1/outdoor-marketing/customers/${editingCustomer.id}`, payload);
        success('Outdoor customer lead updated successfully.');
      } else {
        await api.post('/api/v1/outdoor-marketing/customers', payload);
        success('New outdoor customer lead created successfully.');
      }
      setShowAddModal(false);
      setEditingCustomer(null);
      fetchData();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to save customer lead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Lead
  const handleDeleteCustomer = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await api.delete(`/api/v1/outdoor-marketing/customers/${deleteTarget.id}`);
      success('Customer lead record deleted.');
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to delete customer lead.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredCustomers.length === 0) {
      toastError('No outdoor customer records to export.');
      return;
    }

    const headers = [
      'Customer Name',
      'Phone Number',
      'Date of Birth (DOB)',
      'Wedding Anniversary',
      'Campaign Area',
      'Assisting Field Marketer',
      'Marketer Staff Code',
      'Interested In',
      'Promoted Jewellery Scheme',
      'Lead Status',
      'Google Review Given?',
      'Google Rating (Stars)',
      'Google Review Feedback',
      'Field Date',
      'Notes & Inquiries',
    ];

    const csvRows: string[][] = [headers];

    filteredCustomers.forEach((c) => {
      csvRows.push([
        `"${c.customer_name.replace(/"/g, '""')}"`,
        `"${(c.phone || '').replace(/"/g, '""')}"`,
        c.dob || '',
        c.anniversary_date || '',
        `"${(c.area_name || '').replace(/"/g, '""')}"`,
        `"${(c.marketing_employee_name || 'Staff').replace(/"/g, '""')}"`,
        c.marketing_employee_code || '',
        `"${(c.interested_in || '').replace(/"/g, '""')}"`,
        `"${(c.scheme_name || '').replace(/"/g, '""')}"`,
        `"${c.status}"`,
        c.has_google_review ? 'Yes' : 'No',
        c.has_google_review && c.google_review_rating ? c.google_review_rating.toString() : '',
        c.has_google_review ? `"${(c.google_review_text || '').replace(/"/g, '""')}"` : '',
        c.date || '',
        `"${(c.notes || '').replace(/"/g, '""')}"`,
      ]);
    });

    const csvContent = csvRows.map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Outdoor_Customer_Leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    success(`Exported ${filteredCustomers.length} outdoor customer leads to CSV!`);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedEmpFilter('all');
    setSelectedAreaFilter('all');
    setSelectedSchemeFilter('all');
    setSelectedStatusFilter('all');
    setReviewFilter('all');
    setDateFilter('all');
    setFromDate('');
    setToDate('');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E8E6E1] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#065F46] bg-[#D1FAE5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0]">
              Field Prospecting & Leads Ledger
            </span>
            <span className="text-xs font-semibold text-[#8A8479]">
              {selectedBranch?.name || 'Showroom'} Outdoor Teams
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1D1D1B] tracking-tight mt-1 flex items-center gap-2">
            <Compass className="w-6 h-6 text-[#10B981]" />
            <span>Outdoor Marketers Customer Directory</span>
          </h1>
          <p className="text-xs text-[#8A8479] font-medium mt-0.5">
            Full ledger of customer leads gathered in the field, targeted locations, jewellery scheme promotions, and assisting staff details in each row.
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
            <Download className="w-4 h-4 text-[#10B981]" />
            <span>Export Leads CSV ({filteredCustomers.length})</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={openAddModal}
            className="flex items-center gap-1.5 cursor-pointer shadow-xs bg-[#065F46] hover:bg-[#047857]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Field Customer Lead</span>
          </Button>
        </div>
      </div>

      {/* 2. Top 4 Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E8E6E1] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#8A8479] uppercase tracking-wider block">
              Total Field Leads
            </span>
            <div className="text-2xl font-black text-[#1D1D1B] mt-1">{stats.totalLeads}</div>
            <span className="text-[11px] font-semibold text-[#065F46]">Acquired from Field Campaigns</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#D1FAE5] border border-[#A7F3D0] flex items-center justify-center text-[#065F46]">
            <Compass className="w-6 h-6" />
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
              Schemes Promoted
            </span>
            <div className="text-2xl font-black text-[#7E22CE] mt-1">{stats.schemesCount}</div>
            <span className="text-[11px] font-semibold text-[#7E22CE]">
              Interested in 3 Gold Plans
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
            <span className="text-[11px] font-semibold text-[#D97706]">Field Customer Feedback</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#D97706]">
            <Star className="w-6 h-6 fill-current" />
          </div>
        </div>
      </div>

      {/* 3. Filter Toolbar */}
      <div className="p-4 bg-white border border-[#E4DFD4] rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          {/* Live Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#8A8479] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer name, phone, area, scheme, notes, or staff..."
              className="w-full pl-10 pr-4 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs text-[#1D1D1B] placeholder-[#8A8479] focus:outline-none focus:border-[#10B981]"
            />
          </div>

          {/* Assisting Field Marketer Filter */}
          <div className="flex items-center gap-1.5 w-full lg:w-auto">
            <select
              value={selectedEmpFilter}
              onChange={(e) => setSelectedEmpFilter(e.target.value)}
              className="w-full lg:w-48 px-3 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-bold text-[#1D1D1B] focus:outline-none cursor-pointer"
            >
              <option value="all">All Marketers ({employees.length})</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id.toString()}>
                  {emp.full_name} {emp.employee_code ? `(#${emp.employee_code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Campaign Area Filter */}
          <div className="flex items-center gap-1.5 w-full lg:w-auto">
            <select
              value={selectedAreaFilter}
              onChange={(e) => setSelectedAreaFilter(e.target.value)}
              className="w-full lg:w-44 px-3 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-bold text-[#1D1D1B] focus:outline-none cursor-pointer"
            >
              <option value="all">All Campaign Areas</option>
              {uniqueAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          {/* Scheme Filter (The 3 schemes) */}
          <div className="flex items-center gap-1.5 w-full lg:w-auto">
            <select
              value={selectedSchemeFilter}
              onChange={(e) => setSelectedSchemeFilter(e.target.value)}
              className="w-full lg:w-56 px-3 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-bold text-[#7E22CE] focus:outline-none cursor-pointer"
            >
              <option value="all">All 3 Jewellery Schemes</option>
              {SCHEMES.map((sch) => (
                <option key={sch} value={sch}>
                  {sch}
                </option>
              ))}
            </select>
          </div>

          {/* Lead Status Filter */}
          <div className="flex items-center gap-1.5 w-full lg:w-auto">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full lg:w-36 px-3 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-bold text-[#1D1D1B] focus:outline-none cursor-pointer"
            >
              <option value="all">All Lead Statuses</option>
              <option value="Lead">New Lead</option>
              <option value="Interested">Interested</option>
              <option value="Converted">Converted</option>
              <option value="Contacted">Contacted</option>
              <option value="Closed">Closed</option>
              <option value="Lost">Lost</option>
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
                    ? 'bg-[#065F46] border-[#065F46] text-white shadow-2xs'
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
              Showing <b className="text-[#1D1D1B]">{filteredCustomers.length}</b> outdoor leads
            </span>
            {(searchTerm || selectedEmpFilter !== 'all' || selectedAreaFilter !== 'all' || selectedSchemeFilter !== 'all' || selectedStatusFilter !== 'all' || reviewFilter !== 'all' || dateFilter !== 'all' || fromDate) && (
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
            <LoadingSpinner message="Loading outdoor marketer customer leads..." />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No outdoor customer leads found"
              description="No field leads matched your selected filters or search terms."
              actionText="+ Add New Field Lead"
              onAction={openAddModal}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Customer Contact & Celebrations</th>
                  <th className="px-4 py-3.5">Assisting Field Marketer</th>
                  <th className="px-4 py-3.5">Campaign Location / Status</th>
                  <th className="px-4 py-3.5">Promoted Scheme & Interest</th>
                  <th className="px-4 py-3.5">Google 5-Star Review</th>
                  <th className="px-4 py-3.5">Field Inquiries & Notes</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE6DC] font-medium text-[#1D1D1B]">
                {filteredCustomers.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-[#FAF9F6] transition-colors group">
                    {/* 1. Customer Details */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-extrabold text-[#1D1D1B] text-sm flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-full bg-[#D1FAE5] text-[#065F46] font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span>{c.customer_name}</span>
                      </div>

                      {/* Phone */}
                      {c.phone ? (
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-[#065F46] font-semibold">
                          <Phone className="w-3 h-3 text-[#10B981]" />
                          <span>{c.phone}</span>
                          <a
                            href={`https://wa.me/91${c.phone.replace(/[^0-9]/g, '')}`}
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

                      {/* Birthday & Anniversary */}
                      {(c.dob || c.anniversary_date) && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                          {c.dob && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#FAF1EC] border border-[#ECCFC0] text-[#B97855] text-[10px] font-bold">
                              <Cake className="w-2.5 h-2.5" />
                              <span>DOB: {c.dob}</span>
                            </span>
                          )}
                          {c.anniversary_date && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#FCE7F3] border border-[#FBCFE8] text-[#BE185D] text-[10px] font-bold">
                              <Heart className="w-2.5 h-2.5 fill-current" />
                              <span>Anniv: {c.anniversary_date}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* 2. Assisting Outdoor Marketer */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-[#065F46] font-bold text-xs flex items-center justify-center shrink-0">
                          {(c.marketing_employee_name || 'M').charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-[#1D1D1B] block">
                            {c.marketing_employee_name || 'Outdoor Staff'}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-[#8A8479]">
                            {c.marketing_employee_code && (
                              <span className="font-mono font-bold bg-[#F2EEE9] px-1 rounded text-[#5E5A52]">
                                #{c.marketing_employee_code}
                              </span>
                            )}
                            {c.marketing_employee_designation && (
                              <span>• {c.marketing_employee_designation}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-[#8A8479] mt-1.5 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-[#A1A1AA]" />
                        <span>Date: {c.date}</span>
                      </div>
                    </td>

                    {/* 3. Campaign Area & Lead Status */}
                    <td className="px-4 py-3.5 align-top">
                      {c.area_name ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF8F3] border border-[#E4DFD4] text-[#1D1D1B] font-bold text-xs">
                          <MapPin className="w-3 h-3 text-[#9A782F]" />
                          <span>{c.area_name}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#A1A1AA] italic">Showroom Vicinity</span>
                      )}

                      <div className="mt-1.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            c.is_converted || c.status.toLowerCase().includes('converted')
                              ? 'bg-[#E8F4EE] border-[#C5E3D5] text-[#21845F]'
                              : c.status.toLowerCase().includes('interested')
                              ? 'bg-[#E0F2FE] border-[#BAE6FD] text-[#0284C7]'
                              : 'bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]'
                          }`}
                        >
                          {c.is_converted ? '✨ Converted' : c.status}
                        </span>
                      </div>
                    </td>

                    {/* 4. Scheme & Jewelry Interest */}
                    <td className="px-4 py-3.5 align-top">
                      {c.scheme_name ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] font-bold text-[10px] block w-fit">
                          <Award className="w-3 h-3 text-[#D97706]" />
                          <span>{c.scheme_name}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#A1A1AA] italic block">—</span>
                      )}

                      {c.interested_in && (
                        <div className="flex items-center gap-1 flex-wrap mt-1.5">
                          {c.interested_in.toLowerCase().includes('gold') && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[9px] font-bold">
                              🟡 Gold
                            </span>
                          )}
                          {c.interested_in.toLowerCase().includes('diamond') && (
                            <span className="px-1.5 py-0.5 rounded bg-cyan-50 border border-cyan-200 text-cyan-800 text-[9px] font-bold">
                              💎 Diamond
                            </span>
                          )}
                          {c.interested_in.toLowerCase().includes('silver') && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-700 text-[9px] font-bold">
                              ⚪ Silver
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* 5. Google Review */}
                    <td className="px-4 py-3.5 align-top max-w-[180px]">
                      {c.has_google_review ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-[#D97706] font-bold text-[11px]">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{c.google_review_rating || 5} Stars</span>
                          </div>
                          {c.google_review_text && (
                            <p className="text-[11px] text-[#5E5A52] italic truncate" title={c.google_review_text}>
                              "{c.google_review_text}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#A1A1AA] italic">No review</span>
                      )}
                    </td>

                    {/* 6. Notes & Remarks */}
                    <td className="px-4 py-3.5 align-top max-w-[220px]">
                      <p className="text-xs text-[#5E5A52] line-clamp-2" title={c.notes}>
                        {c.notes || <span className="text-[#A1A1AA] italic">—</span>}
                      </p>
                    </td>

                    {/* 7. Actions */}
                    <td className="px-4 py-3.5 align-top text-right shrink-0">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(c)}
                          title="Edit Customer Lead"
                          className="p-1.5 text-[#8A8479] hover:text-[#065F46] hover:bg-[#D1FAE5] rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          title="Delete Lead Record"
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

      {/* Add / Edit Customer Lead Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingCustomer(null);
        }}
        title={editingCustomer ? 'Edit Outdoor Customer Lead' : 'Add Outdoor Customer Lead'}
        subtitle={`Log field prospect details acquired for ${selectedBranch?.name || 'Showroom'}`}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowAddModal(false);
                setEditingCustomer(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmitForm} isLoading={isSubmitting}>
              {editingCustomer ? 'Update Lead' : 'Save Customer Lead'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Customer Full Name *"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              placeholder="e.g. Ramesh Kumar"
              required
              autoFocus
            />
            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g. 9876543210"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date of Birth (DOB)"
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            />
            <Input
              label="Wedding Anniversary Date"
              type="date"
              value={formData.anniversary_date}
              onChange={(e) => setFormData({ ...formData, anniversary_date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Assisting Field Marketer (Staff) *"
              value={formData.marketing_employee_id}
              onChange={(e) => setFormData({ ...formData, marketing_employee_id: e.target.value })}
              options={employees.map((emp) => ({
                value: emp.id.toString(),
                label: `${emp.full_name} ${emp.employee_code ? `(#${emp.employee_code})` : ''}`,
              }))}
            />
            <Input
              label="Campaign Area / Location *"
              value={formData.area_name}
              onChange={(e) => setFormData({ ...formData, area_name: e.target.value })}
              placeholder="e.g. Yelahanka Old Town Market"
              required
            />
          </div>

          {/* Scheme Selection (The 3 schemes) */}
          <div>
            <label className="block text-xs font-semibold text-[#1D1D1B] mb-1.5">
              Promoted Jewellery Scheme
            </label>
            <select
              value={formData.scheme_name}
              onChange={(e) => setFormData({ ...formData, scheme_name: e.target.value })}
              className="w-full text-xs font-semibold select-luxury-beige rounded-xl p-2.5 cursor-pointer"
            >
              {SCHEMES.map((sch) => (
                <option key={sch} value={sch}>
                  {sch}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SCHEMES.map((sch) => (
                <button
                  key={sch}
                  type="button"
                  onClick={() => setFormData({ ...formData, scheme_name: sch })}
                  className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                    formData.scheme_name === sch
                      ? 'bg-[#FEF3C7] border-[#D97706] text-[#92400E] shadow-2xs font-extrabold'
                      : 'bg-white border-[#E4DFD4] text-[#5E5A52] hover:bg-[#FAF8F3]'
                  }`}
                >
                  {formData.scheme_name === sch ? '✓ ' : ''}{sch}
                </button>
              ))}
            </div>
          </div>

          {/* Jewelry Interest Checkboxes */}
          <div>
            <label className="block text-xs font-semibold text-[#1D1D1B] mb-1.5">
              Customer Interested In
            </label>
            <div className="flex items-center gap-4 text-xs font-bold text-[#1D1D1B]">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.interested_gold}
                  onChange={(e) => setFormData({ ...formData, interested_gold: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>🟡 Gold Jewellery</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.interested_diamond}
                  onChange={(e) => setFormData({ ...formData, interested_diamond: e.target.checked })}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>💎 Diamond Collection</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.interested_silver}
                  onChange={(e) => setFormData({ ...formData, interested_silver: e.target.checked })}
                  className="rounded text-slate-600 focus:ring-slate-500"
                />
                <span>⚪ Silver Articles</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Lead Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'Lead', label: 'New Lead' },
                { value: 'Interested', label: 'Interested / Visit Promised' },
                { value: 'Converted', label: 'Converted / Enrolled' },
                { value: 'Contacted', label: 'Contacted' },
                { value: 'Closed', label: 'Closed' },
                { value: 'Lost', label: 'Not Interested' },
              ]}
            />
            <Input
              label="Campaign Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          {/* Google Review Checkbox */}
          <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E6E1] space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.has_google_review}
                onChange={(e) => setFormData({ ...formData, has_google_review: e.target.checked })}
                className="w-4 h-4 rounded text-[#D97706] focus:ring-[#D97706]"
              />
              <span className="text-xs font-bold text-[#1D1D1B] flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-[#D97706] fill-current" />
                <span>Customer Posted 5-Star Google Review</span>
              </span>
            </label>

            {formData.has_google_review && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div>
                  <Select
                    label="Rating"
                    value={formData.google_review_rating.toString()}
                    onChange={(e) => setFormData({ ...formData, google_review_rating: parseInt(e.target.value) || 5 })}
                    options={[
                      { value: '5', label: '⭐⭐⭐⭐⭐ 5 Stars' },
                      { value: '4', label: '⭐⭐⭐⭐ 4 Stars' },
                      { value: '3', label: '⭐⭐⭐ 3 Stars' },
                    ]}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Review Feedback Snippet"
                    value={formData.google_review_text}
                    onChange={(e) => setFormData({ ...formData, google_review_text: e.target.value })}
                    placeholder="e.g. Very helpful staff and nice gold plans..."
                  />
                </div>
              </div>
            )}
          </div>

          <Input
            label="Inquiries & Follow-up Remarks"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="e.g. Promised showroom visit on Sunday for bridal set inquiry"
          />
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Customer Lead"
        message={`Are you sure you want to delete the outdoor customer lead for "${deleteTarget?.customer_name || 'Customer'}"? This action cannot be undone.`}
        confirmText="Delete Lead"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteCustomer}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
