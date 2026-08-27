import React from 'react';
import { Calendar } from 'lucide-react';

export type PeriodType = 'today' | 'yesterday' | 'week' | 'month' | 'last_month' | 'custom';

export interface DateRangePickerProps {
  period: PeriodType;
  startDate?: string;
  endDate?: string;
  onPeriodChange: (period: PeriodType, start?: string, end?: string) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  period,
  startDate,
  endDate,
  onPeriodChange,
}) => {
  const presets: { id: PeriodType; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-xl border border-cream-200 shadow-sm">
      <div className="flex items-center gap-1 overflow-x-auto py-0.5">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => onPeriodChange(p.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              period === p.id
                ? 'bg-charcoal-900 text-white shadow-sm'
                : 'text-charcoal-600 hover:bg-cream-100 hover:text-charcoal-900'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === 'custom' && (
        <div className="flex items-center gap-2 pl-2 border-l border-cream-200 ml-auto w-full sm:w-auto mt-2 sm:mt-0">
          <div className="flex items-center gap-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-charcoal-400" />
            <input
              type="date"
              value={startDate || ''}
              onChange={(e) => onPeriodChange('custom', e.target.value, endDate)}
              className="px-2 py-1 text-xs border border-cream-300 rounded-md focus:outline-none focus:border-gold-500 bg-cream-50"
            />
            <span className="text-charcoal-400">to</span>
            <input
              type="date"
              value={endDate || ''}
              onChange={(e) => onPeriodChange('custom', startDate, e.target.value)}
              className="px-2 py-1 text-xs border border-cream-300 rounded-md focus:outline-none focus:border-gold-500 bg-cream-50"
            />
          </div>
        </div>
      )}
    </div>
  );
};
