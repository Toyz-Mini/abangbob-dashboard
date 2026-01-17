'use client';

import { useState } from 'react';
import { useInventory } from '@/lib/store';
import { WasteLog } from '@/lib/types';
import { format } from 'date-fns'; // Assume date-fns is available or use native intl
import { Search, Filter, Download, Trash2 } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import PremiumButton from '@/components/PremiumButton';
import { useTranslation } from '@/lib/contexts/LanguageContext';

export default function WasteHistoryView() {
    const { wasteLogs, inventory } = useInventory(); // wasteLogs populated from store
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterReason, setFilterReason] = useState<string>('All');

    // Combine logs with current stock name if needed (though we stored stockName in log)
    // Filtering
    const filteredLogs = wasteLogs.filter(log => {
        const matchesSearch =
            log.stockName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.reportedByName?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesReason = filterReason === 'All' || log.reason === filterReason;

        return matchesSearch && matchesReason;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalLoss = filteredLogs.reduce((sum, log) => sum + (log.totalLoss || 0), 0);

    return (
        <div className="space-y-6 animate-fade-in">

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GlassCard className="p-4 bg-red-50/50 border-red-100">
                    <p className="text-sm text-gray-500 font-medium uppercase">{t('inventory.wasteHistory.stats.value')}</p>
                    <h3 className="text-2xl font-bold text-red-600 mt-1">BND {totalLoss.toFixed(2)}</h3>
                </GlassCard>

                <GlassCard className="p-4">
                    <p className="text-sm text-gray-500 font-medium uppercase">{t('inventory.wasteHistory.stats.incidents')}</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">{filteredLogs.length}</h3>
                </GlassCard>

                <GlassCard className="p-4">
                    <p className="text-sm text-gray-500 font-medium uppercase">{t('inventory.wasteHistory.stats.reason')}</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">
                        {/* Simple mode calculation */}
                        {filteredLogs.length > 0 ?
                            Object.entries(filteredLogs.reduce((acc, log) => {
                                acc[log.reason] = (acc[log.reason] || 0) + 1;
                                return acc;
                            }, {} as Record<string, number>))
                                .sort((a, b) => b[1] - a[1])[0][0].replace('_', ' ').toUpperCase()
                            : '-'}
                    </h3>
                </GlassCard>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex gap-4 w-full sm:w-auto flex-1">
                    <div className="relative flex-1 sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder={t('inventory.wasteHistory.search')}
                            className="input input-bordered w-full pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        className="select select-bordered"
                        value={filterReason}
                        onChange={(e) => setFilterReason(e.target.value)}
                    >
                        <option value="All">{t('inventory.allCategories') || 'All Reasons'}</option>
                        <option value="expired">{t('inventory.waste.reasons.expired')}</option>
                        <option value="spilled">Spilled</option>
                        <option value="burned">{t('inventory.waste.reasons.burned')}</option>
                        <option value="customer_return">{t('inventory.waste.reasons.customer_return')}</option>
                        <option value="staff_meal">{t('inventory.waste.reasons.staff_meal')}</option>
                        <option value="other">{t('inventory.waste.reasons.other')}</option>
                    </select>
                </div>

                <PremiumButton variant="secondary" icon={Download} onClick={() => alert(t('inventory.wasteHistory.exportSoon'))}>
                    {t('inventory.wasteHistory.export')}
                </PremiumButton>
            </div>

            {/* Table */}
            <GlassCard>
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th>{t('inventory.table.date')}</th>
                                <th>{t('inventory.table.item')}</th>
                                <th>{t('inventory.table.quantity')}</th>
                                <th>{t('inventory.table.value')}</th>
                                <th>{t('inventory.table.reason')}</th>
                                <th>Reported By</th>
                                <th>{t('inventory.waste.notes')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-gray-500">
                                        {t('inventory.wasteHistory.empty')}
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50">
                                        <td className="whitespace-nowrap font-medium text-gray-600">
                                            {new Date(log.createdAt).toLocaleDateString()}
                                            <span className="block text-xs text-gray-400">
                                                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </td>
                                        <td className="font-bold text-gray-800">{log.stockName || 'Unknown Item'}</td>
                                        <td>
                                            <span className="font-semibold text-red-600">-{log.quantity}</span>
                                            <span className="text-gray-400 text-xs ml-1">{log.unit}</span>
                                        </td>
                                        <td className="font-bold text-red-700">
                                            {log.totalLoss?.toFixed(2) || '0.00'}
                                        </td>
                                        <td>
                                            <span className={`badge ${log.reason === 'expired' ? 'badge-error' :
                                                log.reason === 'burned' ? 'badge-warning' :
                                                    'badge-ghost'
                                                }`}>
                                                {log.reason.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="text-sm">
                                            {log.reportedByName}
                                        </td>
                                        <td className="text-gray-500 text-sm max-w-xs truncate" title={log.notes}>
                                            {log.notes || '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
}
