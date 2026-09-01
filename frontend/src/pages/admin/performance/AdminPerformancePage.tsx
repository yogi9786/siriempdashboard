import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  Crown,
  Trophy,
  Medal,
  Star,
  Search,
  Filter,
  Building2,
  Users,
  Shirt,
  UserCheck,
  Compass,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { AdminEmployeePerformance } from '../../../types';
import { PerformanceScoreBadge } from '../../../components/admin/ui/PerformanceScoreBadge';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useAdminBranch } from '../../../context/AdminBranchContext';
import { useToast } from '../../../context/ToastContext';
import api from '../../../api/client';

export const AdminPerformancePage: React.FC = () => {
  const navigate = useNavigate();
  const { branches, selectedBranchId } = useAdminBranch();
  const { error: toastError } = useToast();

  const [leaderboard, setLeaderboard] = useState<AdminEmployeePerformance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>(selectedBranchId?.toString() || 'all');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (branchFilter !== 'all') params.branch_id = parseInt(branchFilter);
      if (deptFilter !== 'all') params.department = deptFilter;

      const res = await api.get<AdminEmployeePerformance[]>('/api/v1/admin/performance/leaderboard', { params });
      setLeaderboard(res.data);
    } catch (err) {
      console.error('Failed to load performance leaderboard:', err);
      toastError('Failed to fetch staff performance rankings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [searchTerm, branchFilter, deptFilter]);

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  return (
    <div className="space-y-7 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBE6DC] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#21845F] bg-[#E8F4EE] px-2.5 py-1 rounded-full border border-[#C5E3D5]">
              Executive Evaluation Engine
            </span>
            <span className="text-xs text-[#8A8479] font-medium">{leaderboard.length} Staff Evaluated</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1D1D1B] tracking-tight mt-1">
            Staff Performance Leaderboard
          </h1>
          <p className="text-xs text-[#8A8479] font-medium mt-0.5">
            5-Dimension weighted evaluation covering Engagement, Gold Schemes, Google Reviews, Attire, and Field Drives
          </p>
        </div>
      </div>

      {/* Evaluation Weights Notice */}
      <div className="p-4 rounded-2xl bg-linear-to-r from-[#FAF5FF] via-white to-[#FAF8F3] border border-[#D8B4FE] flex items-start gap-3 shadow-2xs">
        <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] border border-[#D8B4FE] text-[#7E22CE] flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1 text-xs">
          <p className="font-bold text-[#1D1D1B]">Multi-Dimensional Scoring Formulation:</p>
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-[#5E5A52]">
            <span className="bg-white px-2 py-0.5 rounded-md border border-[#E4DFD4]">
              Customer Engagement: <b className="text-[#7E22CE]">30%</b>
            </span>
            <span className="bg-white px-2 py-0.5 rounded-md border border-[#E4DFD4]">
              Gold Schemes Closed: <b className="text-[#21845F]">30%</b>
            </span>
            <span className="bg-white px-2 py-0.5 rounded-md border border-[#E4DFD4]">
              Google Reviews: <b className="text-[#B97855]">15%</b>
            </span>
            <span className="bg-white px-2 py-0.5 rounded-md border border-[#E4DFD4]">
              Attire Compliance: <b className="text-[#526F91]">15%</b>
            </span>
            <span className="bg-white px-2 py-0.5 rounded-md border border-[#E4DFD4]">
              Outdoor Marketing: <b className="text-[#21845F]">10%</b>
            </span>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Rank 2 (Silver) */}
          <div
            onClick={() => navigate(`/admin/employees/${top2.employee_id}`)}
            className="bg-white border border-[#E4DFD4] hover:border-[#94A3B8] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between order-2 md:order-1"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-[#F1F5F9] border border-[#CBD5E1] text-[#475569] font-extrabold text-sm flex items-center justify-center shadow-2xs">
                  #2
                </span>
                <Medal className="w-5 h-5 text-[#94A3B8]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1D1D1B] group-hover:text-[#7E22CE] transition-colors">
                  {top2.full_name}
                </h3>
                <p className="text-xs text-[#8A8479] font-medium">{top2.designation} • {top2.branch_name}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#EBE6DC]">
                <span className="text-xs text-[#8A8479] font-medium">Overall Score</span>
                <PerformanceScoreBadge score={top2.overall_score} size="md" />
              </div>
            </div>
          </div>

          {/* Rank 1 (Gold Crown - Featured) */}
          <div
            onClick={() => navigate(`/admin/employees/${top1.employee_id}`)}
            className="bg-linear-to-br from-[#FEF3C7] via-white to-[#FDE68A]/30 border-2 border-[#F59E0B] rounded-3xl p-6 shadow-md hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between order-1 md:order-2 relative overflow-hidden -translate-y-1"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#F59E0B]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#F59E0B] to-[#D97706] text-white font-extrabold text-base flex items-center justify-center shadow-md">
                  #1
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#B45309] font-extrabold text-xs">
                  <Crown className="w-3.5 h-3.5 fill-[#B45309]" /> Top Performer
                </span>
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#1D1D1B] group-hover:text-[#B45309] transition-colors">
                  {top1.full_name}
                </h3>
                <p className="text-xs text-[#78350F] font-bold">{top1.designation} • {top1.branch_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#FDE68A]">
                <div className="p-2 rounded-xl bg-white/80 border border-[#FDE68A] text-center">
                  <span className="text-[10px] font-bold text-[#78350F] block">Schemes</span>
                  <span className="text-sm font-extrabold text-[#1D1D1B]">{top1.schemes_count} Closed</span>
                </div>
                <div className="p-2 rounded-xl bg-white/80 border border-[#FDE68A] text-center">
                  <span className="text-[10px] font-bold text-[#78350F] block">Overall Score</span>
                  <span className="text-sm font-extrabold text-[#B45309]">{top1.overall_score}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rank 3 (Bronze) */}
          <div
            onClick={() => navigate(`/admin/employees/${top3.employee_id}`)}
            className="bg-white border border-[#E4DFD4] hover:border-[#D97706] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between order-3"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-[#FAF1EC] border border-[#ECCFC0] text-[#B97855] font-extrabold text-sm flex items-center justify-center shadow-2xs">
                  #3
                </span>
                <Trophy className="w-5 h-5 text-[#B97855]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1D1D1B] group-hover:text-[#7E22CE] transition-colors">
                  {top3.full_name}
                </h3>
                <p className="text-xs text-[#8A8479] font-medium">{top3.designation} • {top3.branch_name}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#EBE6DC]">
                <span className="text-xs text-[#8A8479] font-medium">Overall Score</span>
                <PerformanceScoreBadge score={top3.overall_score} size="md" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 bg-white border border-[#E4DFD4] rounded-2xl shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#8A8479] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search leaderboard by staff name or code..."
            className="w-full pl-10 pr-4 py-2 input-luxury-purple rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-bold text-[#1D1D1B] focus:outline-none cursor-pointer"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id.toString()}>
                {b.name} Showroom
              </option>
            ))}
          </select>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-bold text-[#1D1D1B] focus:outline-none cursor-pointer"
          >
            <option value="all">All Departments</option>
            <option value="Sales">Sales</option>
            <option value="Gold Schemes">Gold Schemes</option>
            <option value="Marketing">Marketing / Outdoor</option>
          </select>
        </div>
      </div>

      {/* Performance Matrix Table */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 shadow-[0_4px_18px_rgba(40,35,25,0.045)]">
        {isLoading ? (
          <LoadingSpinner message="Calculating rankings..." />
        ) : leaderboard.length === 0 ? (
          <EmptyState
            title="No staff evaluations"
            description="No employee records found matching your filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase font-bold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Engagement (30%)</th>
                  <th className="px-4 py-3">Schemes (30%)</th>
                  <th className="px-4 py-3">Reviews (15%)</th>
                  <th className="px-4 py-3">Compliance (15%)</th>
                  <th className="px-4 py-3">Outdoor (10%)</th>
                  <th className="px-4 py-3 text-center">Overall Score</th>
                  <th className="px-4 py-3 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE6DC] font-medium">
                {leaderboard.map((emp) => (
                  <tr
                    key={emp.employee_id}
                    onClick={() => navigate(`/admin/employees/${emp.employee_id}`)}
                    className="hover:bg-[#FAF5FF] transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3.5">
                      <span
                        className={`w-7 h-7 rounded-xl font-extrabold text-xs flex items-center justify-center shadow-2xs ${
                          emp.rank === 1
                            ? 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]'
                            : emp.rank === 2
                            ? 'bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]'
                            : emp.rank === 3
                            ? 'bg-[#FAF1EC] text-[#B97855] border border-[#ECCFC0]'
                            : 'bg-[#FAF8F3] text-[#8A8479] border border-[#E4DFD4]'
                        }`}
                      >
                        #{emp.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] border border-[#D8B4FE] text-[#7E22CE] flex items-center justify-center font-bold text-xs shrink-0">
                          {emp.full_name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-[#1D1D1B] group-hover:text-[#7E22CE] transition-colors block">
                            {emp.full_name}
                          </span>
                          <span className="text-[10px] text-[#8A8479] font-mono whitespace-nowrap inline-flex items-center shrink-0">{emp.employee_code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-full bg-[#FAF8F3] border border-[#D8B4FE] text-[#7E22CE] font-bold text-[10px]">
                        {emp.branch_name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-[#1D1D1B]">
                      {emp.customer_engagement_score}%
                      <span className="text-[10px] font-normal text-[#8A8479] block">({emp.customers_attended} cust)</span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-[#21845F]">
                      {emp.gold_schemes_score}%
                      <span className="text-[10px] font-normal text-[#8A8479] block">({emp.schemes_count} plans)</span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-[#B97855]">
                      {emp.google_reviews_score}%
                      <span className="text-[10px] font-normal text-[#8A8479] block">({emp.reviews_count} rev)</span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-[#526F91]">
                      {emp.compliance_score}%
                    </td>
                    <td className="px-4 py-3.5 font-bold text-[#21845F]">
                      {emp.outdoor_marketing_score}%
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <PerformanceScoreBadge score={emp.overall_score} size="md" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-xs font-bold text-[#7E22CE] group-hover:underline">
                        View 360° →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
