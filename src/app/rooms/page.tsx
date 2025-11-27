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
        <div className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <Link href="/">
                        <Button variant="ghost" className="mb-4 text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            <span className="font-semibold">Separa</span>
                            <span className="mx-2 text-slate-600">|</span>
                            <span>Home</span>
                        </Button>
                    </Link>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">Rooms</h1>
                            <p className="text-slate-400">Manage your video conferencing rooms</p>
                        </div>

                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-primary hover:bg-primary/90 text-white"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Create Room
                        </Button>
                    </div>
                </div>

                {/* Rooms Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : rooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 animate-in fade-in zoom-in duration-500">
                        <div className="glass rounded-2xl p-12 max-w-lg w-full text-center border-slate-700/50 shadow-2xl">
                            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                <Video className="w-10 h-10 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">No rooms yet</h3>
                            <p className="text-slate-400 mb-8 text-lg">Create your first room to get started with secure video conferencing.</p>
                            <Button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-primary hover:bg-primary/90 text-white h-12 px-8 text-lg shadow-lg hover:shadow-primary/20 transition-all hover:scale-105"
                            >
                                <Plus className="w-6 h-6 mr-2" />
                                Create Room
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {rooms.map((room) => (
                            <RoomCard
                                key={room.id}
                                room={room}
                                onDelete={handleDeleteRoom}
                                onToggleLock={handleToggleLock}
                            />
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
