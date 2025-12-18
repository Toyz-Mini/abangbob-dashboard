'use client';

import React, { useState, useEffect } from 'react';
import {
    TrendingUp, TrendingDown, AlertTriangle, ShieldAlert,
    Zap, Brain, Crown, User, Calendar, ArrowRight, DollarSign,
    Activity, Search, Filter, Radio, Target, Clock, AlertOctagon
} from 'lucide-react';
import { getTowkayStats, TowkayStats } from '@/lib/towkay-metrics';
import { formatCurrency } from '@/lib/utils';

export default function TowkayDashboard() {
    const [stats, setStats] = useState<TowkayStats | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        // Simulate live clock
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        const data = getTowkayStats();
        setStats(data);
        return () => clearInterval(timer);
    }, []);

    if (!stats) return <div className="min-h-screen bg-black flex items-center justify-center text-cyan-500 font-mono animate-pulse">INITIALIZING GOD MODE...</div>;

    return (
        <div className="min-h-screen bg-slate-950 text-cyan-50 font-sans selection:bg-cyan-500 selection:text-black overflow-hidden relative">

            {/* Background FX */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,27,0.8)_2px,transparent_2px),linear-gradient(90deg,rgba(18,24,27,0.8)_2px,transparent_2px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 animate-pulse"></div>

            {/* Header (HUD Style) */}
            <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-[1920px] mx-auto px-6 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-cyan-500/10 border border-cyan-500/50 rounded flex items-center justify-center">
                            <Activity size={20} className="text-cyan-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-wider text-white uppercase font-mono">GOD MODE <span className="text-cyan-500">v2.0</span></h1>
                            <p className="text-[10px] text-slate-400 tracking-[0.2em] uppercase">System Monitor // {currentTime.toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Ticker */}
                        <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 bg-slate-900 border border-slate-800 rounded-full">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                            <span className="text-xs font-mono text-green-400">SYS: ONLINE</span>
                            <span className="text-xs text-slate-600">|</span>
                            <span className="text-xs font-mono text-slate-400">LATENCY: 12ms</span>
                        </div>

                        <div className="text-right">
                            <div className="text-2xl font-mono font-bold text-white leading-none">
                                {currentTime.toLocaleTimeString([], { hour12: false })}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Command Center Layout (Bento Grid) */}
            <main className="max-w-[1920px] mx-auto p-6 h-[calc(100vh-80px)] overflow-y-auto">
                <div className="grid grid-cols-12 grid-rows-12 gap-4 h-full min-h-[800px]">

                    {/* 1. REALTIME PROFIT (Big Number - Top Left) */}
                    <div className="col-span-12 lg:col-span-4 row-span-3 bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={120} /></div>
                        <h3 className="text-slate-400 text-xs font-mono uppercase tracking-widest mb-1">Realtime Profit</h3>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-5xl lg:text-6xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tighter">
                                {stats.financial.realtimeProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-xl text-slate-500 font-mono">MYR</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <TrendingUp size={16} className="text-green-400" />
                            <span className="text-green-400 font-mono text-sm font-bold">+12.4%</span>
                            <span className="text-slate-500 text-xs uppercase">vs Previous Shift</span>
                        </div>

                        {/* Micro Chart Mockup */}
                        <div className="absolute bottom-0 left-0 w-full h-1/3 flex items-end gap-1 px-6 pb-4 opacity-30">
                            {[40, 60, 45, 70, 85, 65, 90, 80, 50, 60, 75, 100].map((h, i) => (
                                <div key={i} className="flex-1 bg-cyan-500/50 hover:bg-cyan-400 transition-colors rounded-t-sm" style={{ height: `${h}%` }}></div>
                            ))}
                        </div>
                    </div>

                    {/* 2. CASH FLOW & SHORTAGE (Center Top) */}
                    <div className="col-span-12 lg:col-span-4 row-span-3 grid grid-rows-2 gap-4">
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-5 flex justify-between items-center relative overflow-hidden">
                            <div className="absolute inset-y-0 left-0 w-1 bg-purple-500"></div>
                            <div>
                                <h3 className="text-slate-400 text-xs font-mono uppercase mb-1">Projected Cash Flow</h3>
                                <div className="text-3xl font-bold font-mono text-white text-shadow-glow">
                                    {formatCurrency(stats.financial.projectedCashFlow)}
                                </div>
                            </div>
                            <div className="h-12 w-12 rounded-full border border-purple-500/30 flex items-center justify-center bg-purple-500/10">
                                <Target size={20} className="text-purple-400" />
                            </div>
                        </div>

                        <div className={`bg-slate-900/50 border rounded-xl p-5 flex justify-between items-center relative overflow-hidden group
                    ${stats.financial.dailyShortage < 0 ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'border-slate-700/50'}
                `}>
                            <div className={`absolute inset-y-0 left-0 w-1 ${stats.financial.dailyShortage < 0 ? 'bg-red-500 animate-pulse' : 'bg-slate-700'}`}></div>
                            <div>
                                <h3 className={`text-xs font-mono uppercase mb-1 ${stats.financial.dailyShortage < 0 ? 'text-red-400' : 'text-slate-400'}`}>Leakage Detected</h3>
                                <div className={`text-3xl font-bold font-mono ${stats.financial.dailyShortage < 0 ? 'text-red-500' : 'text-white'}`}>
                                    {formatCurrency(stats.financial.dailyShortage)}
                                </div>
                            </div>
                            <div className={`h-12 w-12 rounded-full border flex items-center justify-center
                        ${stats.financial.dailyShortage < 0 ? 'border-red-500/30 bg-red-500/10' : 'border-slate-700 bg-slate-800'}`}>
                                <ShieldAlert size={20} className={stats.financial.dailyShortage < 0 ? 'text-red-500' : 'text-slate-500'} />
                            </div>
                        </div>
                    </div>

                    {/* 3. STAFF RADAR (Top Right) */}
                    <div className="col-span-12 lg:col-span-4 row-span-6 bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 flex flex-col items-center justify-center relative">
                        <div className="absolute top-4 left-4 text-xs font-mono text-slate-400 uppercase flex items-center gap-2">
                            <User size={12} /> Staff Matrix
                        </div>

                        {/* Fake Radar Chart CSS */}
                        <div className="w-64 h-64 border border-slate-700/50 rounded-full relative flex items-center justify-center animate-spin-slow">
                            {/* Rings */}
                            <div className="absolute inset-4 border border-slate-800 rounded-full"></div>
                            <div className="absolute inset-12 border border-slate-800 rounded-full"></div>
                            <div className="absolute inset-20 border border-slate-800 rounded-full"></div>

                            {/* Crosshairs */}
                            <div className="absolute w-full h-[1px] bg-slate-800"></div>
                            <div className="absolute h-full w-[1px] bg-slate-800"></div>

                            {/* Data Shape Mockup */}
                            <div className="absolute top-8 right-6 bottom-16 left-12 bg-cyan-500/20 border border-cyan-500/50 clip-polygon animate-pulse opacity-70"></div>

                            <div className="absolute top-2 font-mono text-[9px] text-cyan-500 bg-slate-900 px-1">SPEED</div>
                            <div className="absolute bottom-2 font-mono text-[9px] text-purple-500 bg-slate-900 px-1">QUALITY</div>
                            <div className="absolute left-1 font-mono text-[9px] text-pink-500 bg-slate-900 px-1">SALES</div>
                            <div className="absolute right-1 font-mono text-[9px] text-green-500 bg-slate-900 px-1">SERVICE</div>
                        </div>

                        {/* Leaderboard List below chart */}
                        <div className="w-full mt-6 space-y-2">
                            {stats.staffLeaderboard.map((staff, i) => (
                                <div key={staff.name} className="flex items-center justify-between text-xs p-2 rounded bg-slate-800/50 border border-slate-700/30">
                                    <div className="flex items-center gap-2">
                                        <span className={`font-mono font-bold w-4 ${i === 0 ? 'text-yellow-400' : 'text-slate-500'}`}>{i + 1}</span>
                                        <span className="text-slate-300">{staff.name}</span>
                                    </div>
                                    <span className="font-mono text-cyan-400">{staff.points} XP</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 4. CSI MODULE (Fraud Alerts - Bottom Left Spanning) */}
                    <div className="col-span-12 lg:col-span-8 row-span-6 bg-slate-900/50 border border-slate-700/50 rounded-xl p-0 overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                            <h3 className="text-sm font-mono text-red-400 uppercase flex items-center gap-2">
                                <AlertOctagon size={16} /> CSI RISK DETECTION
                            </h3>
                            <div className="flex gap-2 text-[10px] uppercase">
                                <span className="px-2 py-1 bg-red-500/10 text-red-500 border border-red-900 rounded">High Risk</span>
                                <span className="px-2 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded">Scanning...</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto p-4 space-y-3">
                            {stats.risks.length === 0 && <div className="text-slate-600 text-center py-10 font-mono">NO THREATS DETECTED. SYSTEM SECURE.</div>}

                            {stats.risks.map(risk => (
                                <div key={risk.id} className="group relative pl-4 pr-6 py-4 bg-gradient-to-r from-red-900/10 to-transparent border border-red-900/30 hover:border-red-500/50 rounded-lg transition-all">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600"></div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-red-400 font-bold font-mono tracking-wide">{risk.title}</span>
                                                <span className="text-[10px] px-1.5 bg-red-950 text-red-300 border border-red-800 rounded uppercase">{risk.severity}</span>
                                            </div>
                                            <p className="text-slate-400 text-sm">{risk.description}</p>
                                            <div className="mt-2 text-xs font-mono text-red-300 flex items-center gap-2">
                                                <User size={10} /> {risk.staffName || 'Unknown Staff'}
                                                <span className="text-slate-600">|</span>
                                                <Clock size={10} /> {new Date(risk.timestamp).toLocaleTimeString()}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-bold font-mono text-white mb-2">{risk.value}</div>
                                            <button className="text-[10px] uppercase tracking-wider text-red-400 hover:text-red-300 border border-red-800 hover:border-red-500 px-3 py-1 rounded transition-colors">
                                                Investigate
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 5. OPPORTUNITIES (Bottom Right) */}
                    <div className="col-span-12 lg:col-span-4 row-span-3 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 rounded-xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-50"><Brain size={64} className="text-indigo-500" /></div>

                        <h3 className="text-indigo-400 text-xs font-mono uppercase tracking-widest mb-4">AI Recommendations</h3>

                        <div className="space-y-4 relative z-10">
                            {stats.opportunities.slice(0, 1).map(opp => (
                                <div key={opp.id}>
                                    <h4 className="text-white font-bold text-lg leading-tight mb-2">{opp.title}</h4>
                                    <p className="text-indigo-200/70 text-sm mb-3">{opp.description}</p>

                                    <div className="flex items-center justify-between mt-4 p-3 bg-indigo-950/50 rounded border border-indigo-500/30">
                                        <span className="text-xs text-indigo-300 uppercase">Potential Gain</span>
                                        <span className="font-mono font-bold text-green-400">{opp.potentialValue}</span>
                                    </div>

                                    <button className="w-full mt-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors">
                                        Apply Strategy
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 6. TICKER FOOTER (System Logs) */}
                    <div className="col-span-12 row-span-1 border-t border-slate-800 bg-black flex items-center px-4 overflow-hidden">
                        <div className="text-[10px] font-mono text-slate-500 whitespace-nowrap animate-marquee">
                            LOG: [21:40:05] SYSTEM CHECK OK ... [21:40:02] KITCHEN PRINTER 2 ONLINE ... [21:39:55] NEW ORDER #10394 RECEIVED ... [21:39:40] STAFF SARA CLOCKED IN ... [21:39:12] INVENTORY SYNC COMPLETED
                        </div>
                    </div>

                </div>
            </main>

            <style jsx global>{`
        .text-shadow-glow {
            text-shadow: 0 0 20px rgba(168, 85, 247, 0.5);
        }
        .animate-spin-slow {
            animation: spin 20s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .clip-polygon {
            clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
        }
        @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
        }
        .animate-marquee {
            animation: marquee 20s linear infinite;
        }
      `}</style>
        </div>
    );
}
