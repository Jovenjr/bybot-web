import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const mcpConnections = pgTable("mcp_connections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "stdio" or "http"
  url: text("url"),
  command: text("command"),
  args: jsonb("args"),
  status: text("status").notNull().default("disconnected"), // "connected", "disconnected", "error"
  latency: integer("latency").default(0),
  requestCount: integer("request_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(), // "user" or "assistant"
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  tokenCount: integer("token_count").default(0),
  mcpConnectionId: integer("mcp_connection_id").references(() => mcpConnections.id),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMcpConnectionSchema = createInsertSchema(mcpConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMcpConnection = z.infer<typeof insertMcpConnectionSchema>;
export type McpConnection = typeof mcpConnections.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
