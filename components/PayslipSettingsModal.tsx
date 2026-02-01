'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { Settings, Image as ImageIcon, MapPin, Building, FileText, Layout } from 'lucide-react';

export interface PayslipConfig {
    template: 'professional' | 'simple';
    showLogo: boolean;
    showCompanyInfo: boolean;
    showEmployerContributions: boolean;
    customNote: string;
}

export const DEFAULT_CONFIG: PayslipConfig = {
    template: 'professional',
    showLogo: true,
    showCompanyInfo: true,
    showEmployerContributions: false,
    customNote: ''
};

interface PayslipSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: PayslipConfig;
    onSave: (config: PayslipConfig) => void;
}

export default function PayslipSettingsModal({ isOpen, onClose, config, onSave }: PayslipSettingsModalProps) {
    const [localConfig, setLocalConfig] = useState<PayslipConfig>(config);

    useEffect(() => {
        if (isOpen) {
            setLocalConfig(config);
        }
    }, [isOpen, config]);

    const handleSave = () => {
        onSave(localConfig);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Payslip Settings"
            maxWidth="500px"
        >
            <div className="space-y-6">
                <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Layout size={14} /> Template Design
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition-all ${localConfig.template === 'professional' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200 hover:border-gray-300'}`}
                            onClick={() => setLocalConfig({ ...localConfig, template: 'professional' })}
                        >
                            <div className="w-full h-16 bg-white border border-gray-200 rounded p-1 shadow-sm flex flex-col gap-1">
                                <div className="w-4 h-4 rounded-full bg-gray-200"></div>
                                <div className="w-full h-1 bg-gray-100"></div>
                                <div className="w-full h-8 bg-gray-50 mt-1"></div>
                            </div>
                            <span className={`text-sm font-medium ${localConfig.template === 'professional' ? 'text-primary' : 'text-gray-600'}`}>Professional</span>
                        </button>

                        <button
                            className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition-all ${localConfig.template === 'simple' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200 hover:border-gray-300'}`}
                            onClick={() => setLocalConfig({ ...localConfig, template: 'simple' })}
                        >
                            <div className="w-full h-16 bg-white border border-gray-200 rounded p-1 shadow-sm flex flex-col gap-1 items-center justify-center">
                                <div className="w-16 h-8 border border-gray-100 rounded"></div>
                            </div>
                            <span className={`text-sm font-medium ${localConfig.template === 'simple' ? 'text-primary' : 'text-gray-600'}`}>Simple</span>
                        </button>
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Settings size={14} /> Display Options
                    </h4>
                    <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <ImageIcon size={16} />
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900">Show Logo</div>
                                    <div className="text-xs text-gray-500">Include company logo in header</div>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                className="toggle toggle-primary toggle-sm"
                                checked={localConfig.showLogo}
                                onChange={e => setLocalConfig({ ...localConfig, showLogo: e.target.checked })}
                            />
                        </label>

                        <label className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                                    <MapPin size={16} />
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900">Show Company Info</div>
                                    <div className="text-xs text-gray-500">Address and contact details</div>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                className="toggle toggle-primary toggle-sm"
                                checked={localConfig.showCompanyInfo}
                                onChange={e => setLocalConfig({ ...localConfig, showCompanyInfo: e.target.checked })}
                            />
                        </label>

                        <label className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                                    <Building size={16} />
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900">Employer Contributions</div>
                                    <div className="text-xs text-gray-500">Show TAP/SCP Employer portion</div>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                className="toggle toggle-primary toggle-sm"
                                checked={localConfig.showEmployerContributions}
                                onChange={e => setLocalConfig({ ...localConfig, showEmployerContributions: e.target.checked })}
                            />
                        </label>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                    <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary px-6" onClick={handleSave}>Save Settings</button>
                </div>
            </div>
        </Modal>
    );
}
