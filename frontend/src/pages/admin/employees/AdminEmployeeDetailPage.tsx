import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Award,
  Star,
  Shirt,
  Compass,
  FileText,
  UserCheck,
  Building2,
  Phone,
  Mail,
  Calendar,
  ShieldCheck,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Sparkles,
  TrendingUp,
  MessageSquare,
  PhoneCall,
  Clock,
  Search,
} from 'lucide-react';
import { AdminEmployeeDetail } from '../../../types';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useToast } from '../../../context/ToastContext';
import { formatCleanBreakdownText } from '../../../utils/customerUtils';
import api from '../../../api/client';

export const AdminEmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const [data, setData] = useState<AdminEmployeeDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'customers' | 'calls' | 'schemes' | 'reviews' | 'attire' | 'outdoor' | 'gallery'>('customers');
  const [callSearchTerm, setCallSearchTerm] = useState<string>('');
  const [callStatusFilter, setCallStatusFilter] = useState<string>('all');

  const fetchEmployeeDetail = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await api.get<AdminEmployeeDetail>(`/api/v1/admin/employees/${id}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load employee details:', err);
      toastError('Failed to fetch employee 360 profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeDetail();
  }, [id]);

  if (isLoading && !data) {
    return <LoadingSpinner fullPage message="Loading Employee 360° Intelligence Profile..." />;
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/admin/employees')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E4DFD4] text-[#1D1D1B] font-bold text-xs hover:bg-[#FAF5FF] hover:border-[#D8B4FE] hover:text-[#7E22CE] transition-all cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Employee Roster</span>
        </button>
        <EmptyState
          title="Employee Not Found"
          description="The requested employee record does not exist or has been removed."
          actionText="Return to Employee Directory"
          onAction={() => navigate('/admin/employees')}
        />
      </div>
    );
  }

  const {
    employee,
    customer_activities,
    schemes,
    google_reviews,
    attire_records,
    gallery_media,
    outdoor_areas,
    outdoor_customers,
    outdoor_schemes,
    customer_feedbacks = [],
    calls = [],
    calls_done_count = 0,
    calls_pending_count = 0,
  } = data;

  const totalSchemesAmount = schemes.reduce((acc, s) => acc + (s.amount || 0), 0);
  const totalSchemesCount = schemes.reduce((acc, s) => acc + (s.customers_count || 1), 0);
  const totalCustomersAttended = customer_activities.reduce((acc, c) => acc + (c.customers_count || 1), 0);
  const totalCustomersClosed = customer_activities.filter((c) => c.status === 'Closed').reduce((acc, c) => acc + (c.customers_count || 1), 0);
  const conversionPct = totalCustomersAttended > 0 ? Math.round((totalCustomersClosed / totalCustomersAttended) * 100) : 100;

  // Calls analytics
  const callsDoneList = calls.filter((c) => c.call_status === 'Done');
  const callsPendingList = calls.filter((c) => c.call_status === 'Pending');
  const totalCallsCount = calls.length;
  const totalCallsHeadcount = calls.reduce((acc, c) => acc + (c.customers_count || 1), 0);
  const callsDoneHeadcount = callsDoneList.reduce((acc, c) => acc + (c.customers_count || 1), 0);
  const callsPendingHeadcount = callsPendingList.reduce((acc, c) => acc + (c.customers_count || 1), 0);
  const callCompletionPct = totalCallsCount > 0 ? Math.round((callsDoneList.length / totalCallsCount) * 100) : 100;

  const filteredCalls = calls.filter((c) => {
    const matchesSearch =
      !callSearchTerm.trim() ||
      c.customer_name?.toLowerCase().includes(callSearchTerm.toLowerCase()) ||
      c.phone_number?.includes(callSearchTerm) ||
      c.purpose?.toLowerCase().includes(callSearchTerm.toLowerCase()) ||
      c.notes?.toLowerCase().includes(callSearchTerm.toLowerCase());
    const matchesStatus =
      callStatusFilter === 'all' ||
      (callStatusFilter === 'done' && c.call_status === 'Done') ||
      (callStatusFilter === 'pending' && c.call_status === 'Pending');
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-7 pb-16">
      {/* -------------------------------------------------------------
          1. TOP NAVIGATION WITH BACK BUTTON
      ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/admin/employees')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-[#D8B4FE] text-[#3B0764] font-extrabold text-xs hover:bg-[#FAF5FF] hover:border-[#7E22CE] hover:text-[#7E22CE] transition-all cursor-pointer shadow-xs group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Employee Roster</span>
        </button>

        {/* Read-only Enterprise Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF5FF] border border-[#D8B4FE] text-[#7E22CE] font-bold text-xs">
          <Eye className="w-3.5 h-3.5" />
          <span>Read-Only Enterprise Mode • Managed by Showroom Manager</span>
        </div>
      </div>

      {/* -------------------------------------------------------------
          2. EMPLOYEE EXECUTIVE HEADER HERO
      ------------------------------------------------------------- */}
      <div className="relative bg-linear-to-br from-[#FAF8F3] via-white to-[#FAF5FF] border border-[#D8B4FE] rounded-3xl p-6 sm:p-8 shadow-xs overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-[#C5A869] via-[#9333EA] to-[#C5A869] opacity-70" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-linear-to-br from-[#F3E8FF] to-[#E9D5FF] border-2 border-[#D8B4FE] text-[#7E22CE] font-black text-2xl sm:text-3xl flex items-center justify-center shrink-0 shadow-md">
              {employee.full_name.charAt(0)}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-[#1D1D1B] tracking-tight">
                  {employee.full_name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-lg bg-[#FAF8F3] border border-[#E4DFD4] text-[#1D1D1B] font-mono font-bold text-xs">
                  {employee.employee_code}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold text-xs flex items-center gap-1 ${
                    employee.status === 'active'
                      ? 'bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]'
                      : 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
                  }`}
                >
                  {employee.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {employee.status === 'active' ? 'Active on Floor' : 'Inactive'}
                </span>
                {employee.is_outdoor_marketing_employee && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#21845F] bg-[#E8F4EE] px-2 py-0.5 rounded-md border border-[#C5E3D5]">
                    <Compass className="w-3 h-3" /> Outdoor Specialist
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-[#5E5A52] font-semibold">
                <span className="text-[#7E22CE] font-bold">{employee.designation}</span> • {employee.department}
              </p>

              <div className="flex items-center gap-4 sm:gap-6 text-xs text-[#5E5A52] font-medium pt-1 flex-wrap">
                <button
                  onClick={() => navigate(`/admin/branches/${employee.branch_id}`)}
                  className="flex items-center gap-1.5 font-bold text-[#3B0764] hover:text-[#7E22CE] bg-white px-2.5 py-1 rounded-lg border border-[#D8B4FE] shadow-2xs hover:shadow-xs transition-all cursor-pointer group/br"
                  title="Navigate to Showroom Details"
                >
                  <Building2 className="w-3.5 h-3.5 text-[#7E22CE]" />
                  <span>{employee.branch_name} Showroom ({employee.branch_code})</span>
                  <ExternalLink className="w-3 h-3 text-[#7E22CE] opacity-60 group-hover/br:opacity-100 transition-opacity" />
                </button>

                {employee.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#8A8479]" />
                    {employee.phone}
                  </span>
                )}
                {employee.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#8A8479]" />
                    {employee.email}
                  </span>
                )}
                {employee.manager_name && (
                  <button
                    onClick={() => navigate('/admin/managers')}
                    className="flex items-center gap-1.5 text-xs text-[#5E5A52] hover:text-[#7E22CE] transition-colors cursor-pointer"
                    title="View Showroom Managers"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#7E22CE]" />
                    <span>Manager: <strong className="text-[#1D1D1B] underline decoration-[#7E22CE]/40">{employee.manager_name}</strong></span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          3. SUMMARY METRIC CARDS
      ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
        {/* Footfall Attended */}
        <div
          onClick={() => setActiveTab('customers')}
          className="bg-white border border-[#E4DFD4] rounded-2xl p-4 shadow-2xs space-y-1 cursor-pointer hover:border-[#7E22CE] transition-colors"
        >
          <div className="flex items-center justify-between text-[#526F91]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5E5A52]">Footfall</span>
            <UserCheck className="w-4 h-4 text-[#526F91]" />
          </div>
          <p className="text-xl font-black text-[#1D1D1B]">{totalCustomersAttended}</p>
          <p className="text-[10px] text-[#21845F] font-bold">{totalCustomersClosed} Closed ({conversionPct}%)</p>
        </div>

        {/* Customer Calls */}
        <div
          onClick={() => setActiveTab('calls')}
          className="bg-white border border-[#E4DFD4] rounded-2xl p-4 shadow-2xs space-y-1 cursor-pointer hover:border-[#7E22CE] transition-colors group"
        >
          <div className="flex items-center justify-between text-[#7E22CE]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5E5A52] group-hover:text-[#7E22CE]">Calls</span>
            <PhoneCall className="w-4 h-4 text-[#7E22CE]" />
          </div>
          <p className="text-xl font-black text-[#1D1D1B]">{totalCallsCount}</p>
          <p className="text-[10px] text-[#21845F] font-bold">
            {callsDoneList.length} Done • <span className="text-amber-600 font-bold">{callsPendingList.length} Pend</span>
          </p>
        </div>

        {/* Gold Schemes */}
        <div
          onClick={() => setActiveTab('schemes')}
          className="bg-white border border-[#E4DFD4] rounded-2xl p-4 shadow-2xs space-y-1 cursor-pointer hover:border-[#7E22CE] transition-colors"
        >
          <div className="flex items-center justify-between text-[#21845F]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5E5A52]">Schemes</span>
            <Award className="w-4 h-4 text-[#21845F]" />
          </div>
          <p className="text-xl font-black text-[#1D1D1B]">{totalSchemesCount}</p>
          <p className="text-[10px] text-[#7E22CE] font-bold">₹{totalSchemesAmount.toLocaleString('en-IN')}</p>
        </div>

        {/* Reputation */}
        <div
          onClick={() => setActiveTab('reviews')}
          className="bg-white border border-[#E4DFD4] rounded-2xl p-4 shadow-2xs space-y-1 cursor-pointer hover:border-[#7E22CE] transition-colors"
        >
          <div className="flex items-center justify-between text-[#B97855]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5E5A52]">Reviews</span>
            <Star className="w-4 h-4 fill-[#B97855] text-[#B97855]" />
          </div>
          <p className="text-xl font-black text-[#1D1D1B]">{(employee.average_rating || 5.0).toFixed(1)} ★</p>
          <p className="text-[10px] text-[#5E5A52] font-semibold">{google_reviews.length} Verified</p>
        </div>

        {/* Grooming */}
        <div
          onClick={() => setActiveTab('attire')}
          className="bg-white border border-[#E4DFD4] rounded-2xl p-4 shadow-2xs space-y-1 cursor-pointer hover:border-[#7E22CE] transition-colors"
        >
          <div className="flex items-center justify-between text-[#7E22CE]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5E5A52]">Attire</span>
            <Shirt className="w-4 h-4 text-[#7E22CE]" />
          </div>
          <p className="text-xl font-black text-[#1D1D1B]">{employee.attire_compliance_pct}%</p>
          <p className="text-[10px] text-[#21845F] font-bold">{attire_records.length} Inspected</p>
        </div>

        {/* Outdoor Leads */}
        <div
          onClick={() => setActiveTab('outdoor')}
          className="bg-white border border-[#E4DFD4] rounded-2xl p-4 shadow-2xs space-y-1 cursor-pointer hover:border-[#7E22CE] transition-colors"
        >
          <div className="flex items-center justify-between text-[#21845F]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5E5A52]">Outdoor</span>
            <Compass className="w-4 h-4 text-[#21845F]" />
          </div>
          <p className="text-xl font-black text-[#1D1D1B]">{outdoor_customers.length}</p>
          <p className="text-[10px] text-[#5E5A52] font-semibold">{outdoor_areas.length} Field Areas</p>
        </div>

        {/* Form Media */}
        <div
          onClick={() => setActiveTab('gallery')}
          className="bg-white border border-[#E4DFD4] rounded-2xl p-4 shadow-2xs space-y-1 cursor-pointer hover:border-[#7E22CE] transition-colors"
        >
          <div className="flex items-center justify-between text-[#B97855]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5E5A52]">Closing Sheets</span>
            <FileText className="w-4 h-4 text-[#B97855]" />
          </div>
          <p className="text-xl font-black text-[#1D1D1B]">{gallery_media.length}</p>
          <p className="text-[10px] text-[#5E5A52] font-semibold">Store Submissions</p>
        </div>
      </div>

      {/* -------------------------------------------------------------
          4. TAB NAVIGATION
      ------------------------------------------------------------- */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 sm:p-7 shadow-[0_4px_18px_rgba(40,35,25,0.045)] space-y-6">
        <div className="flex items-center gap-2 border-b border-[#EBE6DC] pb-4 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'customers'
                ? 'bg-[#7E22CE] text-white shadow-xs'
                : 'bg-[#FAF8F3] text-[#5E5A52] hover:bg-[#FAF5FF] hover:text-[#7E22CE]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Customer Interactions ({customer_activities.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('calls')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'calls'
                ? 'bg-[#7E22CE] text-white shadow-xs'
                : 'bg-[#FAF8F3] text-[#5E5A52] hover:bg-[#FAF5FF] hover:text-[#7E22CE]'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Customer Calls ({totalCallsCount})</span>
            {callsPendingList.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                {callsPendingList.length} Pending
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('schemes')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'schemes'
                ? 'bg-[#7E22CE] text-white shadow-xs'
                : 'bg-[#FAF8F3] text-[#5E5A52] hover:bg-[#FAF5FF] hover:text-[#7E22CE]'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Gold Schemes ({schemes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'reviews'
                ? 'bg-[#7E22CE] text-white shadow-xs'
                : 'bg-[#FAF8F3] text-[#5E5A52] hover:bg-[#FAF5FF] hover:text-[#7E22CE]'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Reviews & Feedback ({google_reviews.length + (customer_feedbacks?.length || 0)})</span>
          </button>

          <button
            onClick={() => setActiveTab('attire')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'attire'
                ? 'bg-[#7E22CE] text-white shadow-xs'
                : 'bg-[#FAF8F3] text-[#5E5A52] hover:bg-[#FAF5FF] hover:text-[#7E22CE]'
            }`}
          >
            <Shirt className="w-3.5 h-3.5" />
            <span>Attire Inspection ({attire_records.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('outdoor')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'outdoor'
                ? 'bg-[#7E22CE] text-white shadow-xs'
                : 'bg-[#FAF8F3] text-[#5E5A52] hover:bg-[#FAF5FF] hover:text-[#7E22CE]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Outdoor Field Marketing ({outdoor_customers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'gallery'
                ? 'bg-[#7E22CE] text-white shadow-xs'
                : 'bg-[#FAF8F3] text-[#5E5A52] hover:bg-[#FAF5FF] hover:text-[#7E22CE]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Closing Sheets & Gallery ({gallery_media.length})</span>
          </button>
        </div>

        {/* ---------------- TAB 1: CUSTOMERS ---------------- */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#1D1D1B]">Customer Visits & Showroom Enquiries</h3>
            {customer_activities.length === 0 ? (
              <EmptyState title="No customer activity logs" description="No customer visits logged for this employee yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase font-bold text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Customer Name</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Count</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Breakdown / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBE6DC] font-medium">
                    {customer_activities.map((c) => (
                      <tr key={c.id} className="hover:bg-[#FAF5FF] transition-colors">
                        <td className="px-4 py-3 font-mono text-[#5E5A52]">{c.activity_date}</td>
                        <td className="px-4 py-3 font-bold text-[#1D1D1B]">{c.customer_name || 'Walk-in Customer'}</td>
                        <td className="px-4 py-3 text-[#5E5A52]">{c.phone_number || '—'}</td>
                        <td className="px-4 py-3 font-bold text-[#7E22CE]">{c.customers_count}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              c.status === 'Closed'
                                ? 'bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]'
                                : c.status === 'In Hold Jewellery'
                                ? 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]'
                                : 'bg-[#EFF6FF] text-[#3B82F6] border border-[#BFDBFE]'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#5E5A52] max-w-xs truncate">
                          {formatCleanBreakdownText(c.breakdown || c.notes, c.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ---------------- TAB: CUSTOMER CALLS (CALLS DONE & PENDING) ---------------- */}
        {activeTab === 'calls' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#1D1D1B] flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-[#7E22CE]" />
                  <span>Customer Calling Log (Calls Done & Pending)</span>
                </h3>
                <p className="text-xs text-[#5E5A52]">
                  Live telephonic outreach, customer phone numbers, contact headcounts, and calling statuses.
                </p>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 bg-[#FAF8F3] p-1 rounded-xl border border-[#E4DFD4]">
                <button
                  onClick={() => setCallStatusFilter('all')}
                  className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${
                    callStatusFilter === 'all'
                      ? 'bg-[#7E22CE] text-white shadow-xs'
                      : 'text-[#5E5A52] hover:text-[#1D1D1B]'
                  }`}
                >
                  All ({totalCallsCount})
                </button>
                <button
                  onClick={() => setCallStatusFilter('done')}
                  className={`px-3 py-1 text-xs rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    callStatusFilter === 'done'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-700 hover:text-emerald-800'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Calls Done ({callsDoneList.length})
                </button>
                <button
                  onClick={() => setCallStatusFilter('pending')}
                  className={`px-3 py-1 text-xs rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    callStatusFilter === 'pending'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-amber-700 hover:text-amber-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Calls Pending ({callsPendingList.length})
                </button>
              </div>
            </div>

            {/* Quick KPI stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E5A52]">Total Calls Logged</span>
                <p className="text-lg font-black text-[#1D1D1B] mt-0.5">{totalCallsCount}</p>
                <p className="text-[10px] text-[#5E5A52] font-semibold">{totalCallsHeadcount} customer contacts</p>
              </div>
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Calls Done</span>
                <p className="text-lg font-black text-emerald-700 mt-0.5">{callsDoneList.length}</p>
                <p className="text-[10px] text-emerald-700 font-semibold">{callsDoneHeadcount} customers reached</p>
              </div>
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Calls Pending</span>
                <p className="text-lg font-black text-amber-700 mt-0.5">{callsPendingList.length}</p>
                <p className="text-[10px] text-amber-700 font-semibold">{callsPendingHeadcount} awaiting follow-up</p>
              </div>
              <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800">Completion Ratio</span>
                <p className="text-lg font-black text-purple-700 mt-0.5">{callCompletionPct}%</p>
                <p className="text-[10px] text-purple-700 font-semibold">success rate</p>
              </div>
            </div>

            {/* Search toolbar */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#8A8479] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search calls by customer name, phone number, purpose, or remarks..."
                value={callSearchTerm}
                onChange={(e) => setCallSearchTerm(e.target.value)}
                className="w-full text-xs font-semibold select-luxury-beige rounded-xl pl-9 pr-3 py-2 border border-[#E4DFD4] bg-white focus:outline-none focus:border-[#7E22CE]"
              />
            </div>

            {filteredCalls.length === 0 ? (
              <EmptyState
                title="No customer calls found"
                description={
                  callSearchTerm || callStatusFilter !== 'all'
                    ? 'No calls match your active search or filter.'
                    : 'No customer calls have been logged by this employee yet.'
                }
              />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[#E4DFD4]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase font-bold text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Call Date & Time</th>
                      <th className="px-4 py-3">Customer Name</th>
                      <th className="px-4 py-3">Phone Number</th>
                      <th className="px-4 py-3 text-center">Customers Count</th>
                      <th className="px-4 py-3">Call Status</th>
                      <th className="px-4 py-3">Purpose / Subject</th>
                      <th className="px-4 py-3">Discussion Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBE6DC] font-medium bg-white">
                    {filteredCalls.map((c) => (
                      <tr key={c.id} className="hover:bg-[#FAF5FF] transition-colors">
                        <td className="px-4 py-3 font-mono text-[#5E5A52] whitespace-nowrap">
                          <div className="font-bold text-[#1D1D1B]">{c.call_date}</div>
                          {c.call_time && <div className="text-[10px] text-[#8A8479]">{c.call_time}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-[#1D1D1B]">{c.customer_name}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {c.phone_number ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={`tel:${c.phone_number}`}
                                className="font-mono text-xs font-semibold text-[#7E22CE] hover:underline flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3" />
                                {c.phone_number}
                              </a>
                              <a
                                href={`https://wa.me/91${c.phone_number.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#25D366]/10 text-[#128C7E] font-bold hover:bg-[#25D366]/20 transition-colors"
                                title="Chat on WhatsApp"
                              >
                                WA
                              </a>
                            </div>
                          ) : (
                            <span className="text-[#8A8479]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-6 px-2 py-0.5 rounded-full bg-[#FAF5FF] text-[#7E22CE] border border-[#D8B4FE] font-black text-xs">
                            {c.customers_count || 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {c.call_status === 'Done' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Calls Done
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs shadow-2xs">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              Calls Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-[#1D1D1B] bg-[#FAF8F3] px-2 py-0.5 rounded-md border border-[#E4DFD4] text-[11px]">
                            {c.purpose || 'General Follow-up'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#5E5A52] max-w-xs truncate" title={c.notes || undefined}>
                          {c.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ---------------- TAB 2: GOLD SCHEMES ---------------- */}
        {activeTab === 'schemes' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#1D1D1B]">Gold Scheme Registrations</h3>
            {schemes.length === 0 ? (
              <EmptyState title="No scheme records" description="No gold schemes enrolled by this employee yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase font-bold text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Scheme Name</th>
                      <th className="px-4 py-3">Amount (₹)</th>
                      <th className="px-4 py-3">Enrolled Count</th>
                      <th className="px-4 py-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBE6DC] font-medium">
                    {schemes.map((s) => (
                      <tr key={s.id} className="hover:bg-[#FAF5FF] transition-colors">
                        <td className="px-4 py-3 font-mono text-[#5E5A52]">{s.record_date}</td>
                        <td className="px-4 py-3 font-bold text-[#1D1D1B]">{s.customer_name || 'Enrolled Member'}</td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-[#7E22CE] bg-[#FAF5FF] px-2 py-0.5 rounded-md border border-[#D8B4FE]">
                            {s.scheme_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-[#21845F]">₹{(s.amount || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 font-bold text-[#1D1D1B]">{s.customers_count}</td>
                        <td className="px-4 py-3 text-[#5E5A52] max-w-xs truncate">{s.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ---------------- TAB 3: REVIEWS & FEEDBACK ---------------- */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* 1. In-Showroom Direct Customer Feedback */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#1D1D1B] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#23815F]" />
                <span>Showroom Customer Direct Feedback & Ratings ({customer_feedbacks.length})</span>
              </h3>
              {customer_feedbacks.length === 0 ? (
                <p className="text-xs text-[#8A8479] italic p-4 bg-[#FAF8F3] rounded-2xl border border-[#E4DFD4]">
                  No direct customer feedback logged for this employee yet. Showroom managers log direct reviews in the Manager Portal.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customer_feedbacks.map((fb) => (
                    <div key={fb.id} className="bg-white border-2 border-[#C5E3D5] rounded-2xl p-4 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[#1D1D1B] text-xs">{fb.customer_name}</span>
                        <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < fb.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                              }`}
                            />
                          ))}
                          <span className="text-[#1D1D1B] ml-1">{fb.rating}.0</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#5E5A52]">
                        <span className="px-2 py-0.5 rounded-full bg-[#FAF6EB] text-[#9A782F] font-bold border border-[#C6A45C]/30 text-[10px]">
                          {fb.category}
                        </span>
                        <span className="font-mono text-[10px] text-[#8A8479]">{fb.feedback_date}</span>
                      </div>

                      <p className="text-xs text-[#1D1D1B] italic bg-[#FAF8F3] p-2.5 rounded-xl border border-[#E4DFD4]">
                        "{fb.feedback_text}"
                      </p>

                      {fb.notes && (
                        <p className="text-[10px] text-[#5E5A52] italic">
                          Manager Note: {fb.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Google Maps Verified Reviews */}
            <div className="space-y-3 pt-3 border-t border-[#E8E6E1]">
              <h3 className="text-sm font-bold text-[#1D1D1B] flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Google Maps Public Customer Reviews ({google_reviews.length})</span>
              </h3>
              {google_reviews.length === 0 ? (
                <EmptyState title="No Google reviews recorded" description="No verified Google reviews collected by this staff member." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {google_reviews.map((r) => (
                    <div key={r.id} className="bg-[#FAF8F3] border border-[#E4DFD4] rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1D1D1B] text-xs">{r.customer_name || 'Happy Customer'}</span>
                        <div className="flex items-center gap-1 text-[#B97855] font-bold text-xs">
                          <Star className="w-3.5 h-3.5 fill-[#B97855]" />
                          <span>{r.rating}.0</span>
                        </div>
                      </div>
                      <p className="text-xs text-[#5E5A52] italic">{r.review_text || r.notes || 'Verified Google Review submitted on showroom floor.'}</p>
                      <p className="text-[10px] text-[#8A8479] font-mono">{r.review_date}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------- TAB 4: ATTIRE INSPECTION ---------------- */}
        {activeTab === 'attire' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#1D1D1B]">Daily Grooming & Attire Inspection History</h3>
            {attire_records.length === 0 ? (
              <EmptyState title="No attire checks" description="No attire inspections recorded for this staff member." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase font-bold text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Inspection Date</th>
                      <th className="px-4 py-3">Compliance Status</th>
                      <th className="px-4 py-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBE6DC] font-medium">
                    {attire_records.map((a) => (
                      <tr key={a.id} className="hover:bg-[#FAF5FF] transition-colors">
                        <td className="px-4 py-3 font-mono text-[#5E5A52]">{a.record_date}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              a.status === 'Proper'
                                ? 'bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]'
                                : 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
                            }`}
                          >
                            {a.status === 'Proper' ? '✓ Proper Standard Uniform' : '✗ Non-Compliant Uniform'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#5E5A52]">{a.notes || 'Full luxury jewellery attire adherence verified.'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ---------------- TAB 5: OUTDOOR FIELD MARKETING ---------------- */}
        {activeTab === 'outdoor' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#1D1D1B]">Field Leads & Customer Outreach ({outdoor_customers.length})</h3>
              {outdoor_customers.length === 0 ? (
                <EmptyState title="No field leads" description="No outdoor marketing leads logged by this staff member." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase font-bold text-[11px]">
                      <tr>
                        <th className="px-4 py-3">Customer Name</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Area / Drive</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EBE6DC] font-medium">
                      {outdoor_customers.map((oc) => (
                        <tr key={oc.id} className="hover:bg-[#FAF5FF] transition-colors">
                          <td className="px-4 py-3 font-bold text-[#1D1D1B]">{oc.customer_name}</td>
                          <td className="px-4 py-3 text-[#5E5A52]">{oc.phone_number || '—'}</td>
                          <td className="px-4 py-3 font-semibold text-[#7E22CE]">{oc.area_name || 'Field Target Area'}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]">
                              {oc.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#5E5A52]">{oc.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {outdoor_areas.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-[#EBE6DC]">
                <h3 className="text-sm font-bold text-[#1D1D1B]">Assigned Field Marketing Locations ({outdoor_areas.length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {outdoor_areas.map((oa) => (
                    <div key={oa.id} className="bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#1D1D1B]">{oa.area_name}</span>
                        <span className="text-[10px] font-bold text-[#21845F]">{oa.status || 'Active'}</span>
                      </div>
                      <p className="text-[10px] text-[#5E5A52]">{oa.landmark ? `${oa.landmark}, ` : ''}{oa.city}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- TAB 6: CLOSING SHEETS & GALLERY ---------------- */}
        {activeTab === 'gallery' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#1D1D1B]">Daily Store Closing Sheets & Uploaded Media</h3>
            {gallery_media.length === 0 ? (
              <EmptyState title="No closing sheets" description="No daily store closing forms or visual media uploaded." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {gallery_media.map((m) => (
                  <div key={m.id} className="bg-[#FAF8F3] border border-[#E4DFD4] rounded-2xl overflow-hidden shadow-2xs space-y-2 p-3">
                    <div className="h-36 rounded-xl bg-white border border-[#E4DFD4] flex items-center justify-center overflow-hidden">
                      {m.file_url ? (
                        <img src={m.file_url} alt={m.form_type} className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="w-10 h-10 text-[#B97855]" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <span className="font-bold text-xs text-[#1D1D1B] block">{m.form_type || 'Store Closing Form'}</span>
                      <p className="text-[10px] text-[#5E5A52]">{m.notes || 'Verified day-end store closing documentation.'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
