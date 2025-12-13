'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SalesTrendChartProps {
  data: { date: string; sales: number }[];
}

export default function SalesTrendChart({ data }: SalesTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
        <XAxis 
          dataKey="date" 
          stroke="var(--text-secondary)"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke="var(--text-secondary)"
          style={{ fontSize: '12px' }}
          tickFormatter={(value) => `BND ${value}`}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius-md)',
          }}
          formatter={(value: number) => [`BND ${value.toFixed(2)}`, 'Sales']}
        />
        <Line 
          type="monotone" 
          dataKey="sales" 
          stroke="var(--primary)" 
          strokeWidth={3}
          dot={{ fill: 'var(--primary)', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

