'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useOrders } from '@/lib/store';
import { useSound } from '@/lib/contexts/SoundContext';
import { Order } from '@/lib/types';
import {
  Maximize,
  Minimize,
  ChefHat,
  CheckCircle,
  Volume2,
  VolumeX,
  Utensils,
  Clock,
  Users,
  Mic,
  MicOff
} from 'lucide-react';

// Average prep time per order in minutes (can be adjusted based on historical data)
const AVG_PREP_TIME_MINUTES = 5;

export default function OrderDisplayPage() {
  const { orders, getTodayOrders, isInitialized } = useOrders();
  const { playSound, settings: soundSettings, toggleSound } = useSound();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [newReadyOrders, setNewReadyOrders] = useState<Set<string>>(new Set());
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const prevReadyOrdersRef = useRef<string[]>([]);

  // Get today's orders
  const todayOrders = getTodayOrders();

  // Filter orders by status
  const pendingOrders = todayOrders.filter(o => o.status === 'pending');
  const preparingOrders = todayOrders.filter(o => o.status === 'preparing');
  const readyOrders = todayOrders.filter(o => o.status === 'ready');

  // Voice announcement function using Web Speech API
  const announceOrder = useCallback((orderNumber: string) => {
    if (!voiceEnabled) return;

    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(
        `Nombor pesanan ${orderNumber} sedia untuk diambil`
      );
      utterance.lang = 'ms-MY'; // Malay
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Fallback to English voice if Malay not available
      const voices = window.speechSynthesis.getVoices();
      const malayVoice = voices.find(v => v.lang.includes('ms'));
      const englishVoice = voices.find(v => v.lang.includes('en'));

      if (malayVoice) {
        utterance.voice = malayVoice;
      } else if (englishVoice) {
        utterance.voice = englishVoice;
        utterance.text = `Order number ${orderNumber} is ready for pickup`;
      }

      window.speechSynthesis.speak(utterance);
    }
  }, [voiceEnabled]);

  // Toggle voice announcements
  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => !prev);
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load voices when available
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Detect new ready orders, play sound, and announce
  useEffect(() => {
    const currentReadyIds = readyOrders.map(o => o.id);
    const prevReadyIds = prevReadyOrdersRef.current;

    // Find newly added ready orders
    const newlyReady = currentReadyIds.filter(id => !prevReadyIds.includes(id));

    if (newlyReady.length > 0) {
      // Play sound for new ready order
      playSound('orderReady');

      // Voice announce each new ready order
      newlyReady.forEach(id => {
        const order = readyOrders.find(o => o.id === id);
        if (order) {
          // Delay announcement slightly so sound plays first
          setTimeout(() => announceOrder(order.orderNumber), 500);
        }
      });

      // Add to flashing set
      setNewReadyOrders(prev => {
        const updated = new Set(prev);
        newlyReady.forEach(id => updated.add(id));
        return updated;
      });

      // Remove flash after 10 seconds
      setTimeout(() => {
        setNewReadyOrders(prev => {
          const updated = new Set(prev);
          newlyReady.forEach(id => updated.delete(id));
          return updated;
        });
      }, 10000);
    }

    prevReadyOrdersRef.current = currentReadyIds;
  }, [readyOrders, playSound, announceOrder]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-enter fullscreen on load (for TV mode)
  useEffect(() => {
    const handleClick = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {
          // Ignore if blocked
        });
      }
    };

    // Add click listener to enable fullscreen (browsers require user interaction)
    document.addEventListener('click', handleClick, { once: true });
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Calculate estimated wait time based on queue position
  const getEstimatedWaitTime = (position: number): string => {
    const totalMinutes = position * AVG_PREP_TIME_MINUTES + (preparingOrders.length * AVG_PREP_TIME_MINUTES);
    if (totalMinutes < 1) return '< 1 min';
    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return `~${hours}h ${mins}m`;
    }
    return `~${totalMinutes} min`;
  };

  // Get wait time color based on estimated time
  const getWaitTimeColor = (position: number): string => {
    const totalMinutes = position * AVG_PREP_TIME_MINUTES + (preparingOrders.length * AVG_PREP_TIME_MINUTES);
    if (totalMinutes <= 5) return '#10b981'; // Green
    if (totalMinutes <= 10) return '#f59e0b'; // Yellow/Orange
    return '#ef4444'; // Red
  };

  if (!isInitialized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#0f172a'
      }}>
        <div className="spinner" style={{ width: 60, height: 60, borderColor: '#f97316', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc', // Light background
      padding: isFullscreen ? '1rem' : '1.5rem',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    }}>
      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .order-number-new {
          animation: pulse-green 2s infinite;
        }

        .animate-card {
          animation: slide-up 0.4s ease-out forwards;
        }
        
        .glass-panel {
          background: white;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          border-radius: 1.5rem;
        }
        
        .header-bg {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
        }
      `}</style>

      {/* Header */}
      <div className="glass-panel" style={{
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: '1rem'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            position: 'relative',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Abang Bob Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>
              ABANG BOB
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>
              Status Pesanan
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '2rem' }}>
          <StatCounter icon={<Users size={20} />} label="Dalam Giliran" value={pendingOrders.length} color="blue" />
          <StatCounter icon={<ChefHat size={20} />} label="Sedang Dibuat" value={preparingOrders.length} color="amber" />
          <StatCounter icon={<CheckCircle size={20} />} label="Sedia" value={readyOrders.length} color="emerald" />
        </div>

        {/* Controls & Time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>
              {currentTime.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
              {currentTime.toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'short' })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <ControlButton onClick={toggleVoice} active={voiceEnabled} iconActive={<Mic size={20} />} iconInactive={<MicOff size={20} />} />
            <ControlButton onClick={toggleSound} active={soundSettings.enabled} iconActive={<Volume2 size={20} />} iconInactive={<VolumeX size={20} />} />
            <button
              onClick={toggleFullscreen}
              style={{
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: '1px solid #e2e8f0',
                background: 'white',
                color: '#64748b',
                cursor: 'pointer'
              }}
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.25fr 1.25fr',
        gap: '1.5rem',
        flex: 1,
        minHeight: 0
      }}>

        {/* Queue Column */}
        <ColumnCard
          title="Dalam Giliran"
          count={pendingOrders.length}
          icon={<Users size={24} />}
          theme="blue"
        >
          {pendingOrders.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pendingOrders.map((order, i) => (
                <QueueItem
                  key={order.id}
                  order={order}
                  position={i + 1}
                  estimatedWait={getEstimatedWaitTime(i + 1)}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={<Users size={48} />} message="Tiada giliran" />
          )}
        </ColumnCard>

        {/* Preparing Column */}
        <ColumnCard
          title="Sedang Dibuat"
          count={preparingOrders.length}
          icon={<ChefHat size={24} />}
          theme="amber"
        >
          {preparingOrders.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignContent: 'flex-start' }}>
              {preparingOrders.map(order => (
                <OrderCard key={order.id} orderNumber={order.orderNumber} theme="amber" />
              ))}
            </div>
          ) : (
            <EmptyState icon={<ChefHat size={48} />} message="Dapur tenang" />
          )}
        </ColumnCard>

        {/* Ready Column */}
        <ColumnCard
          title="Sedia Diambil"
          count={readyOrders.length}
          icon={<CheckCircle size={24} />}
          theme="emerald"
        >
          {readyOrders.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignContent: 'flex-start' }}>
              {readyOrders.map(order => (
                <OrderCard
                  key={order.id}
                  orderNumber={order.orderNumber}
                  theme="emerald"
                  isNew={newReadyOrders.has(order.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={<CheckCircle size={48} />} message="Menunggu pesanan" />
          )}
        </ColumnCard>

      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>
        Sila semak nombor pesanan anda di bahagian "Sedia Diambil"
      </div>
    </div>
  );
}

// Sub-components
function StatCounter({ icon, label, value, color }: { icon: any, label: string, value: number, color: 'blue' | 'amber' | 'emerald' }) {
  const colors = {
    blue: '#3b82f6',
    amber: '#f59e0b',
    emerald: '#10b981'
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{
        color: colors[color],
        background: `${colors[color]}15`,
        padding: '0.5rem',
        borderRadius: '0.5rem'
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{label}</div>
      </div>
    </div>
  );
}

function ControlButton({ onClick, active, iconActive, iconInactive }: any) {
  return (
    <button onClick={onClick} style={{
      padding: '0.75rem',
      borderRadius: '0.75rem',
      background: active ? '#f0fdf4' : '#fef2f2',
      border: `1px solid ${active ? '#bbf7d0' : '#fecaca'}`,
      color: active ? '#16a34a' : '#dc2626',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }}>
      {active ? iconActive : iconInactive}
    </button>
  );
}

function ColumnCard({ title, count, icon, children, theme }: any) {
  const themes = {
    blue: { bg: '#eff6ff', border: '#dbeafe', text: '#1e40af', iconBg: '#2563eb' },
    amber: { bg: '#fffbeb', border: '#fef3c7', text: '#92400e', iconBg: '#d97706' },
    emerald: { bg: '#f0fdf4', border: '#dcfce7', text: '#166534', iconBg: '#16a34a' }
  };

  // @ts-ignore
  const t = themes[theme];

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '1.25rem',
        background: t.bg,
        borderBottom: `1px solid ${t.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'white',
            padding: '0.4rem',
            borderRadius: '0.5rem',
            color: t.iconBg,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>{icon}</div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: t.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </h2>
        </div>
        <div style={{
          background: 'white',
          color: t.text,
          fontWeight: 800,
          padding: '0.25rem 0.75rem',
          borderRadius: '999px',
          fontSize: '1rem',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
          {count}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '1.25rem', flex: 1, overflowY: 'auto', background: 'white' }}>
        {children}
      </div>
    </div>
  );
}

