import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Plus, Server } from 'lucide-react';
import { useState } from 'react';

interface MCPServer {
  id: string;
  name: string;
  type: 'stdio' | 'http';
  status: 'connected' | 'disconnected' | 'error';
  latency: number;
  requestCount: number;
}

interface SidebarProps {
  mcpServers: MCPServer[];
  onClose?: () => void;
}

export function Sidebar({ mcpServers, onClose }: SidebarProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newServer, setNewServer] = useState({
    name: '',
    type: 'stdio' as 'stdio' | 'http',
    url: '',
    command: '',
    args: ''
  });

  const handleAddServer = async () => {
    try {
      const response = await fetch('/api/mcp/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newServer.name,
          type: newServer.type,
          url: newServer.type === 'http' ? newServer.url : null,
          command: newServer.type === 'stdio' ? newServer.command : null,
          args: newServer.type === 'stdio' && newServer.args ? newServer.args : null
        }),
      });

      if (response.ok) {
        console.log('Server added successfully');
        setShowAddForm(false);
        setNewServer({ name: '', type: 'stdio', url: '', command: '', args: '' });
        // Refresh the server list without reloading the page
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        console.error('Failed to add server');
      }
    } catch (error) {
      console.error('Error adding server:', error);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-trading-green';
      case 'error':
        return 'bg-trading-red';
      default:
        return 'bg-trading-text-muted';
    }
  };

  const getStatusAnimation = (status: string) => {
    return status === 'connected' ? 'animate-pulse' : '';
  };

  return (
    <div className="w-80 bg-trading-card border-r border-trading-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-trading-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-trading-green rounded-lg flex items-center justify-center">
              <Server className="h-5 w-5 text-trading-dark" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-trading-text">AI Trading Bot</h1>
              <p className="text-sm text-trading-text-muted">MCP Client v1.0</p>
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 hover:bg-trading-green/20 text-trading-text lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* MCP Connections */}
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-sm font-semibold text-trading-text-muted uppercase tracking-wider mb-4">
          MCP Connections
        </h2>
        
        {mcpServers.length === 0 ? (
          <div className="text-center py-8 text-trading-text-muted">
            <i className="fas fa-server text-2xl mb-2"></i>
            <p>No MCP servers connected</p>
          </div>
        ) : (
          <div className="space-y-4">
            {mcpServers.map((server) => (
              <div key={server.id} className="bg-trading-dark rounded-lg p-4 border border-trading-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(server.status)} ${getStatusAnimation(server.status)}`}></div>
                    <span className="text-sm font-medium text-trading-text">{server.name}</span>
                  </div>
                  <span className="text-xs text-trading-text-muted font-mono uppercase">{server.type}</span>
                </div>
                <div className="text-xs text-trading-text-muted space-y-1">
                  <div className="flex justify-between">
                    <span>Latency:</span>
                    <span className="font-mono text-trading-green">{server.latency}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Requests:</span>
                    <span className="font-mono">{server.requestCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-mono ${server.status === 'connected' ? 'text-trading-green' : server.status === 'error' ? 'text-trading-red' : 'text-trading-text-muted'}`}>
                      {server.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connection Controls */}
      <div className="p-4 border-t border-trading-border">
        {!showAddForm ? (
          <Button 
            onClick={() => setShowAddForm(true)}
            className="w-full bg-trading-green hover:bg-trading-green/90 text-trading-dark font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Connection
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-trading-text font-medium">Add MCP Server</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
                className="p-1 hover:bg-trading-green/20 text-trading-text"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="name" className="text-trading-text text-xs">Name</Label>
                <Input
                  id="name"
                  value={newServer.name}
                  onChange={(e) => setNewServer({...newServer, name: e.target.value})}
                  placeholder="Server name"
                  className="bg-trading-dark border-trading-border text-trading-text text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor="type" className="text-trading-text text-xs">Type</Label>
                <select
                  value={newServer.type}
                  onChange={(e) => setNewServer({...newServer, type: e.target.value as 'stdio' | 'http'})}
                  className="w-full bg-trading-dark border border-trading-border text-trading-text text-sm rounded px-2 py-1"
                >
                  <option value="stdio">STDIO (Node.js command)</option>
                  <option value="http">HTTP (API endpoint)</option>
                </select>
              </div>
              
              {newServer.type === 'http' ? (
                <div>
                  <Label htmlFor="url" className="text-trading-text text-xs">URL</Label>
                  <Input
                    id="url"
                    value={newServer.url}
                    onChange={(e) => setNewServer({...newServer, url: e.target.value})}
                    placeholder="http://localhost:3001/mcp"
                    className="bg-trading-dark border-trading-border text-trading-text text-sm"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="command" className="text-trading-text text-xs">Command</Label>
                    <Input
                      id="command"
                      value={newServer.command}
                      onChange={(e) => setNewServer({...newServer, command: e.target.value})}
                      placeholder="node"
                      className="bg-trading-dark border-trading-border text-trading-text text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="args" className="text-trading-text text-xs">Arguments (optional)</Label>
                    <Input
                      id="args"
                      value={newServer.args}
                      onChange={(e) => setNewServer({...newServer, args: e.target.value})}
                      placeholder="./server.js --stdio"
                      className="bg-trading-dark border-trading-border text-trading-text text-sm"
                    />
                  </div>
                </>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                  className="border-trading-border text-trading-text text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddServer}
                  size="sm"
                  className="bg-trading-green hover:bg-trading-green/90 text-trading-dark text-xs"
                >
                  Add Server
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
