import React, { useState } from 'react';
import {
  Menu,
  Clock,
  Shield,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { BranchSelector } from '../ui/BranchSelector';
import { SignOutConfirmModal } from '../../auth/SignOutConfirmModal';

interface AdminHeaderProps {
  onToggleMobile?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleMobile }) => {
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="h-16 sm:h-18 bg-white border-b border-[#E4DFD4] px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-2 rounded-xl text-[#5E5A52] hover:bg-[#FAF8F3] border border-[#E4DFD4] transition-colors cursor-pointer"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#78350F] px-2 py-0.5 rounded-full bg-[#FEF3C7] border border-[#FDE68A] flex items-center gap-1">
              <Shield className="w-2.5 h-2.5" />
              <span>Super Admin HQ</span>
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-[#8A8479]">
              <Clock className="w-3 h-3 text-[#7E22CE]" />
              <span>{todayFormatted}</span>
            </span>
          </div>
          <h2 className="text-xs sm:text-sm font-extrabold text-[#1D1D1B] tracking-tight hidden lg:block">
            Siri Samruddhi Gold Palace — Enterprise Command Center
          </h2>
        </div>
      </div>

      {/* Right: Global Branch Filter & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Branch Selector Dropdown */}
        <BranchSelector variant="header" />

        {/* Super Admin Profile Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#EBE6DC]">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#78350F] to-[#D97706] text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-2xs border border-[#FBBF24]/60">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-extrabold text-[#1D1D1B] leading-none">{user?.full_name || 'Super Admin'}</p>
            <p className="text-[10px] text-[#78350F] font-bold leading-none mt-1">Enterprise Admin</p>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="p-1.5 rounded-lg text-[#8A8479] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <SignOutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
      />
    </header>
  );
};
