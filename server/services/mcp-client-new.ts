import { EventEmitter } from 'events';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

export interface MCPServer {
  id: string;
  name: string;
  type: 'stdio' | 'http';
  status: 'connected' | 'disconnected' | 'error';
  latency: number;
  requestCount: number;
}

export interface MCPMessage {
  id: string;
  method: string;
  params?: any;
  result?: any;
  error?: any;
}

export class MCPClient extends EventEmitter {
  private servers: Map<string, MCPServer> = new Map();
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, StdioClientTransport | StreamableHTTPClientTransport> = new Map();

  constructor() {
    super();
  }

  async connectStdioServer(config: {
    id: string;
    name: string;
    command: string;
    args?: string[];
    env?: Record<string, string>;
    cwd?: string;
  }): Promise<void> {
    try {
      const server: MCPServer = {
        id: config.id,
        name: config.name,
        type: 'stdio',
        status: 'disconnected',
        latency: 0,
        requestCount: 0
      };

      this.servers.set(config.id, server);

      // Create STDIO transport
      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args || [],
        env: config.env,
        cwd: config.cwd
      });

      // Create client
      const client = new Client({
        name: 'ai-trading-assistant',
        version: '1.0.0'
      }, {
        capabilities: {
          sampling: {},
          tools: {},
          resources: {},
          prompts: {}
        }
      });

      // Set up transport error handling
      transport.onerror = (error) => {
        console.error(`MCP Server ${config.name} error:`, error);
        this.updateServerStatus(config.id, 'error');
      };

      transport.onclose = () => {
        console.log(`MCP Server ${config.name} disconnected`);
        this.updateServerStatus(config.id, 'disconnected');
      };

      // Connect
      await client.connect(transport);
      
      this.clients.set(config.id, client);
      this.transports.set(config.id, transport);
      this.updateServerStatus(config.id, 'connected');
      
      console.log(`MCP Server ${config.name} connected via STDIO`);
      this.emit('serverConnected', server);
    } catch (error) {
      console.error(`Failed to connect to MCP server ${config.name}:`, error);
      this.updateServerStatus(config.id, 'error');
      throw error;
    }
  }

  async connectHttpServer(config: {
    id: string;
    name: string;
    url: string;
  }): Promise<void> {
    try {
      const server: MCPServer = {
        id: config.id,
        name: config.name,
        type: 'http',
        status: 'disconnected',
        latency: 0,
        requestCount: 0
      };

      this.servers.set(config.id, server);

      // Create HTTP transport
      const transport = new StreamableHTTPClientTransport(new URL(config.url));

      // Create client
      const client = new Client({
        name: 'ai-trading-assistant',
        version: '1.0.0'
      }, {
        capabilities: {
          sampling: {},
          tools: {},
          resources: {},
          prompts: {}
        }
      });

      // Set up transport error handling
      transport.onerror = (error) => {
        console.error(`MCP Server ${config.name} error:`, error);
        this.updateServerStatus(config.id, 'error');
      };

      transport.onclose = () => {
        console.log(`MCP Server ${config.name} disconnected`);
        this.updateServerStatus(config.id, 'disconnected');
      };

      // Connect
      await client.connect(transport);
      
      this.clients.set(config.id, client);
      this.transports.set(config.id, transport);
      this.updateServerStatus(config.id, 'connected');
      
      console.log(`MCP Server ${config.name} connected via HTTP`);
      this.emit('serverConnected', server);
    } catch (error) {
      console.error(`Failed to connect to MCP server ${config.name}:`, error);
      this.updateServerStatus(config.id, 'error');
      throw error;
    }
  }

  async sendMessage(serverId: string, message: MCPMessage): Promise<any> {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`MCP server ${serverId} not found`);
    }

    try {
      const startTime = Date.now();
      
      // Send message based on method
      let result;
      switch (message.method) {
        case 'tools/list':
          result = await client.listTools();
          break;
        case 'tools/call':
          result = await client.callTool(message.params.name, message.params.arguments);
          break;
        case 'resources/list':
          result = await client.listResources();
          break;
        case 'resources/read':
          result = await client.readResource(message.params.uri);
          break;
        case 'prompts/list':
          result = await client.listPrompts();
          break;
        case 'prompts/get':
          result = await client.getPrompt(message.params.name, message.params.arguments);
          break;
        default:
          throw new Error(`Unsupported method: ${message.method}`);
      }

      const latency = Date.now() - startTime;
      this.updateServerLatency(serverId, latency);
      this.incrementRequestCount(serverId);

      return result;
    } catch (error) {
      console.error(`Error sending message to MCP server ${serverId}:`, error);
      this.updateServerStatus(serverId, 'error');
      throw error;
    }
  }

  private updateServerStatus(serverId: string, status: MCPServer['status']): void {
    const server = this.servers.get(serverId);
    if (server) {
      server.status = status;
      this.emit('serverStatusChanged', server);
    }
  }

  private updateServerLatency(serverId: string, latency: number): void {
    const server = this.servers.get(serverId);
    if (server) {
      server.latency = latency;
      this.emit('serverStatusChanged', server);
    }
  }

  private incrementRequestCount(serverId: string): void {
    const server = this.servers.get(serverId);
    if (server) {
      server.requestCount++;
      this.emit('serverStatusChanged', server);
    }
  }

  getServers(): MCPServer[] {
    return Array.from(this.servers.values());
  }

  getServer(serverId: string): MCPServer | undefined {
    return this.servers.get(serverId);
  }

  async disconnect(serverId: string): Promise<void> {
    const client = this.clients.get(serverId);
    const transport = this.transports.get(serverId);
    
    if (client) {
      await client.close();
      this.clients.delete(serverId);
    }
    
    if (transport) {
      await transport.close();
      this.transports.delete(serverId);
    }
    
    this.servers.delete(serverId);
    console.log(`MCP Server ${serverId} disconnected`);
  }

  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.servers.keys()).map(serverId => 
      this.disconnect(serverId)
    );
    
    await Promise.all(disconnectPromises);
  }
}

export const mcpClient = new MCPClient();