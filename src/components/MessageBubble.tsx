"use client";

import { ChatMessage } from '@/types/chat';
import { formatMessageTime, downloadFile } from '@/lib/chat-utils';
import { FileText, Download, Image as ImageIcon, Trash2, Ban } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';

interface MessageBubbleProps {
    message: ChatMessage;
    isOwnMessage: boolean;
    isHost: boolean;
    onDelete?: (messageId: string) => void;
    onMute?: (userId: string, userName: string) => void;
}

export default function MessageBubble({ message, isOwnMessage, isHost, onDelete, onMute }: MessageBubbleProps) {
    const [imageError, setImageError] = useState(false);
    const [showLightbox, setShowLightbox] = useState(false);

    const displayName = message.isAnonymous ? 'Anonymous Sister' : message.senderName;
    const isHostMessage = message.senderGender === 'host';
    const isSystemMessage = message.type === 'system';
    const isPrivateMessage = message.type === 'private';

    const handleDownload = () => {
        if (message.file) {
            downloadFile(message.file.data, message.file.name);
        }
    };

    if (isSystemMessage) {
        return (
            <div className="flex justify-center my-4">
                <div className="px-4 py-2 bg-slate-700/50 rounded-full text-xs text-slate-300 border border-slate-600/50">
                    {message.content}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group`}>
                <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    {/* Sender name and timestamp */}
                    <div className={`flex items-center gap-2 px-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className={`text-xs font-medium ${isHostMessage ? 'text-amber-400' :
                                isPrivateMessage ? 'text-rose-400' :
                                    'text-slate-400'
                            }`}>
                            {displayName}
                            {isHostMessage && ' 👑'}
                            {isPrivateMessage && ' 🔒'}
                        </span>
                        <span className="text-xs text-slate-500">
                            {formatMessageTime(message.timestamp)}
                        </span>

                        {/* Host Actions */}
                        {isHost && !isOwnMessage && !isHostMessage && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {onMute && (
                                    <button
                                        onClick={() => onMute(message.senderId, message.senderName)}
                                        className="text-slate-500 hover:text-amber-400 p-1 rounded hover:bg-slate-700"
                                        title="Mute User"
                                    >
                                        <Ban className="w-3 h-3" />
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        onClick={() => onDelete(message.id)}
                                        className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-700"
                                        title="Delete Message"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Message bubble */}
                    <div className={`rounded-2xl px-4 py-2 ${isOwnMessage
                            ? 'bg-primary text-white rounded-tr-sm'
                            : isHostMessage
                                ? 'bg-amber-600/20 text-white border border-amber-500/30 rounded-tl-sm'
                                : isPrivateMessage
                                    ? 'bg-rose-600/20 text-white border border-rose-500/30 rounded-tl-sm'
                                    : 'bg-slate-700 text-white rounded-tl-sm'
                        }`}>
                        {/* File attachment */}
                        {message.file && (
                            <div className="mb-2">
                                {message.file.type === 'image' && !imageError ? (
                                    <div
                                        className="relative rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => setShowLightbox(true)}
                                    >
                                        <img
                                            src={message.file.data}
                                            alt={message.file.name}
                                            className="max-w-full h-auto max-h-64 rounded-lg"
                                            onError={() => setImageError(true)}
                                        />
                                        <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
                                            <ImageIcon className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-600/30">
                                        <FileText className="w-8 h-8 text-slate-400 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{message.file.name}</p>
                                            <p className="text-xs text-slate-400">{message.file.size ? `${Math.round(message.file.size / 1024)} KB` : ''}</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={handleDownload}
                                            className="flex-shrink-0 hover:bg-slate-700"
                                        >
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Message content */}
                        {message.content && (
                            <p className="text-sm whitespace-pre-wrap break-words">
                                {message.content}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Image lightbox */}
            {showLightbox && message.file?.type === 'image' && (
                <div
                    className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setShowLightbox(false)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <img
                            src={message.file.data}
                            alt={message.file.name}
                            className="max-w-full max-h-[90vh] object-contain"
                        />
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDownload();
                            }}
                            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}
