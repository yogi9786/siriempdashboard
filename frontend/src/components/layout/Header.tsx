import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Building2,
  LogOut,
  Sparkles,
  Star,
  Bell,
  CheckCircle2,
  Clock,
  ArrowRight,
  RotateCcw,
  UserCheck,
  Calendar,
  Award,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SignOutConfirmModal } from '../auth/SignOutConfirmModal';
import { ManagerNotificationsResponse } from '../../types';
import api from '../../api/client';

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-3 h-3' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.97.53 1.83.812 2.796.813 3.179 0 5.767-2.587 5.768-5.766.001-3.181-2.587-5.766-5.768-5.766zm3.376 8.212c-.144.405-.837.774-1.17.824-.312.045-.717.067-1.168-.08-.288-.094-.658-.236-1.144-.45-2.072-.913-3.414-3.033-3.518-3.173-.104-.14-1.01-1.344-1.01-2.564 0-1.22.637-1.82.863-2.066.226-.246.495-.308.66-.308.165 0 .33.003.475.01.153.008.358-.058.56.427.207.497.708 1.724.77 1.849.062.125.104.271.021.437-.083.165-.124.27-.247.416-.124.145-.262.325-.374.436-.125.124-.255.26-.11.51.145.249.645 1.062 1.385 1.722.953.849 1.756 1.112 2.004 1.237.248.125.394.104.539-.063.145-.166.621-.726.786-.975.166-.249.331-.208.558-.125.228.083 1.446.682 1.694.807.248.124.414.186.475.29.063.104.063.602-.081 1.007zM12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.98-1.306A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
  </svg>
);

