'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface InventoryLevelChartProps {
  data: { name: string; quantity: number; min: number }[];
}

export default function InventoryLevelChart({ data }: InventoryLevelChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
        <XAxis
          dataKey="name"
          stroke="var(--text-secondary)"
          style={{ fontSize: '11px', fontWeight: 500 }}
          angle={-45}
          textAnchor="end"
          height={60}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="var(--text-secondary)"
          style={{ fontSize: '11px' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}
          cursor={{ fill: 'rgba(0,0,0,0.02)' }}
        />
        <Bar dataKey="min" fill="var(--warning)" radius={[6, 6, 6, 6]} barSize={8} fillOpacity={0.6} />
        <Bar dataKey="quantity" fill="var(--success)" radius={[6, 6, 6, 6]} barSize={8} />
      </BarChart>
    </ResponsiveContainer>
  );
}

