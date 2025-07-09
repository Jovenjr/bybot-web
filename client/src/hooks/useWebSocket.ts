import { useState, useEffect, useRef } from 'react';

interface MCPServer {
  id: string;
  name: string;
  type: 'stdio' | 'http';
  status: 'connected' | 'disconnected' | 'error';
  latency: number;
  requestCount: number;
}

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const messageHandlers = useRef<Map<string, (message: WebSocketMessage) => void>>(new Map());

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsPort = window.location.port ? `:${window.location.port}` : ':8030';
    const wsUrl = `${protocol}//${window.location.hostname}${wsPort}/ws`;
    
    const connectWebSocket = () => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message received:', message);
          
          // Handle MCP server status updates
          if (message.type === 'mcp_status' && message.servers) {
            console.log('Setting MCP servers:', message.servers);
            setMcpServers(message.servers);
          }
          
          // Call registered handlers
          messageHandlers.current.forEach((handler) => {
            handler(message);
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket disconnected');
        
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  };

  const addMessageHandler = (id: string, handler: (message: WebSocketMessage) => void) => {
    messageHandlers.current.set(id, handler);
  };

  const removeMessageHandler = (id: string) => {
    messageHandlers.current.delete(id);
  };

  return {
    isConnected,
    mcpServers,
    sendMessage,
    addMessageHandler,
    removeMessageHandler,
  };
}
