'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Megaphone, Calendar, DollarSign, Clock } from 'lucide-react';

interface Notification {
  id: string;
  type: 'approval' | 'announcement' | 'reminder' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

// Mock notifications
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'approval',
    title: 'Cuti Diluluskan',
    message: 'Permohonan cuti anda pada 20-22 Dis telah diluluskan.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    read: false,
    actionUrl: '/staff-portal/leave'
  },
  {
    id: '2',
    type: 'announcement',
    title: 'Mesyuarat Staff',
    message: 'Mesyuarat staff akan diadakan pada Isnin, 10 pagi.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false
  },
  {
    id: '3',
    type: 'reminder',
    title: 'Checklist Belum Selesai',
    message: 'Opening checklist anda belum selesai untuk hari ini.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    read: true,
    actionUrl: '/staff-portal/checklist'
  },
  {
    id: '4',
    type: 'system',
    title: 'Shift Esok',
    message: 'Peringatan: Anda dijadualkan untuk shift pagi esok (8:00 AM).',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true
  }
];

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'approval': return <Check size={16} />;
      case 'announcement': return <Megaphone size={16} />;
      case 'reminder': return <Clock size={16} />;
      default: return <Bell size={16} />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 60) return `${mins}m yang lalu`;
    if (hours < 24) return `${hours}j yang lalu`;
    return `${days}h yang lalu`;
  };

  return (
    <div className="notification-center" ref={dropdownRef}>
      <button 
        className={`notification-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifikasi</h3>
            {unreadCount > 0 && (
              <button className="mark-all-read" onClick={markAllAsRead}>
                <CheckCheck size={14} />
                Tanda semua dibaca
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <Bell size={32} />
                <p>Tiada notifikasi</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div 
                  key={notif.id}
                  className={`notification-item ${!notif.read ? 'unread' : ''}`}
                  onClick={() => {
                    markAsRead(notif.id);
                    if (notif.actionUrl) {
                      window.location.href = notif.actionUrl;
                    }
                  }}
                >
                  <div className={`notification-icon ${notif.type}`}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notif.title}</div>
                    <div className="notification-message">{notif.message}</div>
                    <div className="notification-time">{formatTime(notif.timestamp)}</div>
                  </div>
                  {!notif.read && <div className="notification-dot" />}
                </div>
              ))
            )}
          </div>

          <div className="notification-footer">
            <button onClick={() => setIsOpen(false)}>Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}

