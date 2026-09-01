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
  const [activeTab, setActiveTab] = useState<'customers' | 'schemes' | 'reviews' | 'attire' | 'outdoor' | 'gallery'>('customers');

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

  const { employee, customer_activities, schemes, google_reviews, attire_records, gallery_media, outdoor_areas, outdoor_customers, outdoor_schemes } = data;

  const totalSchemesAmount = schemes.reduce((acc, s) => acc + (s.amount || 0), 0);
  const totalSchemesCount = schemes.reduce((acc, s) => acc + (s.customers_count || 1), 0);
  const totalCustomersAttended = customer_activities.reduce((acc, c) => acc + (c.customers_count || 1), 0);
  const totalCustomersClosed = customer_activities.filter((c) => c.status === 'Closed').reduce((acc, c) => acc + (c.customers_count || 1), 0);
  const conversionPct = totalCustomersAttended > 0 ? Math.round((totalCustomersClosed / totalCustomersAttended) * 100) : 100;

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
                <span className="flex items-center gap-1.5 font-bold text-[#3B0764]">
                  <Building2 className="w-3.5 h-3.5 text-[#7E22CE]" />
                  {employee.branch_name} Showroom ({employee.branch_code})
                </span>
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
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#7E22CE]" />
                    Manager: <strong className="text-[#1D1D1B]">{employee.manager_name}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          3. 6 SUMMARY METRIC CARDS
      ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Footfall Attended */}
        <div className="bg-white border border-[#E4DFD4] rounded-2xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#526F91]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5E5A52]">Footfall</span>
            <UserCheck className="w-4 h-4 text-[#526F91]" />
          </div>
          <p className="text-xl font-black text-[#1D1D1B]">{totalCustomersAttended}</p>
          <p className="text-[10px] text-[#21845F] font-bold">{totalCustomersClosed} Closed ({conversionPct}%)</p>
        </div>

        {/* Gold Schemes */}
        <div className="bg-white border border-[#E4DFD4] rounded-2xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#21845F]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5E5A52]">Schemes</span>
            <Award className="w-4 h-4 text-[#21845F]" />
          </div>
          <p className="text-xl font-black text-[#1D1D1B]">{totalSchemesCount}</p>
          <p className="text-[10px] text-[#7E22CE] font-bold">₹{totalSchemesAmount.toLocaleString('en-IN')}</p>
        </div>

        {/* Reputation */}
        <div className="bg-white border border-[#E4DFD4] rounded-2xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#B97855]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5E5A52]">Reviews</span>
            <Star className="w-4 h-4 fill-[#B97855] text-[#B97855]" />
          </div>
          <p className="text-xl font-black text-[#1D1D1B]">{(employee.average_rating || 5.0).toFixed(1)} ★</p>
          <p className="text-[10px] text-[#5E5A52] font-semibold">{google_reviews.length} Verified</p>
        </div>

        {/* Grooming */}
        <div className="bg-white border border-[#E4DFD4] rounded-2xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#7E22CE]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5E5A52]">Attire</span>
            <Shirt className="w-4 h-4 text-[#7E22CE]" />
          </div>
          <p className="text-xl font-black text-[#1D1D1B]">{employee.attire_compliance_pct}%</p>
          <p className="text-[10px] text-[#21845F] font-bold">{attire_records.length} Inspected</p>
        </div>

        {/* Outdoor Leads */}
        <div className="bg-white border border-[#E4DFD4] rounded-2xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#21845F]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5E5A52]">Outdoor</span>
            <Compass className="w-4 h-4 text-[#21845F]" />
          </div>
          <p className="text-xl font-black text-[#1D1D1B]">{outdoor_customers.length}</p>
          <p className="text-[10px] text-[#5E5A52] font-semibold">{outdoor_areas.length} Field Areas</p>
        </div>

        {/* Form Media */}
        <div className="bg-white border border-[#E4DFD4] rounded-2xl p-4 shadow-2xs space-y-1">
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
            <span>Google Reviews ({google_reviews.length})</span>
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

        {/* ---------------- TAB 3: GOOGLE REVIEWS ---------------- */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#1D1D1B]">Google Customer Reviews Collected</h3>
            {google_reviews.length === 0 ? (
              <EmptyState title="No reviews recorded" description="No verified Google reviews collected by this staff member." />
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
