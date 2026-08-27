import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

interface EmployeeBarChartProps {
  data: Array<{
    name: string;
    sales: number;
    score?: number;
  }>;
}

export const EmployeeBarChart: React.FC<EmployeeBarChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-charcoal-400">
        No employee contribution data for selected period.
      </div>
    );
  }

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-charcoal-900 text-white p-3 rounded-xl shadow-xl border border-charcoal-700 text-xs">
          <p className="font-bold text-gold-400 mb-1">{label}</p>
          <p className="text-white font-semibold">Sales: {formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#F0ECE1" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#8E929C' }}
            tickLine={false}
            axisLine={{ stroke: '#EAE6DF' }}
            tickFormatter={(val) => `₹${val >= 100000 ? `${(val / 100000).toFixed(1)}L` : val}`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: '#484D58' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={customTooltip} />
          <Bar
            dataKey="sales"
            fill="#C5A869"
            radius={[0, 6, 6, 0]}
            barSize={18}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
