import React from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { useAdminBranch } from '../../../context/AdminBranchContext';

interface BranchSelectorProps {
  className?: string;
  variant?: 'header' | 'inline';
}

export const BranchSelector: React.FC<BranchSelectorProps> = ({ className = '', variant = 'header' }) => {
  const { selectedBranchId, selectedBranch, branches, setSelectedBranchId } = useAdminBranch();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLabelMobile = selectedBranch ? selectedBranch.name : 'All Branches';
  const currentLabelDesktop = selectedBranch ? `${selectedBranch.name} Branch` : 'All Branches (Enterprise)';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
          variant === 'header'
            ? 'bg-white hover:bg-[#FAF5FF] border-[#D8B4FE] text-[#3B0764]'
            : 'bg-white hover:bg-[#FAF8F3] border-[#E4DFD4] text-[#1D1D1B]'
        }`}
      >
        <div className="w-5 h-5 rounded-md bg-[#F3E8FF] border border-[#D8B4FE] flex items-center justify-center text-[#7E22CE] shrink-0">
          <Building2 className="w-3 h-3" />
        </div>
        <span className="truncate max-w-[95px] sm:max-w-[190px]">
          <span className="sm:hidden">{currentLabelMobile}</span>
          <span className="hidden sm:inline">{currentLabelDesktop}</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#7E22CE] transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E4DFD4] rounded-2xl shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in slide-in-from-top-1">
          <div className="px-3 py-2 border-b border-[#EBE6DC]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8479] block">
              Filter Branch Scope
            </span>
          </div>

          {/* Option: All Branches */}
          <button
            onClick={() => {
              setSelectedBranchId(null);
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              selectedBranchId === null
                ? 'bg-[#7E22CE] text-white'
                : 'text-[#1D1D1B] hover:bg-[#FAF5FF] hover:text-[#7E22CE]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${selectedBranchId === null ? 'bg-white' : 'bg-[#7E22CE]'}`} />
              <span>All Branches (Enterprise)</span>
            </div>
            {selectedBranchId === null && <Check className="w-4 h-4 text-white" />}
          </button>

          {/* Branch Options */}
          {branches.map((b) => (
            <button
              key={b.id}
              onClick={() => {
                setSelectedBranchId(b.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedBranchId === b.id
                  ? 'bg-[#7E22CE] text-white'
                  : 'text-[#1D1D1B] hover:bg-[#FAF5FF] hover:text-[#7E22CE]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${selectedBranchId === b.id ? 'bg-white' : 'bg-[#7E22CE]'}`} />
                <span className="truncate">{b.name} Showroom ({b.city})</span>
              </div>
              {selectedBranchId === b.id && <Check className="w-4 h-4 text-white" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
