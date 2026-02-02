'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { BentoGrid, BentoCard } from '@/components/BentoGrid';
import {
    Building,
    Users,
    AlertTriangle,
    DollarSign,
    Activity,
    MapPin,
    Clock,
    CheckCircle,
    ArrowUpRight,
    Search
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import CountUp from '@/components/CountUp';
import Link from 'next/link';

const supabase = getSupabaseClient();

interface OutletMetric {
    id: string;
    name: string;
    is_warehouse: boolean;
    status: string;
    salesToday: number;
    ordersToday: number;
    activeStaff: number;
    lowStockCount: number;
    lastSync: string;
}

export default function MultiOutletOverview() {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<OutletMetric[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [globalStats, setGlobalStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        totalStaff: 0,
        activeAlerts: 0
    });

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];

        const { data: outlets } = await supabase
            .from('outlets')
            .select('id, name, is_warehouse, status')
            .eq('status', 'active');

        if (!outlets) {
            setLoading(false);
            return;
        }

        const outletMetrics: OutletMetric[] = [];
        let gRevenue = 0;
        let gOrders = 0;
        let gStaff = 0;
        let gAlerts = 0;

        await Promise.all(outlets.map(async (outlet: any) => {
            let sales = 0;
            let orders = 0;

            if (!outlet.is_warehouse) {
                const { data: orderData } = await supabase
                    .from('orders')
                    .select('total')
                    .eq('outlet_id', outlet.id)
                    .gte('created_at', `${today}T00:00:00`)
                    .neq('status', 'cancelled');

                if (orderData) {
                    sales = orderData.reduce((acc: number, o: any) => acc + o.total, 0);
                    orders = orderData.length;
                }
            }

            const { count: staffCount } = await supabase
                .from('staff_outlet_assignments')
                .select('id', { count: 'exact' })
                .eq('outlet_id', outlet.id)
                .eq('assignment_date', today);

            const { count: lowStock } = await supabase
                .from('stock_items')
                .select('id', { count: 'exact' })
                .eq('outlet_id', outlet.id)
                .lt('current_quantity', 5);

            gRevenue += sales;
            gOrders += orders;
            gStaff += (staffCount || 0);
            gAlerts += (lowStock || 0);

            outletMetrics.push({
                id: outlet.id,
                name: outlet.name,
                is_warehouse: outlet.is_warehouse,
                status: outlet.status,
                salesToday: sales,
                ordersToday: orders,
                activeStaff: staffCount || 0,
                lowStockCount: lowStock || 0,
                lastSync: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            });
        }));

        setMetrics(outletMetrics.sort((a, b) => (a.is_warehouse === b.is_warehouse) ? 0 : a.is_warehouse ? 1 : -1));
        setGlobalStats({
            totalRevenue: gRevenue,
            totalOrders: gOrders,
            totalStaff: gStaff,
            activeAlerts: gAlerts
        });
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 60000);
        return () => clearInterval(interval);
    }, [fetchDashboardData]);

    const filteredMetrics = metrics.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && metrics.length === 0) return (
        <div className="h-[60vh] flex items-center justify-center">
            <LoadingSpinner />
        </div>
    );

    return (
        <div className="space-y-12 animate-fade-in relative">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                        HQ Command
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">
                        Monitoring <span className="text-primary font-bold">{metrics.length}</span> active locations
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-primary transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Find outlet..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all w-[200px]"
                        />
                    </div>
                    <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-2 border border-green-200 dark:border-green-800">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        LIVE
                    </div>
                </div>
            </div>

            {/* Key Metrics Bento */}
            <BentoGrid className="mb-12">
                {/* Revenue Card (Large) */}
                <BentoCard
                    colSpan={2}
                    title="Total Network Revenue"
                    header={<DollarSign size={24} className="text-primary mb-2" />}
                >
                    <div className="mt-2">
                        <div className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
                            <CountUp end={globalStats.totalRevenue} prefix="BND " decimals={2} />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <Activity size={14} className="text-green-500" />
                            <span className="text-sm font-medium text-gray-500">
                                <span className="text-gray-900 dark:text-gray-300 font-bold">{globalStats.totalOrders}</span> transactions today
                            </span>
                        </div>
                    </div>
                </BentoCard>

                {/* Alerts & Staff (Stacked) */}
                <div className="space-y-10 md:col-span-1 flex flex-col h-full">
                    <div className={`
                        flex-1 glass-panel p-8 rounded-2xl flex flex-col justify-center relative overflow-hidden transition-all hover:scale-[1.02] cursor-pointer
                        ${globalStats.activeAlerts > 0 ? 'bg-amber-50/50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30' : ''}
                    `}>
                        <div className="flex justify-between items-center z-10 relative">
                            <h3 className="font-bold text-gray-700 dark:text-gray-200">System Alerts</h3>
                            <AlertTriangle size={20} className={globalStats.activeAlerts > 0 ? 'text-amber-500' : 'text-gray-400'} />
                        </div>
                        <div className="text-3xl font-bold mt-1 z-10 relative">
                            {globalStats.activeAlerts}
                        </div>
                        {globalStats.activeAlerts > 0 && <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/10 rounded-full -mr-8 -mt-8 blur-2xl" />}
                    </div>

                    <div className="flex-1 glass-panel p-8 rounded-2xl flex flex-col justify-center hover:scale-[1.02] transition-transform">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-gray-700 dark:text-gray-200">Active Staff</h3>
                            <Users size={20} className="text-blue-500" />
                        </div>
                        <div className="text-3xl font-bold mt-1">
                            {globalStats.totalStaff}
                        </div>
                    </div>
                </div>
            </BentoGrid>

            {/* Outlets Grid Title */}
            <div className="flex items-center gap-2 py-2 border-b border-gray-100 dark:border-white/10">
                <Building size={18} className="text-gray-400" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Outlet Performance</h2>
            </div>

            {/* Outlets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {filteredMetrics.map(outlet => (
                    <div
                        key={outlet.id}
                        className="glass-panel p-8 rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative border border-white/40 dark:border-white/5"
                    >
                        {outlet.is_warehouse && (
                            <div className="absolute top-4 right-4 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-md tracking-wider">
                                WAREHOUSE
                            </div>
                        )}

                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${outlet.status === 'active'
                                    ? 'bg-gradient-to-br from-green-400 to-green-600 text-white'
                                    : 'bg-gray-100 text-gray-400'
                                    }`}>
                                    <MapPin size={20} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg leading-tight text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                                        {outlet.name}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${outlet.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                        {outlet.status === 'active' ? 'Online' : 'Offline'}
                                        <span className="text-gray-300 mx-1">|</span>
                                        <Clock size={10} />
                                        {outlet.lastSync}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {!outlet.is_warehouse && (
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 group-hover:border-primary/10 transition-colors">
                                    <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Revenue</div>
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                        $<CountUp end={outlet.salesToday} decimals={2} />
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 group-hover:border-primary/10 transition-colors">
                                    <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Orders</div>
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                        {outlet.ordersToday}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/10">
                            <div className="flex -space-x-2">
                                {[...Array(Math.min(3, outlet.activeStaff))].map((_, i) => (
                                    <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white dark:border-gray-800 flex items-center justify-center text-[8px] font-bold text-gray-500">
                                        {i + 1}
                                    </div>
                                ))}
                                {outlet.activeStaff > 3 && (
                                    <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-gray-500">
                                        +{outlet.activeStaff - 3}
                                    </div>
                                )}
                                {outlet.activeStaff === 0 && <span className="text-xs text-gray-400 italic">No staff</span>}
                            </div>

                            {outlet.lowStockCount > 0 ? (
                                <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md text-xs font-bold">
                                    <AlertTriangle size={12} />
                                    {outlet.lowStockCount} ALERT
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                    <CheckCircle size={12} />
                                    OK
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
