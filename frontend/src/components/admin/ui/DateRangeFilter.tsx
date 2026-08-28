import React from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { useAdminBranch } from '../../../context/AdminBranchContext';

interface DateRangeFilterProps {
  className?: string;
}

const ranges = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7days', label: 'Last 7 Days' },
  { id: '30days', label: 'Last 30 Days' },
  { id: 'this_month', label: 'This Month' },
  { id: 'this_year', label: 'This Year' },
];

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ className = '' }) => {
  const { dateRange, setDateRange } = useAdminBranch();
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

  const activeRange = ranges.find((r) => r.id === dateRange) || ranges[0];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F3] border border-[#D8B4FE] text-[#3B0764] text-xs font-bold transition-all cursor-pointer shadow-2xs"
      >
        <Calendar className="w-3.5 h-3.5 text-[#7E22CE]" />
        <span>{activeRange.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#7E22CE] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E4DFD4] rounded-2xl shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in slide-in-from-top-1">
          {ranges.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setDateRange(r.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                dateRange === r.id
                  ? 'bg-[#7E22CE] text-white'
                  : 'text-[#1D1D1B] hover:bg-[#FAF5FF] hover:text-[#7E22CE]'
              }`}
            >
              <span>{r.label}</span>
              {dateRange === r.id && <Check className="w-3.5 h-3.5 text-white" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
