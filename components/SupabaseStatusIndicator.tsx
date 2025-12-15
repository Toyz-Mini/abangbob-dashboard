'use client';

import { useState, useEffect } from 'react';
import { 
  subscribeToConnectionState, 
  getConnectionState, 
  checkSupabaseConnection,
  ConnectionStatus 
} from '@/lib/supabase/client';
import { 
  subscribeToPendingSyncCount 
} from '@/lib/supabase-sync';
import { 
  subscribeToSyncLogs, 
  getSyncStats, 
  SyncLogEntry 
} from '@/lib/utils/sync-logger';
import { 
  Wifi, 
  WifiOff, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface SupabaseStatusIndicatorProps {
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

export default function SupabaseStatusIndicator({ 
  showDetails = false, 
  compact = false,
  className = '' 
}: SupabaseStatusIndicatorProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isConfigured, setIsConfigured] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [syncStats, setSyncStats] = useState({ errors: 0, success: 0 });
  const [recentErrors, setRecentErrors] = useState<SyncLogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Subscribe to connection state
    const unsubConnection = subscribeToConnectionState((state) => {
      setConnectionStatus(state.status);
      setIsConfigured(state.isConfigured);
      setLastError(state.lastError);
    });

    // Subscribe to pending sync count
    const unsubPending = subscribeToPendingSyncCount((count) => {
      setPendingSyncCount(count);
    });

    // Subscribe to sync logs
    const unsubLogs = subscribeToSyncLogs((logs) => {
      const stats = getSyncStats();
      setSyncStats({ errors: stats.errors, success: stats.success });
      setRecentErrors(logs.filter(l => l.status === 'error').slice(0, 5));
    });

    return () => {
      unsubConnection();
      unsubPending();
      unsubLogs();
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkSupabaseConnection();
    setIsRefreshing(false);
  };

  const getStatusIcon = () => {
    if (!isConfigured) {
      return <CloudOff size={compact ? 14 : 16} className="text-gray-400" />;
    }

    switch (connectionStatus) {
      case 'connected':
        return pendingSyncCount > 0 
          ? <Loader2 size={compact ? 14 : 16} className="text-blue-500 animate-spin" />
          : <Cloud size={compact ? 14 : 16} className="text-green-500" />;
      case 'connecting':
        return <Loader2 size={compact ? 14 : 16} className="text-blue-500 animate-spin" />;
      case 'disconnected':
        return <CloudOff size={compact ? 14 : 16} className="text-red-500" />;
      case 'offline':
        return <WifiOff size={compact ? 14 : 16} className="text-yellow-500" />;
      case 'unconfigured':
        return <CloudOff size={compact ? 14 : 16} className="text-gray-400" />;
      default:
        return <Cloud size={compact ? 14 : 16} className="text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (!isConfigured) return 'Offline Mode';

    switch (connectionStatus) {
      case 'connected':
        return pendingSyncCount > 0 ? `Syncing (${pendingSyncCount})` : 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'offline':
        return 'Network Offline';
      case 'unconfigured':
        return 'Not Configured';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
    if (!isConfigured) return 'var(--gray-400)';

    switch (connectionStatus) {
      case 'connected':
        return pendingSyncCount > 0 ? 'var(--primary)' : 'var(--success)';
      case 'connecting':
        return 'var(--primary)';
      case 'disconnected':
        return 'var(--danger)';
      case 'offline':
        return 'var(--warning)';
      default:
        return 'var(--gray-400)';
    }
  };

  if (compact) {
    return (
      <div 
        className={`flex items-center gap-1 ${className}`}
        title={`Supabase: ${getStatusText()}${lastError ? ` - ${lastError}` : ''}`}
      >
        {getStatusIcon()}
        {pendingSyncCount > 0 && (
          <span style={{ fontSize: '0.65rem', color: 'var(--primary)' }}>
            {pendingSyncCount}
          </span>
        )}
        {syncStats.errors > 0 && (
          <span 
            style={{ 
              fontSize: '0.65rem', 
              color: 'var(--danger)',
              background: 'rgba(239, 68, 68, 0.1)',
              padding: '0 4px',
              borderRadius: '4px'
            }}
          >
            {syncStats.errors}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div
        onClick={() => showDetails && setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          background: 'var(--gray-100)',
          borderRadius: 'var(--radius-md)',
          cursor: showDetails ? 'pointer' : 'default',
          border: syncStats.errors > 0 ? '1px solid var(--danger)' : '1px solid transparent',
        }}
      >
        {getStatusIcon()}
        <span style={{ fontSize: '0.875rem', color: getStatusColor(), fontWeight: 500 }}>
          {getStatusText()}
        </span>
        
        {pendingSyncCount > 0 && (
          <span 
            className="badge" 
            style={{ 
              background: 'var(--primary)', 
              color: 'white',
              fontSize: '0.65rem',
              padding: '0.125rem 0.375rem'
            }}
          >
            {pendingSyncCount} pending
          </span>
        )}

        {syncStats.errors > 0 && (
          <span 
            className="badge badge-danger"
            style={{ fontSize: '0.65rem', padding: '0.125rem 0.375rem' }}
          >
            {syncStats.errors} errors
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRefresh();
          }}
          disabled={isRefreshing}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--text-secondary)',
          }}
          title="Check connection"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
        </button>

        {showDetails && (
          isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />
        )}
      </div>

      {showDetails && isExpanded && (
        <div 
          style={{
            marginTop: '0.5rem',
            padding: '0.75rem',
            background: 'var(--gray-50)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.75rem',
          }}
        >
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Status:</strong> {connectionStatus}
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Configured:</strong> {isConfigured ? 'Yes' : 'No'}
          </div>
          {lastError && (
            <div style={{ marginBottom: '0.5rem', color: 'var(--danger)' }}>
              <strong>Last Error:</strong> {lastError}
            </div>
          )}
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Sync Stats:</strong> {syncStats.success} success, {syncStats.errors} errors
          </div>
          
          {recentErrors.length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Recent Errors:</strong>
              <div style={{ 
                maxHeight: '150px', 
                overflowY: 'auto',
                background: 'var(--gray-100)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.5rem',
              }}>
                {recentErrors.map((error) => (
                  <div 
                    key={error.id}
                    style={{
                      padding: '0.25rem 0',
                      borderBottom: '1px solid var(--gray-200)',
                    }}
                  >
                    <div style={{ color: 'var(--danger)' }}>
                      {error.operation} {error.entity}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>
                      {error.error} - {error.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Compact badge version for use in headers
export function SupabaseStatusBadge() {
  return <SupabaseStatusIndicator compact />;
}
