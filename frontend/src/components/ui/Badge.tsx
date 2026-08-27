import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'burgundy' | 'gold' | 'yellow' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'black' | 'champagne' | 'plum';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
    md: 'px-3 py-1 text-xs font-semibold tracking-wide',
  };

  const variantStyles = {
    default: 'bg-[#F2EFE9] text-[#53606B] border border-[#E8E6E1]',
    gold: 'bg-[#FAF5E8] text-[#8C6D1F] border border-[#E5D6AD]',
    champagne: 'bg-[#FAF5E8] text-[#8C6D1F] border border-[#E5D6AD]',
    yellow: 'bg-[#FAF5E8] text-[#8C6D1F] border border-[#E5D6AD]',
    burgundy: 'bg-[#FAF5E8] text-[#8C6D1F] border border-[#E5D6AD]',
    plum: 'bg-[#F7EEF2] text-[#4A2638] border border-[#E8D5D2]',
    black: 'bg-[#171717] text-white border border-[#252525]',
    success: 'bg-[#EAF7F1] text-[#16845B] border border-[#C1ECD9]',
    warning: 'bg-[#FFF7E6] text-[#B7791F] border border-[#FCE3B4]',
    danger: 'bg-[#FDECEC] text-[#C24141] border border-[#F9C3C3]',
    info: 'bg-[#EEF4FF] text-[#356AE6] border border-[#C5DBFF]',
    outline: 'bg-white text-[#53606B] border border-[#E8E6E1]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
