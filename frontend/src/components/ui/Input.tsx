import React, { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-[#262626]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-[#737373] pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-white text-[#171717] border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm transition-all placeholder:text-[#A3A3A3] focus:outline-none focus:ring-2 focus:ring-[#171717]/5 focus:border-[#171717] disabled:bg-[#FAF9F6] disabled:text-[#A3A3A3] disabled:cursor-not-allowed ${
              leftIcon ? 'pl-9' : ''
            } ${rightIcon ? 'pr-9' : ''} ${
              error ? 'border-[#C24141] focus:border-[#C24141]' : 'border-[#E8E6E1] hover:border-[#D8D6D0]'
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-[#737373] flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <span className="text-xs font-medium text-[#C24141]">{error}</span>}
        {!error && helperText && <span className="text-xs text-[#737373]">{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
