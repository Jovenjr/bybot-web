import { useState, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';
import { queryClient } from '@/lib/queryClient';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { sendMessage, addMessageHandler, removeMessageHandler } = useWebSocket();

  useEffect(() => {
    const handleMessage = (wsMessage: any) => {
      switch (wsMessage.type) {
        case 'message':
          setMessages(prev => {
            // Check if this is a final message replacing a streaming message
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            
            if (lastMessage && lastMessage.role === 'assistant' && lastMessage.timestamp.startsWith('streaming')) {
              // Replace streaming message with final message
              lastMessage.content = wsMessage.content;
              lastMessage.timestamp = wsMessage.timestamp;
              return newMessages;
            } else {
              // Add new message
              return [...prev, {
                role: wsMessage.role,
                content: wsMessage.content,
                timestamp: wsMessage.timestamp
              }];
            }
          });
          break;
        
        case 'stream':
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            
            if (lastMessage && lastMessage.role === 'assistant' && lastMessage.timestamp.startsWith('streaming')) {
              // Update existing streaming message
              lastMessage.content = wsMessage.fullContent;
            } else {
              // Add new streaming message
              newMessages.push({
                role: 'assistant',
                content: wsMessage.fullContent,
                timestamp: `streaming-${Date.now()}`
              });
            }
            
            return newMessages;
          });
          break;
        
        case 'typing':
          setIsTyping(wsMessage.isTyping);
          break;
        
        case 'stream_end':
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            
            if (lastMessage && lastMessage.role === 'assistant' && lastMessage.timestamp.startsWith('streaming')) {
              // Update the final content and timestamp
              lastMessage.content = wsMessage.fullContent;
              lastMessage.timestamp = wsMessage.timestamp;
            }
            
            return newMessages;
          });
          setIsTyping(false);
          break;
        
        case 'error':
          console.error('Chat error:', wsMessage.message);
          break;
      }
    };

    addMessageHandler('chat', handleMessage);

    return () => {
      removeMessageHandler('chat');
    };
  }, [addMessageHandler, removeMessageHandler]);

  const sendChatMessage = (content: string, model?: string) => {
    const success = sendMessage({
      type: 'chat',
      content,
      model
    });

    if (!success) {
      console.error('Failed to send message - WebSocket not connected');
    }
  };

  const clearMessages = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['/api/chat/clear'] });
      setMessages([]);
    } catch (error) {
      console.error('Failed to clear messages:', error);
    }
  };

  return {
    messages,
    isTyping,
    sendMessage: sendChatMessage,
    clearMessages,
  };
}
