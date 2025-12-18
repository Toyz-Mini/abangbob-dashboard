'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { useStore } from '@/lib/store';
import { StockItem } from '@/lib/types';

interface StockImporterProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function StockImporter({ onClose, onSuccess }: StockImporterProps) {
    const { bulkUpsertStock } = useStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<Partial<StockItem>[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState<'upload' | 'preview'>('upload');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
                setError('Sila muat naik fail CSV.');
                return;
            }
            setFile(selectedFile);
            setError(null);
            parseCSV(selectedFile);
        }
    };

    const parseCSV = (file: File) => {
        setIsProcessing(true);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                setIsProcessing(false);
                if (results.errors.length > 0) {
                    setError('Gagal membaca CSV. Sila pastikan format betul.');
                    console.error(results.errors);
                    return;
                }

                // Map and validate
                const mappedData: Partial<StockItem>[] = results.data.map((row: any) => ({
                    name: row.name || row.Name || row['Nama Item'],
                    category: (row.category || row.Category || row.Kategori || 'other').toLowerCase(),
                    currentQuantity: parseFloat(row.currentQuantity || row.quantity || row.Quantity || row.Kuantiti || '0'),
                    minQuantity: parseFloat(row.minQuantity || row.min_quantity || row.MinQuantity || '10'),
                    unit: row.unit || row.Unit || 'unit',
                    cost: parseFloat(row.cost || row.Cost || row.Kos || '0'),
                    supplier: row.supplier || row.Supplier || undefined,
                })).filter(item => item.name); // Filter empty names

                if (mappedData.length === 0) {
                    setError('Tiada data item yang sah ditemui.');
                    return;
                }

                setPreviewData(mappedData);
                setStep('preview');
            },
            error: (error) => {
                setIsProcessing(false);
                setError('Ralat membaca fail: ' + error.message);
            }
        });
    };

    const handleImport = async () => {
        setIsProcessing(true);
        try {
            // Simulate delay for UI
            await new Promise(resolve => setTimeout(resolve, 800));
            bulkUpsertStock(previewData);
            onSuccess();
        } catch (err) {
            console.error(err);
            setError('Gagal import data. Sila cuba lagi.');
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,name,category,currentQuantity,minQuantity,unit,cost,supplier\nBeras Wangi,ingredients,50,10,kg,12.50,Pembekal A\nAyam Segar,ingredients,20,5,ekor,8.00,Pembekal B";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "inventory_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                    <h3 className="font-bold text-lg">Import Stok (CSV)</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {step === 'upload' ? (
                        <div className="space-y-6">
                            <div
                                className={`
                  border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                  ${file ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800'}
                `}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".csv"
                                    className="hidden"
                                />

                                {isProcessing ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 size={32} className="animate-spin text-primary" />
                                        <p className="text-sm text-gray-500">Memproses fail...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                            <Upload size={24} />
                                        </div>
                                        <div>
                                            <p className="font-medium">Klik untuk upload CSV</p>
                                            <p className="text-xs text-gray-500 mt-1">atau drag & drop file ke sini</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2">
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-semibold">Gunakan Template</span>
                                    <button
                                        onClick={downloadTemplate}
                                        className="text-primary text-xs hover:underline flex items-center gap-1"
                                    >
                                        <FileText size={12} /> Download CSV Template
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Pastikan column header mengikut format: <br />
                                    <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">name</code>,
                                    <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded ml-1">category</code>,
                                    <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded ml-1">currentQuantity</code>,
                                    <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded ml-1">cost</code>
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                                <CheckCircle size={20} />
                                <span className="text-sm font-medium">{previewData.length} item berjaya dibaca.</span>
                            </div>

                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-60 overflow-y-auto text-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 uppercase">
                                        <tr>
                                            <th className="px-3 py-2">Item</th>
                                            <th className="px-3 py-2">Qty</th>
                                            <th className="px-3 py-2">Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {previewData.map((item, i) => (
                                            <tr key={i}>
                                                <td className="px-3 py-2 font-medium">{item.name}</td>
                                                <td className="px-3 py-2">{item.currentQuantity} {item.unit}</td>
                                                <td className="px-3 py-2">BND {item.cost?.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex gap-3 justify-end">
                    {step === 'preview' ? (
                        <>
                            <button
                                onClick={() => { setStep('upload'); setFile(null); }}
                                className="btn btn-ghost btn-sm"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={isProcessing}
                                className="btn btn-primary btn-sm min-w-[100px]"
                            >
                                {isProcessing ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Confirm Import'}
                            </button>
                        </>
                    ) : (
                        <button onClick={onClose} className="btn btn-ghost btn-sm">
                            Batal
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
