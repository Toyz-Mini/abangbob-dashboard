/**
 * Real-time service for WebSocket connections
 * This provides a structure for real-time updates without requiring an actual server
 */

type MessageHandler = (data: unknown) => void;
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface RealtimeConfig {
  url?: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  onStatusChange?: (status: ConnectionStatus) => void;
}

interface RealtimeSubscription {
  channel: string;
  handler: MessageHandler;
}

class RealtimeService {
  private socket: WebSocket | null = null;
  private config: RealtimeConfig;
  private subscriptions: Map<string, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private status: ConnectionStatus = 'disconnected';
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(config: RealtimeConfig = {}) {
    this.config = {
      reconnectAttempts: 5,
      reconnectDelay: 3000,
      ...config,
    };
  }

  // Connect to WebSocket server
  connect(url?: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = url || this.config.url;
    if (!wsUrl) {
      console.warn('RealtimeService: No URL provided');
      return;
    }

    this.setStatus('connecting');

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.setStatus('connected');
        this.reconnectAttempts = 0;
        
        // Re-subscribe to all channels
        this.subscriptions.forEach((_, channel) => {
          this.sendSubscribe(channel);
        });
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { channel, payload } = data;

          if (channel && this.subscriptions.has(channel)) {
            this.subscriptions.get(channel)?.forEach(handler => {
              handler(payload);
            });
          }
        } catch (error) {
          console.error('RealtimeService: Failed to parse message', error);
        }
      };

      this.socket.onclose = () => {
        this.setStatus('disconnected');
        this.attemptReconnect();
      };

      this.socket.onerror = () => {
        this.setStatus('error');
      };
    } catch (error) {
      console.error('RealtimeService: Connection failed', error);
      this.setStatus('error');
    }
  }

  // Disconnect from WebSocket server
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.setStatus('disconnected');
  }

  // Subscribe to a channel
  subscribe(channel: string, handler: MessageHandler): () => void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
      
      // If connected, send subscribe message
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.sendSubscribe(channel);
      }
    }

    this.subscriptions.get(channel)?.add(handler);

    // Return unsubscribe function
    return () => this.unsubscribe(channel, handler);
  }

  // Unsubscribe from a channel
  unsubscribe(channel: string, handler: MessageHandler): void {
    const handlers = this.subscriptions.get(channel);
    if (handlers) {
      handlers.delete(handler);
      
      if (handlers.size === 0) {
        this.subscriptions.delete(channel);
        this.sendUnsubscribe(channel);
      }
    }
  }

  // Send a message to a channel
  send(channel: string, payload: unknown): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ channel, payload }));
    } else {
      console.warn('RealtimeService: Cannot send message, not connected');
    }
  }

  // Get current connection status
  getStatus(): ConnectionStatus {
    return this.status;
  }

  // Private methods
  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.config.onStatusChange?.(status);
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= (this.config.reconnectAttempts || 5)) {
      console.warn('RealtimeService: Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectDelay || 3000;

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay * this.reconnectAttempts);
  }

  private sendSubscribe(channel: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'subscribe', channel }));
    }
  }

  private sendUnsubscribe(channel: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'unsubscribe', channel }));
    }
  }
}

// Singleton instance
let realtimeService: RealtimeService | null = null;

export function getRealtimeService(config?: RealtimeConfig): RealtimeService {
  if (!realtimeService) {
    realtimeService = new RealtimeService(config);
  }
  return realtimeService;
}

// React hook for using realtime service
import { useEffect, useState, useCallback } from 'react';

export function useRealtime<T>(channel: string): {
  data: T | null;
  status: ConnectionStatus;
  send: (payload: unknown) => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    const service = getRealtimeService({
      onStatusChange: setStatus,
    });

    const unsubscribe = service.subscribe(channel, (payload) => {
      setData(payload as T);
    });

    return unsubscribe;
  }, [channel]);

  const send = useCallback((payload: unknown) => {
    const service = getRealtimeService();
    service.send(channel, payload);
  }, [channel]);

  return { data, status, send };
}

// Mock realtime events for demo purposes
export function simulateRealtimeEvent(channel: string, payload: unknown): void {
  const service = getRealtimeService();
  // Directly trigger handlers for demo
  (service as any).subscriptions.get(channel)?.forEach((handler: MessageHandler) => {
    handler(payload);
  });
}

export type { ConnectionStatus, RealtimeConfig, RealtimeSubscription };
export { RealtimeService };

