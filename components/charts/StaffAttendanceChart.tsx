'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface StaffAttendanceChartProps {
  data: { name: string; value: number }[];
}

const COLORS = ['var(--primary)', 'var(--success)', 'var(--warning)', 'var(--secondary)', 'var(--danger)'];

export default function StaffAttendanceChart({ data }: StaffAttendanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius-md)',
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

