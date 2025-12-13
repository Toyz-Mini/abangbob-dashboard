'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

// Context for online status
interface OnlineStatusContextType {
  isOnline: boolean;
}

const OnlineStatusContext = createContext<OnlineStatusContextType>({ isOnline: true });

export function useOnlineStatus() {
  return useContext(OnlineStatusContext);
}

interface OnlineStatusProviderProps {
  children: ReactNode;
}

export function OnlineStatusProvider({ children }: OnlineStatusProviderProps) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <OnlineStatusContext.Provider value={{ isOnline }}>
      {children}
    </OnlineStatusContext.Provider>
  );
}

// Offline banner component
interface OfflineBannerProps {
  message?: string;
  showReconnecting?: boolean;
}

export default function OfflineIndicator({ 
  message = 'You are currently offline. Some features may not be available.',
  showReconnecting = true 
}: OfflineBannerProps) {
  const { isOnline } = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline && isOnline) {
      setShowReconnected(true);
      const timeout = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [isOnline, wasOffline]);

  // Show reconnected message
  if (showReconnecting && showReconnected) {
    return (
      <div 
        className="offline-banner" 
        style={{ background: 'var(--success)' }}
        role="status"
        aria-live="polite"
      >
        <Wifi size={18} />
        <span>You&apos;re back online!</span>
      </div>
    );
  }

  // Show offline banner
  if (!isOnline) {
    return (
      <div 
        className="offline-banner"
        role="alert"
        aria-live="assertive"
      >
        <WifiOff size={18} className="offline-banner-icon" />
        <span>{message}</span>
      </div>
    );
  }

  return null;
}

// Small inline offline indicator
export function OfflineStatusBadge() {
  const { isOnline } = useOnlineStatus();

  return (
    <div 
      className="status-indicator"
      style={{ color: isOnline ? 'var(--success)' : 'var(--danger)' }}
    >
      <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
      <span>{isOnline ? 'Online' : 'Offline'}</span>
    </div>
  );
}

