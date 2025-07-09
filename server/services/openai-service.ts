import OpenAI from 'openai';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import { mcpClient } from './mcp-client-new';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key",
});

export interface ChatCompletionRequest {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  stream?: boolean;
  model?: string;
}

export class OpenAIService {
  private defaultModel = 'gpt-4o';

  async generateResponse(request: ChatCompletionRequest): Promise<string> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are an AI trading assistant with access to real-time market data through MCP servers. 
        You can help with market analysis, trading strategies, and risk management. 
        Always provide actionable insights and be mindful of risk management principles.
        
        Available MCP servers: ${mcpClient.getServers().map(s => s.name).join(', ')}
        
        Current time: ${new Date().toISOString()}`
      },
      ...(request.history || []),
      {
        role: 'user' as const,
        content: request.message
      }
    ];

    const result = await generateText({
      model: openai(request.model || this.defaultModel),
      messages,
      maxTokens: 1000,
      temperature: 0.7,
    });

    return result.text;
  }

  async *streamResponse(request: ChatCompletionRequest): AsyncGenerator<string, void, unknown> {
    console.log('streamResponse called with request:', request);
    const messages = [
      {
        role: 'system' as const,
        content: `You are an AI trading assistant with access to real-time market data through MCP servers. 
        You can help with market analysis, trading strategies, and risk management. 
        Always provide actionable insights and be mindful of risk management principles.
        
        Available MCP servers: ${mcpClient.getServers().map(s => s.name).join(', ')}
        
        Current time: ${new Date().toISOString()}`
      },
      ...(request.history || []),
      {
        role: 'user' as const,
        content: request.message
      }
    ];
    console.log('Messages sent to OpenAI:', messages);

    try {
      const result = await streamText({
        model: openai(request.model || this.defaultModel),
        messages,
        maxTokens: 1000,
        temperature: 0.7,
      });

      for await (const delta of result.textStream) {
        console.log('Received delta:', delta);
        yield delta;
      }
      console.log('Stream finished.');
    } catch (error) {
      console.error('Error during OpenAI streaming:', error);
      // Optionally re-throw or yield an error message to the client
      // throw error; 
    }
  }

  async getMarketData(symbol: string): Promise<any> {
    // This would typically connect to a trading data MCP server
    // For now, we'll simulate the structure
    const servers = mcpClient.getServers();
    const tradingServer = servers.find(s => s.name.includes('Trading') || s.name.includes('Data'));
    
    if (tradingServer) {
      try {
        const result = await mcpClient.sendMessage(tradingServer.id, {
          id: `market-data-${Date.now()}`,
          method: 'get_market_data',
          params: { symbol }
        });
        return result;
      } catch (error) {
        console.error('Failed to get market data:', error);
        return null;
      }
    }
    
    return null;
  }
}

export const openaiService = new OpenAIService();
