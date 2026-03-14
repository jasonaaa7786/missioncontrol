import { useEffect, useRef, useCallback, useState } from 'react';

type WSEventHandler = (data: any) => void;

interface UseWebSocketOptions {
  /** Events to listen to and their handlers */
  onEvent?: Record<string, WSEventHandler>;
  /** Auto-reconnect (default: true) */
  autoReconnect?: boolean;
}

/**
 * WebSocket hook for real-time updates from the Mission Control server.
 *
 * Usage:
 *   const { connected } = useWebSocket({
 *     onEvent: {
 *       task_created: (data) => reloadTasks(),
 *       task_status_changed: (data) => reloadTasks(),
 *       agent_toggled: (data) => reloadAgents(),
 *     },
 *   });
 */
export function useWebSocket({ onEvent, autoReconnect = true }: UseWebSocketOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef(onEvent);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const [connected, setConnected] = useState(false);

  // Keep handlers ref current without reconnecting
  handlersRef.current = onEvent;

  const connect = useCallback(() => {
    // Derive WS URL from current page location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // In dev, Vite proxies /api but WS needs to go directly to server port
    // Check if we're proxied or direct
    const wsUrl = `${protocol}//${window.location.hostname}:3001/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event && handlersRef.current?.[msg.event]) {
            handlersRef.current[msg.event](msg.data);
          }
        } catch {
          // Ignore parse errors
        }
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        if (autoReconnect) {
          reconnectTimer.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      if (autoReconnect) {
        reconnectTimer.current = setTimeout(connect, 5000);
      }
    }
  }, [autoReconnect]);

  useEffect(() => {
    connect();

    // Ping keepalive every 30s
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ event: 'ping' }));
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { connected };
}
