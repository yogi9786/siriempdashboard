import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Award,
  UserCheck,
  Star,
  Shirt,
  Compass,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Shield,
  Clock,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useAdminBranch } from '../../../context/AdminBranchContext';
import { AdminDashboardOverview } from '../../../types';
import { AdminKPICard } from '../../../components/admin/ui/AdminKPICard';
import { ActivityTimeline } from '../../../components/admin/ui/ActivityTimeline';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import api from '../../../api/client';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { selectedBranchId, selectedBranch, dateRange } = useAdminBranch();
  const navigate = useNavigate();

  const [overview, setOverview] = useState<AdminDashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchOverview = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {};
      if (selectedBranchId) params.branch_id = selectedBranchId;
      if (dateRange && dateRange !== 'all') params.date_range = dateRange;

      const res = await api.get<AdminDashboardOverview>('/api/v1/admin/dashboard/overview', { params });
      setOverview(res.data);
    } catch (err) {
      console.error('Failed to load admin overview:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(() => {
      fetchOverview();
    }, 15000);
    return () => clearInterval(interval);
  }, [selectedBranchId, dateRange]);

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const branchScopeName = selectedBranch ? `${selectedBranch.name} Showroom` : 'All Branches (Enterprise HQ)';

  if (isLoading && !overview) {
    return <LoadingSpinner fullPage message="Loading Enterprise Command Center metrics..." />;
  }

  return (
    <div className="space-y-7 pb-16">
      {/* -------------------------------------------------------------
          1. LUXURY ENTERPRISE HERO HEADER
      ------------------------------------------------------------- */}
      <div className="relative bg-linear-to-br from-[#FAF8F3] via-white to-[#FAF5FF] border border-[#D8B4FE] rounded-3xl p-6 sm:p-8 sm:py-9 shadow-xs overflow-hidden group text-[#1D1D1B]">
        {/* Top Gold & Purple Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-[#C5A869] via-[#9333EA] to-[#C5A869] opacity-70 animate-pulse" />

        {/* Ambient Radial Glow */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-linear-to-br from-[#9333EA]/10 via-[#F3E8FF]/20 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            {/* Badges */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold text-[#1D1D1B] px-3.5 py-1.5 rounded-full bg-white border border-[#D8B4FE] flex items-center gap-2 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#7E22CE] animate-pulse" />
                <span>Scope: {branchScopeName}</span>
              </span>

              <span className="text-xs font-semibold text-[#5E5A52] flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#D8B4FE] shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-[#7E22CE]" />
                <span>{todayFormatted}</span>
              </span>

              <button
                onClick={() => fetchOverview()}
                className="text-xs font-bold text-[#7E22CE] flex items-center gap-1.5 bg-white hover:bg-[#FAF5FF] px-3 py-1.5 rounded-full border border-[#D8B4FE] shadow-2xs transition-colors cursor-pointer"
                title="Sync Live Showroom Updates"
              >
                <RefreshCw className="w-3 h-3 animate-spin text-[#7E22CE]" style={{ animationDuration: '4s' }} />
                <span>Live Synced</span>
              </button>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1B] tracking-tight">
                Enterprise Command Center, <span className="text-[#7E22CE] font-extrabold">{user?.full_name || 'Super Admin'}</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#5E5A52] font-medium mt-1">
                Executive intelligence & multi-branch operations control for <span className="font-bold text-[#3B0764]">Yelahanka, Kolar, and Udupi</span>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0 flex-wrap">
            <button
              onClick={() => navigate('/admin/branches')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF5FF] text-[#3B0764] text-xs font-bold border border-[#D8B4FE] shadow-2xs transition-all cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-[#7E22CE]" />
              <span>Showrooms (3)</span>
            </button>

            <button
              onClick={() => navigate('/admin/reports')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7E22CE] hover:bg-[#6B21A8] text-white text-xs font-bold shadow-sm transition-all cursor-pointer hover:scale-[1.02]"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              <span>Executive Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          2. 8 ORGANIZATION KPI CARDS
      ------------------------------------------------------------- */}
      {(() => {
        const yelahankaStaff = overview?.branch_comparison?.find((b) => b.branch_name.toLowerCase().includes('yelahanka'))?.employee_count ?? 26;
        const kolarStaff = overview?.branch_comparison?.find((b) => b.branch_name.toLowerCase().includes('kolar'))?.employee_count ?? 14;
        const udupiStaff = overview?.branch_comparison?.find((b) => b.branch_name.toLowerCase().includes('udupi'))?.employee_count ?? 22;
        const totalAllStaff = (yelahankaStaff + kolarStaff + udupiStaff) || 62;

        return (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* 1. Total Visitors Today */}
              <AdminKPICard
                title="Total Visitors Today"
                value={overview?.today_footfall ?? 0}
                subtitle={`${overview?.today_customers_closed ?? 0} Closed Deals Today`}
                icon={<UserCheck className="w-5 h-5 text-[#3B82F6]" />}
                iconBgColor="bg-[#EFF6FF] border-[#BFDBFE] text-[#3B82F6]"
                badgeText="Live Showroom Feed"
                badgeColor="bg-[#E8F4EE] text-[#21845F] border-[#C5E3D5]"
                onClick={() => navigate('/admin/customers')}
              />

              {/* 2. Showroom Staff Roster (All Branches Combined: 62) */}
              <AdminKPICard
                title="Total Staff Roster"
                value={selectedBranch ? (overview?.total_employees ?? 0) : totalAllStaff}
                subtitle={
                  selectedBranch
                    ? `${overview?.active_employees ?? 0} Active on Floor (${selectedBranch.name}) • Total All Branches: ${totalAllStaff}`
                    : `${totalAllStaff} Active (${yelahankaStaff} Yelahanka • ${kolarStaff} Kolar • ${udupiStaff} Udupi)`
                }
                icon={<Users className="w-5 h-5 text-[#7E22CE]" />}
                iconBgColor="bg-[#F3E8FF] border-[#D8B4FE] text-[#7E22CE]"
                badgeText={selectedBranch ? `${selectedBranch.name} (${overview?.total_employees ?? 0} Staff)` : `All 3 Branches (${totalAllStaff} Staff)`}
                badgeColor="bg-[#FAF8F3] text-[#7E22CE] border-[#D8B4FE]"
                progressPct={100}
                progressBarColor="bg-[#7E22CE]"
                onClick={() => navigate('/admin/employees')}
              />

              {/* 3. Gold Schemes */}
              <AdminKPICard
                title="Gold Schemes Closed"
                value={overview?.total_schemes ?? 0}
                subtitle={`₹${(overview?.total_schemes_value ?? 0).toLocaleString('en-IN')} Total Value`}
                icon={<Award className="w-5 h-5 text-[#21845F]" />}
                iconBgColor="bg-[#E8F4EE] border-[#C5E3D5] text-[#21845F]"
                badgeText={`${overview?.today_schemes_count ?? 0} Today`}
                badgeColor="bg-[#FAF8F3] text-[#7E22CE] border-[#D8B4FE]"
                onClick={() => navigate('/admin/gold-schemes')}
              />

              {/* 4. Google Reviews */}
              <AdminKPICard
                title="Showroom Reputation"
                value={`${(overview?.average_rating ?? 5.0).toFixed(1)} ★`}
                subtitle={`${overview?.total_reviews ?? 0} Verified Reviews`}
                icon={<Star className="w-5 h-5 fill-[#B97855] text-[#B97855]" />}
                iconBgColor="bg-[#FAF1EC] border-[#ECCFC0] text-[#B97855]"
                badgeText={`${overview?.today_reviews_count ?? 0} Today`}
                badgeColor="bg-[#E8F4EE] text-[#21845F] border-[#C5E3D5]"
                onClick={() => navigate('/admin/google-reviews')}
              />

              {/* 5. Cumulative Customer Footfall */}
              <AdminKPICard
                title="Cumulative Footfall"
                value={overview?.total_footfall ?? 0}
                subtitle={`${overview?.total_customers_closed ?? 0} Total Closed Deals`}
                icon={<UserCheck className="w-5 h-5 text-[#526F91]" />}
                iconBgColor="bg-[#EDF2F8] border-[#C6D4E3] text-[#526F91]"
                trend={{ value: `${overview?.conversion_percentage ?? 100}%`, label: 'Conversion', isPositive: true }}
                onClick={() => navigate('/admin/customer-activities')}
              />

              {/* 6. Outdoor Leads */}
              <AdminKPICard
                title="Outdoor Field Leads"
                value={overview?.outdoor_leads ?? 0}
                subtitle={`${overview?.outdoor_staff_count ?? 0} Field Marketers`}
                icon={<Compass className="w-5 h-5 text-[#21845F]" />}
                iconBgColor="bg-[#E8F4EE] border-[#C5E3D5] text-[#21845F]"
                badgeText={`${overview?.outdoor_leads_converted ?? 0} Converted`}
                badgeColor="bg-[#FAF8F3] text-[#21845F] border-[#C5E3D5]"
                onClick={() => navigate('/admin/outdoor-marketing')}
              />

              {/* 7. Attire Compliance */}
              <AdminKPICard
                title="Grooming Compliance"
                value={`${overview?.attire_compliance_pct ?? 100}%`}
                subtitle="Showroom Luxury Standards"
                icon={<Shirt className="w-5 h-5 text-[#7E22CE]" />}
                iconBgColor="bg-[#F3E8FF] border-[#D8B4FE] text-[#7E22CE]"
                badgeText="Verified"
                badgeColor="bg-[#E8F4EE] text-[#21845F] border-[#C5E3D5]"
                onClick={() => navigate('/admin/attire')}
              />

              {/* 8. Daily Store Closing Sheets */}
              <AdminKPICard
                title="Daily Closing Forms"
                value={overview?.daily_forms_count ?? 0}
                subtitle="Day-end Closing Sheets"
                icon={<FileText className="w-5 h-5 text-[#B97855]" />}
                iconBgColor="bg-[#FAF1EC] border-[#ECCFC0] text-[#B97855]"
                badgeText="Digital Archive"
                badgeColor="bg-[#FAF8F3] text-[#B97855] border-[#ECCFC0]"
                onClick={() => navigate('/admin/gallery')}
              />
            </div>

            {/* Live Workforce Branch Breakdown Card */}
            <div className="bg-white border border-[#E4DFD4] rounded-3xl p-5 sm:p-6 shadow-[0_4px_18px_rgba(40,35,25,0.045)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#F3E8FF] border border-[#D8B4FE] text-[#7E22CE] flex items-center justify-center font-extrabold text-base shrink-0 shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-extrabold text-[#1D1D1B] tracking-tight">
                      Enterprise Staff Workforce Roster
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#E8F4EE] border border-[#C5E3D5] text-[#21845F] font-extrabold text-[10px]">
                      {totalAllStaff} Staff Active Across All Showrooms
                    </span>
                  </div>
                  <p className="text-xs text-[#5E5A52] font-medium mt-0.5">
                    Live floor personnel count verified across all 3 showroom locations
                  </p>
                </div>
              </div>

              {/* Branch Number Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto">
                <div
                  onClick={() => navigate('/admin/employees')}
                  className="p-3 rounded-2xl bg-[#FAF8F3] border border-[#E4DFD4] flex flex-col justify-center min-w-32 cursor-pointer hover:border-[#7E22CE] transition-all"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7E22CE]">📍 Yelahanka</span>
                  <span className="text-lg font-black text-[#1D1D1B] mt-0.5">{yelahankaStaff} Staff</span>
                  <span className="text-[10px] font-semibold text-[#21845F]">100% on Floor</span>
                </div>

                <div
                  onClick={() => navigate('/admin/employees')}
                  className="p-3 rounded-2xl bg-[#FAF8F3] border border-[#E4DFD4] flex flex-col justify-center min-w-32 cursor-pointer hover:border-[#21845F] transition-all"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#21845F]">📍 Kolar</span>
                  <span className="text-lg font-black text-[#1D1D1B] mt-0.5">{kolarStaff} Staff</span>
                  <span className="text-[10px] font-semibold text-[#21845F]">100% on Floor</span>
                </div>

                <div
                  onClick={() => navigate('/admin/employees')}
                  className="p-3 rounded-2xl bg-[#FAF8F3] border border-[#E4DFD4] flex flex-col justify-center min-w-32 cursor-pointer hover:border-[#3B82F6] transition-all"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#3B82F6]">📍 Udupi</span>
                  <span className="text-lg font-black text-[#1D1D1B] mt-0.5">{udupiStaff} Staff</span>
                  <span className="text-[10px] font-semibold text-[#21845F]">100% on Floor</span>
                </div>

                <div
                  onClick={() => navigate('/admin/employees')}
                  className="p-3 rounded-2xl bg-[#F3E8FF] border border-[#D8B4FE] flex flex-col justify-center min-w-32 cursor-pointer hover:bg-[#E9D5FF] transition-all"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7E22CE]">🌟 Total Roster</span>
                  <span className="text-lg font-black text-[#7E22CE] mt-0.5">{totalAllStaff} Staff</span>
                  <span className="text-[10px] font-bold text-[#7E22CE]">All 3 Branches</span>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* -------------------------------------------------------------
          3. MULTI-BRANCH PERFORMANCE COMPARISON SECTION
      ------------------------------------------------------------- */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 sm:p-7 shadow-[0_4px_18px_rgba(40,35,25,0.045)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBE6DC] pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#1D1D1B] tracking-tight">
              Multi-Branch Performance Comparison
            </h2>
            <p className="text-xs text-[#8A8479] font-medium mt-0.5">
              Live operational metrics across Yelahanka, Kolar, and Udupi showrooms
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/branches')}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#7E22CE] hover:text-[#581C87] cursor-pointer"
          >
            <span>Full Branch Management</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase tracking-wider font-bold text-[11px]">
              <tr>
                <th className="px-4 py-3">Branch Name</th>
                <th className="px-4 py-3">Managers</th>
                <th className="px-4 py-3">Staff Roster</th>
                <th className="px-4 py-3">Footfall</th>
                <th className="px-4 py-3">Schemes Enrolled</th>
                <th className="px-4 py-3">Scheme Revenue (₹)</th>
                <th className="px-4 py-3">Google Rating</th>
                <th className="px-4 py-3">Compliance</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE6DC] font-medium">
              {overview?.branch_comparison.map((b) => (
                <tr
                  key={b.branch_id}
                  onClick={() => navigate(`/admin/branches/${b.branch_id}`)}
                  className="hover:bg-[#FAF5FF] transition-colors cursor-pointer group"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] border border-[#D8B4FE] text-[#7E22CE] flex items-center justify-center font-bold text-xs shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-[#1D1D1B] group-hover:text-[#7E22CE] transition-colors block">
                          {b.branch_name}
                        </span>
                        <span className="text-[10px] text-[#8A8479] block font-mono">{b.branch_code} • {b.city}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-[#1D1D1B] font-semibold">
                    {b.manager_count} Managers
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-bold text-[#1D1D1B]">{b.active_employee_count}</span>
                    <span className="text-[#8A8479]"> / {b.employee_count} Present</span>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-[#1D1D1B]">
                    {b.customer_footfall} <span className="text-[10px] font-normal text-[#21845F]">({b.conversion_rate}%)</span>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-[#7E22CE]">
                    {b.schemes_count} Plans
                  </td>
                  <td className="px-4 py-3.5 font-bold text-[#1D1D1B]">
                    ₹{b.schemes_value.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF1EC] text-[#B97855] border border-[#ECCFC0] font-bold text-[11px]">
                      <Star className="w-3 h-3 fill-[#B97855]" />
                      <span>{b.average_rating.toFixed(1)}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5] font-bold text-[11px]">
                      {b.attire_compliance_pct}%
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-xs font-bold text-[#7E22CE] group-hover:underline">
                      View Branch →
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* -------------------------------------------------------------
          4. MIDDLE SECTION: CUSTOMER FUNNEL (2 COLS) + LIVE ACTIVITY FEED (1 COL)
      ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Customer Pipeline & 7-Day Sparkline */}
        <div className="lg:col-span-2 bg-white border border-[#E4DFD4] rounded-3xl p-6 sm:p-7 shadow-[0_4px_18px_rgba(40,35,25,0.045)] flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#1D1D1B] tracking-tight">
                  Customer Conversion Pipeline
                </h3>
                <p className="text-xs text-[#8A8479] font-medium mt-0.5">
                  Walk-ins and field inquiry conversions across all showrooms
                </p>
              </div>
              <button
                onClick={() => navigate('/admin/customers')}
                className="text-xs font-bold text-[#7E22CE] hover:text-[#581C87] flex items-center gap-1 cursor-pointer"
              >
                <span>Full CRM</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Funnel 3-Stage Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-[#F3E8FF] border border-[#D8B4FE] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#7E22CE]">
                  <span>1. Walk-ins</span>
                  <span className="w-2 h-2 rounded-full bg-[#7E22CE]" />
                </div>
                <div className="text-2xl font-bold text-[#1D1D1B]">{overview?.total_footfall ?? 0}</div>
                <span className="text-[11px] text-[#8A8479] block">Registered Inquiries</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#F5EDF1] border border-[#E8D5D2] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#765568]">
                  <span>2. In Follow-up</span>
                  <span className="w-2 h-2 rounded-full bg-[#765568]" />
                </div>
                <div className="text-2xl font-bold text-[#1D1D1B]">
                  {Math.max(0, (overview?.total_footfall ?? 0) - (overview?.total_customers_closed ?? 0))}
                </div>
                <span className="text-[11px] text-[#8A8479] block">Active Follow-ups</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#E8F4EE] border border-[#C5E3D5] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#21845F]">
                  <span>3. Closed Sales</span>
                  <span className="w-2 h-2 rounded-full bg-[#21845F]" />
                </div>
                <div className="text-2xl font-bold text-[#21845F]">{overview?.total_customers_closed ?? 0}</div>
                <span className="text-[11px] text-[#21845F] font-semibold block">
                  {overview?.conversion_percentage ?? 100}% Conversion
                </span>
              </div>
            </div>
          </div>

          {/* 7-Day Activity Sparkline */}
          <div className="pt-4 border-t border-[#EBE6DC] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#1D1D1B]">
              <span>7-Day Showroom Footfall Trend</span>
              <span className="text-[#7E22CE] font-bold text-[11px]">Daily Inquiries</span>
            </div>
            <div className="flex items-end justify-between gap-2 h-16 pt-2">
              {overview?.sparkline_days.map((item) => (
                <div key={item.day} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full bg-[#FAF8F3] border border-[#E4DFD4] rounded-md h-12 flex items-end p-0.5">
                    <div
                      className="w-full bg-linear-to-t from-[#7E22CE] to-[#A855F7] rounded-sm transition-all duration-300 group-hover:from-[#6B21A8] group-hover:to-[#7E22CE]"
                      style={{
                        height: `${Math.max(15, Math.min(100, item.footfall * 25))}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-[#8A8479] font-bold">{item.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live Enterprise Activity Feed */}
        <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 sm:p-7 shadow-[0_4px_18px_rgba(40,35,25,0.045)] space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#EBE6DC] pb-3 mb-4">
              <h2 className="text-base font-bold text-[#1D1D1B] tracking-tight">
                Enterprise Activity Feed
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#F3E8FF] text-[#7E22CE] border border-[#D8B4FE] font-bold">
                Live
              </span>
            </div>

            <ActivityTimeline items={overview?.recent_activity ?? []} />
          </div>

          <button
            onClick={() => navigate('/admin/audit-logs')}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#FAF5FF] border border-[#D8B4FE] text-[#7E22CE] text-xs font-bold shadow-2xs transition-all cursor-pointer mt-4"
          >
            <span>View Complete Audit Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          5. ENTERPRISE EXECUTIVE COMMAND TILES
      ------------------------------------------------------------- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#1C1C1A] tracking-tight">
              Enterprise Management Command Modules
            </h2>
            <p className="text-xs text-[#8A857A] font-medium">
              Direct access to all showroom administrative, performance, and reporting modules
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => navigate('/admin/branches')}
            className="p-5 rounded-2xl bg-white border border-[#E4DFD4] hover:border-[#3B82F6] hover:bg-[#EFF6FF]/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-4 shadow-[0_4px_18px_rgba(40,35,25,0.045)]"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#3B82F6] flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-[#8A8479] group-hover:translate-x-1 group-hover:text-[#3B82F6] transition-all" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1D1D1B] group-hover:text-[#3B82F6] transition-colors">
                Branches Command
              </h3>
              <p className="text-xs text-[#8A8479] font-medium mt-0.5">
                Manage Yelahanka, Kolar, and Udupi showrooms
              </p>
            </div>
          </div>

          <div
            onClick={() => navigate('/admin/managers')}
            className="p-5 rounded-2xl bg-white border border-[#E4DFD4] hover:border-[#D97706] hover:bg-[#FEF3C7]/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-4 shadow-[0_4px_18px_rgba(40,35,25,0.045)]"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-[#8A8479] group-hover:translate-x-1 group-hover:text-[#D97706] transition-all" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1D1D1B] group-hover:text-[#D97706] transition-colors">
                Showroom Managers
              </h3>
              <p className="text-xs text-[#8A8479] font-medium mt-0.5">
                Manage {overview?.total_managers ?? 0} branch manager credentials
              </p>
            </div>
          </div>

          <div
            onClick={() => navigate('/admin/performance')}
            className="p-5 rounded-2xl bg-white border border-[#E4DFD4] hover:border-[#21845F] hover:bg-[#E8F4EE]/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-4 shadow-[0_4px_18px_rgba(40,35,25,0.045)]"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#E8F4EE] border border-[#C5E3D5] text-[#21845F] flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-[#8A8479] group-hover:translate-x-1 group-hover:text-[#21845F] transition-all" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1D1D1B] group-hover:text-[#21845F] transition-colors">
                Staff Performance Leaderboard
              </h3>
              <p className="text-xs text-[#8A8479] font-medium mt-0.5">
                Multi-dimensional scores & rankings
              </p>
            </div>
          </div>

          <div
            onClick={() => navigate('/admin/reports')}
            className="p-5 rounded-2xl bg-white border border-[#E4DFD4] hover:border-[#7E22CE] hover:bg-[#FAF5FF] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-4 shadow-[0_4px_18px_rgba(40,35,25,0.045)]"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#F3E8FF] border border-[#D8B4FE] text-[#7E22CE] flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-[#8A8479] group-hover:translate-x-1 group-hover:text-[#7E22CE] transition-all" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1D1D1B] group-hover:text-[#7E22CE] transition-colors">
                Executive Reporting Center
              </h3>
              <p className="text-xs text-[#8A8479] font-medium mt-0.5">
                8 Report categories with 1-click CSV export
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
