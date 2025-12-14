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
  Utensils
} from 'lucide-react';

export default function OrderDisplayPage() {
  const { orders, getTodayOrders, isInitialized } = useOrders();
  const { playSound, settings: soundSettings, toggleSound } = useSound();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [newReadyOrders, setNewReadyOrders] = useState<Set<string>>(new Set());
  const prevReadyOrdersRef = useRef<string[]>([]);

  // Get today's orders
  const todayOrders = getTodayOrders();
  
  // Filter orders by status
  const preparingOrders = todayOrders.filter(o => o.status === 'preparing');
  const readyOrders = todayOrders.filter(o => o.status === 'ready');

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Detect new ready orders and play sound
  useEffect(() => {
    const currentReadyIds = readyOrders.map(o => o.id);
    const prevReadyIds = prevReadyOrdersRef.current;
    
    // Find newly added ready orders
    const newlyReady = currentReadyIds.filter(id => !prevReadyIds.includes(id));
    
    if (newlyReady.length > 0) {
      // Play sound for new ready order
      playSound('orderReady');
      
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
  }, [readyOrders, playSound]);

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
      {/* CSS Animations */}
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
        
        .order-number-new {
          animation: pulse-glow 1.5s ease-in-out infinite;
        }
        
        .order-card {
          animation: slide-in 0.4s ease-out;
        }
      `}</style>

      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        padding: '1rem 2rem',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Logo & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(249, 115, 22, 0.4)'
          }}>
            <Utensils size={32} color="white" />
          </div>
          <div>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: 800, 
              color: 'white',
              letterSpacing: '-0.02em'
            }}>
              ABANG BOB
            </h1>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.6)', 
              fontSize: '0.9rem',
              fontWeight: 500
            }}>
              Status Pesanan Anda
            </p>
          </div>
        </div>

        {/* Time & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Current Time */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              fontSize: '2.5rem', 
              fontWeight: 700, 
              color: 'white',
              fontVariantNumeric: 'tabular-nums'
            }}>
              {currentTime.toLocaleTimeString('ms-MY', { 
                hour: '2-digit', 
                minute: '2-digit'
              })}
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.9rem' }}>
              {currentTime.toLocaleDateString('ms-MY', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'short' 
              })}
            </div>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            style={{
              padding: '0.75rem',
              background: soundSettings.enabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              border: `2px solid ${soundSettings.enabled ? '#10b981' : '#ef4444'}`,
              borderRadius: '12px',
              color: soundSettings.enabled ? '#10b981' : '#ef4444',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {soundSettings.enabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </button>

          {/* Fullscreen Toggle */}
          <button 
            onClick={toggleFullscreen}
            style={{
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
          </button>
        </div>
      </div>

      {/* Two Column Display */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '1.5rem',
        height: isFullscreen ? 'calc(100vh - 140px)' : 'calc(100vh - 200px)'
      }}>
        {/* SEDANG DIBUAT Column */}
        <div style={{ 
          background: 'rgba(251, 191, 36, 0.1)',
          borderRadius: '20px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '2px solid rgba(251, 191, 36, 0.3)'
        }}>
          {/* Header */}
          <div style={{ 
            padding: '1.5rem 2rem', 
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ChefHat size={36} color="white" />
              <span style={{ 
                fontSize: '1.8rem', 
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
              padding: '0.5rem 1.5rem',
              borderRadius: '50px',
              fontSize: '1.5rem',
              fontWeight: 800,
              color: 'white'
            }}>
              {preparingOrders.length}
            </div>
          </div>
          
          {/* Order Numbers */}
          <div style={{ 
            flex: 1, 
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexWrap: 'wrap',
            alignContent: 'flex-start',
            gap: '1rem'
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
                icon={<ChefHat size={64} />}
                message="Tiada pesanan dalam penyediaan"
                color="#f59e0b"
              />
            )}
          </div>
        </div>

        {/* SEDIA DIAMBIL Column */}
        <div style={{ 
          background: 'rgba(16, 185, 129, 0.1)',
          borderRadius: '20px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '2px solid rgba(16, 185, 129, 0.3)'
        }}>
          {/* Header */}
          <div style={{ 
            padding: '1.5rem 2rem', 
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <CheckCircle size={36} color="white" />
              <span style={{ 
                fontSize: '1.8rem', 
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
              padding: '0.5rem 1.5rem',
              borderRadius: '50px',
              fontSize: '1.5rem',
              fontWeight: 800,
              color: 'white'
            }}>
              {readyOrders.length}
            </div>
          </div>
          
          {/* Order Numbers */}
          <div style={{ 
            flex: 1, 
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexWrap: 'wrap',
            alignContent: 'flex-start',
            gap: '1rem'
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
                icon={<CheckCircle size={64} />}
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
        bottom: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        padding: '0.75rem 2rem',
        borderRadius: '50px',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '1rem',
        fontWeight: 500,
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        Sila ambil pesanan anda apabila nombor dipaparkan di bahagian "Sedia Diambil"
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
        borderRadius: '16px',
        padding: '1.5rem 2rem',
        minWidth: '160px',
        textAlign: 'center',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ 
        fontSize: '2.2rem', 
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
      minHeight: '200px',
      color: color,
      opacity: 0.4
    }}>
      {icon}
      <span style={{ 
        marginTop: '1rem', 
        fontSize: '1.2rem',
        fontWeight: 500
      }}>
        {message}
      </span>
    </div>
  );
}


