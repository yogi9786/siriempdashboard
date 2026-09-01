import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  UserPlus,
  Compass,
  ChevronDown,
  ChevronRight,
  LogOut,
  FileText,
  Sparkles,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SignOutConfirmModal } from '../auth/SignOutConfirmModal';
import logoImg from '../../assets/siri samruddhi logo.png';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const [employeesOpen, setEmployeesOpen] = useState(
    location.pathname.startsWith('/employees')
  );
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <aside className="w-64 bg-[#18181B] text-white flex flex-col h-full border-r border-[#27272A] select-none shadow-2xs">
      {/* Brand Header with Divider below logo */}
      <div className="h-18 px-4 bg-[#18181B] flex items-center border-b border-[#27272A]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-[#27272A] to-[#1F1F23] border border-[#3F3F46] p-1 flex items-center justify-center shrink-0 shadow-xs">
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
            <p className="text-[11px] font-bold text-[#E5C378] tracking-wide truncate">
              Gold Palace Portal
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links on Dark Grey */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center justify-between">
          <span>Showroom Operations</span>
          <span className="text-[9px] text-[#E5C378] font-bold bg-[#27272A] px-1.5 py-0.5 rounded-sm border border-[#3F3F46]">
            PORTAL
          </span>
        </div>

        {/* 1. Dashboard (Purple & Lavender Theme on Dark Grey) */}
        <NavLink
          to="/dashboard"
          onClick={onCloseMobile}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 relative group ${isActive
              ? 'bg-[#2E1065]/70 text-[#F3E8FF] font-bold border-l-[3px] border-l-[#A855F7] border border-[#7E22CE]/40 shadow-xs pl-2.5'
              : 'text-[#D4D4D8] hover:text-white hover:bg-white/5'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isActive
                  ? 'bg-[#3B0764] text-[#D8B4FE] border border-[#7E22CE]/60 shadow-2xs'
                  : 'bg-[#27272A] text-[#C084FC] group-hover:bg-[#3F3F46]'
                }`}>
                <LayoutDashboard className="w-3.5 h-3.5" />
              </div>
              <span>Dashboard</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#C084FC] ml-auto" />
              )}
            </>
          )}
        </NavLink>

        {/* 2. Employees Section (Slate Blue on Dark Grey) */}
        <div>
          <button
            onClick={() => setEmployeesOpen(!employeesOpen)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer group ${location.pathname.startsWith('/employees')
                ? 'bg-[#1E293B]/70 text-[#E2E8F0] font-bold border-l-[3px] border-l-[#60A5FA] border border-[#3B82F6]/30 shadow-xs pl-2.5'
                : 'text-[#D4D4D8] hover:text-white hover:bg-white/5'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${location.pathname.startsWith('/employees')
                  ? 'bg-[#1E3A8A] text-[#93C5FD] border border-[#3B82F6]/40 shadow-2xs'
                  : 'bg-[#27272A] text-[#93C5FD] group-hover:bg-[#3F3F46]'
                }`}>
                <Users className="w-3.5 h-3.5" />
              </div>
              <span>Employees</span>
            </div>
            {employeesOpen ? (
              <ChevronDown className="w-4 h-4 text-[#A1A1AA] transition-transform duration-200" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[#A1A1AA] transition-transform duration-200" />
            )}
          </button>

          {employeesOpen && (
            <div className="pl-6 pr-1 py-1 space-y-1 transition-all duration-200 animate-in fade-in slide-in-from-top-1">
              <NavLink
                to="/employees"
                end
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isActive
                    ? 'bg-[#3B82F6] text-white font-semibold shadow-xs'
                    : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Users className="w-3.5 h-3.5" />
                <span>All Employees</span>
              </NavLink>
              <NavLink
                to="/employees/add"
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isActive
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

        {/* 3. Outdoor Marketing (Emerald Sage on Dark Grey - Single Direct Link) */}
        <NavLink
          to="/outdoor-marketing"
          onClick={onCloseMobile}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 relative group ${
              isActive
                ? 'bg-[#064E3B]/60 text-[#D1FAE5] font-bold border-l-[3px] border-l-[#10B981] border border-[#059669]/40 shadow-xs pl-2.5'
                : 'text-[#D4D4D8] hover:text-white hover:bg-white/5'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isActive
                    ? 'bg-[#065F46] text-[#A7F3D0] border border-[#10B981]/40 shadow-2xs'
                    : 'bg-[#27272A] text-[#34D399] group-hover:bg-[#3F3F46]'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
              </div>
              <span>Outdoor Marketing</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] ml-auto" />
              )}
            </>
          )}
        </NavLink>

        {/* 4. Daily Forms & Closing Sheets (Amber Terracotta on Dark Grey) */}
        <NavLink
          to="/gallery"
          onClick={onCloseMobile}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${isActive
              ? 'bg-[#7C2D12]/60 text-[#FFEDD5] font-bold border-l-[3px] border-l-[#F97316] border border-[#EA580C]/40 shadow-xs pl-2.5'
              : 'text-[#D4D4D8] hover:text-white hover:bg-white/5'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isActive
                  ? 'bg-[#9A3412] text-[#FED7AA] border border-[#F97316]/40 shadow-2xs'
                  : 'bg-[#27272A] text-[#FB923C] group-hover:bg-[#3F3F46]'
                }`}>
                <FileText className="w-3.5 h-3.5" />
              </div>
              <span>Daily Closing & Forms</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#FB923C] ml-auto" />
              )}
            </>
          )}
        </NavLink>

        {/* 5. Customers Section (Royal Cyan/Blue on Dark Grey - At the very last position) */}
        <NavLink
          to="/customers"
          onClick={onCloseMobile}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 relative group ${isActive
              ? 'bg-[#0369A1]/60 text-[#E0F2FE] font-bold border-l-[3px] border-l-[#38BDF8] border border-[#0284C7]/40 shadow-xs pl-2.5'
              : 'text-[#D4D4D8] hover:text-white hover:bg-white/5'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isActive
                  ? 'bg-[#0284C7] text-[#BAE6FD] border border-[#38BDF8]/50 shadow-2xs'
                  : 'bg-[#27272A] text-[#38BDF8] group-hover:bg-[#3F3F46]'
                }`}>
                <UserCheck className="w-3.5 h-3.5" />
              </div>
              <span>Customers</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] ml-auto" />
              )}
            </>
          )}
        </NavLink>
      </nav>

      {/* Manager User Footer on Dark Grey */}
      <div className="p-3 border-t border-[#27272A] bg-[#18181B]">
        <div className="flex items-center justify-between px-2.5 py-2 bg-[#222226] rounded-xl border border-[#2E2E33] shadow-xs">
          <NavLink
            to="/account"
            onClick={onCloseMobile}
            title="Manager Account & Password Settings"
            className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-90 transition-opacity group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-[#3B0764] to-[#7E22CE] text-[#F3E8FF] flex items-center justify-center font-extrabold text-xs shrink-0 shadow-xs border border-[#A855F7]/60 group-hover:scale-105 transition-transform">
              {user?.full_name?.charAt(0) || 'M'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate group-hover:text-[#A855F7] transition-colors">
                {user?.full_name || 'Manager'}
              </p>
              <p className="text-[10px] text-[#A1A1AA] font-medium truncate flex items-center gap-1">
                <span>Mgr {user?.manager_code ? `#${user.manager_code}` : ''}</span>
                <span className="text-[#71717A]">•</span>
                <span className="text-[#A855F7] group-hover:underline">Settings</span>
              </p>
            </div>
          </NavLink>

          <div className="flex items-center gap-1 shrink-0 ml-1">
            <NavLink
              to="/account"
              onClick={onCloseMobile}
              title="Account & Password Settings"
              className={({ isActive }) =>
                `p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#A855F7] bg-white/10'
                    : 'text-[#A1A1AA] hover:text-white hover:bg-white/10'
                }`
              }
            >
              <Settings className="w-3.5 h-3.5" />
            </NavLink>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              title="Sign out"
              className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#F87171] hover:bg-white/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Purple Theme Sign Out Confirmation Modal */}
      <SignOutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
      />
    </aside>
  );
};
