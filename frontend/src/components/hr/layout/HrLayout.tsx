import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { HrSidebar } from './HrSidebar';
import { Menu, X, Sparkles, Building2, User, LogOut, CalendarDays } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import logoImg from '../../../assets/siri samruddhi logo.png';
import api from '../../../api/client';

export const HrLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingLeavesCount, setPendingLeavesCount] = useState<number>(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const res = await api.get('/api/v1/hr/stats');
        if (isMounted && res.data) {
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
    <div className="flex h-screen bg-[#FAF8F3] text-[#1D1D1B] overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex shrink-0">
        <HrSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <HrSidebar onCloseMobile={() => setMobileMenuOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-[#18181B] border-b border-[#27272A] flex items-center justify-between px-4 sm:px-6 shrink-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-white hover:bg-white/10 transition-colors"
              title="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2.5">
              <span className="text-xs sm:text-sm font-extrabold text-white tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span>HR Administration Portal</span>
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-[#27272A] border border-[#3F3F46] text-[#E5C378] text-[10px] font-bold">
                All 3 Branches
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {pendingLeavesCount > 0 && (
              <button
                type="button"
                onClick={() => navigate('/hr/leaves')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#78350F]/70 border border-[#F59E0B]/50 text-[#FDE68A] hover:bg-[#92400E] text-xs font-bold transition-all cursor-pointer shadow-xs animate-pulse"
                title={`${pendingLeavesCount} pending leave request(s) require review`}
              >
                <CalendarDays className="w-3.5 h-3.5 text-[#FBBF24]" />
                <span>{pendingLeavesCount} Pending Leaves</span>
              </button>
            )}

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <User className="w-3.5 h-3.5 text-[#E5C378]" />
              <span className="text-xs font-bold text-white">{user?.full_name || 'HR Manager'}</span>
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-xl text-[#A1A1AA] hover:text-red-400 hover:bg-white/10 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto bg-[#FAF8F3]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

