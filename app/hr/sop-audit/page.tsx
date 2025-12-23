'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { getSOPLogs, getSOPLogDetails } from '@/lib/supabase/sop-sync';
import { useStaff } from '@/lib/store';
import { Calendar, User, CheckCircle, Clock, AlertCircle, Eye, Camera, X, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SOPAuditPage() {
    const { staff } = useStaff();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedLog, setSelectedLog] = useState<any | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailData, setDetailData] = useState<any | null>(null);

    useEffect(() => {
        loadLogs();
    }, [selectedDate]);

    const loadLogs = async () => {
        setLoading(true);
        const data = await getSOPLogs(selectedDate);
        setLogs(data);
        setLoading(false);
    };

    const handleViewDetail = async (log: any) => {
        setSelectedLog(log);
        setDetailLoading(true);
        setDetailData(null);

        try {
            const details = await getSOPLogDetails(log.id);
            setDetailData(details);
        } catch (e) {
            console.error(e);
        } finally {
            setDetailLoading(false);
        }
    };

    const closeDetail = () => {
        setSelectedLog(null);
        setDetailData(null);
    };

    const getStaffName = (id: string) => {
        const s = staff.find(st => st.id === id);
        return s ? s.name : 'Unknown Staff';
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar isOpen={true} />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <CheckSquare className="text-blue-600" />
                            Mission Control
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Audit & Review SOP Submissions</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
                            <Calendar size={18} className="text-gray-500" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-transparent border-none text-sm focus:ring-0 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-20 text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300">
                            <CheckCircle size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No missions found for this date.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {logs.map(log => (
                                <div
                                    key={log.id}
                                    onClick={() => handleViewDetail(log)}
                                    className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${log.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                                            }`}>
                                            {log.status === 'completed' ? '✓' : '•'}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">{log.templateName}</h3>
                                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <User size={14} /> {getStaffName(log.staffId)}
                                                </span>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={14} />
                                                    {new Date(log.startedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${log.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {log.status.replace('_', ' ')}
                                        </span>
                                        <Eye size={20} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedLog && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-gray-800 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold">{selectedLog.templateName} Details</h2>
                                    <div className="text-sm text-gray-500 mt-1 flex gap-2">
                                        <span>{getStaffName(selectedLog.staffId)}</span>
                                        <span>•</span>
                                        <span>{new Date(selectedLog.startedAt).toLocaleString()}</span>
                                    </div>
                                </div>
                                <button onClick={closeDetail} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {detailLoading ? (
                                    <div className="py-12 flex justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : detailData ? (
                                    <>
                                        <div className="grid gap-4">
                                            {detailData.items.map((item: any) => (
                                                <div key={item.id} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-start gap-2">
                                                            <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0" />
                                                            {item.stepTitle}
                                                        </h4>
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>

                                                    {/* Evidence Section */}
                                                    <div className="pl-6 space-y-3">
                                                        {/* Value Input */}
                                                        {item.inputValue && item.inputValue !== 'true' && (
                                                            <div className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium border border-blue-100">
                                                                Value: {item.inputValue}
                                                            </div>
                                                        )}

                                                        {/* Photo Evidence */}
                                                        {item.photoUrl && (
                                                            <div className="mt-2">
                                                                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                                                    <Camera size={12} /> Photo Evidence:
                                                                </div>
                                                                <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden relative group">
                                                                    <img
                                                                        src={item.photoUrl}
                                                                        alt="Evidence"
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    {/* Zoom overlay could go here */}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {item.requiresPhoto && !item.photoUrl && (
                                                            <div className="text-red-500 text-xs flex items-center gap-1">
                                                                <AlertCircle size={12} /> Missing Required Photo
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center text-gray-500">Failed to load details.</div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
                                <button onClick={closeDetail} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">
                                    Close
                                </button>
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm">
                                    Acknowledge Review
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
