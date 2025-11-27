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
        <div className={`glass rounded-xl p-4 sm:p-7 ${colorClasses[template.color as keyof typeof colorClasses]} border-2 transition-all hover:scale-[1.02] hover:shadow-xl group touch-manipulation`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{room.name}</h3>
                    <p className="text-sm text-slate-400">{room.description || 'No description'}</p>
                </div>
                {room.locked && (
                    <Lock className="w-5 h-5 text-amber-400 flex-shrink-0 ml-2" />
                )}
            </div>

            {/* Template Badge */}
            <div className="mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${badgeClasses[template.color as keyof typeof badgeClasses]}`}>
                    {template.name}
                </span>
            </div>

            {/* Metadata */}
            {/* Metadata */}
            <div className="flex flex-col gap-1.5 mb-5 text-xs font-medium text-slate-400">
                <div className="flex items-center justify-between">
                    <span>Created</span>
                    <span className="text-slate-300">{new Date(room.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span>ID</span>
                    <span className="font-mono text-slate-300 bg-slate-800/50 px-1.5 py-0.5 rounded">{room.id}</span>
                </div>
            </div>

            {/* Actions */}
            {/* Actions */}
            <div className="space-y-2.5">
                <Button
                    onClick={handleJoinRoom}
                    className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 min-h-[44px] touch-manipulation"
                >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Join Room
                </Button>

                <div className="flex gap-2">
                    <Button
                        onClick={handleCopyLink}
                        variant="outline"
                        className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white min-h-[44px] min-w-[44px] touch-manipulation"
                        size="sm"
                        title="Copy Link"
                    >
                        {copied ? (
                            <span className="text-emerald-400 font-bold text-lg">✓</span>
                        ) : (
                            <Copy className="w-5 h-5" />
                        )}
                    </Button>

                    {onToggleLock && (
                        <Button
                            onClick={() => onToggleLock(room.id, room.locked)}
                            variant="outline"
                            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white min-h-[44px] min-w-[44px] touch-manipulation"
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
                            className="flex-1 border-red-900/30 text-red-400 hover:bg-red-950/30 hover:text-red-300 hover:border-red-800/50 min-h-[44px] min-w-[44px] touch-manipulation"
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
