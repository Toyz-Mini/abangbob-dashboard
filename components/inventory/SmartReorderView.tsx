'use client';

import { useState, useMemo } from 'react';
import { useInventory, useSuppliers } from '@/lib/store';
import { StockSuggestion } from '@/lib/types';
import {
    ShoppingCart,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    FileText,
    MessageCircle,
    RefreshCw,
    ArrowRight
} from 'lucide-react';
import { useToast } from '@/lib/contexts/ToastContext';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import { WhatsAppService } from '@/lib/services/whatsapp';

export default function SmartReorderView() {
    const { getRestockSuggestions, inventoryLogs } = useInventory();
    const { addPurchaseOrder } = useSuppliers();
    const { showToast } = useToast();
    const { t } = useTranslation();

    const [isGenerating, setIsGenerating] = useState(false);

    // Get suggestions
    const suggestions = useMemo(() => getRestockSuggestions(), [getRestockSuggestions, inventoryLogs]);

    // Calculations
    const totalEstimatedCost = suggestions.reduce((sum, item) => sum + item.estimatedCost, 0);
    const uniqueSuppliers = Array.from(new Set(suggestions.map(s => s.supplier).filter(Boolean)));

    const handleGeneratePO = async () => {
        if (suggestions.length === 0) return;

        setIsGenerating(true);
        try {
            // Group by supplier
            const bySupplier: Record<string, StockSuggestion[]> = {};
            const noSupplierItems: StockSuggestion[] = [];

            suggestions.forEach(item => {
                if (item.supplier) {
                    bySupplier[item.supplier] = bySupplier[item.supplier] || [];
                    bySupplier[item.supplier].push(item);
                } else {
                    noSupplierItems.push(item);
                }
            });

            // Create POs for each supplier
            for (const [supplierName, items] of Object.entries(bySupplier)) {
                await addPurchaseOrder({
                    supplierId: 'unknown',
                    supplierName: supplierName,
                    items: items.map(i => ({
                        stockItemId: i.stockId,
                        stockItemName: i.stockName,
                        quantity: i.suggestedOrderQuantity,
                        unit: 'unit', // Add unit
                        unitPrice: i.estimatedCost / i.suggestedOrderQuantity,
                        totalPrice: i.estimatedCost,
                        // receivedQuantity is not in PurchaseOrderItem (it's likely in PurchaseOrder status logic or separate table?) 
                        // Wait, PurchaseOrderItem definition from view_code_item earlier:
                        // stockItemId, stockItemName, quantity, unit, unitPrice, totalPrice.
                    })),
                    status: 'draft',
                    notes: 'Auto-generated via Smart Reorder',
                    subtotal: items.reduce((sum, i) => sum + i.estimatedCost, 0),
                    tax: 0,
                    total: items.reduce((sum, i) => sum + i.estimatedCost, 0),
                    paymentStatus: 'pending'
                });
            }

            // Handle items without supplier
            if (noSupplierItems.length > 0) {
                const subtotal = noSupplierItems.reduce((sum, i) => sum + i.estimatedCost, 0);
                await addPurchaseOrder({
                    supplierId: 'misc',
                    supplierName: 'General Supplier (Unassigned)',
                    items: noSupplierItems.map(i => ({
                        stockItemId: i.stockId,
                        stockItemName: i.stockName,
                        quantity: i.suggestedOrderQuantity,
                        unit: 'unit',
                        unitPrice: i.estimatedCost / i.suggestedOrderQuantity,
                        totalPrice: i.estimatedCost,
                    })),
                    status: 'draft',
                    notes: 'Auto-generated via Smart Reorder',
                    subtotal: subtotal,
                    tax: 0,
                    total: subtotal,
                    paymentStatus: 'pending'
                });
            }

            showToast(`Berjaya menjana ${Object.keys(bySupplier).length + (noSupplierItems.length ? 1 : 0)} Purchase Orders`, 'success');
        } catch (error) {
            console.error('Failed to generate PO:', error);
            showToast('Gagal menjana Purchase Order', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const sendToSupplierWhatsApp = (item: StockSuggestion) => {
        // Ideally look up supplier phone number
        // For demo, we just open a blank WhatsApp with the message
        const message = `Halo, saya mahu order stok untuk ${item.stockName}. Kuantiti: ${item.suggestedOrderQuantity}. Terima kasih.`;
        // Using a placeholder number or just opening the app
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    if (suggestions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <CheckCircle size={48} className="text-green-500 mb-4" />
                <h3 className="text-lg font-bold text-gray-800 mb-1">Stok Dalam Keadaan Baik</h3>
                <p className="text-gray-500 max-w-sm">
                    Tiada item yang perlu di-restock berdasarkan analisis penggunaan 30 hari lepas.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex flex-col items-center text-center">
                    <ShoppingCart className="text-blue-600 mb-2" size={24} />
                    <div className="text-2xl font-bold text-blue-800">{suggestions.length}</div>
                    <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">Item Perlu Restock</div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex flex-col items-center text-center">
                    <FileText className="text-emerald-600 mb-2" size={24} />
                    <div className="text-2xl font-bold text-emerald-800">BND {totalEstimatedCost.toFixed(2)}</div>
                    <div className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Anggaran Kos</div>
                </div>

                <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl flex flex-col items-center text-center">
                    <TrendingDown className="text-purple-600 mb-2" size={24} />
                    <div className="text-2xl font-bold text-purple-800">{uniqueSuppliers.length}</div>
                    <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">Supplier Terlibat</div>
                </div>
            </div>

            {/* Suggestion Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <RefreshCw size={20} className="text-primary" />
                        Cadangan Restock (Smart Reorder)
                    </h3>
                    <button
                        onClick={handleGeneratePO}
                        disabled={isGenerating}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        {isGenerating ? 'Generating...' : (
                            <>
                                <FileText size={18} />
                                Jana Purchase Order (PO)
                            </>
                        )}
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Item</th>
                                <th className="px-4 py-3 font-semibold text-center">Stok Semasa</th>
                                <th className="px-4 py-3 font-semibold text-center">Usage / Hari</th>
                                <th className="px-4 py-3 font-semibold text-center">Reorder Point</th>
                                <th className="px-4 py-3 font-semibold text-right">Cadangan Order</th>
                                <th className="px-4 py-3 font-semibold text-right">Kos (Est)</th>
                                <th className="px-4 py-3 font-semibold text-center">Tindakan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {suggestions.map((item) => (
                                <tr key={item.stockId} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {item.stockName}
                                        {item.supplier && (
                                            <div className="text-xs text-gray-400 font-normal">{item.supplier}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${item.currentQuantity === 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {item.currentQuantity}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-gray-600">
                                        {item.averageDailyUsage.toFixed(1)} unit
                                    </td>
                                    <td className="px-4 py-3 text-center text-gray-500">
                                        &lt; {item.suggestedReorderPoint.toFixed(1)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-primary">
                                        {item.suggestedOrderQuantity} unit
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        ${item.estimatedCost.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => sendToSupplierWhatsApp(item)}
                                            title="Hantar WhatsApp ke Supplier"
                                            className="p-1.5 hover:bg-green-50 text-green-600 rounded-md transition-colors"
                                        >
                                            <MessageCircle size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800 flex items-start gap-3">
                <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                <div>
                    <p className="font-bold mb-1">Bagaimana ini dikira?</p>
                    <p>
                        Formula: <b>(Purata Guna Harian × 3 Hari Lead Time) + 20% Safety Stock</b>.
                        System mencadangkan order apabila stok jatuh bawah paras ini, untuk menampung penggunaan selama 7 hari.
                    </p>
                </div>
            </div>
        </div>
    );
}
