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
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: isFullscreen ? '1rem' : '1.5rem',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      overflow: 'hidden'
    }}>
      {/* CSS Animations & Responsive Styles */}
      <style jsx global>{`
        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.5), 0 0 40px rgba(16, 185, 129, 0.3);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 40px rgba(16, 185, 129, 0.8), 0 0 60px rgba(16, 185, 129, 0.5);
            transform: scale(1.02);
          }
        }
        
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes pulse-border {
          0%, 100% { 
            border-color: rgba(59, 130, 246, 0.4);
          }
          50% { 
            border-color: rgba(59, 130, 246, 0.8);
          }
        }
        
        .order-number-new {
          animation: pulse-glow 1.5s ease-in-out infinite;
        }
        
        .order-card {
          animation: slide-in 0.4s ease-out;
        }
        
        .queue-card {
          animation: slide-in 0.3s ease-out;
        }

        /* Responsive Layout */
        .order-display-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          padding: 0.75rem 1.5rem;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          flex-wrap: wrap;
          gap: 1rem;
        }

        .stats-summary {
          display: flex;
          gap: 1rem;
        }

        .order-display-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr 1.2fr;
          gap: 1rem;
          height: ${isFullscreen ? 'calc(100vh - 120px)' : 'calc(100vh - 180px)'};
        }

        @media (max-width: 1024px) {
          .order-display-grid {
            grid-template-columns: 1fr;
            height: auto;
          }
          
          .order-display-header {
            flex-direction: column;
            align-items: stretch;
          }

          .stats-summary {
            justify-content: space-between;
          }

          /* Make columns full height on mobile or fixed height scrolling */
          .order-column {
            height: 400px !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="order-display-header">
        {/* Logo & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '50px',
            height: '50px',
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(249, 115, 22, 0.4)'
          }}>
            <Utensils size={28} color="white" />
          </div>
          <div>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'white',
              letterSpacing: '-0.02em'
            }}>
              ABANG BOB
            </h1>
            <p style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.85rem',
              fontWeight: 500
            }}>
              Status Pesanan Anda
            </p>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="stats-summary">
          <StatBadge
            icon={<Users size={18} />}
            label="Giliran"
            value={pendingOrders.length}
            color="#3b82f6"
          />
          <StatBadge
            icon={<ChefHat size={18} />}
            label="Dibuat"
            value={preparingOrders.length}
            color="#f59e0b"
          />
          <StatBadge
            icon={<CheckCircle size={18} />}
            label="Sedia"
            value={readyOrders.length}
            color="#10b981"
          />
        </div>

        {/* Time & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between', flex: 1 }}>
          {/* Current Time */}
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: 'white',
              fontVariantNumeric: 'tabular-nums'
            }}>
              {currentTime.toLocaleTimeString('ms-MY', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem' }}>
              {currentTime.toLocaleDateString('ms-MY', {
                weekday: 'long',
                day: 'numeric',
                month: 'short'
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {/* Voice Toggle */}
            <button
              onClick={toggleVoice}
              title={voiceEnabled ? 'Matikan pengumuman suara' : 'Hidupkan pengumuman suara'}
              style={{
                padding: '0.6rem',
                background: voiceEnabled ? 'rgba(139, 92, 246, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                border: `2px solid ${voiceEnabled ? '#8b5cf6' : '#6b7280'}`,
                borderRadius: '10px',
                color: voiceEnabled ? '#8b5cf6' : '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {voiceEnabled ? <Mic size={22} /> : <MicOff size={22} />}
            </button>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              title={soundSettings.enabled ? 'Matikan bunyi' : 'Hidupkan bunyi'}
              style={{
                padding: '0.6rem',
                background: soundSettings.enabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                border: `2px solid ${soundSettings.enabled ? '#10b981' : '#ef4444'}`,
                borderRadius: '10px',
                color: soundSettings.enabled ? '#10b981' : '#ef4444',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {soundSettings.enabled ? <Volume2 size={22} /> : <VolumeX size={22} />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Keluar skrin penuh' : 'Skrin penuh'}
              style={{
                padding: '0.6rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Three Column Display */}
      <div className="order-display-grid">
        {/* DALAM GILIRAN Column (Queue) */}
        <div className="order-column" style={{
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '20px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '2px solid rgba(59, 130, 246, 0.3)'
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem 1.5rem',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Users size={28} color="white" />
              <span style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: 'white',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Dalam Giliran
              </span>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.3)',
              padding: '0.4rem 1.2rem',
              borderRadius: '50px',
              fontSize: '1.3rem',
              fontWeight: 800,
              color: 'white'
            }}>
              {pendingOrders.length}
            </div>
          </div>

          {/* Queue List */}
          <div style={{
            flex: 1,
            padding: '1rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {pendingOrders.length > 0 ? (
              pendingOrders.map((order, index) => (
                <QueueCard
                  key={order.id}
                  orderNumber={order.orderNumber}
                  position={index + 1}
                  estimatedTime={getEstimatedWaitTime(index + 1)}
                  timeColor={getWaitTimeColor(index + 1)}
                />
              ))
            ) : (
              <EmptyState
                icon={<Users size={48} />}
                message="Tiada pesanan dalam giliran"
                color="#3b82f6"
              />
            )}
          </div>
        </div>

        {/* SEDANG DIBUAT Column */}
        <div className="order-column" style={{
          background: 'rgba(251, 191, 36, 0.1)',
          borderRadius: '20px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '2px solid rgba(251, 191, 36, 0.3)'
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem 1.5rem',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ChefHat size={28} color="white" />
              <span style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: 'white',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Sedang Dibuat
              </span>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.3)',
              padding: '0.4rem 1.2rem',
              borderRadius: '50px',
              fontSize: '1.3rem',
              fontWeight: 800,
              color: 'white'
            }}>
              {preparingOrders.length}
            </div>
          </div>

          {/* Order Numbers */}
          <div style={{
            flex: 1,
            padding: '1rem',
            overflowY: 'auto',
            display: 'flex',
            flexWrap: 'wrap',
            alignContent: 'flex-start',
            gap: '0.75rem'
          }}>
            {preparingOrders.length > 0 ? (
              preparingOrders.map(order => (
                <OrderNumberCard
                  key={order.id}
                  orderNumber={order.orderNumber}
                  isNew={false}
                  variant="preparing"
                />
              ))
            ) : (
              <EmptyState
                icon={<ChefHat size={48} />}
                message="Tiada pesanan dalam penyediaan"
                color="#f59e0b"
              />
            )}
          </div>
        </div>

        {/* SEDIA DIAMBIL Column */}
        <div className="order-column" style={{
          background: 'rgba(16, 185, 129, 0.1)',
          borderRadius: '20px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '2px solid rgba(16, 185, 129, 0.3)'
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem 1.5rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle size={28} color="white" />
              <span style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: 'white',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Sedia Diambil
              </span>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.3)',
              padding: '0.4rem 1.2rem',
              borderRadius: '50px',
              fontSize: '1.3rem',
              fontWeight: 800,
              color: 'white'
            }}>
              {readyOrders.length}
            </div>
          </div>

          {/* Order Numbers */}
          <div style={{
            flex: 1,
            padding: '1rem',
            overflowY: 'auto',
            display: 'flex',
            flexWrap: 'wrap',
            alignContent: 'flex-start',
            gap: '0.75rem'
          }}>
            {readyOrders.length > 0 ? (
              readyOrders.map(order => (
                <OrderNumberCard
                  key={order.id}
                  orderNumber={order.orderNumber}
                  isNew={newReadyOrders.has(order.id)}
                  variant="ready"
                />
              ))
            ) : (
              <EmptyState
                icon={<CheckCircle size={48} />}
                message="Tiada pesanan siap"
                color="#10b981"
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer - Instruction */}
      <div style={{
        position: 'fixed',
        bottom: '0.75rem',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        padding: '0.6rem 1.5rem',
        borderRadius: '50px',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '0.9rem',
        fontWeight: 500,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <CheckCircle size={16} />
        Sila ambil pesanan anda apabila nombor dipaparkan di bahagian "Sedia Diambil"
      </div>
    </div>
  );
}

// Stat Badge Component for header
function StatBadge({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1rem',
      background: `${color}20`,
      borderRadius: '12px',
      border: `2px solid ${color}40`
    }}>
      <div style={{ color }}>{icon}</div>
      <div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color }}>{value}</div>
        <div style={{ fontSize: '0.7rem', color: `${color}cc`, fontWeight: 600 }}>{label}</div>
      </div>
    </div>
  );
}

// Queue Card Component with position and estimated time
function QueueCard({
  orderNumber,
  position,
  estimatedTime,
  timeColor
}: {
  orderNumber: string;
  position: number;
  estimatedTime: string;
  timeColor: string;
}) {
  return (
    <div
      className="queue-card"
      style={{
        background: 'rgba(59, 130, 246, 0.15)',
        border: '2px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '14px',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Position & Order Number */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '36px',
          height: '36px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 800,
          fontSize: '1rem'
        }}>
          #{position}
        </div>
        <div style={{
          fontSize: '1.4rem',
          fontWeight: 800,
          color: '#60a5fa',
          letterSpacing: '0.02em',
          fontVariantNumeric: 'tabular-nums'
        }}>
          {orderNumber}
        </div>
      </div>

      {/* Estimated Wait Time */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.4rem 0.75rem',
        background: `${timeColor}20`,
        borderRadius: '8px',
        border: `1px solid ${timeColor}40`
      }}>
        <Clock size={14} color={timeColor} />
        <span style={{
          fontSize: '0.85rem',
          fontWeight: 700,
          color: timeColor
        }}>
          {estimatedTime}
        </span>
      </div>
    </div>
  );
}

// Order Number Card Component
function OrderNumberCard({
  orderNumber,
  isNew,
  variant
}: {
  orderNumber: string;
  isNew: boolean;
  variant: 'preparing' | 'ready';
}) {
  const baseStyles = variant === 'ready'
    ? {
      background: isNew
        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
        : 'rgba(16, 185, 129, 0.2)',
      border: `3px solid ${isNew ? '#10b981' : 'rgba(16, 185, 129, 0.4)'}`,
      color: isNew ? 'white' : '#10b981',
    }
    : {
      background: 'rgba(251, 191, 36, 0.2)',
      border: '3px solid rgba(251, 191, 36, 0.4)',
      color: '#fbbf24',
    };

  return (
    <div
      className={`order-card ${isNew ? 'order-number-new' : ''}`}
      style={{
        ...baseStyles,
        borderRadius: '14px',
        padding: '1.25rem 1.75rem',
        minWidth: '140px',
        textAlign: 'center',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{
        fontSize: '2rem',
        fontWeight: 800,
        letterSpacing: '0.02em',
        fontVariantNumeric: 'tabular-nums'
      }}>
        {orderNumber}
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({
  icon,
  message,
  color
}: {
  icon: React.ReactNode;
  message: string;
  color: string;
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      minHeight: '150px',
      color: color,
      opacity: 0.4
    }}>
      {icon}
      <span style={{
        marginTop: '0.75rem',
        fontSize: '1rem',
        fontWeight: 500,
        textAlign: 'center'
      }}>
        {message}
      </span>
    </div>
  );
}
