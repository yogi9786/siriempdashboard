import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

interface SalesTrendChartProps {
  data: Array<{
    date: string;
    day_name?: string;
    sales_value: number;
    customers_approached?: number;
    customers_converted?: number;
  }>;
}

export const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-charcoal-400">
        No sales trend data available for selected period.
      </div>
    );
  }

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-charcoal-900 text-white p-3 rounded-xl shadow-xl border border-charcoal-700 text-xs">
          <p className="font-bold text-gold-400 mb-1.5">{label}</p>
          {payload.map((item: any, idx: number) => (
            <p key={idx} className="flex items-center justify-between gap-4 py-0.5">
              <span className="text-charcoal-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}:
              </span>
              <span className="font-semibold text-white">
                {item.name.includes('Sales') ? formatCurrency(item.value) : item.value}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="goldSalesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C5A869" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#C5A869" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0ECE1" vertical={false} />
          <XAxis
            dataKey="day_name"
            tick={{ fontSize: 11, fill: '#8E929C' }}
            tickLine={false}
            axisLine={{ stroke: '#EAE6DF' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#8E929C' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `₹${val >= 100000 ? `${(val / 100000).toFixed(1)}L` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
          />
          <Tooltip content={customTooltip} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: 15, fontSize: 12 }}
          />
          <Area
            type="monotone"
            dataKey="sales_value"
            name="Sales Value"
            stroke="#C5A869"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#goldSalesGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
