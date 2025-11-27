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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[55] md:hidden"
        onClick={onClose}
      />

      {/* Chat Panel */}
      <div
        className={`
          fixed right-0 top-0 bottom-0 z-[60]
          w-full md:w-96
          glass-strong border-l border-slate-700/50 shadow-2xl
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900/50">
          <h3 className="font-bold text-white flex items-center gap-2 text-lg">
            💬 Chat
            {messages.length > 0 && (
              <span className="text-xs bg-gradient-to-r from-primary to-emerald-600 text-white px-2.5 py-1 rounded-full font-semibold shadow-lg">
                {messages.length}
              </span>
            )}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-900/30 to-transparent">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-emerald-600/20 flex items-center justify-center mb-4 pulse-glow">
                <span className="text-4xl">💬</span>
              </div>
              <p className="text-slate-300 text-base font-semibold">No messages yet</p>
              <p className="text-slate-500 text-sm mt-1">Start the conversation!</p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div
                  key={msg.id}
                  className={`
                    p-3 rounded-xl border shadow-lg
                    ${msg.userId === userId ? 'ml-8' : 'mr-8'}
                    ${getMessageColor(msg.gender)}
                    animate-slide-up
                  `}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-bold ${getTextColor(msg.gender)}`}>
                      {msg.userId === userId ? 'You' : msg.userName}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
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
        <div className="p-4 border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
          <form onSubmit={handleSendMessage} className="flex gap-2 mb-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary transition-all"
              maxLength={500}
            />
            <Button
              type="submit"
              disabled={!inputMessage.trim()}
              className="bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 text-white font-semibold transition-all hover:scale-105 shadow-lg"
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <span>💡</span>
            <span>Chat messages are local only. Real-time sync coming soon!</span>
          </p>
        </div>
      </div>
    </>
  );
}
