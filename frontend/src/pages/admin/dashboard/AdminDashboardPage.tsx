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
  Trophy,
  Medal,
  Crown,
  Search,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useAdminBranch } from '../../../context/AdminBranchContext';
import { useToast } from '../../../context/ToastContext';
import { AdminDashboardOverview, EmployeePointsRanking } from '../../../types';
import { AdminKPICard } from '../../../components/admin/ui/AdminKPICard';
import { ActivityTimeline } from '../../../components/admin/ui/ActivityTimeline';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import api from '../../../api/client';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { success } = useToast();
  const { selectedBranchId, selectedBranch, dateRange } = useAdminBranch();
  const navigate = useNavigate();

  const [overview, setOverview] = useState<AdminDashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pointsRanking, setPointsRanking] = useState<EmployeePointsRanking[]>([]);
  const [rankingSearch, setRankingSearch] = useState<string>('');
  const [rankingBranchFilter, setRankingBranchFilter] = useState<string>(selectedBranchId?.toString() || 'all');

  const fetchPointsRanking = async () => {
    try {
      const params: Record<string, any> = {};
      if (rankingBranchFilter !== 'all') {
        params.branch_id = parseInt(rankingBranchFilter, 10);
      } else if (selectedBranchId) {
        params.branch_id = selectedBranchId;
      }
      const res = await api.get<EmployeePointsRanking[]>('/api/v1/admin/employees/points-ranking', { params });
      setPointsRanking(res.data);
    } catch (err) {
      console.error('Failed to load points ranking:', err);
    }
  };

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
    fetchPointsRanking();
  }, [selectedBranchId, dateRange, rankingBranchFilter]);

  useEffect(() => {
    if (selectedBranchId) {
      setRankingBranchFilter(selectedBranchId.toString());
    } else {
      setRankingBranchFilter('all');
    }
  }, [selectedBranchId]);

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
              onClick={() => {
                fetchOverview();
                fetchPointsRanking();
                success('Admin dashboard synced with live showroom records.');
              }}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#1D1D1B] text-xs font-bold border border-[#E4DFD4] shadow-2xs transition-all cursor-pointer group"
              title="Sync admin records"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#7E22CE] transition-transform ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 duration-500'}`} />
              <span>Sync</span>
            </button>

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

        {/* Mobile View: Showroom Branch Cards (block md:hidden) */}
        <div className="block md:hidden space-y-3">
          {overview?.branch_comparison.map((b) => (
            <div
              key={b.branch_id}
              onClick={() => navigate(`/admin/branches/${b.branch_id}`)}
              className="bg-white border border-[#E4DFD4] rounded-2xl p-4 shadow-xs space-y-3 hover:border-[#7E22CE] transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#F0ECE1]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] border border-[#D8B4FE] text-[#7E22CE] flex items-center justify-center font-bold text-xs shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-[#1D1D1B] block text-sm">{b.branch_name}</span>
                    <span className="text-[10px] text-[#8A8479] font-mono">{b.branch_code} • {b.city}</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF1EC] text-[#B97855] border border-[#ECCFC0] font-bold text-xs">
                  <Star className="w-3 h-3 fill-[#B97855]" />
                  <span>{b.average_rating.toFixed(1)}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EBE6DC]">
                  <span className="text-[10px] text-[#8A8479] font-semibold block">Staff On Floor</span>
                  <span className="font-bold text-[#1D1D1B] mt-0.5 block">
                    {b.active_employee_count} <span className="text-[#8A8479] font-normal">/ {b.employee_count}</span>
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EBE6DC]">
                  <span className="text-[10px] text-[#8A8479] font-semibold block">Footfall (Conv.)</span>
                  <span className="font-bold text-[#1D1D1B] mt-0.5 block">
                    {b.customer_footfall} <span className="text-[#21845F] font-semibold text-[11px]">({b.conversion_rate}%)</span>
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#F5F3FF] border border-[#DDD6FE]">
                  <span className="text-[10px] text-[#7E22CE] font-semibold block">Gold Schemes</span>
                  <span className="font-bold text-[#6B21A8] mt-0.5 block">
                    {b.schemes_count} Plans (₹{b.schemes_value.toLocaleString('en-IN')})
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]">
                  <span className="text-[10px] text-[#166534] font-semibold block">Attire Compliance</span>
                  <span className="font-bold text-[#15803D] mt-0.5 block">
                    {b.attire_compliance_pct}% Standard
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#F0ECE1] flex items-center justify-between text-xs font-bold text-[#7E22CE]">
                <span>{b.manager_count} Showroom Manager{b.manager_count > 1 ? 's' : ''}</span>
                <span className="flex items-center gap-1 hover:underline">
                  <span>Showroom Dashboard</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Tablet & Desktop Table View (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
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
          3b. SHOWROOM STAFF POINT-WISE RANKING LEADERBOARD
      ------------------------------------------------------------- */}
      <div id="staff-points-ranking" className="bg-white border border-[#E4DFD4] rounded-3xl p-6 sm:p-7 shadow-[0_4px_18px_rgba(40,35,25,0.045)] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EBE6DC] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] flex items-center gap-1">
                <Trophy className="w-3 h-3 text-[#D97706]" />
                <span>Showroom Leaderboard</span>
              </span>
              <span className="text-xs font-bold text-[#7E22CE] bg-[#F3E8FF] px-2.5 py-0.5 rounded-full border border-[#D8B4FE]">
                1 Review = 1 Pt • 1 Video = 5 Pts (5 pts per video)
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#1D1D1B] mt-1.5 flex items-center gap-2">
              <span>Showroom Staff Points Ranking</span>
            </h2>
            <p className="text-xs text-[#8A8479] font-medium mt-0.5">
              Point-wise ranked employee leaderboard based on customer Google review proofs and video reviews
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8479]" />
              <input
                type="text"
                placeholder="Search staff or code..."
                value={rankingSearch}
                onChange={(e) => setRankingSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#FAF8F5] border border-[#CBD5E1] rounded-xl text-xs text-[#1D1D1B] placeholder-[#8A8479] focus:outline-hidden focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706]"
              />
            </div>

            {/* Branch Filter Pills */}
            <div className="flex items-center gap-1 p-0.5 bg-[#FAF8F3] rounded-xl border border-[#E4DFD4] overflow-x-auto max-w-full">
              {[
                { id: 'all', label: 'All Showrooms' },
                { id: '1', label: 'Yelahanka' },
                { id: '2', label: 'Kolar' },
                { id: '3', label: 'Udupi' },
              ].map((b) => (
                <button
                  key={b.id}
                  onClick={() => setRankingBranchFilter(b.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    rankingBranchFilter === b.id
                      ? 'bg-white text-[#1D1D1B] shadow-2xs font-extrabold'
                      : 'text-[#6B6559] hover:text-[#1D1D1B]'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Top 3 Podium Highlights & Ranking Table */}
        {(() => {
          const filtered = pointsRanking.filter((item) => {
            if (rankingBranchFilter !== 'all' && item.branch_id.toString() !== rankingBranchFilter) return false;
            if (rankingSearch.trim()) {
              const q = rankingSearch.trim().toLowerCase();
              return item.full_name.toLowerCase().includes(q) || item.employee_code.toLowerCase().includes(q);
            }
            return true;
          });

          const top1 = filtered[0];
          const top2 = filtered[1];
          const top3 = filtered[2];

          if (!top1) {
            return (
              <div className="py-8 text-center text-xs text-[#8A8479] bg-[#FAF8F5] rounded-2xl border border-[#EBE6DC]">
                No staff members found matching the selected filter.
              </div>
            );
          }

          return (
            <div className="space-y-5">
              {/* Top 3 Podium Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* #2 Rank Card */}
                {top2 ? (
                  <div className="relative p-4 rounded-2xl bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9] border-2 border-[#CBD5E1] shadow-2xs flex flex-col justify-between order-2 sm:order-1">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E2E8F0] text-[#334155] border border-[#CBD5E1] flex items-center gap-1">
                        <Medal className="w-3 h-3 text-[#64748B]" />
                        <span>Rank #2</span>
                      </span>
                      <span className="text-[11px] font-bold text-[#64748B] font-mono">{top2.branch_name}</span>
                    </div>
                    <div className="my-3 text-center">
                      <div className="w-12 h-12 mx-auto rounded-full bg-white border-2 border-[#94A3B8] shadow-xs flex items-center justify-center font-black text-sm text-[#334155] mb-2">
                        {top2.full_name.charAt(0)}
                      </div>
                      <h4 className="font-extrabold text-[#1D1D1B] text-sm leading-tight">{top2.full_name}</h4>
                      <p className="text-[10px] text-[#64748B] font-mono font-bold mt-0.5">{top2.employee_code}</p>
                    </div>
                    <div className="pt-2 border-t border-[#CBD5E1] flex items-center justify-between text-xs">
                      <span className="text-[#64748B] text-[11px] font-medium">Verified Points</span>
                      <span className="font-black text-[#1E293B] font-mono text-sm">
                        {top2.total_points} <span className="text-[10px] font-bold">pts</span>
                      </span>
                    </div>
                  </div>
                ) : <div className="hidden sm:block order-2 sm:order-1" />}

                {/* #1 Rank Card (Gold Centerpiece) */}
                {top1 && (
                  <div className="relative p-5 rounded-2xl bg-gradient-to-b from-[#FEFCE8] to-[#FEF3C7] border-2 border-[#F59E0B] shadow-md flex flex-col justify-between order-1 sm:order-2 sm:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FDE68A] text-[#92400E] border border-[#F59E0B] flex items-center gap-1 shadow-2xs">
                        <Crown className="w-3.5 h-3.5 fill-[#D97706] text-[#D97706]" />
                        <span>#1 Leader</span>
                      </span>
                      <span className="text-[11px] font-extrabold text-[#B45309] font-mono">{top1.branch_name}</span>
                    </div>
                    <div className="my-3 text-center">
                      <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] border-2 border-white shadow-md flex items-center justify-center font-black text-base text-white mb-2">
                        {top1.full_name.charAt(0)}
                      </div>
                      <h4 className="font-black text-[#1D1D1B] text-base leading-tight">{top1.full_name}</h4>
                      <p className="text-[11px] text-[#92400E] font-mono font-bold mt-0.5">{top1.employee_code} • {top1.designation}</p>
                    </div>
                    <div className="pt-2.5 border-t border-[#FCD34D] flex items-center justify-between text-xs">
                      <span className="text-[#92400E] text-[11px] font-extrabold uppercase">Total Points</span>
                      <span className="font-black text-[#78350F] font-mono text-base flex items-center gap-1">
                        <Star className="w-4 h-4 fill-[#D97706] text-[#D97706]" />
                        <span>{top1.total_points} pts</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* #3 Rank Card */}
                {top3 ? (
                  <div className="relative p-4 rounded-2xl bg-gradient-to-b from-[#FFF7ED] to-[#FFEDD5] border-2 border-[#FDBA74] shadow-2xs flex flex-col justify-between order-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FED7AA] text-[#9A3412] border border-[#FDBA74] flex items-center gap-1">
                        <Medal className="w-3 h-3 text-[#C2410C]" />
                        <span>Rank #3</span>
                      </span>
                      <span className="text-[11px] font-bold text-[#C2410C] font-mono">{top3.branch_name}</span>
                    </div>
                    <div className="my-3 text-center">
                      <div className="w-12 h-12 mx-auto rounded-full bg-white border-2 border-[#FB923C] shadow-xs flex items-center justify-center font-black text-sm text-[#9A3412] mb-2">
                        {top3.full_name.charAt(0)}
                      </div>
                      <h4 className="font-extrabold text-[#1D1D1B] text-sm leading-tight">{top3.full_name}</h4>
                      <p className="text-[10px] text-[#9A3412] font-mono font-bold mt-0.5">{top3.employee_code}</p>
                    </div>
                    <div className="pt-2 border-t border-[#FDBA74] flex items-center justify-between text-xs">
                      <span className="text-[#9A3412] text-[11px] font-medium">Verified Points</span>
                      <span className="font-black text-[#7C2D12] font-mono text-sm">
                        {top3.total_points} <span className="text-[10px] font-bold">pts</span>
                      </span>
                    </div>
                  </div>
                ) : <div className="hidden sm:block order-3" />}
              </div>

              {/* Complete Point-Wise Table */}
              {/* Mobile View: Ranking Cards (block sm:hidden) */}
              <div className="block sm:hidden space-y-3">
                {filtered.map((item) => {
                  const isTop1 = item.rank === 1;
                  const isTop2 = item.rank === 2;
                  const isTop3 = item.rank === 3;

                  return (
                    <div
                      key={item.employee_id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isTop1
                          ? 'bg-gradient-to-b from-[#FEFCE8] to-[#FFFBEB] border-[#F59E0B] shadow-xs'
                          : isTop2
                          ? 'bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9] border-[#CBD5E1] shadow-2xs'
                          : isTop3
                          ? 'bg-gradient-to-b from-[#FFF7ED] to-[#FFEDD5] border-[#FDBA74] shadow-2xs'
                          : 'bg-white border-[#E6E1D6] shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-black/5">
                        <div className="flex items-center gap-2 min-w-0">
                          {isTop1 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#FEF3C7] text-[#92400E] font-black text-xs border border-[#FDE68A] shadow-2xs shrink-0">
                              🥇 1
                            </span>
                          ) : isTop2 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F1F5F9] text-[#334155] font-black text-xs border border-[#CBD5E1] shadow-2xs shrink-0">
                              🥈 2
                            </span>
                          ) : isTop3 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#FFEDD5] text-[#9A3412] font-black text-xs border border-[#FDBA74] shadow-2xs shrink-0">
                              🥉 3
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#FAF8F5] text-[#8A8479] font-bold text-xs border border-[#E6E1D6] shrink-0">
                              #{item.rank}
                            </span>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-black text-[#1D1D1B] text-sm leading-tight truncate">{item.full_name}</h4>
                            <span className="text-[10px] text-[#8A8479] font-mono block truncate">{item.employee_code} • {item.designation}</span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-[#536B8A] border border-[#E2E8F0] shrink-0">
                          {item.branch_name}
                        </span>
                      </div>

                      {/* Points and Sub-breakdown Row */}
                      <div className="pt-2.5 flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-[10px] font-bold">
                            <Star className="w-3 h-3 fill-[#D97706] text-[#D97706]" />
                            <span>{item.google_review_points} Google pts</span>
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F3E8FF] text-[#7E22CE] border border-[#D8B4FE] text-[10px] font-bold">
                            <span>🎥 {item.video_review_points} Video pts</span>
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] border border-[#F59E0B]/60 text-[#78350F] font-black text-xs font-mono shadow-2xs">
                            <Star className="w-3.5 h-3.5 fill-[#D97706] text-[#D97706]" />
                            <span>{item.total_points} pts</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tablet & Desktop Table (hidden sm:block) */}
              <div className="hidden sm:block overflow-x-auto rounded-2xl border border-[#EBE6DC]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase tracking-wider font-bold text-[11px]">
                    <tr>
                      <th className="px-4 py-3 text-center w-16">Rank</th>
                      <th className="px-4 py-3">Staff Member</th>
                      <th className="px-4 py-3">Showroom</th>
                      <th className="px-4 py-3 text-center">Google Reviews</th>
                      <th className="px-4 py-3 text-center">Video Reviews</th>
                      <th className="px-4 py-3 text-center">Total Points</th>
                      <th className="px-4 py-3 text-right">Standing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBE6DC] font-medium">
                    {filtered.map((item) => {
                      const isTop1 = item.rank === 1;
                      const isTop2 = item.rank === 2;
                      const isTop3 = item.rank === 3;

                      return (
                        <tr
                          key={item.employee_id}
                          className={`hover:bg-[#FAF5FF] transition-colors ${
                            isTop1 ? 'bg-[#FEFCE8]/40 font-bold' : isTop2 ? 'bg-[#F8FAFC]/40' : isTop3 ? 'bg-[#FFF7ED]/40' : ''
                          }`}
                        >
                          {/* Rank */}
                          <td className="px-4 py-3.5 text-center">
                            {isTop1 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#FEF3C7] text-[#92400E] font-black text-xs border border-[#FDE68A] shadow-2xs">
                                🥇 1
                              </span>
                            ) : isTop2 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F1F5F9] text-[#334155] font-black text-xs border border-[#CBD5E1] shadow-2xs">
                                🥈 2
                              </span>
                            ) : isTop3 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#FFEDD5] text-[#9A3412] font-black text-xs border border-[#FDBA74] shadow-2xs">
                                🥉 3
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#FAF8F5] text-[#8A8479] font-bold text-xs border border-[#E6E1D6]">
                                #{item.rank}
                              </span>
                            )}
                          </td>

                          {/* Staff Member */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] border border-[#D8B4FE] text-[#7E22CE] flex items-center justify-center font-extrabold text-xs shrink-0">
                                {item.full_name.charAt(0)}
                              </div>
                              <div>
                                <span className="font-extrabold text-[#1D1D1B] block">{item.full_name}</span>
                                <span className="text-[10px] text-[#8A8479] font-mono">{item.employee_code} • {item.designation}</span>
                              </div>
                            </div>
                          </td>

                          {/* Showroom */}
                          <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#FAF8F5] text-[#536B8A] border border-[#E2E8F0]">
                              {item.branch_name}
                            </span>
                          </td>

                          {/* Google Reviews */}
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] font-bold text-xs font-mono">
                              <Star className="w-3 h-3 fill-[#D97706] text-[#D97706]" />
                              <span>{item.google_review_points} pts</span>
                            </span>
                          </td>

                          {/* Video Reviews */}
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#F3E8FF] text-[#7E22CE] border border-[#D8B4FE] font-bold text-xs font-mono">
                              <span>🎥 {item.video_review_points} pts</span>
                            </span>
                          </td>

                          {/* Total Points */}
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] border border-[#F59E0B]/60 text-[#78350F] font-black text-xs font-mono shadow-2xs">
                              <Star className="w-3.5 h-3.5 fill-[#D97706] text-[#D97706]" />
                              <span>{item.total_points} Points</span>
                            </span>
                          </td>

                          {/* Standing */}
                          <td className="px-4 py-3.5 text-right">
                            {item.total_points >= 3 ? (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]">
                                ★ Top Performer
                              </span>
                            ) : item.total_points > 0 ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]">
                                Contributor
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-[#8A8479]">
                                Floor Active
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
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
    </div>
  );
};
