import React from 'react';
import { formatNumber, formatPercent } from '../../utils/formatters';

interface ConversionFunnelChartProps {
  data: Array<{
    stage: string;
    count: number;
    percentage: number;
  }>;
}

export const ConversionFunnelChart: React.FC<ConversionFunnelChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-charcoal-400">
        No funnel data available for selected period.
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex flex-col space-y-3.5 py-2">
      {data.map((item, index) => {
        const widthPct = Math.max((item.count / maxCount) * 100, 8);
        return (
          <div key={index} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-charcoal-700">{item.stage}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-charcoal-900">{formatNumber(item.count)}</span>
                <span className="text-charcoal-400 font-mono text-[11px]">
                  ({formatPercent(item.percentage)})
                </span>
              </div>
            </div>
            <div className="w-full h-3 bg-cream-100 rounded-full overflow-hidden p-0.5 border border-cream-200">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${widthPct}%`,
                  background:
                    index === data.length - 1
                      ? 'linear-gradient(90deg, #C5A869 0%, #10B981 100%)'
                      : 'linear-gradient(90deg, #D4AF37 0%, #C5A869 100%)',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
