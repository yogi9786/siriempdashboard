import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  Receipt,
  CalendarDays,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  UserPlus,
  IndianRupee,
  ShoppingBag,
} from 'lucide-react';
import api from '../../api/client';

export const HrDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/api/v1/hr/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load HR stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 sm:p-8 shadow-[0_4px_18px_rgba(40,35,25,0.045)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FAF8F3] border border-[#E4DFD4] text-[#B45309] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
              <span>HR Central Command</span>
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#E8F4EE] border border-[#C5E3D5] text-[#21845F]">
              3 Showroom Branches
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1D1D1B] tracking-tight">
            Human Resources Management
          </h1>
          <p className="text-xs sm:text-sm text-[#5E5A52] font-medium mt-1">
            Overview of personnel, payroll payslips, leaves, and customer directory across Yelahanka, Kolar, and Udupi showrooms.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/hr/revenue')}
            className="px-4 py-2.5 rounded-xl bg-[#1D1D1B] hover:bg-[#27272A] text-[#E5C378] font-extrabold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-all hover:scale-102 border border-[#3F3F46]"
          >
            <TrendingUp className="w-4 h-4 text-[#E5C378]" />
            <span>Revenue</span>
          </button>
          <button
            onClick={() => navigate('/hr/employees/add')}
            className="px-4 py-2.5 rounded-xl bg-[#21845F] hover:bg-[#1A6B4C] text-white font-extrabold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-all hover:scale-102"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Employee</span>
          </button>
          <button
            onClick={() => navigate('/hr/payslips')}
            className="px-4 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-extrabold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-all hover:scale-102"
          >
            <Receipt className="w-4 h-4" />
            <span>+ Add Pay Slip</span>
          </button>
          <button
            onClick={fetchStats}
            className="p-2.5 rounded-xl bg-white border border-[#E4DFD4] hover:bg-[#FAF8F3] text-[#536B8A] transition-colors cursor-pointer"
            title="Refresh Stats"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Employees */}
        <div
          onClick={() => navigate('/hr/employees')}
          className="bg-white border border-[#E4DFD4] hover:border-[#3B82F6] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#3B82F6] uppercase tracking-wider block mb-1">
                Active Staff
              </span>
              <div className="text-3xl font-black text-[#1D1D1B] font-mono">
                {stats?.total_employees ?? '—'}
              </div>
              <span className="text-xs text-[#8A8479] font-medium mt-1 block">Across 3 Showrooms</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#3B82F6] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 2: Branches Segregation */}
        <div
          onClick={() => navigate('/hr/employees?branch=YELAHANKA')}
          className="bg-white border border-[#E4DFD4] hover:border-[#D97706] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#D97706] uppercase tracking-wider block mb-1">
                Branches
              </span>
              <div className="text-3xl font-black text-[#1D1D1B] font-mono">
                {stats?.total_branches ?? 3}
              </div>
              <span className="text-xs text-[#8A8479] font-medium mt-1 block">Yelahanka, Kolar, Udupi</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 3: Gross Sold Revenue */}
        <div
          onClick={() => navigate('/hr/revenue')}
          className="bg-white border border-[#E4DFD4] hover:border-[#21845F] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#21845F] uppercase tracking-wider block mb-1">
                Gross Revenue
              </span>
              <div className="text-2xl sm:text-3xl font-black text-[#21845F] font-mono">
                {stats?.total_revenue ? `₹${Number(stats.total_revenue).toLocaleString('en-IN')}` : '₹0'}
              </div>
              <span className="text-xs text-[#8A8479] font-medium mt-1 block">Sold & Exchanges</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#E8F4EE] border border-[#C5E3D5] text-[#21845F] flex items-center justify-center shrink-0">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 4: Pending Leave Requests */}
        <div
          onClick={() => navigate('/hr/leaves')}
          className="bg-white border border-[#E4DFD4] hover:border-[#EF4444] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#EF4444] uppercase tracking-wider block mb-1">
                Pending Leaves
              </span>
              <div className="text-3xl font-black text-[#EF4444] font-mono">
                {stats?.pending_leaves ?? 0}
              </div>
              <span className="text-xs text-[#8A8479] font-medium mt-1 block">Awaiting Review</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#FEE2E2] border border-[#FECACA] text-[#EF4444] flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 5: Total Pay Slips */}
        <div
          onClick={() => navigate('/hr/payslips')}
          className="bg-white border border-[#E4DFD4] hover:border-[#0284C7] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#0284C7] uppercase tracking-wider block mb-1">
                Issued Payslips
              </span>
              <div className="text-3xl font-black text-[#1D1D1B] font-mono">
                {stats?.total_payslips ?? 0}
              </div>
              <span className="text-xs text-[#8A8479] font-medium mt-1 block">Salary Slips</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Segregated Branches Highlight Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#1D1D1B] tracking-tight flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#D97706]" />
            <span>Showroom Branches Directory</span>
          </h2>
          <span className="text-xs text-[#6B6559] font-medium">Click a branch to view its employees</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Branch 1: Yelahanka */}
          <div
            onClick={() => navigate('/hr/employees?branch=YELAHANKA')}
            className="bg-white border-2 border-[#D97706]/40 hover:border-[#D97706] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#D97706] tracking-wider block">
                  Main Showroom Branch
                </span>
                <h3 className="text-lg font-black text-[#1D1D1B] mt-0.5 group-hover:text-[#D97706] transition-colors">
                  Yelahanka Showroom
                </h3>
                <p className="text-xs text-[#6B6559] mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Bangalore North, Karnataka</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-[#D97706]">
                  {stats?.branch_distribution?.find((b: any) => b.branch_code === 'YELAHANKA')?.employee_count ?? 23}
                </span>
                <span className="text-[10px] text-[#8A8479] block uppercase font-bold">Staff</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#F0ECE1] flex items-center justify-between text-xs font-bold text-[#D97706]">
              <span>Manage Yelahanka Personnel</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Branch 2: Kolar */}
          <div
            onClick={() => navigate('/hr/employees?branch=KOLAR')}
            className="bg-white border border-[#E4DFD4] hover:border-[#38BDF8] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#0284C7] tracking-wider block">
                  Branch Showroom
                </span>
                <h3 className="text-lg font-black text-[#1D1D1B] mt-0.5 group-hover:text-[#0284C7] transition-colors">
                  Kolar Showroom
                </h3>
                <p className="text-xs text-[#6B6559] mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#0284C7]" />
                  <span>Kolar District, Karnataka</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-[#0284C7]">
                  {stats?.branch_distribution?.find((b: any) => b.branch_code === 'KOLAR')?.employee_count ?? 12}
                </span>
                <span className="text-[10px] text-[#8A8479] block uppercase font-bold">Staff</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#F0ECE1] flex items-center justify-between text-xs font-bold text-[#0284C7]">
              <span>Manage Kolar Personnel</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Branch 3: Udupi */}
          <div
            onClick={() => navigate('/hr/employees?branch=UDUPI')}
            className="bg-white border border-[#E4DFD4] hover:border-[#10B981] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#059669] tracking-wider block">
                  Branch Showroom
                </span>
                <h3 className="text-lg font-black text-[#1D1D1B] mt-0.5 group-hover:text-[#059669] transition-colors">
                  Udupi Showroom
                </h3>
                <p className="text-xs text-[#6B6559] mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#059669]" />
                  <span>Coastal Karnataka</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-[#059669]">
                  {stats?.branch_distribution?.find((b: any) => b.branch_code === 'UDUPI')?.employee_count ?? 20}
                </span>
                <span className="text-[10px] text-[#8A8479] block uppercase font-bold">Staff</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#F0ECE1] flex items-center justify-between text-xs font-bold text-[#059669]">
              <span>Manage Udupi Personnel</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Module 1: Add / Issue Pay Slips */}
        <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-[#E8F4EE] border border-[#C5E3D5] text-[#21845F] flex items-center justify-center mb-3">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#1D1D1B]">Employee Pay Slips</h3>
            <p className="text-xs text-[#5E5A52] mt-1 leading-relaxed">
              Upload salary slips time-by-time for showroom staff across branches. Employees can instantly view and download their payslip images in their dashboard.
            </p>
          </div>
          <button
            onClick={() => navigate('/hr/payslips')}
            className="w-full py-2.5 rounded-xl bg-[#21845F] hover:bg-[#1A6B4C] text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
          >
            <span>Open Pay Slips Manager</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Module 2: Customer Directory */}
        <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#1D1D1B]">Showroom Customers Directory</h3>
            <p className="text-xs text-[#5E5A52] mt-1 leading-relaxed">
              Complete visibility into customer interactions, purchases, and savings schemes enrolled by employees across Yelahanka, Kolar, and Udupi.
            </p>
          </div>
          <button
            onClick={() => navigate('/hr/customers')}
            className="w-full py-2.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
          >
            <span>View All Customer Logs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Module 3: Showroom Revenue & Sales */}
        <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#1D1D1B]">Showroom Revenue & Sales</h3>
            <p className="text-xs text-[#5E5A52] mt-1 leading-relaxed">
              Real-time revenue monitoring, customer jewellery purchases, and savings schemes segregation across Yelahanka, Kolar, and Udupi showrooms.
            </p>
          </div>
          <button
            onClick={() => navigate('/hr/revenue')}
            className="w-full py-2.5 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
          >
            <span>View Revenue Breakdown</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

