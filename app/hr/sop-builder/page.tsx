'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, GripVertical, CheckCircle, AlertCircle } from 'lucide-react';
import { MOCK_SOP_TEMPLATES, MOCK_SOP_STEPS } from '@/lib/staff-portal-data';
import { SOPTemplate, SOPStep } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import { motion } from 'framer-motion';

export default function SOPBuilderPage() {
    const [templates, setTemplates] = useState<SOPTemplate[]>(MOCK_SOP_TEMPLATES);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [steps, setSteps] = useState<SOPStep[]>([]);

    // Create New Mock
    const handleCreateTemplate = () => {
        const newTemplate: SOPTemplate = {
            id: `sop_${Date.now()}`,
            title: 'New Checklist',
            shiftType: 'morning',
            targetRole: ['Staff'],
            isActive: true,
            createdAt: new Date().toISOString()
        };
        setTemplates([...templates, newTemplate]);
        setSelectedTemplateId(newTemplate.id);
        setSteps([]);
    };

    useEffect(() => {
        if (selectedTemplateId) {
            setSteps(MOCK_SOP_STEPS[selectedTemplateId] || []);
        }
    }, [selectedTemplateId]);

    const handleCreateStep = () => {
        if (!selectedTemplateId) return;
        const newStep: SOPStep = {
            id: `step_${Date.now()}`,
            templateId: selectedTemplateId,
            title: 'New Task',
            stepOrder: steps.length + 1,
            isRequired: true,
            requiresPhoto: false,
            requiresValue: false,
            valueType: 'boolean',
            description: '',
            createdAt: new Date().toISOString()
        };
        setSteps([...steps, newStep]);
    };

    const updateStep = (id: string, updates: Partial<SOPStep>) => {
        setSteps(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const deleteStep = (id: string) => {
        setSteps(prev => prev.filter(s => s.id !== id));
    };

    const saveChanges = () => {
        // In real app, sync to Supabase here
        alert('Template saved successfully!');
        // Update Mock
        MOCK_SOP_STEPS[selectedTemplateId!] = steps;
        const tmpl = templates.find(t => t.id === selectedTemplateId);
        if (tmpl) {
            // Sync template updates too if any
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar isOpen={true} />
            <div className="flex-1 flex overflow-hidden">

                {/* Sidebar: List of Templates */}
                <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="font-bold text-lg">SOP Templates</h2>
                        <button onClick={handleCreateTemplate} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200">
                            <Plus size={18} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {templates.map(t => (
                            <div
                                key={t.id}
                                onClick={() => setSelectedTemplateId(t.id)}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedTemplateId === t.id ? 'bg-blue-50 border-blue-500 border' : 'hover:bg-gray-100'}`}
                            >
                                <div className="font-medium text-gray-900">{t.title}</div>
                                <div className="text-xs text-gray-500 uppercase mt-1">{t.shiftType} Shift</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Editor */}
                <div className="flex-1 overflow-y-auto p-8">
                    {selectedTemplateId ? (
                        <div className="max-w-4xl mx-auto">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold">Edit Steps</h1>
                                    <p className="text-gray-500">Manage checklist items for {templates.find(t => t.id === selectedTemplateId)?.title}</p>
                                </div>
                                <button
                                    onClick={saveChanges}
                                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                                >
                                    <Save size={18} /> Simpan Perubahan
                                </button>
                            </div>

                            <div className="space-y-4">
                                {steps.map((step, index) => (
                                    <motion.div
                                        key={step.id}
                                        layout
                                        className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex gap-4 items-start group"
                                    >
                                        <div className="mt-3 text-gray-400 cursor-move">
                                            <GripVertical size={20} />
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <input
                                                type="text"
                                                value={step.title}
                                                onChange={(e) => updateStep(step.id, { title: e.target.value })}
                                                className="w-full text-lg font-bold bg-transparent border-none focus:ring-0 p-0"
                                                placeholder="Enter step title..."
                                            />
                                            <input
                                                type="text"
                                                value={step.description || ''}
                                                onChange={(e) => updateStep(step.id, { description: e.target.value })}
                                                className="w-full text-sm text-gray-500 bg-transparent border-none focus:ring-0 p-0"
                                                placeholder="Description (optional)"
                                            />

                                            {/* Config Chips */}
                                            <div className="flex gap-2 flex-wrap pt-2">
                                                <label className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm cursor-pointer border ${step.requiresPhoto ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={step.requiresPhoto}
                                                        onChange={(e) => updateStep(step.id, { requiresPhoto: e.target.checked })}
                                                        className="hidden"
                                                    />
                                                    📸 Photo Wajib
                                                </label>

                                                <label className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm cursor-pointer border ${step.requiresValue ? 'bg-orange-100 border-orange-300 text-orange-700' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={step.requiresValue}
                                                        onChange={(e) => updateStep(step.id, { requiresValue: e.target.checked })}
                                                        className="hidden"
                                                    />
                                                    🔢 Input Nilai
                                                </label>

                                                {step.requiresValue && (
                                                    <select
                                                        value={step.valueType}
                                                        onChange={(e) => updateStep(step.id, { valueType: e.target.value as any })}
                                                        className="text-sm border-gray-300 rounded-md py-1"
                                                    >
                                                        <option value="number">Nombor</option>
                                                        <option value="currency">Duit (RM)</option>
                                                        <option value="temperature">Suhu (°C)</option>
                                                        <option value="text">Teks</option>
                                                    </select>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteStep(step.id)}
                                            className="p-2 text-gray-300 hover:text-red-500 rounded-lg"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </motion.div>
                                ))}

                                <button
                                    onClick={handleCreateStep}
                                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2 font-medium"
                                >
                                    <Plus size={20} /> Add New Step
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <p className="text-lg">Select a template to edit</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
