import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileDrawer } from './MobileDrawer';
import { MobileBottomNav } from './MobileBottomNav';

export const DashboardLayout: React.FC = () => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#F6F3EC] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0 h-full">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        <Header onOpenMobileMenu={() => setIsMobileDrawerOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8 bg-[#F6F3EC]">
          <div className="max-w-384 mx-auto">
            <Outlet />
          </div>
        </main>
        {/* Bottom Navigation for Mobile */}
        <MobileBottomNav />
      </div>
    </div>
  );
};
