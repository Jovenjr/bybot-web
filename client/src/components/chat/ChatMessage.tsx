import { format } from 'date-fns';
import { Bot, User } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  // Handle streaming messages with invalid timestamps
  let time = '';
  try {
    if (message.timestamp.startsWith('streaming')) {
      time = '...';
    } else {
      time = format(new Date(message.timestamp), 'HH:mm');
    }
  } catch (error) {
    time = '...';
  }

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="flex items-start space-x-3">
          <div className="bg-trading-blue max-w-md rounded-lg px-4 py-3">
            <p className="text-white">{message.content}</p>
            <div className="text-xs text-blue-200 mt-1">{time}</div>
          </div>
          <div className="w-8 h-8 bg-trading-blue rounded-full flex items-center justify-center mt-1">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-trading-green rounded-full flex items-center justify-center mt-1">
          <Bot className="h-4 w-4 text-trading-dark" />
        </div>
        <div className="bg-trading-card max-w-md rounded-lg px-4 py-3 border border-trading-border">
          <div className="text-trading-text whitespace-pre-wrap">{message.content}</div>
          <div className="text-xs text-trading-text-muted mt-2">{time} • via OpenAI</div>
        </div>
      </div>
    </div>
  );
}
