"use client";

import { Room, RoomTemplate } from '@/types';
import { ROOM_TEMPLATES } from '@/lib/room-templates';
import { Button } from '@/components/ui/button';
import { Copy, Lock, Unlock, Trash2, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface RoomCardProps {
    room: Omit<Room, 'password'>;
    onDelete?: (roomId: string) => void;
    onToggleLock?: (roomId: string, currentLocked: boolean) => void;
}

export default function RoomCard({ room, onDelete, onToggleLock }: RoomCardProps) {
    const [copied, setCopied] = useState(false);
    const template = ROOM_TEMPLATES[room.template];

    const colorClasses = {
        emerald: 'border-emerald-500/30 bg-emerald-500/5',
        rose: 'border-rose-500/30 bg-rose-500/5',
        amber: 'border-amber-500/30 bg-amber-500/5',
        blue: 'border-blue-500/30 bg-blue-500/5',
    };

    const badgeClasses = {
        emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        rose: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };

    const handleCopyLink = () => {
        const link = `${window.location.origin}/?room=${room.id}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleJoinRoom = () => {
        // Check if room is locked and needs password
        if (room.locked) {
            const password = prompt(`Enter password for "${room.name}":`);
            if (!password) return; // User cancelled
            
            // Store password temporarily in sessionStorage to pass to lobby
            sessionStorage.setItem(`room_${room.id}_password`, password);
        }
        
        window.location.href = `/?room=${room.id}`;
    };

    return (
        <div className={`glass-card rounded-2xl p-6 sm:p-7 ${colorClasses[template.color as keyof typeof colorClasses]} border-2 transition-all hover:scale-[1.02] group touch-manipulation frosted-edge`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">{room.name}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{room.description || 'No description'}</p>
                </div>
                {room.locked && (
                    <div className="flex-shrink-0 ml-3 w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-amber-400" />
                    </div>
                )}
            </div>

            {/* Template Badge */}
            <div className="mb-5">
                <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-sm ${badgeClasses[template.color as keyof typeof badgeClasses]}`}>
                    {template.name}
                </span>
            </div>

            {/* Metadata */}
            <div className="flex flex-col gap-2 mb-6 text-xs font-medium">
                <div className="flex items-center justify-between p-2 rounded-lg glass-subtle">
                    <span className="text-slate-400">Created</span>
                    <span className="text-slate-200 font-semibold">{new Date(room.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg glass-subtle">
                    <span className="text-slate-400">Room ID</span>
                    <span className="font-mono text-slate-200 bg-slate-800/70 px-2 py-1 rounded border border-slate-700/50">{room.id}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
                <Button
                    onClick={handleJoinRoom}
                    className="w-full glass-button text-white font-semibold min-h-[48px] touch-manipulation premium-glow group/btn"
                >
                    <ExternalLink className="w-5 h-5 mr-2 group-hover/btn:rotate-12 transition-transform" />
                    Join Room
                </Button>

                <div className="flex gap-2.5">
                    <Button
                        onClick={handleCopyLink}
                        variant="outline"
                        className="flex-1 glass-subtle border-slate-600/50 text-slate-300 hover:text-white hover:border-emerald-500/50 min-h-[44px] min-w-[44px] touch-manipulation transition-all"
                        size="sm"
                        title="Copy Link"
                    >
                        {copied ? (
                            <span className="text-emerald-400 font-bold text-lg animate-scale-in">✓</span>
                        ) : (
                            <Copy className="w-5 h-5" />
                        )}
                    </Button>

                    {onToggleLock && (
                        <Button
                            onClick={() => onToggleLock(room.id, room.locked)}
                            variant="outline"
                            className="flex-1 glass-subtle border-slate-600/50 text-slate-300 hover:text-white hover:border-amber-500/50 min-h-[44px] min-w-[44px] touch-manipulation transition-all"
                            size="sm"
                            title={room.locked ? "Unlock Room" : "Lock Room"}
                        >
                            {room.locked ? (
                                <Unlock className="w-5 h-5 text-amber-400" />
                            ) : (
                                <Lock className="w-5 h-5" />
                            )}
                        </Button>
                    )}

                    {onDelete && (
                        <Button
                            onClick={() => onDelete(room.id)}
                            variant="outline"
                            className="flex-1 glass-subtle border-red-900/50 text-red-400 hover:bg-red-950/50 hover:text-red-300 hover:border-red-700/70 min-h-[44px] min-w-[44px] touch-manipulation transition-all"
                            size="sm"
                            title="Delete Room"
                        >
                            <Trash2 className="w-5 h-5" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
