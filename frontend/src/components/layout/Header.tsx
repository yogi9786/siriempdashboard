import React, { useState } from 'react';
import {
  Menu,
  Building2,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SignOutConfirmModal } from '../auth/SignOutConfirmModal';

interface HeaderProps {
  onMenuToggle?: () => void;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, onOpenMobileMenu }) => {
  const { user, selectedBranch, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleMenuClick = onOpenMobileMenu || onMenuToggle;

  // Format clean showroom branch display name (e.g. "Yelahanka Branch" without repeating)
  const rawBranch = selectedBranch?.name || user?.branch_name || 'Yelahanka';
  const branchDisplayName = rawBranch.toLowerCase().includes('branch')
    ? rawBranch
    : `${rawBranch} Branch`;

  return (
    <>
      {/* Merged Dark Grey Header Banner */}
      <header className="h-16 sm:h-18 bg-[#18181B] px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 select-none border-b border-[#27272A]/50 gap-2">
        {/* Left Section: Mobile Menu + Showroom Branch Indicator */}
        <div className="flex items-center gap-1.5 sm:gap-3.5 min-w-0 flex-1 sm:flex-initial">
          {handleMenuClick && (
            <button
              onClick={handleMenuClick}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl text-[#D4D4D8] hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Showroom Branch Pill: Compact on Mobile to Prevent Overlap */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-3.5 py-1 sm:py-2 rounded-xl sm:rounded-2xl bg-[#222226] border border-[#2E2E33] text-white min-w-0 shadow-xs">
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-[#10B981]" />
            </span>
            <span className="text-[11px] sm:text-sm font-extrabold text-white tracking-tight truncate max-w-[110px] xs:max-w-[160px] sm:max-w-none">
              {branchDisplayName}
            </span>
            <span className="hidden sm:inline-flex text-[9px] sm:text-[10px] font-mono font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded-md bg-[#3B0764] border border-[#7E22CE]/50 text-[#D8B4FE] shrink-0">
              SHOWROOM
            </span>
          </div>
        </div>

        {/* Right Section: Manager Avatar & Logout */}
        <div className="flex items-center gap-1.5 sm:gap-3.5 shrink-0">
          {/* Manager User Chip */}
          <div className="flex items-center gap-2 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-[#222226] border border-[#2E2E33] shadow-xs shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#3B0764] to-[#7E22CE] text-[#F3E8FF] flex items-center justify-center font-extrabold text-xs shadow-xs border border-[#A855F7]/60 shrink-0">
              {user?.full_name?.charAt(0) || 'M'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-white leading-tight">
                {user?.full_name || 'Manager'}
              </p>
              <p className="text-[10px] text-[#A1A1AA] font-medium leading-tight">
                Showroom Manager
              </p>
            </div>
          </div>

          {/* Logout Action */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="p-1.5 sm:p-2 rounded-xl text-[#A1A1AA] hover:text-[#F87171] hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Purple Theme Sign Out Confirmation Modal */}
      <SignOutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
      />
    </>
  );
};
