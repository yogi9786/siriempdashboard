import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Award,
  UserCheck,
  Star,
  Shirt,
  Compass,
  FileText,
  FileSpreadsheet,
  ShieldCheck,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Shield,
  Layers,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useAdminBranch } from '../../../context/AdminBranchContext';
import { SignOutConfirmModal } from '../../auth/SignOutConfirmModal';
import logoImg from '../../../assets/siri samruddhi logo.png';

interface AdminSidebarProps {
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onCloseMobile }) => {
  const { user, logout } = useAuth();
  const { branches, selectedBranchId, setSelectedBranchId } = useAdminBranch();
  const location = useLocation();
  const navigate = useNavigate();

  const [branchesOpen, setBranchesOpen] = useState(
    location.pathname.startsWith('/admin/branches')
  );
  const [peopleOpen, setPeopleOpen] = useState(
    location.pathname.startsWith('/admin/managers') || location.pathname.startsWith('/admin/employees') || location.pathname.startsWith('/admin/performance')
  );
  const [opsOpen, setOpsOpen] = useState(
    location.pathname.startsWith('/admin/customers') ||
    location.pathname.startsWith('/admin/customer-activities') ||
    location.pathname.startsWith('/admin/gold-schemes') ||
    location.pathname.startsWith('/admin/outdoor-marketing') ||
    location.pathname.startsWith('/admin/google-reviews') ||
    location.pathname.startsWith('/admin/attire') ||
    location.pathname.startsWith('/admin/gallery')
  );
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <aside className="w-64 bg-[#18181B] text-white flex flex-col h-full border-r border-[#27272A] select-none shadow-2xs">
      {/* Brand Header */}
      <div className="h-18 px-4 bg-[#18181B] flex items-center border-b border-[#27272A]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-[#27272A] to-[#1F1F23] border border-[#C5A869]/60 p-1 flex items-center justify-center shrink-0 shadow-xs">
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
              <Sparkles className="w-2.5 h-2.5 text-[#E5C378]" />
              <span>Enterprise Admin</span>
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-3 overflow-y-auto custom-scrollbar">
        {/* ---------------- MAIN SECTION ---------------- */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center justify-between">
            <span>Enterprise Main</span>
            <span className="text-[9px] text-[#E5C378] font-bold bg-[#27272A] px-1.5 py-0.5 rounded-sm border border-[#3F3F46]">
              HQ
            </span>
          </div>

          <NavLink
            to="/admin/dashboard"
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                isActive
                  ? 'bg-[#2E1065]/80 text-[#F3E8FF] font-bold border-l-[3px] border-l-[#A855F7] border border-[#7E22CE]/50 shadow-xs pl-2.5'
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
                <span>Command Center</span>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#C084FC] ml-auto" />}
              </>
            )}
          </NavLink>

          <NavLink
            to="/admin/performance"
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                isActive
                  ? 'bg-[#064E3B]/80 text-[#D1FAE5] font-bold border-l-[3px] border-l-[#10B981] border border-[#059669]/50 shadow-xs pl-2.5'
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
                  <Award className="w-3.5 h-3.5" />
                </div>
                <span>Performance Scoring</span>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] ml-auto" />}
              </>
            )}
          </NavLink>
        </div>

        {/* ---------------- BRANCHES SECTION ---------------- */}
        <div className="space-y-1">
          <button
            onClick={() => setBranchesOpen(!branchesOpen)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              location.pathname.startsWith('/admin/branches')
                ? 'bg-[#1E293B]/80 text-[#E2E8F0] font-bold border-l-[3px] border-l-[#60A5FA] border border-[#3B82F6]/30 shadow-xs pl-2.5'
                : 'text-[#D4D4D8] hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  location.pathname.startsWith('/admin/branches')
                    ? 'bg-[#1E3A8A] text-[#93C5FD] border border-[#3B82F6]/40'
                    : 'bg-[#27272A] text-[#93C5FD]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <span>Branches (3)</span>
            </div>
            {branchesOpen ? (
              <ChevronDown className="w-4 h-4 text-[#A1A1AA]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[#A1A1AA]" />
            )}
          </button>

          {branchesOpen && (
            <div className="pl-6 pr-1 py-1 space-y-1 animate-in fade-in slide-in-from-top-1">
              <NavLink
                to="/admin/branches"
                end
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive ? 'bg-[#3B82F6] text-white font-semibold' : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Layers className="w-3 h-3" />
                <span>All Branches Overview</span>
              </NavLink>

              {branches.map((b) => (
                <NavLink
                  key={b.id}
                  to={`/admin/branches/${b.id}`}
                  onClick={() => {
                    setSelectedBranchId(b.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive ? 'bg-[#3B82F6] text-white font-semibold' : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#60A5FA]" />
                  <span className="truncate">{b.name}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* ---------------- PEOPLE SECTION ---------------- */}
        <div className="space-y-1">
          <button
            onClick={() => setPeopleOpen(!peopleOpen)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              peopleOpen
                ? 'text-[#E2E8F0] font-bold'
                : 'text-[#D4D4D8] hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#27272A] text-[#FBBF24] flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5" />
              </div>
              <span>People & Staff</span>
            </div>
            {peopleOpen ? (
              <ChevronDown className="w-4 h-4 text-[#A1A1AA]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[#A1A1AA]" />
            )}
          </button>

          {peopleOpen && (
            <div className="pl-6 pr-1 py-1 space-y-1 animate-in fade-in slide-in-from-top-1">
              <NavLink
                to="/admin/managers"
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive ? 'bg-[#D97706] text-white font-semibold' : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Showroom Managers</span>
              </NavLink>

              <NavLink
                to="/admin/employees"
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive ? 'bg-[#D97706] text-white font-semibold' : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Users className="w-3.5 h-3.5" />
                <span>Employees Directory</span>
              </NavLink>

              <NavLink
                to="/admin/performance"
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive ? 'bg-[#D97706] text-white font-semibold' : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Award className="w-3.5 h-3.5" />
                <span>Staff Leaderboard</span>
              </NavLink>

              <NavLink
                to="/admin/outdoor-marketing"
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive ? 'bg-[#D97706] text-white font-semibold' : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Outdoor Marketing</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* ---------------- ANALYTICS & REPORTS ---------------- */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">
            <span>Intelligence & Reports</span>
          </div>

          <NavLink
            to="/admin/reports"
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                isActive
                  ? 'bg-[#1E3A8A]/80 text-[#DBEAFE] font-bold border-l-[3px] border-l-[#3B82F6] border border-[#2563EB]/50 shadow-xs pl-2.5'
                  : 'text-[#D4D4D8] hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-[#1D4ED8] text-white border border-[#3B82F6]/60 shadow-2xs'
                      : 'bg-[#27272A] text-[#60A5FA] group-hover:bg-[#3F3F46]'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </div>
                <span>Executive Reports</span>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#60A5FA] ml-auto" />}
              </>
            )}
          </NavLink>
        </div>

        {/* ---------------- SYSTEM SECTION ---------------- */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">
            <span>System Administration</span>
          </div>

          <NavLink
            to="/admin/settings"
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                isActive
                  ? 'bg-[#374151]/80 text-white font-bold border-l-[3px] border-l-[#9CA3AF] border border-[#4B5563]/50 shadow-xs pl-2.5'
                  : 'text-[#D4D4D8] hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-[#4B5563] text-white border border-[#6B7280]/60 shadow-2xs'
                      : 'bg-[#27272A] text-[#9CA3AF] group-hover:bg-[#3F3F46]'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                </div>
                <span>System Settings</span>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF] ml-auto" />}
              </>
            )}
          </NavLink>
        </div>
      </nav>

      {/* Super Admin User Footer */}
      <div className="p-3 border-t border-[#27272A] bg-[#18181B]">
        <div className="flex items-center justify-between px-2.5 py-2 bg-[#222226] rounded-xl border border-[#2E2E33] shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-[#78350F] to-[#D97706] text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-xs border border-[#FBBF24]/60">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.full_name || 'Super Admin'}</p>
              <p className="text-[10px] text-[#E5C378] font-bold truncate">Enterprise Control</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            title="Sign out of Enterprise Admin"
            className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#F87171] hover:bg-white/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      <SignOutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
          navigate('/admin/login');
        }}
      />
    </aside>
  );
};
