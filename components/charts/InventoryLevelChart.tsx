'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface InventoryLevelChartProps {
  data: { name: string; quantity: number; min: number }[];
}

export default function InventoryLevelChart({ data }: InventoryLevelChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
        <XAxis 
          dataKey="name" 
          stroke="var(--text-secondary)"
          style={{ fontSize: '12px' }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          stroke="var(--text-secondary)"
          style={{ fontSize: '12px' }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius-md)',
          }}
        />
        <Bar dataKey="min" fill="var(--warning)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="quantity" fill="var(--success)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

