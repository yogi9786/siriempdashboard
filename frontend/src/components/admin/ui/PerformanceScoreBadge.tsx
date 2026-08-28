import React from 'react';

interface PerformanceScoreBadgeProps {
  score: number; // 0 to 100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const PerformanceScoreBadge: React.FC<PerformanceScoreBadgeProps> = ({
  score,
  size = 'md',
  showLabel = false,
}) => {
  let colorClass = 'bg-[#E8F4EE] text-[#21845F] border-[#C5E3D5]'; // Emerald for >= 85%
  let label = 'Top Performer';

  if (score >= 85) {
    colorClass = 'bg-[#E8F4EE] text-[#21845F] border-[#C5E3D5]';
    label = 'Excellent';
  } else if (score >= 70) {
    colorClass = 'bg-[#F3E8FF] text-[#7E22CE] border-[#D8B4FE]';
    label = 'Good';
  } else if (score >= 50) {
    colorClass = 'bg-[#FAF1EC] text-[#B97855] border-[#ECCFC0]';
    label = 'Average';
  } else {
    colorClass = 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]';
    label = 'Needs Focus';
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 font-bold',
    md: 'text-xs px-2.5 py-1 font-bold',
    lg: 'text-sm px-3.5 py-1.5 font-extrabold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-2xs ${sizeClasses[size]} ${colorClass}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      <span>{score}%</span>
      {showLabel && <span className="opacity-80 text-[10px] font-semibold">({label})</span>}
    </span>
  );
};
