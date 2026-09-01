import React, { useEffect, useState, useCallback } from 'react';
import {
  Compass,
  Search,
  Filter,
  Building2,
  Users,
  MapPin,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Star,
  Camera,
  Image as ImageIcon,
  Phone,
  Cake,
  Heart,
  Download,
  Eye,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  RotateCcw,
  Award,
  Clock,
} from 'lucide-react';
import { AdminKPICard } from '../../../components/admin/ui/AdminKPICard';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Button } from '../../../components/ui/Button';
import { useAdminBranch } from '../../../context/AdminBranchContext';
import { useToast } from '../../../context/ToastContext';
import api from '../../../api/client';

// ----------------------------------------------------
// Interfaces
// ----------------------------------------------------
interface AdminOutdoorCustomer {
  id: number;
  branch_id: number;
  branch_name: string;
  branch_code: string;
  marketing_employee_id: number;
  marketing_employee_name: string;
  marketing_employee_code: string;
  customer_name: string;
  phone?: string;
  dob?: string;
  anniversary_date?: string;
  is_converted: boolean;
  has_google_review: boolean;
  google_review_rating?: number;
  google_review_text?: string;
  area_name?: string;
  scheme_name?: string;
  date: string;
  status: string;
  notes?: string;
}

interface AdminOutdoorDuty {
  id: number;
  branch_id: number;
  branch_name: string;
  branch_code: string;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  designation: string;
  department: string;
  date: string;
  area?: string;
  scheme_name?: string;
  customers_attended_count: number;
  converted_customers_count: number;
  google_ratings_count: number;
  photo_url?: string;
  photo_urls: string[];
  notes?: string;
  status: string;
  customers: AdminOutdoorCustomer[];
  created_at?: string;
}

interface AdminOutdoorOverview {
  total_duties: number;
  total_attended: number;
  total_converted: number;
  total_google_ratings: number;
  total_photos: number;
  conversion_rate: number;
  branch_metrics: {
    branch_id: number;
    branch_name: string;
    branch_code: string;
    duties_count: number;
    attended_count: number;
    converted_count: number;
    google_ratings_count: number;
    conversion_rate: number;
  }[];
}

interface LightboxState {
  photos: string[];
  currentIndex: number;
  title: string;
  subtitle: string;
  date?: string;
}

