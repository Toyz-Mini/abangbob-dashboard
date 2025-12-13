'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';

type SoundType = 
  | 'newOrder' 
  | 'orderReady' 
  | 'alert' 
  | 'success' 
  | 'error' 
  | 'notification'
  | 'clockIn'
  | 'clockOut'
  | 'lowStock'
  | 'payment'
  | 'message';

interface SoundSettings {
  enabled: boolean;
  volume: number; // 0-1
  newOrderSound: boolean;
  orderReadySound: boolean;
  alertSound: boolean;
  clockSound: boolean;
  paymentSound: boolean;
  lowStockSound: boolean;
}

interface SoundContextType {
  settings: SoundSettings;
  updateSettings: (updates: Partial<SoundSettings>) => void;
  playSound: (type: SoundType) => void;
  toggleSound: () => void;
  testSound: (type: SoundType) => void;
}

const SoundContext = createContext<SoundContextType | null>(null);

const STORAGE_KEY = 'abangbob_sound_settings';

const DEFAULT_SETTINGS: SoundSettings = {
  enabled: true,
  volume: 0.7,
  newOrderSound: true,
  orderReadySound: true,
  alertSound: true,
  clockSound: true,
  paymentSound: true,
  lowStockSound: true,
};

// Sound URLs - using Web Audio API generated tones as fallback
const SOUND_URLS: Record<SoundType, string> = {
  newOrder: '/sounds/new-order.mp3',
  orderReady: '/sounds/order-ready.mp3',
  alert: '/sounds/alert.mp3',
  success: '/sounds/success.mp3',
  error: '/sounds/error.mp3',
  notification: '/sounds/notification.mp3',
  clockIn: '/sounds/clock-in.mp3',
  clockOut: '/sounds/clock-out.mp3',
  lowStock: '/sounds/low-stock.mp3',
  payment: '/sounds/payment.mp3',
  message: '/sounds/message.mp3',
};

export function SoundProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SoundSettings>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch {
        // Use defaults
      }
    }
    setMounted(true);
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings, mounted]);

  // Get or create AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Generate a simple beep sound using Web Audio API
  const playBeep = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!settings.enabled) return;

    try {
      const audioContext = getAudioContext();
      
      // Resume if suspended
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(settings.volume * 0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Could not play beep sound:', error);
    }
  }, [settings.enabled, settings.volume, getAudioContext]);

  // Play sound effect
  const playSound = useCallback((type: SoundType) => {
    if (!settings.enabled) return;

    // Check specific sound settings
    if (type === 'newOrder' && !settings.newOrderSound) return;
    if (type === 'orderReady' && !settings.orderReadySound) return;
    if (type === 'alert' && !settings.alertSound) return;
    if ((type === 'clockIn' || type === 'clockOut') && !settings.clockSound) return;
    if (type === 'payment' && !settings.paymentSound) return;
    if (type === 'lowStock' && !settings.lowStockSound) return;

    // Try to play audio file first
    const audio = new Audio(SOUND_URLS[type]);
    audio.volume = settings.volume;
    
    audio.play().catch(() => {
      // Fallback to generated beeps if audio file not found
      switch (type) {
        case 'newOrder':
          // Ding-dong pattern
          playBeep(880, 0.15, 'sine');
          setTimeout(() => playBeep(660, 0.2, 'sine'), 150);
          break;
        case 'orderReady':
          // Triple beep
          playBeep(1000, 0.1, 'sine');
          setTimeout(() => playBeep(1000, 0.1, 'sine'), 150);
          setTimeout(() => playBeep(1200, 0.15, 'sine'), 300);
          break;
        case 'alert':
          // Warning tone
          playBeep(440, 0.3, 'sawtooth');
          setTimeout(() => playBeep(440, 0.3, 'sawtooth'), 400);
          break;
        case 'success':
          // Ascending tone
          playBeep(523, 0.1, 'sine');
          setTimeout(() => playBeep(659, 0.1, 'sine'), 100);
          setTimeout(() => playBeep(784, 0.15, 'sine'), 200);
          break;
        case 'error':
          // Descending tone
          playBeep(400, 0.2, 'square');
          setTimeout(() => playBeep(300, 0.3, 'square'), 200);
          break;
        case 'notification':
          // Simple ding
          playBeep(800, 0.15, 'sine');
          break;
        case 'clockIn':
          // Welcome chime - ascending pleasant tone
          playBeep(523, 0.12, 'sine');
          setTimeout(() => playBeep(659, 0.12, 'sine'), 120);
          setTimeout(() => playBeep(784, 0.12, 'sine'), 240);
          setTimeout(() => playBeep(1047, 0.2, 'sine'), 360);
          break;
        case 'clockOut':
          // Goodbye chime - descending pleasant tone
          playBeep(1047, 0.12, 'sine');
          setTimeout(() => playBeep(784, 0.12, 'sine'), 120);
          setTimeout(() => playBeep(659, 0.12, 'sine'), 240);
          setTimeout(() => playBeep(523, 0.2, 'sine'), 360);
          break;
        case 'lowStock':
          // Urgent double beep
          playBeep(600, 0.2, 'triangle');
          setTimeout(() => playBeep(600, 0.2, 'triangle'), 250);
          setTimeout(() => playBeep(800, 0.15, 'triangle'), 500);
          break;
        case 'payment':
          // Ka-ching! Cash register sound
          playBeep(1200, 0.08, 'sine');
          setTimeout(() => playBeep(1400, 0.08, 'sine'), 80);
          setTimeout(() => playBeep(1800, 0.15, 'sine'), 160);
          break;
        case 'message':
          // Soft notification ping
          playBeep(900, 0.1, 'sine');
          setTimeout(() => playBeep(1100, 0.12, 'sine'), 100);
          break;
      }
    });
  }, [settings, playBeep]);

  // Test sound function (always plays regardless of settings)
  const testSound = useCallback((type: SoundType) => {
    const audio = new Audio(SOUND_URLS[type]);
    audio.volume = settings.volume;
    
    audio.play().catch(() => {
      // Fallback to generated beep for testing
      playBeep(800, 0.2, 'sine');
    });
  }, [settings.volume, playBeep]);

  // Update settings
  const updateSettings = useCallback((updates: Partial<SoundSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // Toggle sound on/off
  const toggleSound = useCallback(() => {
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <SoundContext.Provider value={{ settings, updateSettings, playSound, toggleSound, testSound }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
}

