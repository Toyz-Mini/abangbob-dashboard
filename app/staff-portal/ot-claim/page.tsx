'use client';

import { useState, useMemo } from 'react';
import StaffLayout from '@/components/StaffLayout';
import { useStaffPortal } from '@/lib/store';
import { useAuth } from '@/lib/contexts/AuthContext';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
    Clock,
    Plus,
    Calendar,
    DollarSign,
    CheckCircle,
    XCircle,
    AlertCircle,
    FileText,
    Briefcase,
    Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Default OT settings
const DEFAULT_OT_RATE = 5; // BND per hour
const DEFAULT_MULTIPLIER = 1.5;

export default function OTClaimPage() {
    const { currentStaff, isStaffLoggedIn } = useAuth();
    const { otClaims, addOTClaim, getStaffOTClaims } = useStaffPortal();

    const [showModal, setShowModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'paid'>('all');

    // Form state
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        startTime: '18:00',
        endTime: '22:00',
        reason: '',
        hourlyRate: DEFAULT_OT_RATE,
        multiplier: DEFAULT_MULTIPLIER,
    });

    // Get staff's OT claims
    const myClaims = useMemo(() => {
        if (!currentStaff) return [];
        // Sort by date descending
        return getStaffOTClaims(currentStaff.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [currentStaff, getStaffOTClaims, otClaims]);

    // Filtered claims
    const filteredClaims = useMemo(() => {
        if (filterStatus === 'all') return myClaims;
        return myClaims.filter(c => c.status === filterStatus);
    }, [myClaims, filterStatus]);

    // Calculate hours worked
    const calculateHours = (startTime: string, endTime: string): number => {
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        let hours = endH - startH + (endM - startM) / 60;
        if (hours < 0) hours += 24; // Handle overnight OT
        return Math.max(0, hours);
    };

    // Form calculations
    const hoursWorked = calculateHours(formData.startTime, formData.endTime);
    const totalAmount = hoursWorked * formData.hourlyRate * formData.multiplier;

    // Stats
    const stats = useMemo(() => {
        const pending = myClaims.filter(c => c.status === 'pending').length;
        const approved = myClaims.filter(c => c.status === 'approved').length;
        const totalApprovedAmount = myClaims
            .filter(c => c.status === 'approved' || c.status === 'paid')
            .reduce((sum, c) => sum + c.totalAmount, 0);
        const totalHours = myClaims
            .filter(c => c.status === 'approved' || c.status === 'paid')
            .reduce((sum, c) => sum + c.hoursWorked, 0);
        return { pending, approved, totalApprovedAmount, totalHours };
    }, [myClaims]);

    const handleSubmit = async () => {
        if (!currentStaff) return;
        if (!formData.reason.trim()) {
            alert('Sila masukkan sebab OT');
            return;
        }
        if (hoursWorked <= 0) {
            alert('Masa OT tidak sah');
            return;
        }

        setIsProcessing(true);
        await new Promise(r => setTimeout(r, 500)); // Simulate processing

        addOTClaim({
            staffId: currentStaff.id,
            staffName: currentStaff.name,
            date: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime,
            hoursWorked,
            hourlyRate: formData.hourlyRate,
            multiplier: formData.multiplier,
            totalAmount,
            reason: formData.reason.trim(),
            status: 'pending',
        });

        setShowModal(false);
        setIsProcessing(false);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            startTime: '18:00',
            endTime: '22:00',
            reason: '',
            hourlyRate: DEFAULT_OT_RATE,
            multiplier: DEFAULT_MULTIPLIER,
        });
    };

    if (!isStaffLoggedIn || !currentStaff) {
        return (
            <StaffLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                    <div className="bg-amber-50 p-6 rounded-2xl max-w-sm w-full border border-amber-100">
                        <AlertCircle size={48} className="text-amber-500 mb-4 mx-auto" />
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Sila Log Masuk</h2>
                        <p className="text-sm text-gray-600">Anda perlu log masuk sebagai staf untuk mengakses halaman ini.</p>
                    </div>
                </div>
            </StaffLayout>
        );
    }

    return (
        <StaffLayout>
            <div className="max-w-md mx-auto sm:max-w-2xl lg:max-w-4xl animate-fade-in pb-24 pt-4 px-4 sm:px-6">

                {/* Modern Header */}
                <header className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tuntutan OT</h1>
                        <p className="text-sm text-gray-500 font-medium">Rekod kerja lebih masa</p>
                    </div>
                    <button
                        className="p-3 bg-red-600 text-white rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 active:scale-95 transition-all"
                        onClick={() => setShowModal(true)}
                    >
                        <Plus size={20} />
                    </button>
                </header>

                {/* Compact Stats Row - Horizontal Scroll */}
                <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                    {/* Pending Stat */}
                    <div className="min-w-[140px] flex-1 bg-white p-3 rounded-2xl border border-amber-50 shadow-sm flex flex-col items-center justify-center text-center gap-1 shrink-0">
                        <div className="bg-amber-50 p-1.5 rounded-lg text-amber-600 mb-1">
                            <Clock size={16} />
                        </div>
                        <span className="text-xl font-bold text-gray-900 leading-none">{stats.pending}</span>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Menunggu</span>
                    </div>

                    {/* Approved Stat */}
                    <div className="min-w-[140px] flex-1 bg-white p-3 rounded-2xl border border-emerald-50 shadow-sm flex flex-col items-center justify-center text-center gap-1 shrink-0">
                        <div className="bg-emerald-50 p-1.5 rounded-lg text-emerald-600 mb-1">
                            <CheckCircle size={16} />
                        </div>
                        <span className="text-xl font-bold text-gray-900 leading-none">{stats.approved}</span>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Lulus</span>
                    </div>

                    {/* Amount Stat */}
                    <div className="min-w-[140px] flex-1 bg-white p-3 rounded-2xl border border-blue-50 shadow-sm flex flex-col items-center justify-center text-center gap-1 shrink-0">
                        <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600 mb-1">
                            <DollarSign size={16} />
                        </div>
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-xs font-medium text-gray-400">BND</span>
                            <span className="text-xl font-bold text-gray-900 leading-none">{stats.totalApprovedAmount.toFixed(0)}</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Jumlah</span>
                    </div>

                    {/* Hours Stat */}
                    <div className="min-w-[140px] flex-1 bg-white p-3 rounded-2xl border border-purple-50 shadow-sm flex flex-col items-center justify-center text-center gap-1 shrink-0">
                        <div className="bg-purple-50 p-1.5 rounded-lg text-purple-600 mb-1">
                            <Briefcase size={16} />
                        </div>
                        <span className="text-xl font-bold text-gray-900 leading-none">{stats.totalHours.toFixed(0)}h</span>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Jam OT</span>
                    </div>
                </div>

                {/* Modern Filter Pills */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
                    {(['all', 'pending', 'approved', 'rejected', 'paid'] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border",
                                filterStatus === status
                                    ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                            )}
                        >
                            {status === 'all' ? 'Semua' :
                                status === 'pending' ? 'Menunggu' :
                                    status === 'approved' ? 'Diluluskan' :
                                        status === 'rejected' ? 'Ditolak' : 'Dibayar'}
                        </button>
                    ))}
                </div>

                {/* Claims List - Modern Cards */}
                <div className="space-y-3">
                    <AnimatePresence>
                        {filteredClaims.length > 0 ? (
                            filteredClaims.map((claim, index) => (
                                <motion.div
                                    key={claim.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Date Badge */}
                                        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 text-gray-600 shrink-0">
                                            <span className="text-[10px] font-bold uppercase tracking-wider leading-none mb-0.5">
                                                {new Date(claim.date).toLocaleDateString('ms-MY', { month: 'short' })}
                                            </span>
                                            <span className="text-lg font-bold leading-none">
                                                {new Date(claim.date).getDate()}
                                            </span>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-gray-900 text-sm">
                                                    OT: {claim.startTime} - {claim.endTime}
                                                </h3>
                                                {claim.status === 'pending' && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                                                {claim.status === 'approved' && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                                            </div>
                                            <p className="text-xs text-gray-500 line-clamp-1 italic">"{claim.reason}"</p>

                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg">
                                                    {claim.hoursWorked.toFixed(1)} Jam
                                                </span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/5 text-primary rounded-lg border border-primary/10">
                                                    BND {claim.totalAmount.toFixed(2)}
                                                </span>
                                            </div>

                                            {claim.rejectionReason && (
                                                <div className="mt-2 text-[10px] text-red-500 bg-red-50 px-2 py-1 rounded-lg border border-red-100">
                                                    Rejected: {claim.rejectionReason}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end sm:border-l sm:border-gray-100 sm:pl-4">
                                        {/* Status Badge */}
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                            claim.status === 'pending' ? "bg-amber-50 text-amber-600" :
                                                claim.status === 'approved' ? "bg-emerald-50 text-emerald-600" :
                                                    claim.status === 'rejected' ? "bg-red-50 text-red-600" :
                                                        "bg-blue-50 text-blue-600"
                                        )}>
                                            {claim.status === 'pending' ? 'Processing' :
                                                claim.status === 'approved' ? 'Approved' :
                                                    claim.status === 'rejected' ? 'Rejected' : 'Paid'}
                                        </span>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <div className="bg-gray-50 p-4 rounded-full mb-3">
                                    <FileText size={24} className="text-gray-300" />
                                </div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-1">Tiada Rekod</h3>
                                <p className="text-xs text-gray-400 max-w-[200px]">
                                    Belum ada tuntutan OT untuk status pilihan ini.
                                </p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Add OT Claim Modal */}
                <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title="Tuntutan OT Baru"
                    maxWidth="500px"
                >
                    <div className="space-y-4">
                        <div className="form-group">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Tarikh OT</label>
                            <input
                                type="date"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
                                value={formData.date}
                                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Masa Mula</label>
                                <input
                                    type="time"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Masa Tamat</label>
                                <input
                                    type="time"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Sebab OT</label>
                            <textarea
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                                rows={3}
                                value={formData.reason}
                                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                                placeholder="Contoh: Kena siapkan order untuk event..."
                            />
                        </div>

                        {/* Summary Card */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/50">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Ringkasan Tuntutan</h4>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-600">Jam Bekerja</span>
                                <span className="text-sm font-bold text-gray-900">{hoursWorked.toFixed(1)} jam</span>
                            </div>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm text-gray-600">Kadar Gandaan</span>
                                <span className="text-sm font-bold text-gray-900">{formData.multiplier}x</span>
                            </div>
                            <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                                <span className="text-sm font-bold text-gray-900">Anggaran Bayaran</span>
                                <span className="text-lg font-bold text-primary">BND {totalAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 active:scale-95 transition-all"
                                onClick={() => setShowModal(false)}
                            >
                                Batal
                            </button>
                            <button
                                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                onClick={handleSubmit}
                                disabled={isProcessing || hoursWorked <= 0 || !formData.reason.trim()}
                            >
                                {isProcessing ? <LoadingSpinner size="sm" /> : 'Hantar Tuntutan'}
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </StaffLayout>
    );
}
