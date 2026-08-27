import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: string;
  badgeVariant?: 'success' | 'gold' | 'neutral' | 'warning';
  iconColor?: string;
  iconBg?: string;
  onClick?: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeVariant = 'success',
  iconColor = 'text-[#C9A227]',
  iconBg = 'bg-[#FAF6EB] border-[#EEDFA8]',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-[#E8E6E1] rounded-2xl p-5 transition-all duration-150 hover:border-[#D8D6D0] shadow-2xs flex flex-col justify-between ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider block mb-1.5">
            {title}
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-[#171717] tracking-tight">
            {value}
          </div>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${iconBg} ${iconColor} shrink-0 shadow-2xs`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )}
      </div>

      {(subtitle || badge) && (
        <div className="mt-4 pt-3 border-t border-[#F0EFEA] flex items-center justify-between gap-2 text-xs">
          {subtitle && (
            <span className="text-[#737373] font-medium truncate">
              {subtitle}
            </span>
          )}
          {badge && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                badgeVariant === 'success'
                  ? 'bg-[#EAF7F1] text-[#16845B] border border-[#C1ECD9]'
                  : badgeVariant === 'gold'
                  ? 'bg-[#FAF6EB] text-[#8B6D1B] border border-[#EEDFA8]'
                  : badgeVariant === 'warning'
                  ? 'bg-[#FFF7E6] text-[#B7791F] border border-[#FCE3B4]'
                  : 'bg-[#F5F4F0] text-[#525252] border border-[#E8E6E1]'
              }`}
            >
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