interface HeaderProps {
  onMenuToggle?: () => void;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, onOpenMobileMenu }) => {
  const { user, selectedBranch, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notifications, setNotifications] = useState<ManagerNotificationsResponse | null>(null);
  const [showNotificationsPopover, setShowNotificationsPopover] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleMenuClick = onOpenMobileMenu || onMenuToggle;

  // Format clean showroom branch display name (e.g. "Yelahanka Branch" without repeating)
  const rawBranch = selectedBranch?.name || user?.branch_name || 'Yelahanka';
  const branchDisplayName = rawBranch.toLowerCase().includes('branch')
    ? rawBranch
    : `${rawBranch} Branch`;

  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      const res = await api.get<ManagerNotificationsResponse>('/api/v1/dashboard/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch manager notifications:', err);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowNotificationsPopover(false);
      }
    };
    if (showNotificationsPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotificationsPopover]);

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
            <span className="text-[11px] sm:text-sm font-extrabold text-white tracking-tight truncate max-w-[120px] sm:max-w-none">
              {branchDisplayName}
            </span>
            <span className="hidden sm:inline-flex text-[9px] sm:text-[10px] font-mono font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded-md bg-[#3B0764] border border-[#7E22CE]/50 text-[#D8B4FE] shrink-0">
              SHOWROOM
            </span>
          </div>
        </div>

        {/* Right Section: Manager Avatar & Logout */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Review Points Ledger Shortcut */}
          <Link
            to="/google-reviews"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-[#222226] hover:bg-[#2C2C32] border border-[#3E3E44] text-[#FBBF24] shadow-xs transition-all cursor-pointer group shrink-0"
            title="Showroom Reviews & Points Ledger"
          >
            <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B] group-hover:scale-110 transition-transform shrink-0" />
            <span className="text-[11px] sm:text-xs font-black text-[#FEF3C7] tracking-tight hidden sm:inline">
              Reviews & Points
            </span>
          </Link>

          {/* Manager Notifications Bell */}
          <div className="relative" ref={popoverRef}>
            <button
              type="button"
              onClick={() => {
                setShowNotificationsPopover(!showNotificationsPopover);
                if (!showNotificationsPopover) fetchNotifications();
              }}
              className="relative p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-[#222226] hover:bg-[#2C2C32] border border-[#3E3E44] text-[#D4D4D8] hover:text-white transition-all cursor-pointer shadow-xs"
              title="Showroom Notifications (Pending Activity & Outdoor Notes)"
              aria-label="Showroom notifications"
            >
              <Bell className="w-4 h-4 text-[#E4E4E7]" />
              {(notifications?.total_count || 0) > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#EF4444] text-white text-[10px] font-black border border-[#18181B] shadow-xs">
                  {notifications!.total_count > 99 ? '99+' : notifications!.total_count}
                </span>
              )}
            </button>

            {/* Notification Dropdown Popover */}
            {showNotificationsPopover && (
              <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-16 sm:top-full mt-2 w-auto sm:w-96 max-w-[calc(100vw-24px)] bg-[#1F1F23] border border-[#3F3F46] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Popover Header */}
                <div className="px-4 py-3 bg-[#18181B] border-b border-[#2E2E33] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#F59E0B]" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      Showroom Notifications
                    </span>
                    {(notifications?.total_count || 0) > 0 && (
                      <span className="px-1.5 py-0.2 rounded-md bg-[#EF4444] text-white text-[10px] font-extrabold">
                        {notifications?.total_count}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={fetchNotifications}
                    className="p-1 text-[#A1A1AA] hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                    title="Refresh notifications"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isLoadingNotifications ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* Popover Content */}
                <div className="max-h-84 overflow-y-auto divide-y divide-[#2E2E33]/60 p-2 space-y-2">
                  {/* Section 1: Pending Customer Activities */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-2 pt-1 pb-0.5">
                      <span className="text-[11px] font-bold text-[#F59E0B] uppercase tracking-wider flex items-center gap-1.5">
                        <UserCheck className="w-3 h-3 text-[#F59E0B]" />
                        <span>Pending Customer Activity ({notifications?.pending_activities_count || 0})</span>
                      </span>
                      <Link
                        to="/pending-customer-activity"
                        onClick={() => setShowNotificationsPopover(false)}
                        className="text-[10px] font-bold text-[#60A5FA] hover:text-[#93C5FD] flex items-center gap-0.5 hover:underline"
                      >
                        <span>View all</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </Link>
                    </div>

                    {(notifications?.pending_activities || []).length === 0 ? (
                      <p className="text-[11px] text-[#71717A] italic px-2 py-1">
                        No customer activities awaiting review.
                      </p>
                    ) : (
                      notifications?.pending_activities.slice(0, 3).map((act) => (
                        <div
                          key={act.id}
                          onClick={() => {
                            setShowNotificationsPopover(false);
                            navigate('/pending-customer-activity');
                          }}
                          className="p-2 rounded-xl bg-[#27272A]/70 hover:bg-[#2E2E33] transition-colors cursor-pointer space-y-0.5 text-left border border-transparent hover:border-[#3F3F46]"
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-white">
                            <span className="truncate">{act.customer_name}</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-[#FEF3C7] text-[#92400E]">
                              {act.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#A1A1AA] flex items-center gap-1">
                            <span>Staff: {act.employee_name}</span>
                            <span>•</span>
                            <span>{act.activity_date}</span>
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Section 2: Outdoor Customer Notes Date Reminders */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between px-2 pt-1 pb-0.5">
                      <span className="text-[11px] font-bold text-[#38BDF8] uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-[#38BDF8]" />
                        <span>Outdoor Notes Due ({notifications?.note_reminders_count || 0})</span>
                      </span>
                      <Link
                        to="/outdoor-marketing"
                        onClick={() => setShowNotificationsPopover(false)}
                        className="text-[10px] font-bold text-[#60A5FA] hover:text-[#93C5FD] flex items-center gap-0.5 hover:underline"
                      >
                        <span>View all</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </Link>
                    </div>

                    {(notifications?.note_reminders || []).length === 0 ? (
                      <p className="text-[11px] text-[#71717A] italic px-2 py-1">
                        No outdoor customer note reminders scheduled for today.
                      </p>
                    ) : (
                      notifications?.note_reminders.slice(0, 3).map((note) => (
                        <div
                          key={note.id}
                          onClick={() => {
                            setShowNotificationsPopover(false);
                            navigate('/outdoor-marketing');
                          }}
                          className="p-2 rounded-xl bg-[#27272A]/70 hover:bg-[#2E2E33] transition-colors cursor-pointer space-y-0.5 text-left border border-transparent hover:border-[#3F3F46]"
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-white">
                            <span className="truncate">{note.customer_name}</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-[#EFF6FF] text-[#1E40AF]">
                              Due: {note.note_notification_date}
                            </span>
                          </div>
                          {note.notes && (
                            <p className="text-[10px] text-[#D4D4D8] line-clamp-1 italic">
                              "{note.notes}"
                            </p>
                          )}
                          <p className="text-[9px] text-[#A1A1AA]">
                            Marketer: {note.employee_name} ({note.area_name || 'Field'})
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Section 3: Gold Scheme Payment Reminders */}
                  <div className="space-y-1.5 pt-2 border-t border-[#27272A]">
                    <div className="flex items-center justify-between px-2 pt-1 pb-0.5">
                      <span className="text-[11px] font-bold text-[#F59E0B] uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="w-3 h-3 text-[#F59E0B]" />
                        <span>Gold Scheme Dues ({notifications?.scheme_reminders_count || 0})</span>
                      </span>
                    </div>

                    {(notifications?.scheme_reminders || []).length === 0 ? (
                      <p className="text-[11px] text-[#71717A] italic px-2 py-1">
                        No customer scheme payments due today.
                      </p>
                    ) : (
                      notifications?.scheme_reminders.slice(0, 4).map((sch) => (
                        <div
                          key={sch.id}
                          className="p-2.5 rounded-xl bg-[#27272A]/70 hover:bg-[#2E2E33] transition-colors space-y-1 text-left border border-amber-900/40"
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-white">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="truncate">{sch.customer_name}</span>
                              {sch.phone && (
                                <a
                                  href={`https://wa.me/91${sch.phone.replace(/[^0-9]/g, '').slice(-10)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#25D366] hover:opacity-80"
                                  title="WhatsApp customer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <WhatsAppIcon className="w-3 h-3 inline" />
                                </a>
                              )}
                            </div>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-[#FEF3C7] text-[#92400E]">
                              ₹{sch.amount ? Number(sch.amount).toLocaleString('en-IN') : 0}
                            </span>
                          </div>

                          <p className="text-[10px] text-[#E5C378] font-semibold flex items-center justify-between">
                            <span className="truncate">{sch.scheme_name} (Inst. {sch.installment_no}/{sch.total_installments})</span>
                            <span className="text-[#A1A1AA] shrink-0 ml-1">Due: {sch.due_date}</span>
                          </p>

                          {sch.price_notes && (
                            <p className="text-[9.5px] text-[#D4D4D8] italic line-clamp-1">
                              Note: {sch.price_notes}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[9px] text-[#A1A1AA]">Staff: {sch.employee_name || 'Showroom'}</span>
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await api.post(`/api/v1/dashboard/notifications/scheme-reminder/${sch.id}/status`, null, {
                                    params: { status: 'Paid' },
                                  });
                                  fetchNotifications();
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-[#16A34A] hover:bg-[#15803D] text-white cursor-pointer shadow-xs"
                            >
                              ✓ Mark Paid
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Popover Footer */}
                <div className="px-3 py-2 bg-[#18181B] border-t border-[#2E2E33] flex items-center justify-between text-[11px]">
                  <span className="text-[#A1A1AA]">
                    {notifications?.total_count === 0 ? '✓ Everything is up to date' : `${notifications?.total_count} pending notifications`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowNotificationsPopover(false)}
                    className="text-[#D4D4D8] hover:text-white font-bold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Manager User Chip */}
          <div className="flex items-center gap-2 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-[#222226] border border-[#2E2E33] shadow-xs shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-linear-to-br from-[#3B0764] to-[#7E22CE] text-[#F3E8FF] flex items-center justify-center font-extrabold text-xs shadow-xs border border-[#A855F7]/60 shrink-0">
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
