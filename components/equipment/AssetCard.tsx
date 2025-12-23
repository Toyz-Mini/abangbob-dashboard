import React from 'react';
import { Equipment } from '@/lib/types';
import { Edit2, Trash2, Calendar, AlertTriangle, CheckCircle, Wrench, Thermometer } from 'lucide-react';

interface AssetCardProps {
    equipment: Equipment;
    onEdit: (equipment: Equipment) => void;
    onDelete: (equipment: Equipment) => void;
    onViewSchedule: (equipment: Equipment) => void;
}

export default function AssetCard({ equipment, onEdit, onDelete, onViewSchedule }: AssetCardProps) {
    const getStatusColor = (status: Equipment['status']) => {
        switch (status) {
            case 'good': return 'var(--success)';
            case 'warning': return 'var(--warning)';
            case 'critical': return 'var(--danger)';
            case 'maintenance': return 'var(--info)';
            case 'broken': return 'var(--danger)';
            case 'retired': return 'var(--gray-400)';
            default: return 'var(--gray-400)';
        }
    };

    const statusLabel = {
        good: 'BAIK',
        warning: 'AMARAN',
        critical: 'KRITIKAL',
        maintenance: 'SERVIS',
        broken: 'ROSAK',
        retired: 'LUPUS'
    };

    const getIcon = (type: Equipment['type']) => {
        switch (type) {
            case 'fridge': return <Thermometer className="text-blue-500" />;
            case 'freezer': return <Thermometer className="text-cyan-600" />;
            case 'ac': return <Wrench className="text-sky-400" />;
            case 'grill': return <Thermometer className="text-orange-500" />;
            case 'fryer': return <Thermometer className="text-yellow-500" />;
            case 'pos': return <Calendar className="text-purple-500" />;
            default: return <Wrench className="text-gray-400" />;
        }
    };

    return (
        <div className="card hover:shadow-lg transition-shadow duration-200">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gray-100 rounded-lg">
                        {getIcon(equipment.type)}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{equipment.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{equipment.type} • {equipment.location}</p>
                    </div>
                </div>
                <span
                    className="px-3 py-1 rounded-full text-xs font-bold text-white uppercase"
                    style={{ backgroundColor: getStatusColor(equipment.status) }}
                >
                    {statusLabel[equipment.status]}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                    <p className="text-gray-500 mb-1">Model</p>
                    <p className="font-medium">{equipment.modelNumber || '-'}</p>
                </div>
                <div>
                    <p className="text-gray-500 mb-1">Serial No.</p>
                    <p className="font-medium truncate" title={equipment.serialNumber}>{equipment.serialNumber || '-'}</p>
                </div>
                {equipment.warrantyExpiry && (
                    <div className="col-span-2">
                        <p className="text-gray-500 mb-1">Warranty Expiry</p>
                        <p className={`font-medium ${new Date(equipment.warrantyExpiry) < new Date() ? 'text-red-500' : 'text-green-600'}`}>
                            {new Date(equipment.warrantyExpiry).toLocaleDateString()}
                        </p>
                    </div>
                )}
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                    onClick={() => onViewSchedule(equipment)}
                    className="btn btn-outline btn-sm flex-1 flex items-center justify-center gap-2"
                >
                    <Calendar size={14} />
                    Jadual
                </button>
                <button
                    onClick={() => onEdit(equipment)}
                    className="btn btn-outline btn-sm px-3"
                    title="Edit"
                >
                    <Edit2 size={14} />
                </button>
                <button
                    onClick={() => onDelete(equipment)}
                    className="btn btn-outline btn-sm px-3 text-red-500 hover:text-red-600 hover:border-red-500"
                    title="Padam"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}
