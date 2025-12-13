'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStore } from '@/lib/store';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AuditLog, AuditAction, AuditModule, generateMockAuditLogs, ACTION_LABELS, MODULE_LABELS, ACTION_COLORS } from '@/lib/audit-data';
import { 
  FileText, 
  Filter, 
  Search,
  Calendar,
  User,
  Download,
  RefreshCw,
  Clock,
  Shield,
  AlertCircle,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import { exportToCSV } from '@/lib/services/excel-export';

export default function AuditLogPage() {
  const { isInitialized } = useStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<AuditAction | 'all'>('all');
  const [filterModule, setFilterModule] = useState<AuditModule | 'all'>('all');
  const [filterDate, setFilterDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load audit logs
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      const storedLogs = localStorage.getItem('abangbob_audit_logs');
      if (storedLogs) {
        setLogs(JSON.parse(storedLogs));
      } else {
        const mockLogs = generateMockAuditLogs();
        setLogs(mockLogs);
        localStorage.setItem('abangbob_audit_logs', JSON.stringify(mockLogs));
      }
      setIsLoading(false);
    }, 500);
  }, []);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = searchQuery === '' || 
        log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesAction = filterAction === 'all' || log.action === filterAction;
      const matchesModule = filterModule === 'all' || log.module === filterModule;
      const matchesDate = filterDate === '' || log.timestamp.startsWith(filterDate);
      
      return matchesSearch && matchesAction && matchesModule && matchesDate;
    });
  }, [logs, searchQuery, filterAction, filterModule, filterDate]);

  // Stats
  const todayLogs = logs.filter(l => l.timestamp.startsWith(new Date().toISOString().split('T')[0]));
  const actionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    todayLogs.forEach(l => {
      counts[l.action] = (counts[l.action] || 0) + 1;
    });
    return counts;
  }, [todayLogs]);

  const handleExport = () => {
    exportToCSV({
      filename: 'audit-log',
      columns: [
        { key: 'timestamp', label: 'Masa', format: 'datetime' },
        { key: 'userName', label: 'Pengguna' },
        { key: 'action', label: 'Tindakan' },
        { key: 'module', label: 'Modul' },
        { key: 'details', label: 'Butiran' },
        { key: 'ipAddress', label: 'IP Address' },
      ],
      data: filteredLogs.map(l => ({
        ...l,
        action: ACTION_LABELS[l.action],
        module: MODULE_LABELS[l.module],
      })),
    });
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      const mockLogs = generateMockAuditLogs();
      setLogs(mockLogs);
      localStorage.setItem('abangbob_audit_logs', JSON.stringify(mockLogs));
      setIsLoading(false);
    }, 500);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} minit lepas`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} jam lepas`;
    
    return date.toLocaleString('ms-MY', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={28} />
              Audit Log
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Rekod semua aktiviti dan perubahan dalam sistem
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button className="btn btn-primary" onClick={handleExport}>
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="content-grid cols-4 mb-lg">
          <StatCard
            label="Total Log Hari Ini"
            value={todayLogs.length}
            change="aktiviti direkodkan"
            changeType="neutral"
            icon={FileText}
            gradient="primary"
          />
          <StatCard
            label="Tambah"
            value={actionCounts.create || 0}
            change="rekod baharu"
            changeType="positive"
            icon={Plus}
            gradient="success"
          />
          <StatCard
            label="Kemaskini"
            value={actionCounts.update || 0}
            change="pengubahsuaian"
            changeType="neutral"
            icon={Edit}
          />
          <StatCard
            label="Padam"
            value={actionCounts.delete || 0}
            change="rekod dibuang"
            changeType={actionCounts.delete > 0 ? "negative" : "neutral"}
            icon={Trash2}
            gradient="warning"
          />
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 2, minWidth: '200px' }}>
              <label className="form-label">Cari</label>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Cari aktiviti..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>
            
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label className="form-label">Tindakan</label>
              <select
                className="form-select"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value as AuditAction | 'all')}
              >
                <option value="all">Semua</option>
                {Object.entries(ACTION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label className="form-label">Modul</label>
              <select
                className="form-select"
                value={filterModule}
                onChange={(e) => setFilterModule(e.target.value as AuditModule | 'all')}
              >
                <option value="all">Semua</option>
                {Object.entries(MODULE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label className="form-label">Tarikh</label>
              <input
                type="date"
                className="form-input"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Log List */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Log Aktiviti</div>
            <div className="card-subtitle">{filteredLogs.length} rekod dijumpai</div>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <LoadingSpinner />
            </div>
          ) : filteredLogs.length > 0 ? (
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {filteredLogs.map((log, idx) => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    padding: '1rem',
                    borderBottom: idx < filteredLogs.length - 1 ? '1px solid var(--border-color)' : 'none',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-50)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Action Icon */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: `${ACTION_COLORS[log.action]}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: ACTION_COLORS[log.action]
                    }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        background: `${ACTION_COLORS[log.action]}20`,
                        color: ACTION_COLORS[log.action],
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {ACTION_LABELS[log.action]}
                      </span>
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--gray-100)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.7rem',
                        fontWeight: 600
                      }}>
                        {MODULE_LABELS[log.module]}
                      </span>
                    </div>
                    
                    <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{log.details}</p>
                    
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <User size={12} />
                        {log.userName}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} />
                        {formatTimestamp(log.timestamp)}
                      </span>
                      {log.ipAddress && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          IP: {log.ipAddress}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              <AlertCircle size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>Tiada log dijumpai dengan kriteria ini</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

