'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/auth-forms/card';
import Input from '@/components/ui/auth-forms/input';

export default function AIChat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = message;
    setMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // TODO: Implement AI chat API call
      const response = "I'm a placeholder response. The AI chat feature is coming soon!";
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="h-[400px] overflow-y-auto space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground ml-12' 
                  : 'bg-muted mr-12'
              }`}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="bg-muted p-3 rounded-lg mr-12 animate-pulse">
              Thinking...
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about stocks, trading strategies, or market analysis..."
            className="flex-1"
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </Card>
  );
} 