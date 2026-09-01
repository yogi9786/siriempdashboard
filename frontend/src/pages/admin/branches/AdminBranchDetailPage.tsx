import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Users,
  Award,
  UserCheck,
  Star,
  Shirt,
  Phone,
  Mail,
  MapPin,
  Shield,
  FileText,
  Clock,
  Compass,
  ChevronRight,
} from 'lucide-react';
import { AdminBranchDetail, AdminEmployee, CustomerActivity, SchemeRecord, AttireRecord, FormMedia } from '../../../types';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { AdminKPICard } from '../../../components/admin/ui/AdminKPICard';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../context/ToastContext';
import api from '../../../api/client';
import { getMediaUrl } from '../../../utils/media';
import { formatCleanBreakdownText } from '../../../utils/customerUtils';

export const AdminBranchDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const [detail, setDetail] = useState<AdminBranchDetail | null>(null);
  const [employees, setEmployees] = useState<AdminEmployee[]>([]);
  const [customerActivities, setCustomerActivities] = useState<CustomerActivity[]>([]);
  const [schemes, setSchemes] = useState<SchemeRecord[]>([]);
  const [attireRecords, setAttireRecords] = useState<AttireRecord[]>([]);
  const [galleryMedia, setGalleryMedia] = useState<FormMedia[]>([]);

  const [activeTab, setActiveTab] = useState<'employees' | 'managers' | 'customers' | 'schemes' | 'attire' | 'gallery'>('employees');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchBranchData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [detailRes, empRes, custRes, schRes, attRes, galRes] = await Promise.all([
        api.get<AdminBranchDetail>(`/api/v1/admin/branches/${id}`),
        api.get<AdminEmployee[]>('/api/v1/admin/employees', { params: { branch_id: id } }),
        api.get<CustomerActivity[]>('/api/v1/admin/customer-activities', { params: { branch_id: id } }),
        api.get<any>('/api/v1/admin/gold-schemes', { params: { branch_id: id } }),
        api.get<any>('/api/v1/admin/attire', { params: { branch_id: id } }),
        api.get<FormMedia[]>('/api/v1/admin/gallery', { params: { branch_id: id } }),
      ]);

      setDetail(detailRes.data);
      setEmployees(empRes.data);
      setCustomerActivities(custRes.data);
      setSchemes(schRes.data.schemes || []);
      setAttireRecords(attRes.data.records || []);
      setGalleryMedia(galRes.data || []);
    } catch (err) {
      console.error('Failed to load branch detail:', err);
      toastError('Failed to fetch branch details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranchData();
  }, [id]);

  if (isLoading || !detail) {
    return <LoadingSpinner fullPage message="Loading branch command details..." />;
  }

  const { branch, managers, performance } = detail;

  return (
    <div className="space-y-7 pb-16">
      {/* Back Button & Header */}
      <div className="space-y-4">
        <button
          onClick={() => navigate('/admin/branches')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7E22CE] hover:text-[#581C87] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Showrooms</span>
        </button>

        {/* Branch Luxury Hero */}
        <div className="bg-linear-to-br from-[#FAF8F3] via-white to-[#FAF5FF] border border-[#D8B4FE] rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#F3E8FF] border border-[#D8B4FE] text-[#7E22CE] flex items-center justify-center font-extrabold text-2xl shrink-0 shadow-2xs">
                <Building2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-white border border-[#D8B4FE] text-[#3B0764]">
                    {branch.code}
                  </span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#E8F4EE] border border-[#C5E3D5] text-[#21845F]">
                    Operational
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1B] tracking-tight">
                  {branch.name} Showroom Command
                </h1>
                <p className="text-xs text-[#8A8479] font-medium">
                  {branch.city} Location • Active Branch Management
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKPICard
          title="Branch Staff"
          value={performance.employee_count}
          subtitle={`${performance.active_employee_count} Present Today`}
          icon={<Users className="w-5 h-5 text-[#7E22CE]" />}
          iconBgColor="bg-[#F3E8FF] border-[#D8B4FE] text-[#7E22CE]"
        />
        <AdminKPICard
          title="Customer Footfall"
          value={performance.customer_footfall}
          subtitle={`${performance.conversion_rate}% Conversion`}
          icon={<UserCheck className="w-5 h-5 text-[#526F91]" />}
          iconBgColor="bg-[#EDF2F8] border-[#C6D4E3] text-[#526F91]"
        />
        <AdminKPICard
          title="Gold Schemes Closed"
          value={performance.schemes_count}
          subtitle={`₹${performance.schemes_value.toLocaleString('en-IN')} Total Value`}
          icon={<Award className="w-5 h-5 text-[#21845F]" />}
          iconBgColor="bg-[#E8F4EE] border-[#C5E3D5] text-[#21845F]"
        />
        <AdminKPICard
          title="Showroom Reputation"
          value={`${performance.average_rating.toFixed(1)} ★`}
          subtitle={`${performance.reviews_count} Customer Reviews`}
          icon={<Star className="w-5 h-5 fill-[#B97855] text-[#B97855]" />}
          iconBgColor="bg-[#FAF1EC] border-[#ECCFC0] text-[#B97855]"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-[#E4DFD4] flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'employees'
              ? 'border-[#7E22CE] text-[#7E22CE]'
              : 'border-transparent text-[#8A8479] hover:text-[#1D1D1B]'
          }`}
        >
          Staff Roster ({employees.length})
        </button>

        <button
          onClick={() => setActiveTab('managers')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'managers'
              ? 'border-[#7E22CE] text-[#7E22CE]'
              : 'border-transparent text-[#8A8479] hover:text-[#1D1D1B]'
          }`}
        >
          Assigned Managers ({managers.length})
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'customers'
              ? 'border-[#7E22CE] text-[#7E22CE]'
              : 'border-transparent text-[#8A8479] hover:text-[#1D1D1B]'
          }`}
        >
          Customer Walk-ins ({customerActivities.length})
        </button>

        <button
          onClick={() => setActiveTab('schemes')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'schemes'
              ? 'border-[#7E22CE] text-[#7E22CE]'
              : 'border-transparent text-[#8A8479] hover:text-[#1D1D1B]'
          }`}
        >
          Gold Schemes ({schemes.length})
        </button>

        <button
          onClick={() => setActiveTab('attire')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'attire'
              ? 'border-[#7E22CE] text-[#7E22CE]'
              : 'border-transparent text-[#8A8479] hover:text-[#1D1D1B]'
          }`}
        >
          Attire & Grooming ({attireRecords.length})
        </button>

        <button
          onClick={() => setActiveTab('gallery')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'gallery'
              ? 'border-[#7E22CE] text-[#7E22CE]'
              : 'border-transparent text-[#8A8479] hover:text-[#1D1D1B]'
          }`}
        >
          Daily Closing Sheets ({galleryMedia.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 shadow-[0_4px_18px_rgba(40,35,25,0.045)]">
        {/* TAB 1: EMPLOYEES */}
        {activeTab === 'employees' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase font-bold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Customers</th>
                  <th className="px-4 py-3">Schemes</th>
                  <th className="px-4 py-3">Attire Score</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE6DC] font-medium">
                {employees.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => navigate(`/admin/employees/${emp.id}`)}
                    className="hover:bg-[#FAF5FF] transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] border border-[#D8B4FE] text-[#7E22CE] flex items-center justify-center font-bold text-xs shrink-0">
                          {emp.full_name.charAt(0)}
                        </div>
                        <span className="font-bold text-[#1D1D1B] group-hover:text-[#7E22CE] transition-colors">
                          {emp.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs whitespace-nowrap">
                      <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-[#FAF8F3] border border-[#E4DFD4] text-[#1D1D1B] font-semibold text-[10px] sm:text-xs whitespace-nowrap inline-flex items-center shrink-0">
                        {emp.employee_code}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[#5E5A52]">{emp.designation}</td>
                    <td className="px-4 py-3.5 text-[#5E5A52]">{emp.department}</td>
                    <td className="px-4 py-3.5 font-bold text-[#1D1D1B]">{emp.customers_attended_count}</td>
                    <td className="px-4 py-3.5 font-bold text-[#7E22CE]">{emp.schemes_closed_count}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-[#E8F4EE] text-[#21845F] font-bold text-[11px]">
                        {emp.attire_compliance_pct}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-xs font-bold text-[#7E22CE] group-hover:underline">
                        View 360° Profile →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: MANAGERS */}
        {activeTab === 'managers' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {managers.map((m) => (
              <div key={m.id} className="p-5 rounded-2xl bg-[#FAF8F3] border border-[#E4DFD4] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] flex items-center justify-center font-bold text-sm">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1D1D1B]">{m.full_name}</h3>
                    <p className="text-xs text-[#8A8479] font-mono">@{m.username}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#EBE6DC] text-[11px] font-bold">
                  <span className="text-[#21845F] bg-[#E8F4EE] px-2 py-0.5 rounded-md">Active Manager</span>
                  <span className="text-[#8A8479]">{m.last_login ? 'Logged in recently' : 'Active Account'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: CUSTOMERS */}
        {activeTab === 'customers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase font-bold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customers Count</th>
                  <th className="px-4 py-3">Attending Staff</th>
                  <th className="px-4 py-3">Status / Breakdown</th>
                  <th className="px-4 py-3">Customer Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE6DC] font-medium">
                {customerActivities.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF8F3]">
                    <td className="px-4 py-3 font-semibold text-[#1D1D1B]">{c.activity_date}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#EDF2F7] text-[#536B8A] font-bold text-xs">
                        {c.customers_count || 1} Customer{(c.customers_count || 1) > 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#5E5A52] font-semibold">{c.employee_name || 'Staff'}</td>
                    <td className="px-4 py-3 space-y-0.5">
                      <div>
                        <span className="px-2 py-0.5 rounded-md bg-[#FAF8F3] border border-[#D8B4FE] text-[#7E22CE] font-bold">
                          {c.status}
                        </span>
                      </div>
                      {c.breakdown && (
                        <p className="text-[11px] text-[#5E5A52] font-medium">
                          {formatCleanBreakdownText(c.breakdown, c.status)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#8A8479] max-w-xs">{c.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: SCHEMES */}
        {activeTab === 'schemes' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase font-bold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Scheme Plan</th>
                  <th className="px-4 py-3">Customers Count</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Salesperson</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE6DC] font-medium">
                {schemes.map((s) => (
                  <tr key={s.id} className="hover:bg-[#FAF8F3]">
                    <td className="px-4 py-3 font-bold text-[#1D1D1B]">{s.scheme_name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-[#EDF2F7] text-[#536B8A] font-bold text-xs">
                        {s.customers_count || 1} Enrolled
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-[#21845F]">₹{s.amount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-[#5E5A52]">{s.employee_name || 'Staff'}</td>
                    <td className="px-4 py-3 text-[#8A8479]">{s.record_date}</td>
                    <td className="px-4 py-3 text-[#8A8479]">{s.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: ATTIRE */}
        {activeTab === 'attire' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase font-bold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Staff Member</th>
                  <th className="px-4 py-3">Audit Date</th>
                  <th className="px-4 py-3">Attire Status</th>
                  <th className="px-4 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE6DC] font-medium">
                {attireRecords.map((a) => (
                  <tr key={a.id} className="hover:bg-[#FAF8F3]">
                    <td className="px-4 py-3 font-bold text-[#1D1D1B]">{a.employee_name || 'Staff'}</td>
                    <td className="px-4 py-3 text-[#8A8479]">{a.check_date}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5] font-bold">
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#8A8479]">{a.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 6: GALLERY */}
        {activeTab === 'gallery' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {galleryMedia.map((m) => (
              <div key={m.id} className="p-3 rounded-2xl bg-[#FAF8F3] border border-[#E4DFD4] space-y-2">
                <div className="h-32 rounded-xl bg-white border border-[#E4DFD4] flex items-center justify-center overflow-hidden">
                  {m.file_url ? (
                    <img src={getMediaUrl(m.file_url)} alt={m.form_type} className="w-full h-full object-cover" />
                  ) : (
                    <FileText className="w-8 h-8 text-[#8A8479]" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1D1D1B] truncate">{m.form_type}</p>
                  <p className="text-[10px] text-[#8A8479]">{m.employee_name} • {m.upload_date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
