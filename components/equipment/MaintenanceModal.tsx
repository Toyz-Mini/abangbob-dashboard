import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { Equipment, MaintenanceLog, MaintenanceSchedule } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';

interface MaintenanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    equipment: Equipment;
    onSaveLog: (log: Omit<MaintenanceLog, 'id'>) => void;
    onSaveSchedule: (schedule: Omit<MaintenanceSchedule, 'id'>) => void;
    existingSchedule?: MaintenanceSchedule;
    currentUser: { id: string; name: string };
}

type TabType = 'log' | 'schedule';

export default function MaintenanceModal({
    isOpen,
    onClose,
    equipment,
    onSaveLog,
    onSaveSchedule,
    existingSchedule,
    currentUser
}: MaintenanceModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>('log');
    const [isProcessing, setIsProcessing] = useState(false);

    // Log Form State
    const [logForm, setLogForm] = useState({
        type: 'routine' as MaintenanceLog['type'],
        notes: '',
        cost: 0,
        performedAt: new Date().toISOString().split('T')[0],
    });

    // Schedule Form State
    const [scheduleForm, setScheduleForm] = useState({
        taskName: '',
        frequencyDays: 30,
        nextDue: '',
        assignedRole: 'Staff',
    });

    useEffect(() => {
        if (existingSchedule) {
            setActiveTab('schedule');
            setScheduleForm({
                taskName: existingSchedule.taskName,
                frequencyDays: existingSchedule.frequencyDays,
                nextDue: existingSchedule.nextDue,
                assignedRole: existingSchedule.assignedRole || 'Staff',
            });
        } else {
            // Reset if no schedule passed
            setScheduleForm({
                taskName: '',
                frequencyDays: 30,
                nextDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                assignedRole: 'Staff',
            });
        }
    }, [existingSchedule, isOpen]);

    const handleSubmitLog = async () => {
        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

        onSaveLog({
            equipmentId: equipment.id,
            type: logForm.type,
            performedBy: currentUser.id,
            performedByName: currentUser.name,
            performedAt: new Date(logForm.performedAt).toISOString(),
            notes: logForm.notes,
            cost: Number(logForm.cost),
            status: 'completed',
        });

        setIsProcessing(false);
        onClose();
        // Reset form
        setLogForm({
            type: 'routine',
            notes: '',
            cost: 0,
            performedAt: new Date().toISOString().split('T')[0],
        });
    };

    const handleSubmitSchedule = async () => {
        if (!scheduleForm.taskName) return;

        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 500));

        onSaveSchedule({
            equipmentId: equipment.id,
            taskName: scheduleForm.taskName,
            frequencyDays: Number(scheduleForm.frequencyDays),
            nextDue: scheduleForm.nextDue,
            assignedRole: scheduleForm.assignedRole,
            isActive: true,
        });

        setIsProcessing(false);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Maintenance: ${equipment.name}`}
            maxWidth="500px"
        >
            <div className="flex gap-2 mb-4 border-b border-gray-200 pb-2">
                <button
                    className={`flex-1 pb-2 text-center font-medium ${activeTab === 'log' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('log')}
                >
                    Rekod Servis
                </button>
                <button
                    className={`flex-1 pb-2 text-center font-medium ${activeTab === 'schedule' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('schedule')}
                >
                    Jadual Rutin
                </button>
            </div>

            {activeTab === 'log' && (
                <div className="space-y-4">
                    <div className="form-group">
                        <label className="form-label">Jenis Servis</label>
                        <select
                            className="form-input"
                            value={logForm.type}
                            onChange={(e) => setLogForm({ ...logForm, type: e.target.value as MaintenanceLog['type'] })}
                        >
                            <option value="routine">Rutin (Cuci/Check)</option>
                            <option value="repair">Repair (Rosak)</option>
                            <option value="issue">Report Masalah</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Tarikh</label>
                        <input
                            type="date"
                            className="form-input"
                            value={logForm.performedAt}
                            onChange={(e) => setLogForm({ ...logForm, performedAt: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Catatan / Laporan</label>
                        <textarea
                            className="form-input"
                            rows={3}
                            value={logForm.notes}
                            onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                            placeholder="Apa yang dibuat?..."
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Kos (Jika ada)</label>
                        <div className="input-group">
                            <span className="input-group-text">BND</span>
                            <input
                                type="number"
                                className="form-input"
                                value={logForm.cost}
                                onChange={(e) => setLogForm({ ...logForm, cost: Number(e.target.value) })}
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>

                    <button
                        className="btn btn-primary w-full mt-4"
                        onClick={handleSubmitLog}
                        disabled={isProcessing}
                    >
                        {isProcessing ? <LoadingSpinner size="sm" /> : 'Simpan Rekod'}
                    </button>
                </div>
            )}

            {activeTab === 'schedule' && (
                <div className="space-y-4">
                    <div className="form-group">
                        <label className="form-label">Nama Tugasan</label>
                        <input
                            type="text"
                            className="form-input"
                            value={scheduleForm.taskName}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, taskName: e.target.value })}
                            placeholder="Contoh: Servis Aircond"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Kekerapan (Hari)</label>
                        <input
                            type="number"
                            className="form-input"
                            value={scheduleForm.frequencyDays}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, frequencyDays: Number(e.target.value) })}
                            placeholder="30"
                        />
                        <small className="text-gray-500">Setiap berapa hari perlu buat?</small>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Next Due Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={scheduleForm.nextDue}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, nextDue: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Ditugaskan Kepada</label>
                        <select
                            className="form-input"
                            value={scheduleForm.assignedRole}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, assignedRole: e.target.value })}
                        >
                            <option value="Staff">General Staff</option>
                            <option value="Manager">Manager Only</option>
                            <option value="Technician">External Technician</option>
                        </select>
                    </div>

                    <button
                        className="btn btn-primary w-full mt-4"
                        onClick={handleSubmitSchedule}
                        disabled={isProcessing || !scheduleForm.taskName}
                    >
                        {isProcessing ? <LoadingSpinner size="sm" /> : 'Simpan Jadual'}
                    </button>
                </div>
            )}
        </Modal>
    );
}
