"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Room } from '@/types';
import RoomCard from '@/components/RoomCard';
import CreateRoomModal from '@/components/CreateRoomModal';
import { Plus, ArrowLeft, Loader2, Video } from 'lucide-react';
import Link from 'next/link';

export default function RoomsPage() {
    const [rooms, setRooms] = useState<Omit<Room, 'password'>[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const res = await fetch('/api/rooms');
            const data = await res.json();
            setRooms(data);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRoom = async (roomData: any) => {
        try {
            const res = await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...roomData,
                    creator: 'anonymous', // TODO: Add proper user authentication
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to create room');
            }

            await fetchRooms();
        } catch (error) {
            console.error('Error creating room:', error);
            throw error;
        }
    };

    const handleDeleteRoom = async (roomId: string) => {
        if (!confirm('Are you sure you want to delete this room?')) {
            return;
        }

        try {
            const res = await fetch(`/api/rooms/${roomId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                throw new Error('Failed to delete room');
            }

            await fetchRooms();
        } catch (error) {
            console.error('Error deleting room:', error);
            alert('Failed to delete room');
        }
    };

    const handleToggleLock = async (roomId: string, currentLocked: boolean) => {
        const newLocked = !currentLocked;
        let password: string | undefined;

        if (newLocked) {
            password = prompt('Enter a password for this room:') || undefined;
            if (!password) return;
        }

        try {
            const res = await fetch(`/api/rooms/${roomId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    locked: newLocked,
                    password: password,
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to update room');
            }

            await fetchRooms();
        } catch (error) {
            console.error('Error updating room:', error);
            alert('Failed to update room');
        }
    };

    return (
        <div className="min-h-screen p-8 gradient-bg">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <Link href="/">
                        <Button variant="ghost" className="mb-6 glass-subtle text-slate-300 hover:text-white border border-slate-700/30 hover:border-slate-600/50 transition-all group">
                            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-semibold">Separa</span>
                            <span className="mx-2 text-slate-600">|</span>
                            <span>Home</span>
                        </Button>
                    </Link>

                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">Rooms</h1>
                            <p className="text-slate-400 text-lg">Manage your video conferencing rooms</p>
                        </div>

                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="glass-button text-white font-semibold premium-glow"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Create Room
                        </Button>
                    </div>
                </div>

                {/* Rooms Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="glass-card rounded-2xl p-8">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        </div>
                    </div>
                ) : rooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
                        <div className="glass-card rounded-3xl p-12 max-w-lg w-full text-center frosted-edge shimmer">
                            <div className="mx-auto w-24 h-24 glass-subtle rounded-2xl flex items-center justify-center mb-8 pulse-glow">
                                <Video className="w-12 h-12 text-primary" />
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-4">No rooms yet</h3>
                            <p className="text-slate-300 mb-10 text-lg leading-relaxed">Create your first room to get started with secure video conferencing.</p>
                            <Button
                                onClick={() => setShowCreateModal(true)}
                                className="glass-button text-white h-14 px-10 text-lg font-semibold premium-glow hover:scale-105 transition-transform"
                            >
                                <Plus className="w-6 h-6 mr-2" />
                                Create Your First Room
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
                        {rooms.map((room, index) => (
                            <div key={room.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                                <RoomCard
                                    room={room}
                                    onDelete={handleDeleteRoom}
                                    onToggleLock={handleToggleLock}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Room Modal */}
            <CreateRoomModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreateRoom={handleCreateRoom}
            />
        </div>
    );
}
