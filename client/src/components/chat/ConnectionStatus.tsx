interface MCPServer {
  id: string;
  name: string;
  type: 'stdio' | 'http';
  status: 'connected' | 'disconnected' | 'error';
  latency: number;
  requestCount: number;
}

interface ConnectionStatusProps {
  isConnected: boolean;
  mcpServers: MCPServer[];
}

export function ConnectionStatus({ isConnected, mcpServers }: ConnectionStatusProps) {
  const connectedServers = mcpServers.filter(s => s.status === 'connected').length;
  const totalServers = mcpServers.length;
  const avgLatency = mcpServers.length > 0 
    ? Math.round(mcpServers.reduce((sum, s) => sum + s.latency, 0) / mcpServers.length)
    : 0;

  return (
    <div className="bg-trading-card border-t border-trading-border p-4">
      <div className="flex items-center justify-between text-xs text-trading-text-muted">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-trading-green' : 'bg-trading-red'}`}></div>
            <span>Connected to {connectedServers}/{totalServers} MCP servers</span>
          </div>
          <div className="flex items-center space-x-2">
            <i className="fas fa-clock"></i>
            <span>Response time: {avgLatency}ms</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-mono">WebSocket: {isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
    </div>
  );
}
