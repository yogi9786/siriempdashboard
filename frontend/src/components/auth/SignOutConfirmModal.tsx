import React from 'react';
import { LogOut, X, ShieldAlert, Store, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface SignOutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const SignOutConfirmModal: React.FC<SignOutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const { user, selectedBranch } = useAuth();

  if (!isOpen) return null;

  const rawBranch = selectedBranch?.name || user?.branch_name || 'Yelahanka';
  const branchDisplayName = rawBranch.toLowerCase().includes('branch')
    ? rawBranch
    : `${rawBranch} Branch`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop with Soft Dark Blur */}
      <div
        className="fixed inset-0 bg-[#18181B]/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Luxury Purple Confirmation Card */}
      <div className="relative w-full max-w-md bg-white border border-[#D8B4FE] rounded-3xl shadow-2xl overflow-hidden z-10 my-8 flex flex-col animate-in zoom-in-95 duration-200">
        {/* Top Royal Purple Gradient Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#7E22CE] via-[#A855F7] to-[#C084FC]" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-0 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#F3E8FF] border border-[#D8B4FE] text-[#7E22CE] flex items-center justify-center shrink-0 shadow-2xs">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#1D1D1B] tracking-tight">
                Sign Out Session
              </h3>
              <p className="text-xs text-[#5E5A52] font-medium mt-0.5">
                Lock terminal & end manager shift
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#8A8479] hover:text-[#1D1D1B] p-1.5 rounded-xl hover:bg-[#FAF8F3] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Active Manager Card */}
          <div className="bg-[#FAF8F3] border border-[#E4DFD4] rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3B0764] to-[#7E22CE] text-white flex items-center justify-center font-extrabold text-xs shadow-2xs border border-[#A855F7]/60 shrink-0">
                {user?.full_name?.charAt(0) || 'M'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#1D1D1B] truncate">{user?.full_name || 'Showroom Manager'}</p>
                <p className="text-[10px] text-[#5E5A52] font-medium truncate">Authorized Manager</p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold text-[#7E22CE] bg-[#F3E8FF] border border-[#D8B4FE] px-2.5 py-1 rounded-md block">
                {branchDisplayName}
              </span>
            </div>
          </div>

          {/* Clarification Note */}
          <div className="p-3 rounded-2xl bg-[#FAF5FF] border border-[#E9D5FF] flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-[#7E22CE] shrink-0 mt-0.5" />
            <p className="text-xs text-[#581C87] font-medium leading-relaxed">
              Are you sure you want to end your current session? You will be returned to the showroom login page to re-authenticate.
            </p>
          </div>
        </div>

        {/* Modal Footer with Royal Purple Theme Action */}
        <div className="p-4 sm:p-5 bg-[#FAF8F3] border-t border-[#E4DFD4] flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5E5A52] hover:text-[#1D1D1B] hover:bg-white border border-[#E4DFD4] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#7E22CE] via-[#6B21A8] to-[#581C87] hover:from-[#6B21A8] hover:to-[#4C1D95] text-white shadow-sm transition-all cursor-pointer hover:scale-[1.02] disabled:opacity-60"
          >
            <LogOut className="w-3.5 h-3.5 text-[#D8B4FE]" />
            <span>{isLoading ? 'Signing Out...' : 'Confirm Sign Out'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
