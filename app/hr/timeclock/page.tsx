'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStaff } from '@/lib/store';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Clock, LogIn, LogOut, User, CheckCircle, XCircle, History } from 'lucide-react';

export default function TimeClockPage() {
  const { staff, attendance, clockIn, clockOut, getStaffAttendanceToday, isInitialized } = useStaff();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeStaff = staff.filter(s => s.status === 'active');
  const today = new Date().toISOString().split('T')[0];

  const getStaffStatus = (staffId: string) => {
    const record = getStaffAttendanceToday(staffId);
    if (record?.clockInTime && !record?.clockOutTime) {
      return { status: 'on-duty', clockIn: record.clockInTime, clockOut: null };
    }
    if (record?.clockInTime && record?.clockOutTime) {
      return { status: 'completed', clockIn: record.clockInTime, clockOut: record.clockOutTime };
    }
    return { status: 'not-clocked', clockIn: null, clockOut: null };
  };

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
    }
  };

  const handlePinDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handlePinClear = () => {
    setPin('');
  };

  const handleClockAction = async () => {
    if (!selectedStaffId || pin.length !== 4) return;

    setIsProcessing(true);
    setResultMessage(null);

    await new Promise(resolve => setTimeout(resolve, 800));

    const staffStatus = getStaffStatus(selectedStaffId);

    let result;
    if (staffStatus.status === 'not-clocked') {
      // Clock In
      result = clockIn(selectedStaffId, pin);
    } else if (staffStatus.status === 'on-duty') {
      // Clock Out - verify PIN first
      const staffMember = staff.find(s => s.id === selectedStaffId);
      if (staffMember?.pin !== pin) {
        result = { success: false, message: 'PIN salah' };
      } else {
        result = clockOut(selectedStaffId);
      }
    } else {
      result = { success: false, message: 'Sudah selesai bekerja hari ini' };
    }

    setResultMessage({
      type: result.success ? 'success' : 'error',
      message: result.message,
    });

    setIsProcessing(false);
    setPin('');

    // Auto clear result after 3 seconds
    setTimeout(() => {
      setResultMessage(null);
      if (result.success) {
        setSelectedStaffId(null);
      }
    }, 3000);
  };

  const getTodayAttendance = () => {
    return attendance
      .filter(a => a.date === today)
      .map(a => {
        const staffMember = staff.find(s => s.id === a.staffId);
        return { ...a, staffName: staffMember?.name || 'Unknown', staffRole: staffMember?.role || '' };
      })
      .sort((a, b) => (b.clockInTime || '').localeCompare(a.clockInTime || ''));
  };

  if (!isInitialized) {
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Clock In / Clock Out
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Rekod kehadiran staf
            </p>
          </div>
          <button className="btn btn-outline" onClick={() => setShowHistoryModal(true)}>
            <History size={18} />
            Sejarah Hari Ini
          </button>
        </div>

        {/* Current Time Display */}
        <div className="card" style={{ 
          textAlign: 'center', 
          marginBottom: '2rem',
          background: 'var(--gradient-primary)',
          color: 'white'
        }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>
            {currentTime.toLocaleDateString('ms-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ fontSize: '4rem', fontWeight: 700, fontFamily: 'monospace' }}>
            {currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '2rem' }}>
          {/* Staff Selection */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={20} />
                Pilih Staf
              </div>
              <div className="card-subtitle">{activeStaff.length} staf aktif</div>
            </div>

            <div style={{ display: 'grid', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
              {activeStaff.map(staffMember => {
                const status = getStaffStatus(staffMember.id);
                const isSelected = selectedStaffId === staffMember.id;

                return (
                  <button
                    key={staffMember.id}
                    onClick={() => {
                      setSelectedStaffId(staffMember.id);
                      setPin('');
                      setResultMessage(null);
                    }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--gray-200)',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-primary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{staffMember.name}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{staffMember.role}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {status.status === 'on-duty' && (
                        <>
                          <span className="badge badge-success">On Duty</span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            In: {status.clockIn}
                          </div>
                        </>
                      )}
                      {status.status === 'completed' && (
                        <>
                          <span className="badge badge-info">Selesai</span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            {status.clockIn} - {status.clockOut}
                          </div>
                        </>
                      )}
                      {status.status === 'not-clocked' && (
                        <span className="badge badge-warning">Belum Clock In</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PIN Pad */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} />
                Masukkan PIN
              </div>
              <div className="card-subtitle">
                {selectedStaffId 
                  ? staff.find(s => s.id === selectedStaffId)?.name 
                  : 'Sila pilih staf dahulu'}
              </div>
            </div>

            {!selectedStaffId ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                <User size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <p>Sila pilih staf dari senarai di sebelah</p>
              </div>
            ) : (
              <>
                {/* Result Message */}
                {resultMessage && (
                  <div 
                    className={`alert ${resultMessage.type === 'success' ? 'alert-success' : 'alert-danger'}`}
                    style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {resultMessage.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                    {resultMessage.message}
                  </div>
                )}

                {/* PIN Display */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: '0.75rem', 
                  marginBottom: '1.5rem' 
                }}>
                  {[0, 1, 2, 3].map(i => (
                    <div
                      key={i}
                      style={{
                        width: '50px',
                        height: '50px',
                        border: '2px solid var(--gray-300)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        background: pin[i] ? 'var(--gray-100)' : 'white',
                      }}
                    >
                      {pin[i] ? '●' : ''}
                    </div>
                  ))}
                </div>

                {/* Number Pad */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '0.5rem',
                  maxWidth: '300px',
                  margin: '0 auto'
                }}>
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(key => (
                    <button
                      key={key}
                      onClick={() => {
                        if (key === 'C') handlePinClear();
                        else if (key === '⌫') handlePinDelete();
                        else handlePinInput(key);
                      }}
                      disabled={isProcessing}
                      style={{
                        padding: '1.25rem',
                        fontSize: '1.5rem',
                        fontWeight: 600,
                        border: '1px solid var(--gray-200)',
                        borderRadius: 'var(--radius-md)',
                        background: key === 'C' ? '#fee2e2' : key === '⌫' ? '#fef3c7' : 'var(--bg-primary)',
                        color: key === 'C' ? 'var(--danger)' : key === '⌫' ? 'var(--warning)' : 'var(--text-primary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--gray-100)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = key === 'C' ? '#fee2e2' : key === '⌫' ? '#fef3c7' : 'var(--bg-primary)';
                      }}
                    >
                      {key}
                    </button>
                  ))}
                </div>

                {/* Action Button */}
                {(() => {
                  const status = getStaffStatus(selectedStaffId);
                  const isClockIn = status.status === 'not-clocked';
                  const isCompleted = status.status === 'completed';

                  if (isCompleted) {
                    return (
                      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        <div className="alert alert-success">
                          Sudah selesai bekerja hari ini
                        </div>
                      </div>
                    );
                  }

                  return (
                    <button
                      onClick={handleClockAction}
                      disabled={pin.length !== 4 || isProcessing}
                      className={`btn ${isClockIn ? 'btn-primary' : 'btn-danger'}`}
                      style={{ 
                        width: '100%', 
                        marginTop: '1.5rem',
                        padding: '1rem',
                        fontSize: '1.1rem',
                      }}
                    >
                      {isProcessing ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          {isClockIn ? <LogIn size={20} /> : <LogOut size={20} />}
                          {isClockIn ? 'Clock In' : 'Clock Out'}
                        </>
                      )}
                    </button>
                  );
                })()}
              </>
            )}
          </div>
        </div>

        {/* Today's Attendance Summary */}
        <div className="card" style={{ marginTop: '2rem' }}>
          <div className="card-header">
            <div className="card-title">Ringkasan Kehadiran Hari Ini</div>
            <div className="card-subtitle">{today}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: '1rem' }}>
            <div style={{ 
              padding: '1rem', 
              background: 'var(--gray-100)', 
              borderRadius: 'var(--radius-md)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>
                {activeStaff.length}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Staf Aktif</div>
            </div>

            <div style={{ 
              padding: '1rem', 
              background: '#d1fae5', 
              borderRadius: 'var(--radius-md)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>
                {activeStaff.filter(s => getStaffStatus(s.id).status === 'on-duty').length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#065f46' }}>Sedang Bekerja</div>
            </div>

            <div style={{ 
              padding: '1rem', 
              background: '#dbeafe', 
              borderRadius: 'var(--radius-md)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1e40af' }}>
                {activeStaff.filter(s => getStaffStatus(s.id).status === 'completed').length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#1e40af' }}>Sudah Clock Out</div>
            </div>

            <div style={{ 
              padding: '1rem', 
              background: '#fef3c7', 
              borderRadius: 'var(--radius-md)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--warning)' }}>
                {activeStaff.filter(s => getStaffStatus(s.id).status === 'not-clocked').length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#92400e' }}>Belum Clock In</div>
            </div>
          </div>
        </div>

        {/* History Modal */}
        <Modal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          title="Sejarah Kehadiran Hari Ini"
          subtitle={today}
          maxWidth="600px"
        >
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {getTodayAttendance().length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Staf</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getTodayAttendance().map(record => (
                    <tr key={record.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{record.staffName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{record.staffRole}</div>
                      </td>
                      <td>{record.clockInTime || '-'}</td>
                      <td>{record.clockOutTime || '-'}</td>
                      <td>
                        {record.clockOutTime ? (
                          <span className="badge badge-info">Selesai</span>
                        ) : (
                          <span className="badge badge-success">On Duty</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                Tiada rekod kehadiran hari ini
              </p>
            )}
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <button className="btn btn-outline" onClick={() => setShowHistoryModal(false)} style={{ width: '100%' }}>
              Tutup
            </button>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
}
