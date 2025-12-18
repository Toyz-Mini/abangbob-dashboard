
import React, { useMemo } from 'react';
import Modal from '../../components/Modal';
import { useInventory } from '../../lib/store';
import { formatCurrency } from '../../lib/utils';
import { AlertTriangle, Calendar, TrendingDown, TrendingUp } from 'lucide-react';

interface VarianceReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function VarianceReportModal({ isOpen, onClose }: VarianceReportModalProps) {
    const { inventoryLogs, inventory } = useInventory();

    const varianceLogs = useMemo(() => {
        // Filter for logs that represent a discrepancy correction
        // - type: 'adjust' (Manual adjustments)
        // - reason: "Shift Opening Count" or "Shift Closing Count"
        return inventoryLogs.filter(log =>
            log.type === 'adjust' ||
            log.reason.toLowerCase().includes('shift')
        ).map(log => {
            // Find current cost for value calculation
            const item = inventory.find(i => i.id === log.stockItemId);
            const cost = item ? item.cost : 0;

            // Calculate value
            // If type is 'out' or negative adjust -> Loss
            // If type is 'in' or positive adjust -> Gain
            let quantityChange = 0;
            if (log.type === 'adjust') {
                // Determine direction based on prev vs new
                quantityChange = log.newQuantity - log.previousQuantity;
            } else if (log.type === 'in') {
                quantityChange = log.quantity;
            } else if (log.type === 'out') {
                quantityChange = -log.quantity;
            }

            const valueChange = quantityChange * cost;

            return {
                ...log,
                quantityChange,
                valueChange,
                costPerUnit: cost
            };
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [inventoryLogs, inventory]);

    const totalLoss = varianceLogs.reduce((sum, log) => sum + (log.valueChange < 0 ? log.valueChange : 0), 0);
    const totalCount = varianceLogs.length;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Stock Variance Report"
            subtitle="Laporan Ketidaksamaan Stok (Audit)"
            maxWidth="800px"
        >
            <div className="space-y-6">

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-4">
                        <div className="p-3 bg-white rounded-full text-red-500 shadow-sm">
                            <TrendingDown size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-gray-500 font-medium">Total Nilai Hilang (Loss)</div>
                            <div className="text-2xl font-bold text-red-600">{formatCurrency(Math.abs(totalLoss))}</div>
                        </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-white rounded-full text-gray-500 shadow-sm">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-gray-500 font-medium">Jumlah Insiden</div>
                            <div className="text-2xl font-bold text-gray-800">{totalCount} Record{totalCount !== 1 ? 's' : ''}</div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto max-h-[500px]">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3">Tarikh</th>
                                    <th className="px-4 py-3">Item</th>
                                    <th className="px-4 py-3 text-right">Variance</th>
                                    <th className="px-4 py-3 text-right">Nilai</th>
                                    <th className="px-4 py-3">Sebab</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {varianceLogs.length > 0 ? (
                                    varianceLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">
                                                        {new Date(log.createdAt).toLocaleDateString('ms-MY')}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(log.createdAt).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-800">
                                                {log.stockItemName}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`font-bold ${log.quantityChange < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    {log.quantityChange > 0 ? '+' : ''}{log.quantityChange}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">
                                                <span className={log.valueChange < 0 ? 'text-red-600' : 'text-green-600'}>
                                                    {formatCurrency(log.valueChange)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {log.reason}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                                            Tiada rekod variance ditemui.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg flex gap-3 text-sm text-blue-800 border border-blue-100">
                    <div className="shrink-0 mt-0.5"><Calendar size={16} /></div>
                    <div>
                        Laporan ini menunjukkan perbezaan stok yang dikesan semasa <strong>Shift Count (Blind)</strong> atau pelarasan manual. Jika nilai negatif, bermaksud stok fizikal kurang daripada sistem (Potensi Kehilangan).
                    </div>
                </div>

            </div>
        </Modal>
    );
}
