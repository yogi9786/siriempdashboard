import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'burgundy' | 'gold' | 'yellow' | 'black' | 'white' | 'premium' | 'plum';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const effectiveLeftIcon = leftIcon || icon;
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30 disabled:opacity-40 disabled:cursor-not-allowed select-none cursor-pointer active:scale-[0.98]';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 font-semibold h-8',
    md: 'px-4 py-2 text-xs sm:text-sm gap-2 font-semibold h-10',
    lg: 'px-5 py-2.5 text-sm gap-2.5 font-bold h-11',
  };

  const variantStyles = {
    primary:
      'bg-[#171717] text-white hover:bg-[#252525] hover:shadow-md border border-[#252525] shadow-xs',
    black:
      'bg-[#171717] text-white hover:bg-[#252525] hover:shadow-md border border-[#252525] shadow-xs',
    burgundy:
      'bg-[#171717] text-white hover:bg-[#252525] hover:shadow-md border border-[#252525] shadow-xs',
    plum:
      'bg-[#4A2638] text-white hover:bg-[#381B2A] border border-[#5E3248] shadow-xs font-semibold',
    premium:
      'bg-gradient-to-r from-[#C8A951] to-[#B38E1E] text-white hover:from-[#B8963E] hover:to-[#9E7B15] border border-[#C8A951] shadow-xs font-bold shadow-[#C8A951]/20',
    gold:
      'bg-gradient-to-r from-[#C8A951] to-[#B38E1E] text-white hover:from-[#B8963E] hover:to-[#9E7B15] border border-[#C8A951] shadow-xs font-bold shadow-[#C8A951]/20',
    yellow:
      'bg-gradient-to-r from-[#C8A951] to-[#B38E1E] text-white hover:from-[#B8963E] hover:to-[#9E7B15] border border-[#C8A951] shadow-xs font-bold',
    secondary:
      'bg-[#FAF5E8] text-[#8C6D1F] hover:bg-[#F5E7B0]/60 border border-[#E5D6AD] font-semibold',
    outline:
      'bg-white text-[#171717] hover:bg-[#FAF5E8] hover:border-[#E5D6AD] hover:text-[#8C6D1F] border border-[#E8E6E1] shadow-2xs',
    white:
      'bg-white text-[#171717] hover:bg-[#FAF5E8] border border-[#E8E6E1] shadow-2xs',
    danger:
      'bg-[#FDECEC] text-[#C24141] hover:bg-[#FCD8D8] border border-[#F9C3C3] font-semibold',
    ghost:
      'bg-transparent text-[#53606B] hover:bg-[#FAF5E8] hover:text-[#171717] border-transparent',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
      {!isLoading && effectiveLeftIcon && <span className="shrink-0">{effectiveLeftIcon}</span>}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
