import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileSpreadsheet,
  Receipt,
  CalendarDays,
  Building2,
  ChevronDown,
  ChevronRight,
  LogOut,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { SignOutConfirmModal } from '../../auth/SignOutConfirmModal';
import logoImg from '../../../assets/siri samruddhi logo.png';
import api from '../../../api/client';

interface HrSidebarProps {
  onCloseMobile?: () => void;
}

export const HrSidebar: React.FC<HrSidebarProps> = ({ onCloseMobile }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const [branchesOpen, setBranchesOpen] = useState<boolean>(true);
  const [employeesOpen, setEmployeesOpen] = useState<boolean>(
    location.pathname.startsWith('/hr/employees')
  );
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [branchCounts, setBranchCounts] = useState<Record<string, number>>({});
  const [pendingLeavesCount, setPendingLeavesCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const res = await api.get('/api/v1/hr/stats');
        if (isMounted && res.data) {
          const counts: Record<string, number> = {};
          (res.data.branch_distribution || []).forEach((b: any) => {
            counts[b.branch_code?.toUpperCase()] = b.employee_count || 0;
          });
          setBranchCounts(counts);
          setPendingLeavesCount(res.data.pending_leaves || 0);
        }
      } catch {
        // silent
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <aside className="w-64 bg-[#18181B] text-white flex flex-col h-full border-r border-[#27272A] select-none shadow-2xs">
      {/* Brand Header */}
      <div className="h-18 px-4 bg-[#18181B] flex items-center border-b border-[#27272A]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#27272A] to-[#1F1F23] border border-[#3F3F46] p-1 flex items-center justify-center shrink-0 shadow-xs">
            <img
              src={logoImg}
              alt="Siri Samruddhi Gold Palace"
              className="w-full h-full object-contain scale-105"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-[13px] font-extrabold uppercase tracking-wider text-white truncate flex items-center gap-1.5">
              <span>Siri Samruddhi</span>
            </h1>
            <p className="text-[11px] font-bold text-[#E5C378] tracking-wide truncate flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#E5C378]" />
              <span>HR Central Portal</span>
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center justify-between">
          <span>Human Resources</span>
          <span className="text-[9px] text-[#E5C378] font-bold bg-[#27272A] px-1.5 py-0.5 rounded-sm border border-[#3F3F46]">
            HR ADMIN
          </span>
        </div>

        {/* 1. HR Dashboard Overview */}
        <NavLink
          to="/hr/dashboard"
          onClick={onCloseMobile}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 relative group ${
              isActive
                ? 'bg-[#2E1065]/70 text-[#F3E8FF] font-bold border-l-[3px] border-l-[#A855F7] border border-[#7E22CE]/40 shadow-xs pl-2.5'
                : 'text-[#D4D4D8] hover:text-white hover:bg-white/5'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isActive
                    ? 'bg-[#3B0764] text-[#D8B4FE] border border-[#7E22CE]/60 shadow-2xs'
                    : 'bg-[#27272A] text-[#C084FC] group-hover:bg-[#3F3F46]'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
              </div>
              <span>HR Dashboard</span>
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#C084FC] ml-auto" />}
            </>
          )}
        </NavLink>

        {/* 2. Segregated Branches Section (Yelahanka and the other 2) */}
        <div>
          <button
            onClick={() => setBranchesOpen(!branchesOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#D4D4D8] hover:text-white hover:bg-white/5 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#27272A] text-[#E5C378] flex items-center justify-center shrink-0 group-hover:bg-[#3F3F46]">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#E5C378]">Branches</span>
            </div>
            {branchesOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#A1A1AA]" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#A1A1AA]" />
            )}
          </button>

          {branchesOpen && (
            <div className="pl-6 pr-1 py-1 space-y-1 transition-all">
              {/* Branch 1: Yelahanka (Main Showroom) */}
              <NavLink
                to="/hr/employees?branch=YELAHANKA"
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    location.search.includes('YELAHANKA')
                      ? 'bg-[#E5C378]/20 text-[#E5C378] font-bold border border-[#E5C378]/40'
                      : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="w-3 h-3 text-[#E5C378] shrink-0" />
                  <span className="truncate">Yelahanka Branch</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#27272A] text-[#E5C378] border border-[#3F3F46]">
                  {branchCounts['YELAHANKA'] ?? 23} Staff
                </span>
              </NavLink>

              {/* Branch 2: Kolar */}
              <NavLink
                to="/hr/employees?branch=KOLAR"
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    location.search.includes('KOLAR')
                      ? 'bg-[#38BDF8]/20 text-[#38BDF8] font-bold border border-[#38BDF8]/40'
                      : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="w-3 h-3 text-[#38BDF8] shrink-0" />
                  <span className="truncate">Kolar Branch</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#27272A] text-[#38BDF8] border border-[#3F3F46]">
                  {branchCounts['KOLAR'] ?? 12} Staff
                </span>
              </NavLink>

              {/* Branch 3: Udupi */}
              <NavLink
                to="/hr/employees?branch=UDUPI"
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    location.search.includes('UDUPI')
                      ? 'bg-[#34D399]/20 text-[#34D399] font-bold border border-[#34D399]/40'
                      : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="w-3 h-3 text-[#34D399] shrink-0" />
                  <span className="truncate">Udupi Branch</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#27272A] text-[#34D399] border border-[#3F3F46]">
                  {branchCounts['UDUPI'] ?? 20} Staff
                </span>
              </NavLink>
            </div>
          )}
        </div>

        {/* 3. Employees Management */}
        <div>
          <button
            onClick={() => setEmployeesOpen(!employeesOpen)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer group ${
              location.pathname.startsWith('/hr/employees')
                ? 'bg-[#1E293B]/70 text-[#E2E8F0] font-bold border-l-[3px] border-l-[#60A5FA] border border-[#3B82F6]/30 shadow-xs pl-2.5'
                : 'text-[#D4D4D8] hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  location.pathname.startsWith('/hr/employees')
                    ? 'bg-[#1E3A8A] text-[#93C5FD] border border-[#3B82F6]/40 shadow-2xs'
                    : 'bg-[#27272A] text-[#93C5FD] group-hover:bg-[#3F3F46]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
              </div>
              <span>Employees</span>
            </div>
            {employeesOpen ? (
              <ChevronDown className="w-4 h-4 text-[#A1A1AA]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[#A1A1AA]" />
            )}
          </button>

          {employeesOpen && (
            <div className="pl-6 pr-1 py-1 space-y-1 transition-all duration-200">
              <NavLink
                to="/hr/employees"
                end
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive && !location.search
                      ? 'bg-[#3B82F6] text-white font-semibold shadow-xs'
                      : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Users className="w-3.5 h-3.5" />
                <span>All Employees</span>
              </NavLink>
              <NavLink
                to="/hr/employees/add"
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[#3B82F6] text-white font-semibold shadow-xs'
                      : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add Employee</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* 4. Pay Slips (Dedicated Page for HR to issue & manage payslips) */}
        <NavLink
          to="/hr/payslips"
          onClick={onCloseMobile}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 relative group ${
              isActive
                ? 'bg-[#064E3B]/70 text-[#D1FAE5] font-bold border-l-[3px] border-l-[#10B981] border border-[#059669]/40 shadow-xs pl-2.5'
                : 'text-[#D4D4D8] hover:text-white hover:bg-white/5'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isActive
                    ? 'bg-[#065F46] text-[#A7F3D0] border border-[#10B981]/50 shadow-2xs'
                    : 'bg-[#27272A] text-[#34D399] group-hover:bg-[#3F3F46]'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 flex items-center justify-between min-w-0">
                <span className="truncate">Add Pay Slip</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-[#059669]/40 text-[#A7F3D0] border border-[#10B981]/40 font-bold uppercase tracking-wider ml-1 shrink-0">
                  Salary
                </span>
              </div>
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] ml-1 shrink-0" />}
            </>
          )}
        </NavLink>

        {/* 5. Customer Details Across Branches */}
        <NavLink
          to="/hr/customers"
          onClick={onCloseMobile}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 relative group ${
              isActive
                ? 'bg-[#312E81]/70 text-[#EEF2FF] font-bold border-l-[3px] border-l-[#818CF8] border border-[#6366F1]/40 shadow-xs pl-2.5'
                : 'text-[#D4D4D8] hover:text-white hover:bg-white/5'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isActive
                    ? 'bg-[#3730A3] text-[#C7D2FE] border border-[#818CF8]/50 shadow-2xs'
                    : 'bg-[#27272A] text-[#818CF8] group-hover:bg-[#3F3F46]'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 flex items-center justify-between min-w-0">
                <span className="truncate">Customer Details</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-[#3730A3]/60 text-[#C7D2FE] border border-[#6366F1]/30 font-semibold uppercase tracking-wider ml-1 shrink-0">
                  Logs
                </span>
              </div>
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#818CF8] ml-1 shrink-0" />}
            </>
          )}
        </NavLink>

        {/* 6. Employee Leave Requests */}
        <NavLink
          to="/hr/leaves"
          onClick={onCloseMobile}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 relative group ${
              isActive
                ? 'bg-[#78350F]/60 text-[#FEF3C7] font-bold border-l-[3px] border-l-[#F59E0B] border border-[#D97706]/40 shadow-xs pl-2.5'
                : 'text-[#D4D4D8] hover:text-white hover:bg-white/5'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isActive
                    ? 'bg-[#92400E] text-[#FDE68A] border border-[#F59E0B]/50 shadow-2xs'
                    : 'bg-[#27272A] text-[#FBBF24] group-hover:bg-[#3F3F46]'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 flex items-center justify-between min-w-0">
                <span className="truncate">Leave Requests</span>
                {pendingLeavesCount > 0 && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#EF4444] text-white font-black shrink-0 ml-1">
                    {pendingLeavesCount}
                  </span>
                )}
              </div>
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] ml-1 shrink-0" />}
            </>
          )}
        </NavLink>
      </nav>

      {/* User Footer & Logout */}
      <div className="p-3 border-t border-[#27272A] bg-[#18181B]">
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{user?.full_name || 'HR Manager'}</p>
            <p className="text-[10px] text-[#A1A1AA] truncate font-mono">Role: HR Admin</p>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="p-1.5 text-[#A1A1AA] hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <SignOutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={logout}
      />
    </aside>
  );
};

