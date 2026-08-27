import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { formatCurrency, formatPercent } from '../../utils/formatters';

interface CategoryPieChartProps {
  data: Array<{
    name: string;
    value: number;
    count?: number;
    color?: string;
  }>;
}

const DEFAULT_COLORS = ['#C5A869', '#333740', '#9E814D', '#E2D5B5', '#6E737E', '#B38F3B'];

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data }) => {
  const filteredData = (data || []).filter((d) => d.value > 0);

  if (filteredData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-charcoal-400">
        No category sales data for selected period.
      </div>
    );
  }

  const totalValue = filteredData.reduce((acc, cur) => acc + cur.value, 0);

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const pct = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
      return (
        <div className="bg-charcoal-900 text-white p-3 rounded-xl shadow-xl border border-charcoal-700 text-xs">
          <p className="font-bold text-gold-400 mb-1">{item.name}</p>
          <p className="text-white font-semibold">{formatCurrency(item.value)}</p>
          <p className="text-charcoal-300">{formatPercent(pct)} of total revenue</p>
          {item.payload.count !== undefined && (
            <p className="text-charcoal-400 mt-1">{item.payload.count} item(s) sold</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filteredData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
          >
            {filteredData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                stroke="#FAF8F5"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={customTooltip} />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
