"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, History, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface RoomHistoryItem {
    id: string;
    name: string;
    lastJoined: number;
}

export default function RoomHistoryPage() {
    const [history, setHistory] = useState<RoomHistoryItem[]>([]);
    const router = useRouter();

    useEffect(() => {
        // Load room history from localStorage
        const historyStr = localStorage.getItem('roomHistory');
        if (historyStr) {
            try {
                const parsedHistory = JSON.parse(historyStr);
                setHistory(parsedHistory);
            } catch (error) {
                console.error('Error parsing room history:', error);
                setHistory([]);
            }
        }
    }, []);

    const clearHistory = () => {
        if (confirm('Are you sure you want to clear your room history?')) {
            localStorage.removeItem('roomHistory');
            setHistory([]);
        }
    };

    const joinRoom = (roomId: string) => {
        router.push(`/room/${roomId}`);
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
            {/* Header */}
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <Link href="/">
                        <Button variant="ghost" className="text-slate-400 hover:text-white">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Home
                        </Button>
                    </Link>
                </div>

                {/* Title */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <History className="w-8 h-8 text-cyan-400" />
                        <h1 className="text-4xl font-bold text-white">Room History</h1>
                    </div>
                    <p className="text-slate-400">Your recently joined rooms</p>
                </div>

                {/* History List */}
                {history.length === 0 ? (
                    <div className="glass-card p-12 text-center rounded-xl border border-slate-700/50">
                        <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-slate-400 mb-2">No Room History</h3>
                        <p className="text-slate-500 mb-6">Rooms you join will appear here</p>
                        <Link href="/">
                            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
                                Join a Room
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3 mb-6">
                            {history.map((room, index) => (
                                <div
                                    key={room.id}
                                    className="glass-card p-5 rounded-xl border border-slate-700/50 hover:border-cyan-500/30 transition-all group cursor-pointer"
                                    onClick={() => joinRoom(room.id)}
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-medium text-white group-hover:text-cyan-400 transition-colors truncate">
                                                {room.name}
                                            </h3>
                                            <div className="flex items-center gap-4 mt-1">
                                                <p className="text-sm text-slate-500 font-mono truncate">
                                                    {room.id}
                                                </p>
                                                <p className="text-xs text-slate-600 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDate(room.lastJoined)}
                                                </p>
                                            </div>
                                        </div>
                                        <ExternalLink className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 transition-colors ml-4" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-center">
                            <Button
                                variant="ghost"
                                onClick={clearHistory}
                                className="text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                            >
                                Clear History
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
