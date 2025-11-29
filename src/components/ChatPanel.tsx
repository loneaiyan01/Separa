'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gender } from '@/types';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
  gender?: Gender;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userGender: Gender;
  userId: string;
  userName: string;
  isHost: boolean;
  roomName: string;
}

export default function ChatPanel({
  isOpen,
  onClose,
  userGender,
  userId,
  userName,
  isHost,
  roomName,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim()) return;

    const newMessage: ChatMessage = {
      id: `${Date.now()}-${userId}`,
      userId,
      userName,
      message: inputMessage.trim(),
      timestamp: Date.now(),
      gender: userGender,
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');

    // TODO: Implement actual chat via WebSocket or LiveKit Data Channel
    // For now, this is local only
  };

  const getMessageColor = (gender?: Gender) => {
    if (gender === 'male') return 'bg-blue-500/20 border-blue-500/30';
    if (gender === 'female') return 'bg-rose-500/20 border-rose-500/30';
    if (gender === 'host') return 'bg-amber-500/20 border-amber-500/30';
    return 'bg-slate-500/20 border-slate-500/30';
  };

  const getTextColor = (gender?: Gender) => {
    if (gender === 'male') return 'text-blue-400';
    if (gender === 'female') return 'text-rose-400';
    if (gender === 'host') return 'text-amber-400';
    return 'text-slate-400';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[55] md:hidden animate-fade-in"
        onClick={onClose}
      />

      {/* Chat Panel */}
      <div
        className={`
          fixed right-0 top-0 bottom-0 z-[60]
          w-full md:w-96
          glass-panel shadow-2xl
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50 glass-strong">
          <h3 className="font-bold text-white flex items-center gap-3 text-lg">
            <span className="text-2xl">💬</span>
            <span>Chat</span>
            {messages.length > 0 && (
              <span className="text-xs glass-button px-3 py-1.5 rounded-full font-bold shadow-lg">
                {messages.length}
              </span>
            )}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-400 hover:text-white glass-subtle transition-all"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar bg-gradient-to-b from-slate-900/20 to-transparent">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
              <div className="w-24 h-24 rounded-2xl glass-card flex items-center justify-center mb-6 pulse-glow frosted-edge">
                <span className="text-5xl">💬</span>
              </div>
              <p className="text-slate-200 text-lg font-bold mb-2">No messages yet</p>
              <p className="text-slate-400 text-sm">Start the conversation!</p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div
                  key={msg.id}
                  className={`
                    p-4 rounded-xl glass-card border shadow-lg
                    ${msg.userId === userId ? 'ml-8' : 'mr-8'}
                    ${getMessageColor(msg.gender)}
                    animate-slide-up
                    hover:scale-[1.02] transition-transform
                  `}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-bold ${getTextColor(msg.gender)}`}>
                      {msg.userId === userId ? 'You' : msg.userName}
                    </span>
                    <span className="text-xs text-slate-400 font-medium glass-subtle px-2 py-0.5 rounded">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-100 break-words leading-relaxed">{msg.message}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-5 border-t border-slate-700/50 glass-strong">
          <form onSubmit={handleSendMessage} className="flex gap-3 mb-3">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 glass-input text-white placeholder:text-slate-400 h-12 text-sm"
              maxLength={500}
            />
            <Button
              type="submit"
              disabled={!inputMessage.trim()}
              className="glass-button text-white font-semibold transition-all hover:scale-105 shadow-lg w-12 h-12"
              size="icon"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
          <p className="text-xs text-slate-400 flex items-center gap-2 glass-subtle p-2 rounded-lg">
            <span className="text-base">💡</span>
            <span>Chat messages are local only. Real-time sync coming soon!</span>
          </p>
        </div>
      </div>
    </>
  );
}
