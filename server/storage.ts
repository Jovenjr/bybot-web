import { users, type User, type InsertUser, type McpConnection, type InsertMcpConnection, type ChatMessage, type InsertChatMessage } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getMcpConnections(): Promise<McpConnection[]>;
  createMcpConnection(connection: InsertMcpConnection): Promise<McpConnection>;
  getChatMessages(): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  clearChatMessages(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private mcpConnections: Map<number, McpConnection>;
  private chatMessages: Map<number, ChatMessage>;
  private currentUserId: number;
  private currentMcpId: number;
  private currentChatId: number;

  constructor() {
    this.users = new Map();
    this.mcpConnections = new Map();
    this.chatMessages = new Map();
    this.currentUserId = 1;
    this.currentMcpId = 1;
    this.currentChatId = 1;
    
    // Clear existing connections on restart
    this.mcpConnections.clear();
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getMcpConnections(): Promise<McpConnection[]> {
    return Array.from(this.mcpConnections.values());
  }

  async createMcpConnection(connection: InsertMcpConnection): Promise<McpConnection> {
    const id = this.currentMcpId++;
    const mcpConnection: McpConnection = { 
      ...connection, 
      id,
      status: connection.status || 'disconnected',
      url: connection.url || null,
      command: connection.command || null,
      args: connection.args || null,
      latency: connection.latency || 0,
      requestCount: connection.requestCount || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mcpConnections.set(id, mcpConnection);
    return mcpConnection;
  }

  async getChatMessages(): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values()).sort((a, b) => 
      new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
    );
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentChatId++;
    const chatMessage: ChatMessage = { 
      ...message, 
      id,
      tokenCount: message.tokenCount || 0,
      mcpConnectionId: message.mcpConnectionId || null,
      timestamp: new Date()
    };
    this.chatMessages.set(id, chatMessage);
    return chatMessage;
  }

  async clearChatMessages(): Promise<void> {
    this.chatMessages.clear();
  }
}

export const storage = new MemStorage();
