import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileSpreadsheet, Star, Clock } from 'lucide-react';
import api from '../../api/client';

export const MobileBottomNav: React.FC = () => {
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const fetchPending = async () => {
      try {
        const res = await api.get('/api/v1/dashboard/notifications');
        if (isMounted) {
          setPendingCount(res.data?.pending_activities_count || 0);
        }
      } catch {
        // silent
      }
    };
    fetchPending();
    const interval = setInterval(fetchPending, 45000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const items = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Customer Logs', path: '/customer-logs', icon: FileSpreadsheet },
    { label: 'Review Points', path: '/google-reviews', icon: Star },
    { label: 'Pending Activities', path: '/pending-customer-activity', icon: Clock },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-[#18181B]/95 backdrop-blur-md border-t border-[#27272A] flex items-center justify-around px-0.5 z-30 select-none pb-safe shadow-lg">
      {items.map((item) => {
        const Icon = item.icon;
        const isPendingItem = item.path === '/pending-customer-activity';

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 px-0.5 gap-1 text-[9.5px] xs:text-[10px] font-semibold transition-colors relative min-w-0 ${
                isActive ? 'text-white font-bold' : 'text-[#A1A1AA] hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`w-4 h-4 transition-transform duration-150 ${
                      isActive
                        ? isPendingItem
                          ? 'text-[#F59E0B] scale-110'
                          : item.path === '/google-reviews'
                          ? 'text-[#F59E0B] scale-110'
                          : item.path === '/customer-logs'
                          ? 'text-[#818CF8] scale-110'
                          : 'text-[#C084FC] scale-110'
                        : 'text-[#71717A]'
                    }`}
                  />
                  {isPendingItem && pendingCount > 0 && (
                    <span className="absolute -top-1 -right-2.5 min-w-3.5 h-3.5 px-0.5 rounded-full bg-[#EF4444] text-white text-[8px] font-black flex items-center justify-center shadow-xs">
                      {pendingCount > 99 ? '99+' : pendingCount}
                    </span>
                  )}
                </div>
                <span className="truncate max-w-full text-center leading-tight tracking-tight">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};
