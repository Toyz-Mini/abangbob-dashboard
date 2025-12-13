'use client';

import { useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStaffPortal, useStaff } from '@/lib/store';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Sun,
  Moon,
  Calendar
} from 'lucide-react';

// Demo: Using staff ID 2 (Siti Nurhaliza) as the logged-in user
const CURRENT_STAFF_ID = '2';

export default function ChecklistHistoryPage() {
  const { staff, isInitialized } = useStaff();
  const { checklistCompletions, shifts } = useStaffPortal();
  
  const currentStaff = staff.find(s => s.id === CURRENT_STAFF_ID);

  // Get my checklist history
  const myChecklists = useMemo(() => {
    return checklistCompletions
      .filter(c => c.staffId === CURRENT_STAFF_ID)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [checklistCompletions]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, typeof myChecklists> = {};
    myChecklists.forEach(checklist => {
      if (!groups[checklist.date]) {
        groups[checklist.date] = [];
      }
      groups[checklist.date].push(checklist);
    });
    return groups;
  }, [myChecklists]);

  if (!isInitialized || !currentStaff) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link href="/staff-portal/checklist" className="btn btn-outline btn-sm" style={{ marginBottom: '0.5rem' }}>
            <ArrowLeft size={16} />
            Kembali
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem' }}>
            Sejarah Checklist
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Rekod checklist yang telah dihantar
          </p>
        </div>

        {/* History List */}
        {Object.keys(groupedByDate).length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {Object.entries(groupedByDate).map(([date, checklists]) => (
              <div key={date} className="card">
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={18} />
                    {new Date(date).toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {checklists.map(checklist => {
                    const shift = shifts.find(s => s.id === checklist.shiftId);
                    const completedItems = checklist.items.filter(i => i.isCompleted).length;
                    const totalItems = checklist.items.length;

                    return (
                      <div 
                        key={checklist.id}
                        style={{ 
                          padding: '1rem',
                          borderRadius: 'var(--radius-md)',
                          background: checklist.status === 'completed' ? '#dcfce7' : '#fef3c7',
                          border: `1px solid ${checklist.status === 'completed' ? '#86efac' : '#fcd34d'}`
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {checklist.type === 'opening' ? (
                              <Sun size={24} color="#f59e0b" />
                            ) : (
                              <Moon size={24} color="#8b5cf6" />
                            )}
                            <div>
                              <div style={{ fontWeight: 600 }}>
                                {checklist.type === 'opening' ? 'Opening' : 'Closing'} Checklist
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {shift?.name && `Shift ${shift.name}`}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            {checklist.status === 'completed' ? (
                              <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <CheckCircle size={12} />
                                Selesai
                              </span>
                            ) : (
                              <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <XCircle size={12} />
                                Tidak Lengkap
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)' }}>
                            <Clock size={14} />
                            Mula: {new Date(checklist.startedAt).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {checklist.completedAt && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)' }}>
                              <CheckCircle size={14} />
                              Siap: {new Date(checklist.completedAt).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                          <div style={{ color: 'var(--text-secondary)' }}>
                            {completedItems}/{totalItems} items
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div style={{ marginTop: '0.75rem' }}>
                          <div style={{ 
                            height: '4px', 
                            background: 'rgba(0,0,0,0.1)', 
                            borderRadius: '2px',
                            overflow: 'hidden'
                          }}>
                            <div style={{ 
                              height: '100%', 
                              width: `${(completedItems / totalItems) * 100}%`,
                              background: checklist.status === 'completed' ? 'var(--success)' : 'var(--warning)'
                            }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <Calendar size={48} color="var(--gray-400)" style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>
              Tiada rekod checklist
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

