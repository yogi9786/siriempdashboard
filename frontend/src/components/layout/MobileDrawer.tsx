import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Smooth Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer content with smooth slide animation */}
      <div className="relative w-64 max-w-[85vw] bg-[#18181B] h-full shadow-2xl z-10 flex flex-col transition-transform duration-300 animate-in slide-in-from-left">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-[#A1A1AA] hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors z-20 cursor-pointer"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
        <Sidebar onCloseMobile={onClose} />
      </div>
    </div>
  );
};
