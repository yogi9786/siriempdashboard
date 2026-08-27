import React, { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, children, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-[#262626]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            className={`w-full bg-white text-[#171717] border rounded-xl pl-3.5 pr-9 py-2.5 text-xs sm:text-sm appearance-none transition-all focus:outline-none focus:ring-2 focus:ring-[#171717]/5 focus:border-[#171717] disabled:bg-[#FAF9F6] disabled:text-[#A3A3A3] disabled:cursor-not-allowed cursor-pointer ${
              error ? 'border-[#C24141] focus:border-[#C24141]' : 'border-[#E8E6E1] hover:border-[#D8D6D0]'
            } ${className}`}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="absolute right-3.5 text-[#737373] pointer-events-none flex items-center">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && <span className="text-xs font-medium text-[#C24141]">{error}</span>}
        {!error && helperText && <span className="text-xs text-[#737373]">{helperText}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
