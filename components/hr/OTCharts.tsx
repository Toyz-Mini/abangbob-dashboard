import React, { memo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

const STATUS_COLORS = {
    pending: '#f59e0b',    // warning
    approved: '#3b82f6',   // info
    rejected: '#ef4444',   // danger
    paid: '#22c55e',       // success
};

interface OTChartsProps {
    staffCostData: { name: string; amount: number }[];
    statusData: { name: string; value: number }[];
}

const OTCharts = memo(({ staffCostData, statusData }: OTChartsProps) => {
    return (
        <div className="content-grid cols-2" style={{ marginBottom: '2rem' }}>
            {/* Bar Chart: Cost by Staff */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Kos OT Mengikut Staf</h3>
                </div>
                <div style={{ height: '300px', width: '100%' }}>
                    <ResponsiveContainer>
                        <BarChart data={staffCostData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                            <XAxis type="number" tickFormatter={(val) => `$${val}`} />
                            <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '0.8rem' }} />
                            <Tooltip
                                formatter={(val: number) => [`$${val.toFixed(2)}`, 'Kos OT']}
                                contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                            />
                            <Bar dataKey="amount" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Pie Chart: Status Distribution */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Status Tuntutan</h3>
                </div>
                <div style={{ height: '300px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || '#8884d8'} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
});

OTCharts.displayName = 'OTCharts';

export default OTCharts;