function QueueItem({ order, position, estimatedWait }: any) {
  return (
    <div className="animate-card" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem',
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '0.75rem',
      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          background: '#f1f5f9',
          color: '#64748b',
          fontSize: '0.875rem',
          fontWeight: 700,
          width: '32px',
          height: '32px',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          #{position}
        </div>
        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#334155' }}>{order.orderNumber}</span>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        fontSize: '0.8rem',
        color: '#64748b',
        background: '#f8fafc',
        padding: '0.4rem 0.6rem',
        borderRadius: '0.5rem'
      }}>
        <Clock size={14} />
        {estimatedWait}
      </div>
    </div>
  );
}

function OrderCard({ orderNumber, theme, isNew }: any) {
  const themes = {
    amber: { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c' },
    emerald: { bg: '#ecfdf5', border: '#6ee7b7', text: '#059669' }
  };
  // @ts-ignore
  const t = themes[theme];

  return (
    <div className={`animate-card ${isNew ? 'order-number-new' : ''}`} style={{
      flex: '1 1 auto',
      minWidth: '120px',
      textAlign: 'center',
      padding: '1.5rem 1rem',
      background: isNew ? '#10b981' : 'white',
      border: `2px solid ${isNew ? '#10b981' : '#e2e8f0'}`,
      borderRadius: '1rem',
      color: isNew ? 'white' : '#334155',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{ fontSize: '2rem', fontWeight: 800 }}>{orderNumber}</div>
    </div>
  );
}

function EmptyState({ icon, message }: any) {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#cbd5e1',
      gap: '1rem',
      minHeight: '200px'
    }}>
      {icon}
      <span style={{ fontSize: '1rem', fontWeight: 500 }}>{message}</span>
    </div>
  )
}
