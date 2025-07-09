import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Trash2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onClearChat: () => void;
}

export function ChatInput({ onSendMessage, onClearChat }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  return (
    <div className="bg-trading-card border-t border-trading-border p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about market analysis, trading strategies, or risk management..."
            className="w-full bg-trading-dark border-trading-border text-trading-text placeholder-trading-text-muted resize-none focus:ring-2 focus:ring-trading-green focus:border-transparent min-h-[44px] max-h-32 pr-12"
            rows={1}
          />
          <Button
            type="submit"
            size="sm"
            className="absolute right-2 bottom-2 p-2 h-8 w-8 bg-transparent hover:bg-trading-green/20 text-trading-text-muted hover:text-trading-green disabled:opacity-50"
            disabled={!message.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button
            type="button"
            onClick={onClearChat}
            variant="outline"
            size="sm"
            className="px-3 py-2 h-auto border-trading-border text-trading-text-muted hover:text-trading-red hover:border-trading-red bg-trading-dark hover:bg-trading-dark/80"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Button
            type="submit"
            disabled={!message.trim()}
            size="sm"
            className="px-4 py-2 h-auto bg-trading-green hover:bg-trading-green/90 text-trading-dark font-medium disabled:opacity-50"
          >
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