// ----------------------------------------------------
// Main Admin Component
// ----------------------------------------------------
export const AdminOutdoorMarketingPage: React.FC = () => {
  const { branches, selectedBranchId } = useAdminBranch();
  const { error: toastError, success } = useToast();

  const [overview, setOverview] = useState<AdminOutdoorOverview | null>(null);
  const [duties, setDuties] = useState<AdminOutdoorDuty[]>([]);
  const [customers, setCustomers] = useState<AdminOutdoorCustomer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & State
  const [activeTab, setActiveTab] = useState<'duties' | 'customers' | 'branches' | 'photos'>('duties');
  const [branchFilter, setBranchFilter] = useState<string>(selectedBranchId?.toString() || 'all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [viewDetailDuty, setViewDetailDuty] = useState<AdminOutdoorDuty | null>(null);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  const fetchOutdoorData = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {};
      if (branchFilter !== 'all') params.branch_id = parseInt(branchFilter);
      if (selectedDate) params.date_filter = selectedDate;

      const [overviewRes, dutiesRes, customersRes] = await Promise.all([
        api.get<AdminOutdoorOverview>('/api/v1/admin/outdoor/overview', { params }),
        api.get<AdminOutdoorDuty[]>('/api/v1/admin/outdoor/duties', { params }),
        api.get<AdminOutdoorCustomer[]>('/api/v1/admin/outdoor/customers', { params }),
      ]);

      setOverview(overviewRes.data);
      setDuties(dutiesRes.data || []);
      setCustomers(customersRes.data || []);
    } catch (err) {
      console.error('Failed to load admin outdoor marketing data:', err);
      toastError('Failed to fetch outdoor marketing records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOutdoorData();
  }, [branchFilter, selectedDate]);

  // CSV Export
  const handleExportCSV = async () => {
    try {
      const params: Record<string, any> = {};
      if (branchFilter !== 'all') params.branch_id = parseInt(branchFilter);
      if (selectedDate) params.date_filter = selectedDate;

      const res = await api.get('/api/v1/admin/outdoor/customers/export-csv', {
        params,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `admin_outdoor_customers_${selectedDate || 'all'}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      success('Organization-wide outdoor leads exported to CSV!');
    } catch (err) {
      console.error('CSV Export failed:', err);
      toastError('Failed to export CSV file.');
    }
  };

  // Lightbox Handlers
  const handleOpenLightbox = useCallback((photos: string[], index: number, title: string, subtitle: string) => {
    setLightbox({
      photos,
      currentIndex: index,
      title,
      subtitle,
      date: selectedDate,
    });
  }, [selectedDate]);

  const handlePrevLightbox = () => {
    if (!lightbox) return;
    setLightbox((prev) => {
      if (!prev) return null;
      const nextIdx = (prev.currentIndex - 1 + prev.photos.length) % prev.photos.length;
      return { ...prev, currentIndex: nextIdx };
    });
  };

  const handleNextLightbox = () => {
    if (!lightbox) return;
    setLightbox((prev) => {
      if (!prev) return null;
      const nextIdx = (prev.currentIndex + 1) % prev.photos.length;
      return { ...prev, currentIndex: nextIdx };
    });
  };

  // Filtered lists
  const filteredCustomers = customers.filter((c) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.customer_name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.area_name?.toLowerCase().includes(q) ||
      c.scheme_name?.toLowerCase().includes(q) ||
      c.branch_name?.toLowerCase().includes(q) ||
      c.marketing_employee_name?.toLowerCase().includes(q)
    );
  });

  const filteredDuties = duties.filter((d) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      d.employee_name?.toLowerCase().includes(q) ||
      d.employee_code?.toLowerCase().includes(q) ||
      d.area?.toLowerCase().includes(q) ||
      d.scheme_name?.toLowerCase().includes(q) ||
      d.branch_name?.toLowerCase().includes(q)
    );
  });

  const dutiesWithPhotos = duties.filter((d) => {
    const p = d.photo_urls && d.photo_urls.length > 0 ? d.photo_urls : (d.photo_url ? [d.photo_url] : []);
    return p.length > 0;
  });

  return (
    <div className="space-y-7 pb-16">
      {/* ----------------------------------------------------
          1. HEADER & CONTROL BAR
      ---------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EBE6DC] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#21845F] bg-[#E8F4EE] px-2.5 py-1 rounded-full border border-[#C5E3D5]">
              Enterprise Field Oversight
            </span>
            <span className="text-xs text-[#8A8479] font-medium">
              {branches.length} Showroom Branches Monitored
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1D1D1B] tracking-tight mt-1 flex items-center gap-2">
            <Compass className="w-6 h-6 text-[#21845F]" />
            <span>Outdoor Marketing & Daily Field Operations</span>
          </h1>
          <p className="text-xs text-[#8A8479] font-medium mt-0.5">
            Cross-branch field assignments, customer acquisition, birthday/anniversary records, Google reviews & photo audits.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Branch Filter */}
          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-[#E4DFD4] shadow-2xs">
            <Building2 className="w-4 h-4 text-[#8A8479] ml-1.5" />
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#1D1D1B] pr-2 focus:outline-none cursor-pointer"
            >
              <option value="all">All Branches ({branches.length})</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id.toString()}>
                  {b.name} Showroom
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-[#E4DFD4] shadow-2xs">
            <Calendar className="w-4 h-4 text-[#8A8479] ml-1.5" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#1D1D1B] pr-2 focus:outline-none cursor-pointer"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="text-[10px] text-[#8A8479] hover:text-[#C24141] px-1 font-bold"
                title="Clear date"
              >
                Clear
              </button>
            )}
          </div>

          <button
            onClick={fetchOutdoorData}
            title="Refresh Data"
            className="p-2 bg-white hover:bg-[#F0F7F4] text-[#21845F] rounded-xl border border-[#C5E3D5] shadow-2xs transition-colors cursor-pointer"
          >
            <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------
          2. KPI SUMMARY CARDS
      ---------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <AdminKPICard
          title="Staff Dispatched"
          value={overview?.total_duties || 0}
          subtitle="Field Duty Records"
          icon={<Users className="w-5 h-5 text-[#21845F]" />}
          iconBgColor="bg-[#E8F4EE] border-[#C5E3D5] text-[#21845F]"
        />

        <AdminKPICard
          title="Customers Attended"
          value={overview?.total_attended || 0}
          subtitle="Visitors Reached"
          icon={<Compass className="w-5 h-5 text-[#23815F]" />}
          iconBgColor="bg-[#E8F4EE] border-[#C5E3D5] text-[#23815F]"
        />

        <AdminKPICard
          title="Schemes Converted"
          value={overview?.total_converted || 0}
          subtitle="Enrolled Subscribers"
          icon={<Award className="w-5 h-5 text-[#9A782F]" />}
          iconBgColor="bg-[#FAF6EB] border-[#C6A45C]/30 text-[#9A782F]"
        />

        <AdminKPICard
          title="Google ⭐ Ratings"
          value={overview?.total_google_ratings || 0}
          subtitle="5-Star Showroom Reviews"
          icon={<Star className="w-5 h-5 text-amber-600" />}
          iconBgColor="bg-amber-50 border-amber-200 text-amber-600"
        />

        <AdminKPICard
          title="Field Photos & Proofs"
          value={overview?.total_photos || 0}
          subtitle="Verified Campaign Proofs"
          icon={<Camera className="w-5 h-5 text-[#526F91]" />}
          iconBgColor="bg-[#EDF2F8] border-[#C6D4E3] text-[#526F91]"
        />
      </div>

      {/* ----------------------------------------------------
          3. TAB NAVIGATION
      ---------------------------------------------------- */}
      <div className="p-3 bg-white border border-[#E4DFD4] rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('duties')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'duties'
                ? 'bg-[#21845F] text-white shadow-2xs'
                : 'bg-[#FAF8F3] text-[#5E5A52] hover:text-[#1D1D1B]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Daily Staff Status ({duties.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'customers'
                ? 'bg-[#21845F] text-white shadow-2xs'
                : 'bg-[#FAF8F3] text-[#5E5A52] hover:text-[#1D1D1B]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customer Leads ({customers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('branches')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'branches'
                ? 'bg-[#21845F] text-white shadow-2xs'
                : 'bg-[#FAF8F3] text-[#5E5A52] hover:text-[#1D1D1B]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Branch Performance Comparison ({overview?.branch_metrics?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('photos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'photos'
                ? 'bg-[#21845F] text-white shadow-2xs'
                : 'bg-[#FAF8F3] text-[#5E5A52] hover:text-[#1D1D1B]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Field Photo Proofs ({overview?.total_photos || 0})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-[#8A8479] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search staff, lead, area..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-medium focus:outline-none"
            />
          </div>

          {activeTab === 'customers' && (
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#21845F] hover:bg-[#1B694C] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------
          4. TAB CONTENT
      ---------------------------------------------------- */}
      {isLoading ? (
        <div className="py-20 bg-white border border-[#E4DFD4] rounded-3xl shadow-xs flex justify-center">
          <LoadingSpinner message="Fetching organization outdoor marketing metrics..." />
        </div>
      ) : (
        <>
          {/* TAB 1: DAILY STAFF FIELD DUTIES */}
          {activeTab === 'duties' && (
            <div className="space-y-4">
              {filteredDuties.length === 0 ? (
                <EmptyState
                  title="No staff outdoor duties found"
                  description="No employee field logs matching the selected branch/date filters."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDuties.map((duty) => {
                    const photos = duty.photo_urls && duty.photo_urls.length > 0
                      ? duty.photo_urls
                      : (duty.photo_url ? [duty.photo_url] : []);

                    return (
                      <div
                        key={duty.id}
                        onClick={() => setViewDetailDuty(duty)}
                        className="bg-white border border-[#C5E3D5] hover:border-[#21845F] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-4 flex flex-col justify-between group"
                      >
                        <div className="space-y-3">
                          {/* Top: Branch Badge, Staff Code, Status */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]">
                              {duty.branch_name} ({duty.branch_code})
                            </span>
                            <span className="text-[10px] font-mono font-bold text-[#8A8479]">
                              📅 {duty.date}
                            </span>
                          </div>

                          {/* Staff Info */}
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5] flex items-center justify-center font-extrabold text-sm shadow-2xs group-hover:scale-105 transition-transform">
                              {duty.employee_name?.charAt(0) || 'E'}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-extrabold text-[#1D1D1B] truncate group-hover:text-[#21845F] transition-colors">
                                {duty.employee_name}
                              </h4>
                              <p className="text-[11px] text-[#5E5A52] truncate">
                                {duty.employee_code} • {duty.designation}
                              </p>
                            </div>
                          </div>

                          {/* Area & Scheme */}
                          <div className="p-2.5 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] space-y-1 text-xs">
                            <div className="flex items-center gap-1.5 font-bold text-[#1D1D1B] truncate">
                              <MapPin className="w-3.5 h-3.5 text-[#21845F] shrink-0" />
                              <span className="truncate">{duty.area || 'Area Not Logged'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#9A782F] font-semibold truncate">
                              <Award className="w-3.5 h-3.5 text-[#9A782F] shrink-0" />
                              <span className="truncate">{duty.scheme_name || 'General Scheme'}</span>
                            </div>
                          </div>

                          {/* Metrics Badges */}
                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="p-1.5 rounded-lg bg-[#E8F4EE]">
                              <span className="text-[9px] font-bold text-[#5E5A52] block">Attended</span>
                              <span className="font-extrabold text-[#21845F]">{duty.customers_attended_count}</span>
                            </div>
                            <div className="p-1.5 rounded-lg bg-[#FAF6EB]">
                              <span className="text-[9px] font-bold text-[#5E5A52] block">Converted</span>
                              <span className="font-extrabold text-[#9A782F]">{duty.converted_customers_count}</span>
                            </div>
                            <div className="p-1.5 rounded-lg bg-amber-50">
                              <span className="text-[9px] font-bold text-amber-800 block">Google ⭐</span>
                              <span className="font-extrabold text-amber-600">{duty.google_ratings_count}</span>
                            </div>
                          </div>

                          {/* Photo Strip */}
                          {photos.length > 0 && (
                            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                              {photos.slice(0, 4).map((pUrl, pIdx) => (
                                <img
                                  key={pIdx}
                                  src={pUrl}
                                  alt="Proof"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenLightbox(
                                      photos,
                                      pIdx,
                                      `${duty.employee_name} (${duty.branch_name})`,
                                      `Area: ${duty.area} • Date: ${duty.date}`
                                    );
                                  }}
                                  className="w-10 h-10 rounded-lg object-cover border border-[#C5E3D5] shrink-0 hover:scale-105 transition-transform"
                                />
                              ))}
                              {photos.length > 4 && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]">
                                  +{photos.length - 4}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Card Footer */}
                        <div className="pt-2.5 border-t border-[#E8E6E1] flex items-center justify-between text-xs font-bold text-[#21845F] group-hover:underline">
                          <span>Inspect Full Work Done →</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ALL CUSTOMER LEADS & REVIEWS */}
          {activeTab === 'customers' && (
            <div className="bg-white border border-[#E4DFD4] rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase font-bold text-[11px]">
                    <tr>
                      <th className="px-4 py-3.5">Branch</th>
                      <th className="px-4 py-3.5">Customer Name</th>
                      <th className="px-4 py-3.5">Phone Number</th>
                      <th className="px-4 py-3.5">DOB & Anniversary</th>
                      <th className="px-4 py-3.5">Google Review</th>
                      <th className="px-4 py-3.5">Staff Rep</th>
                      <th className="px-4 py-3.5">Area & Scheme</th>
                      <th className="px-4 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBE6DC] font-medium">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-[#8A8479]">
                          No customer leads match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((cust) => (
                        <tr key={cust.id} className="hover:bg-[#FAFDFB] transition-colors">
                          <td className="px-4 py-3.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FAF8F3] text-[#5E5A52] border border-[#E4DFD4]">
                              {cust.branch_name}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-bold text-[#1D1D1B]">{cust.customer_name}</td>
                          <td className="px-4 py-3.5 font-mono text-[#5E5A52]">
                            {cust.phone ? (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-[#21845F]" />
                                {cust.phone}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-[#5E5A52]">
                            <div className="space-y-0.5 text-[11px]">
                              {cust.dob && <div>🎂 {cust.dob}</div>}
                              {cust.anniversary_date && <div>💍 {cust.anniversary_date}</div>}
                              {!cust.dob && !cust.anniversary_date && <span>—</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            {cust.has_google_review ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                                  {cust.google_review_rating || 5} Stars
                                </span>
                                {cust.google_review_text && (
                                  <p className="text-[10px] text-[#5E5A52] italic max-w-xs truncate">
                                    "{cust.google_review_text}"
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-[#8A8479] text-[10px]">No review</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-[#5E5A52]">
                            <div className="font-semibold text-[#1D1D1B]">{cust.marketing_employee_name}</div>
                            <div className="text-[10px] text-[#8A8479] font-mono">{cust.marketing_employee_code}</div>
                          </td>
                          <td className="px-4 py-3.5 text-[#5E5A52]">
                            <div className="font-medium text-[#1D1D1B]">{cust.area_name || 'Field'}</div>
                            <div className="text-[10px] text-[#9A782F] font-semibold truncate">{cust.scheme_name || 'Scheme'}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                cust.is_converted
                                  ? 'bg-[#FAF6EB] text-[#9A782F] border border-[#C6A45C]/30'
                                  : 'bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]'
                              }`}
                            >
                              {cust.is_converted ? '🏆 Converted' : '👥 Attended'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: BRANCH PERFORMANCE COMPARISON */}
          {activeTab === 'branches' && (
            <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#1D1D1B]">
                    Branch-by-Branch Field Outreach Comparison
                  </h3>
                  <p className="text-xs text-[#8A8479] mt-0.5">
                    Compare outdoor marketing output, customer inquiries, enrolled schemes, and conversion rates across all showrooms.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase font-bold text-[11px]">
                    <tr>
                      <th className="px-4 py-3.5">Branch Showroom</th>
                      <th className="px-4 py-3.5">Code</th>
                      <th className="px-4 py-3.5">Staff Dispatched</th>
                      <th className="px-4 py-3.5">Customers Attended</th>
                      <th className="px-4 py-3.5">Schemes Converted</th>
                      <th className="px-4 py-3.5">Google ⭐ Reviews</th>
                      <th className="px-4 py-3.5">Conversion Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBE6DC] font-medium">
                    {overview?.branch_metrics?.map((bm) => (
                      <tr key={bm.branch_id} className="hover:bg-[#FAFDFB] transition-colors">
                        <td className="px-4 py-3.5 font-bold text-[#1D1D1B] flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#21845F]" />
                          <span>{bm.branch_name} Showroom</span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[#8A8479] font-bold">{bm.branch_code}</td>
                        <td className="px-4 py-3.5 font-bold text-[#1D1D1B]">{bm.duties_count}</td>
                        <td className="px-4 py-3.5 font-bold text-[#21845F]">{bm.attended_count}</td>
                        <td className="px-4 py-3.5 font-bold text-[#9A782F]">{bm.converted_count}</td>
                        <td className="px-4 py-3.5 font-bold text-amber-600">{bm.google_ratings_count}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-[#1D1D1B]">{bm.conversion_rate}%</span>
                            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#21845F] rounded-full"
                                style={{ width: `${Math.min(bm.conversion_rate, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: FIELD PHOTO PROOFS GALLERY */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              {dutiesWithPhotos.length === 0 ? (
                <EmptyState
                  title="No field photo proofs found"
                  description="No camera uploads or proof images logged for this selection."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dutiesWithPhotos.map((duty) => {
                    const photos = duty.photo_urls && duty.photo_urls.length > 0
                      ? duty.photo_urls
                      : (duty.photo_url ? [duty.photo_url] : []);

                    return (
                      <div
                        key={duty.id}
                        className="bg-white border border-[#C5E3D5] rounded-2xl p-4 space-y-3 shadow-2xs hover:shadow-xs transition-all"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#E8E6E1]">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5] flex items-center justify-center font-extrabold text-xs shrink-0 shadow-2xs">
                              {duty.employee_name?.charAt(0) || 'E'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-xs font-extrabold text-[#1D1D1B] truncate">
                                  {duty.employee_name}
                                </h4>
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5] shrink-0">
                                  {duty.branch_name}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#5E5A52] truncate flex items-center gap-1.5 mt-0.5">
                                <span>📍 {duty.area || 'Field Area'}</span>
                                <span>•</span>
                                <span className="truncate">🏆 {duty.scheme_name || 'Scheme'}</span>
                              </p>
                            </div>
                          </div>

                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[#FAF8F3] text-[#21845F] border border-[#C5E3D5] shrink-0">
                            📸 {photos.length}
                          </span>
                        </div>

                        {/* Compact Photo Thumbnails Strip */}
                        <div className="flex items-center gap-2 overflow-x-auto py-1">
                          {photos.map((photoUrl, pIdx) => (
                            <div
                              key={pIdx}
                              onClick={() =>
                                handleOpenLightbox(
                                  photos,
                                  pIdx,
                                  `${duty.employee_name} — Photo #${pIdx + 1}`,
                                  `Branch: ${duty.branch_name} • Area: ${duty.area} • Date: ${duty.date}`
                                )
                              }
                              className="relative group shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-[#C5E3D5] bg-black/5 hover:border-[#21845F] shadow-2xs hover:shadow-md transition-all cursor-pointer"
                            >
                              <img
                                src={photoUrl}
                                alt={`Proof #${pIdx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ZoomIn className="w-4 h-4 text-white drop-shadow" />
                              </div>
                              <span className="absolute bottom-1 left-1 px-1 py-0.2 bg-black/60 text-white text-[9px] font-bold rounded">
                                #{pIdx + 1}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 border-t border-[#F0F7F4] flex items-center justify-between text-[11px] text-[#5E5A52]">
                          <span className="italic">Click thumbnail to expand full-screen</span>
                          <span className="font-semibold text-[#21845F]">Date: {duty.date}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ----------------------------------------------------
          FULL WORK DETAILS MODAL (ADMIN DRILL-DOWN)
      ---------------------------------------------------- */}
      {viewDetailDuty && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-3xl overflow-hidden max-w-4xl w-full shadow-2xl border border-[#C5E3D5] flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E8E6E1] flex items-center justify-between bg-[#FAF8F3]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5] flex items-center justify-center font-extrabold text-lg shadow-2xs">
                  {viewDetailDuty.employee_name?.charAt(0) || 'E'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-[#1D1D1B]">
                      {viewDetailDuty.employee_name}
                    </h3>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white text-[#21845F] border border-[#C5E3D5]">
                      {viewDetailDuty.employee_code}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]">
                      {viewDetailDuty.branch_name} Showroom
                    </span>
                  </div>
                  <p className="text-xs text-[#5E5A52] mt-0.5">
                    {viewDetailDuty.designation} • {viewDetailDuty.department} • 📅 Field Date: {viewDetailDuty.date}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewDetailDuty(null)}
                className="p-2 rounded-full hover:bg-[#E8E6E1] text-[#1D1D1B] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
              {/* Overview Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-[#FAF8F3] border border-[#E4DFD4]">
                  <span className="text-[10px] font-bold text-[#8A8479] uppercase block">Targeted Area</span>
                  <span className="text-xs font-extrabold text-[#1D1D1B] mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#21845F]" />
                    {viewDetailDuty.area || 'N/A'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[#FAF8F3] border border-[#E4DFD4]">
                  <span className="text-[10px] font-bold text-[#8A8479] uppercase block">Promoted Scheme</span>
                  <span className="text-xs font-extrabold text-[#9A782F] mt-1 flex items-center gap-1 truncate">
                    <Award className="w-3.5 h-3.5 text-[#9A782F]" />
                    {viewDetailDuty.scheme_name || 'N/A'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[#E8F4EE] border border-[#C5E3D5]">
                  <span className="text-[10px] font-bold text-[#5E5A52] uppercase block">Customers Reached</span>
                  <span className="text-base font-extrabold text-[#21845F] mt-0.5 block">
                    {viewDetailDuty.customers_attended_count || viewDetailDuty.customers.length} Attended • {viewDetailDuty.converted_customers_count} Converted
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                  <span className="text-[10px] font-bold text-amber-800 uppercase block">Google ⭐ Ratings</span>
                  <span className="text-base font-extrabold text-amber-600 mt-0.5 block">
                    {viewDetailDuty.customers.filter((c) => c.has_google_review).length || viewDetailDuty.google_ratings_count} Reviews Collected
                  </span>
                </div>
              </div>

              {/* Customers Met */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-[#1D1D1B] uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#21845F]" />
                  <span>All Customers Met on Field ({viewDetailDuty.customers.length})</span>
                </h4>

                {viewDetailDuty.customers.length === 0 ? (
                  <p className="text-xs text-[#8A8479] italic p-4 bg-[#FAF8F3] rounded-2xl border border-[#E4DFD4]">
                    No individual customer contact details were recorded for this day.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {viewDetailDuty.customers.map((cust) => (
                      <div
                        key={cust.id}
                        className={`p-4 rounded-2xl border space-y-2 ${
                          cust.is_converted
                            ? 'bg-[#FAF6EB] border-[#C6A45C]/40'
                            : 'bg-white border-[#C5E3D5]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-[#1D1D1B]">
                            {cust.customer_name}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              cust.is_converted
                                ? 'bg-amber-100 text-[#9A782F] border border-[#C6A45C]/30'
                                : 'bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]'
                            }`}
                          >
                            {cust.is_converted ? '🏆 Converted' : '👥 Attended'}
                          </span>
                        </div>

                        <div className="text-xs text-[#5E5A52] font-mono flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-[#21845F]" />
                          <span>{cust.phone || 'Phone not provided'}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-[#5E5A52] pt-1 border-t border-[#E8E6E1]">
                          <div>
                            <strong>DOB:</strong> {cust.dob ? `🎂 ${cust.dob}` : '—'}
                          </div>
                          <div>
                            <strong>Anniversary:</strong> {cust.anniversary_date ? `💍 ${cust.anniversary_date}` : '—'}
                          </div>
                        </div>

                        {cust.has_google_review && (
                          <div className="p-2 bg-white rounded-xl border border-amber-200 text-xs text-amber-700 flex items-start gap-1.5">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 mt-0.5 shrink-0" />
                            <div>
                              <strong>Google Review: {cust.google_review_rating || 5} Stars</strong>
                              {cust.google_review_text && (
                                <p className="text-[10px] text-[#5E5A52] italic mt-0.5">
                                  "{cust.google_review_text}"
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {cust.notes && (
                          <p className="text-[11px] text-[#5E5A52] italic bg-white/70 p-2 rounded-lg">
                            Notes: "{cust.notes}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Photos Gallery */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-[#1D1D1B] uppercase tracking-wider flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#21845F]" />
                  <span>Field Photos Uploaded</span>
                </h4>

                {viewDetailDuty.photo_urls && viewDetailDuty.photo_urls.length > 0 ? (
                  <div className="flex items-center gap-2.5 overflow-x-auto py-1">
                    {viewDetailDuty.photo_urls.map((photoUrl, pIdx) => (
                      <div
                        key={pIdx}
                        onClick={() =>
                          handleOpenLightbox(
                            viewDetailDuty.photo_urls || [],
                            pIdx,
                            `${viewDetailDuty.employee_name} — Photo #${pIdx + 1}`,
                            `Branch: ${viewDetailDuty.branch_name} • Area: ${viewDetailDuty.area} • Date: ${viewDetailDuty.date}`
                          )
                        }
                        className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-[#C5E3D5] bg-black/5 cursor-pointer group shadow-2xs shrink-0"
                      >
                        <img
                          src={photoUrl}
                          alt="Proof"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn className="w-4 h-4 text-white drop-shadow" />
                        </div>
                        <span className="absolute bottom-1 left-1 px-1 py-0.2 bg-black/60 text-white text-[8px] font-bold rounded">
                          #{pIdx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#8A8479] italic p-4 bg-[#FAF8F3] rounded-2xl border border-[#E4DFD4]">
                    No photos uploaded for this duty.
                  </p>
                )}
              </div>

              {/* Notes */}
              {viewDetailDuty.notes && (
                <div className="p-4 bg-[#FAF8F3] border border-[#E4DFD4] rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-[#8A8479] uppercase">
                    Staff Field Remarks & Feedback
                  </span>
                  <p className="text-xs text-[#1D1D1B] font-medium italic">
                    "{viewDetailDuty.notes}"
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E8E6E1] bg-[#FAF8F3] flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewDetailDuty(null)}
              >
                Close Full Details
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          FULL-SCREEN PHOTO LIGHTBOX MODAL
      ---------------------------------------------------- */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative bg-white rounded-3xl overflow-hidden max-w-4xl w-full shadow-2xl border border-[#C5E3D5] flex flex-col max-h-[92vh]">
            <div className="p-4 sm:p-5 border-b border-[#E8E6E1] flex items-center justify-between bg-[#FAF8F3]">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-extrabold text-[#1D1D1B]">
                    {lightbox.title}
                  </h4>
                  {lightbox.photos.length > 1 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]">
                      {lightbox.currentIndex + 1} / {lightbox.photos.length}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#5E5A52] mt-0.5 font-medium">
                  {lightbox.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={lightbox.photos[lightbox.currentIndex]}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="p-2 rounded-xl bg-white hover:bg-[#F0F7F4] text-[#21845F] border border-[#C5E3D5] text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Save</span>
                </a>
                <button
                  onClick={() => setLightbox(null)}
                  className="p-2 rounded-xl hover:bg-[#E8E6E1] text-[#1D1D1B] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="relative flex-1 bg-[#121212] flex items-center justify-center p-3 sm:p-6 overflow-hidden min-h-88 sm:min-h-120">
              <img
                src={lightbox.photos[lightbox.currentIndex]}
                alt="Field Proof Full View"
                className="max-h-[68vh] max-w-full object-contain rounded-xl shadow-2xl"
              />

              {lightbox.photos.length > 1 && (
                <>
                  <button
                    onClick={handlePrevLightbox}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all cursor-pointer shadow-lg hover:scale-105"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>

                  <button
                    onClick={handleNextLightbox}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all cursor-pointer shadow-lg hover:scale-105"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </>
              )}
            </div>

            {lightbox.photos.length > 1 && (
              <div className="p-3 bg-[#FAF8F3] border-t border-[#E8E6E1] flex items-center justify-center gap-2 overflow-x-auto">
                {lightbox.photos.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      lightbox.currentIndex = idx;
                    }}
                    className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                      lightbox.currentIndex === idx
                        ? 'border-[#21845F] scale-105 shadow-xs'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
