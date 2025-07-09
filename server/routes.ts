import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { openaiService } from "./services/openai-service";
import { mcpClient, MCPServer } from "./services/mcp-client-new";
import { insertChatMessageSchema, insertMcpConnectionSchema, InsertMcpConnection } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize default MCP connections
  await initializeDefaultMCPConnections();

  // API Routes
  app.get("/api/mcp/connections", async (req, res) => {
    try {
      const connections = await storage.getMcpConnections();
      res.json(connections);
    } catch (error) {
      res.status(500).json({ error: "Failed to get MCP connections" });
    }
  });

  app.post("/api/mcp/connections", async (req, res) => {
    try {
      const connectionData = insertMcpConnectionSchema.parse(req.body);
      const connection = await storage.createMcpConnection(connectionData);
      
      // Attempt to connect to the MCP server
      if (connection.type === 'stdio') {
        const args = connection.args ? 
          (typeof connection.args === 'string' ? connection.args.split(' ') : connection.args) : 
          [];
        await mcpClient.connectStdioServer({
          id: connection.id.toString(),
          name: connection.name,
          command: connection.command || '',
          args: args as string[]
        });
      } else if (connection.type === 'http') {
        await mcpClient.connectHttpServer({
          id: connection.id.toString(),
          name: connection.name,
          url: connection.url || ''
        });
      }

      res.json(connection);
    } catch (error) {
      res.status(400).json({ error: "Failed to create MCP connection" });
    }
  });

  app.get("/api/chat/messages", async (req, res) => {
    try {
      const messages = await storage.getChatMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to get chat messages" });
    }
  });

  app.post("/api/chat/clear", async (req, res) => {
    try {
      await storage.clearChatMessages();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear chat messages" });
    }
  });

  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws' 
  });

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'chat') {
          // Save user message
          await storage.createChatMessage({
            role: 'user',
            content: message.content,
            tokenCount: message.content.length,
            mcpConnectionId: null
          });

          // Send user message to client
          ws.send(JSON.stringify({
            type: 'message',
            role: 'user',
            content: message.content,
            timestamp: new Date().toISOString()
          }));

          // Get chat history
          const history = await storage.getChatMessages();
          const chatHistory = history.slice(-10).map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          }));

          // Send typing indicator
          ws.send(JSON.stringify({
            type: 'typing',
            isTyping: true
          }));

          let fullResponse = '';
          try {
            console.log('Calling openaiService.streamResponse...');
            // Generate AI response with streaming
            const responseStream = openaiService.streamResponse({
              message: message.content,
              history: chatHistory,
              stream: true,
              model: message.model || 'gpt-4o'
            });
            console.log('openaiService.streamResponse called. Starting to process stream...');

            for await (const chunk of responseStream) {
              fullResponse += chunk;
              
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'stream',
                  content: chunk,
                  fullContent: fullResponse
                }));
              }
            }
            console.log('Finished processing stream.');

            // Send final message
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'typing',
                isTyping: false
              }));

              ws.send(JSON.stringify({
                type: 'stream_end',
                fullContent: fullResponse,
                timestamp: new Date().toISOString()
              }));
            }

            // Save AI response
            await storage.createChatMessage({
              role: 'assistant',
              content: fullResponse,
              tokenCount: fullResponse.length,
              mcpConnectionId: null
            });
          } catch (streamError) {
            console.error('Error during AI response streaming:', streamError);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to get AI response'
              }));
            }
          }
        }
      } catch (error) {
        console.error('WebSocket message processing error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to process message'
        }));
      }
    });

    // Send initial MCP connection status
    const mcpServers = mcpClient.getServers();
    console.log('Sending MCP servers to client:', mcpServers);
    ws.send(JSON.stringify({
      type: 'mcp_status',
      servers: mcpServers
    }));

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  // Listen for MCP server events
  mcpClient.on('serverConnected', (server: MCPServer) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'mcp_status',
          servers: mcpClient.getServers()
        }));
      }
    });
  });

  mcpClient.on('serverStatusChanged', (server: MCPServer) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'mcp_status',
          servers: mcpClient.getServers()
        }));
      }
    });
  });

  return httpServer;
}

async function initializeDefaultMCPConnections() {
  try {
    // Check if we already have connections
    const existingConnections = await storage.getMcpConnections();
    if (existingConnections.length > 0) {
      console.log('MCP connections already exist, skipping initialization');
      return;
    }

    // Create demo connections based on real MCP server examples
    const demoConnections: InsertMcpConnection[] = [
      {
        name: 'BotBybit API',
        type: 'http' as const,
        command: null,
        args: null,
        url: 'http://localhost:8010/mcp',
        status: 'disconnected',
        latency: 0,
        requestCount: 0
      },
      {
        name: 'Time',
        type: 'stdio' as const,
        command: 'npx',
        args: ['@dandeliongold/mcp-time'],
        url: null,
        status: 'disconnected',
        latency: 0,
        requestCount: 0
      }
      
    ];

    for (const conn of demoConnections) {
      const connection = await storage.createMcpConnection(conn);
      
      // Try to connect to MCP servers automatically
      if (conn.type === 'http' && conn.url) {
        try {
          await mcpClient.connectHttpServer({
            id: connection.id.toString(),
            name: conn.name,
            url: conn.url
          });
        } catch (error) {
          console.log(`Failed to auto-connect to ${conn.name}: ${error instanceof Error ? error.message : error}`);
        }
      } else if (conn.type === 'stdio' && conn.command) {
        try {
          await mcpClient.connectStdioServer({
            id: connection.id.toString(),
            name: conn.name,
            command: conn.command,
            args: (conn.args as string[] | null) || []
          });
        } catch (error) {
          console.log(`Failed to auto-connect to ${conn.name}: ${error instanceof Error ? error.message : error}`);
        }
      }
    }

    console.log('Default MCP connections initialized (demo mode)');
  } catch (error) {
    console.error('Failed to initialize default MCP connections:', error);
  }
}
