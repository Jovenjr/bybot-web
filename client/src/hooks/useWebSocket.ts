import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface MCPStatus {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'error' | 'disconnected';
  latency: number;
  requestCount: number;
}

export function useWebSocket(onMessage: (message: any) => void) {
  const { token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [mcpServers, setMcpServers] = useState<MCPStatus[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (token) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Solución: Usar el puerto de la ubicación o default a 8030 para desarrollo local
    const wsPort = window.location.port || '8030';
    const wsUrl = `${protocol}//${window.location.hostname}:${wsPort}/?token=${token}`;

    const connectWebSocket = () => {
      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        if (data.type === 'mcp_status') {
          console.log('Setting MCP servers:', data.servers);
          setMcpServers(data.servers);
        } else {
          onMessage(data);
        }
      };

      socketRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        // Intentar reconectar después de un breve retraso
        setTimeout(connectWebSocket, 5000);
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        socketRef.current?.close();
      };
    };

    connectWebSocket();

    return () => {
      socketRef.current?.close();
    };
  }, [token, onMessage]);

  const sendMessage = (message: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  };

  return { isConnected, mcpServers, sendMessage };
}