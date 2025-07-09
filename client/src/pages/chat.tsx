import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/chat/Sidebar';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { ConnectionStatus } from '@/components/chat/ConnectionStatus';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useChat } from '@/hooks/useChat';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Menu, Settings, Plus, Bot, MessageCircle } from 'lucide-react';

export default function Chat() {
  const { messages, isTyping, sendMessage, clearMessages } = useChat();
  const { isConnected, mcpServers } = useWebSocket();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState('gpt-4o');
  
  const { data: chatHistory, isLoading } = useQuery({
    queryKey: ['/api/chat/messages'],
  });

  useEffect(() => {
    if (chatHistory && messages.length === 0) {
      // Initialize with existing messages if available
    }
  }, [chatHistory, messages.length]);

  return (
    <div className="flex h-screen bg-trading-dark">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
          <div className="absolute inset-0 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative w-80 h-full">
            <Sidebar mcpServers={mcpServers} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}
      
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-trading-card border-b border-trading-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-trading-green/20 text-trading-text"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div className="w-8 h-8 bg-trading-blue rounded-full flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-trading-text">AI Trading Assistant</h2>
                <p className="text-sm text-trading-text-muted">Connected to OpenAI {currentModel}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={currentModel}
                onChange={(e) => setCurrentModel(e.target.value)}
                className="bg-trading-dark border border-trading-border text-trading-text text-sm rounded px-2 py-1"
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
              </select>
              <div className="text-sm text-trading-text-muted">
                <span className="font-mono">$0.045</span> / 1K tokens
              </div>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-trading-green' : 'bg-trading-red'}`}></div>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* System Message */}
          <div className="flex justify-center">
            <div className="bg-trading-border/30 rounded-lg px-4 py-2 text-sm text-trading-text-muted max-w-md text-center">
              <i className="fas fa-info-circle mr-2"></i>
              AI Trading Assistant initialized. Ready to help with trading strategies.
            </div>
          </div>

          {/* Messages */}
          {messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-trading-green rounded-full flex items-center justify-center mt-1">
                  <Bot className="h-4 w-4 text-trading-dark" />
                </div>
                <div className="bg-trading-card max-w-md rounded-lg px-4 py-3 border border-trading-border">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-trading-green rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-trading-green rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-trading-green rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-trading-text-muted">AI is analyzing your request...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <ChatInput onSendMessage={(content) => sendMessage(content, currentModel)} onClearChat={clearMessages} />
        
        {/* Connection Status */}
        <ConnectionStatus isConnected={isConnected} mcpServers={mcpServers} />
      </div>
    </div>
  );
}
