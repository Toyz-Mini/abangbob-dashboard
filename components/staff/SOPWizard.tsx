'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Check, ChevronRight, AlertTriangle, Upload, X } from 'lucide-react';
import { SOPTemplate, SOPStep, SOPLog } from '@/lib/types';
import * as SOPSync from '@/lib/supabase/sop-sync';
import { generateUUID } from '@/lib/utils';

interface SOPWizardProps {
    shiftType: 'morning' | 'mid' | 'night';
    staffId: string;
    onComplete: () => void;
    onCancel: () => void;
}

export default function SOPWizard({ shiftType, staffId, onComplete, onCancel }: SOPWizardProps) {
    const [template, setTemplate] = useState<SOPTemplate | null>(null);
    const [steps, setSteps] = useState<SOPStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [log, setLog] = useState<SOPLog | null>(null);

    // Form State
    const [inputValue, setInputValue] = useState<string>('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load Template on Mount
    useEffect(() => {
        loadSOP();
    }, [shiftType]);

    const loadSOP = async () => {
        setLoading(true);
        const { template, steps } = await SOPSync.getActiveSOPTemplate(shiftType);
        if (template && steps.length > 0) {
            setTemplate(template);
            setSteps(steps);
            // Start Log
            const newLog = await SOPSync.startSOPLog(template.id, staffId);
            setLog(newLog);
        }
        setLoading(false);
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const validateStep = (): boolean => {
        const step = steps[currentStepIndex];
        setError(null);

        // Value Validation
        if (step.requiresValue) {
            if (!inputValue) {
                setError('Sila masukkan nilai.');
                return false;
            }
            if (step.valueType === 'number' || step.valueType === 'currency' || step.valueType === 'temperature') {
                const num = parseFloat(inputValue);
                if (isNaN(num)) {
                    setError('Sila masukkan nombor yang sah.');
                    return false;
                }
                if (step.minValue !== undefined && num < step.minValue) {
                    setError(`Nilai terlalu rendah (Min: ${step.minValue}). Sila check semula.`);
                    return false;
                }
                if (step.maxValue !== undefined && num > step.maxValue) {
                    setError(`Nilai terlalu tinggi (Max: ${step.maxValue}). Sila check semula.`);
                    return false;
                }
            }
        }

        // Photo Validation
        if (step.requiresPhoto && !photo) {
            setError('Sila ambil gambar sebagai bukti.');
            return false;
        }

        return true;
    };

    const handleNext = async () => {
        if (!validateStep()) return;
        if (!log) return;

        setIsSubmitting(true);
        const step = steps[currentStepIndex];

        try {
            // Mock Photo URL for now (In real app, upload to storage first)
            const photoUrl = photo ? 'https://via.placeholder.com/150' : undefined;

            await SOPSync.submitSOPLogItem(log.id, step.id, inputValue, photoUrl);

            if (currentStepIndex < steps.length - 1) {
                // Next Step
                setCurrentStepIndex(prev => prev + 1);
                setInputValue('');
                setPhoto(null);
                setPhotoPreview(null);
            } else {
                // Finish
                await SOPSync.completeSOPLog(log.id);
                onComplete();
            }
        } catch (e) {
            setError('Gagal simpan data. Sila cuba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center animate-pulse">Loading Mission...</div>;
    }

    if (!template) {
        return (
            <div className="p-8 text-center text-gray-500">
                <p>Tiada checklist aktif untuk shift ini.</p>
                <button onClick={onCancel} className="mt-4 px-4 py-2 bg-gray-200 rounded">Tutup</button>
            </div>
        );
    }

    const currentStep = steps[currentStepIndex];
    const progress = ((currentStepIndex) / steps.length) * 100;

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider">{template.shiftType} MISSION</h2>
                        <div className="text-xs text-gray-500">Step {currentStepIndex + 1} of {steps.length}</div>
                    </div>
                    {/* Don't allow closing easily, but maybe an emergency exit */}
                    <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-gray-200 w-full">
                    <motion.div
                        className="h-full bg-green-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center text-center">

                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={currentStep.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full flex-1 flex flex-col items-center"
                        >
                            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full inline-block text-blue-600 dark:text-blue-400">
                                {/* Dynamic Icons based on title could go here */}
                                <Check size={32} />
                            </div>

                            <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{currentStep.title}</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-8">{currentStep.description}</p>

                            {/* Inputs */}
                            <div className="w-full space-y-6">

                                {/* Value Input */}
                                {currentStep.requiresValue && (
                                    <div className="text-left">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {currentStep.valueType === 'temperature' ? 'Suhu (°C)' :
                                                currentStep.valueType === 'currency' ? 'Jumlah (RM)' : 'Nota / Nilai'}
                                        </label>
                                        <input
                                            type={currentStep.valueType === 'text' ? 'text' : 'number'}
                                            className="w-full text-center text-2xl p-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-0 font-mono"
                                            placeholder={currentStep.valueType === 'currency' ? '0.00' : '0'}
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                )}

                                {/* Photo Input */}
                                {currentStep.requiresPhoto && (
                                    <div className="text-left w-full">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Bukti Bergambar 📸
                                        </label>

                                        <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 h-48 flex flex-col items-center justify-center overflow-hidden hover:bg-gray-100 transition-colors cursor-pointer group">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                onChange={handlePhotoUpload}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />

                                            {photoPreview ? (
                                                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-center p-4">
                                                    <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:text-gray-600" />
                                                    <p className="text-sm text-gray-500">Tap untuk ambil gambar</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Error Message */}
                                {error && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm justify-center animate-shake">
                                        <AlertTriangle size={16} />
                                        {error}
                                    </div>
                                )}

                            </div>

                        </motion.div>
                    </AnimatePresence>

                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleNext}
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Saving...' : currentStepIndex === steps.length - 1 ? 'Selesai Mission 🎉' : 'Seterusnya'}
                        {!isSubmitting && <ChevronRight />}
                    </button>
                </div>

            </div>
        </div>
    );
}
