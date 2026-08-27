import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Compass } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const items = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Employees', path: '/employees', icon: Users },
    { label: 'Outdoor', path: '/outdoor-marketing', icon: Compass },
    { label: 'Closing Forms', path: '/gallery', icon: FileText },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-[#18181B]/95 backdrop-blur-md border-t border-[#27272A] flex items-center justify-around px-1 z-30 select-none pb-safe shadow-lg">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 gap-1 text-[10px] font-semibold transition-colors ${
                isActive ? 'text-white font-bold' : 'text-[#A1A1AA] hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#C084FC]' : 'text-[#71717A]'}`} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};
