import React, { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AdminKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  iconBgColor?: string; // e.g. "bg-[#F3E8FF] border-[#D8B4FE] text-[#7E22CE]"
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  badgeText?: string;
  badgeColor?: string;
  progressPct?: number;
  progressBarColor?: string;
  onClick?: () => void;
  className?: string;
}

export const AdminKPICard: React.FC<AdminKPICardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = 'bg-[#F3E8FF] border-[#D8B4FE] text-[#7E22CE]',
  trend,
  badgeText,
  badgeColor = 'bg-[#FAF8F3] text-[#8A8479] border-[#E4DFD4]',
  progressPct,
  progressBarColor = 'bg-[#7E22CE]',
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-[#E4DFD4] hover:border-[#C084FC] rounded-2xl p-5 sm:p-6 shadow-[0_4px_18px_rgba(40,35,25,0.045)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div>
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#8A8479] uppercase tracking-wider block mb-1">
              {title}
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-[#1D1D1B] tracking-tight">
              {value}
            </div>
            {subtitle && (
              <span className="text-xs text-[#8A8479] font-medium mt-0.5 block">{subtitle}</span>
            )}
          </div>
          <div
            className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform ${iconBgColor}`}
          >
            {icon}
          </div>
        </div>

        {/* Optional Progress Bar or Trend Indicator */}
        {(trend || progressPct !== undefined || badgeText) && (
          <div className="mt-4 pt-3 border-t border-[#EBE6DC] flex items-center justify-between gap-2">
            {trend && (
              <div className="flex items-center gap-1 text-[11px] font-bold">
                <span
                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md ${
                    trend.isPositive !== false
                      ? 'bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]'
                      : 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
                  }`}
                >
                  {trend.isPositive !== false ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{trend.value}</span>
                </span>
                {trend.label && (
                  <span className="text-[#8A8479] font-medium text-[10px]">{trend.label}</span>
                )}
              </div>
            )}

            {badgeText && !trend && (
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
                {badgeText}
              </span>
            )}

            {progressPct !== undefined && (
              <div className="w-full space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-[#8A8479]">
                  <span>Progress</span>
                  <span className="text-[#1D1D1B]">{progressPct}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#FAF8F3] rounded-full overflow-hidden border border-[#E4DFD4]">
                  <div
                    className={`h-full rounded-full ${progressBarColor}`}
                    style={{ width: `${Math.min(100, Math.max(5, progressPct))}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
