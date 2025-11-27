"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RoomTemplate } from '@/types';
import { ROOM_TEMPLATES } from '@/lib/room-templates';
import { X, Lock } from 'lucide-react';

interface CreateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateRoom: (roomData: {
        name: string;
        description: string;
        template: RoomTemplate;
        locked: boolean;
        password?: string;
        sessionPassword?: string;
    }) => void;
}

export default function CreateRoomModal({ isOpen, onClose, onCreateRoom }: CreateRoomModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [template, setTemplate] = useState<RoomTemplate>('brothers-only');
    const [locked, setLocked] = useState(false);
    const [password, setPassword] = useState('');
    const [sessionPassword, setSessionPassword] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Keyboard accessibility - ESC to close
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setError('');

        if (!name.trim()) {
            setError('Please enter a room name');
            return;
        }

        if (locked && !password.trim()) {
            setError('Please enter a password for locked room');
            return;
        }

        setLoading(true);

        try {
            await onCreateRoom({
                name: name.trim(),
                description: description.trim(),
                template,
                locked,
                password: locked ? password : undefined,
                sessionPassword: sessionPassword.trim() || undefined,
            });

            // Reset form
            setName('');
            setDescription('');
            setTemplate('brothers-only');
            setLocked(false);
            setPassword('');
            setSessionPassword('');
            setShowAdvanced(false);
            onClose();
        } catch (error) {
            console.error('Error creating room:', error);
            setError('Failed to create room. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-lg glass border-slate-700 shadow-2xl">
                <CardHeader className="relative">
                    <Button
                        onClick={onClose}
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-4 text-slate-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                    <CardTitle className="text-2xl text-white">Create New Room</CardTitle>
                    <CardDescription className="text-slate-400">
                        Set up a new video conferencing room
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-10">
                    <form onSubmit={handleSubmit} className="space-y-7">
                        {/* Error Display */}
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
                                {error}
                            </div>
                        )}

                        {/* Room Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Room Name <span className="text-red-400">*</span>
                            </label>
                            <Input
                                autoFocus
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setError('');
                                }}
                                placeholder="e.g., Weekly Study Circle"
                                className="bg-slate-800/50 border-slate-700 text-white"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Description (Optional)
                            </label>
                            <Input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief description of the room"
                                className="bg-slate-800/50 border-slate-700 text-white"
                            />
                        </div>

                        {/* Template Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-slate-300">
                                Room Template <span className="text-red-400">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.entries(ROOM_TEMPLATES).map(([key, config]) => (
                                    <label
                                        key={key}
                                        className={`flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all ${template === key
                                            ? 'border-primary bg-primary/10'
                                            : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="template"
                                            value={key}
                                            checked={template === key}
                                            onChange={(e) => setTemplate(e.target.value as RoomTemplate)}
                                            className="sr-only"
                                        />
                                        <div className="flex-1 text-center">
                                            <div className={`text-2xl mb-2 ${config.color}`}>
                                                {config.name.includes('Brothers') ? '👨' : config.name.includes('Sisters') ? '👩' : config.name.includes('Mixed') ? '👥' : '🌐'}
                                            </div>
                                            <div className="font-medium text-white text-sm">{config.name}</div>
                                            <div className="text-xs text-slate-400 mt-1">{config.description}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Lock Room */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={locked}
                                    onChange={(e) => setLocked(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <div className="flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-amber-400" />
                                    <span className="text-sm font-medium text-slate-300">
                                        Lock this room with a password
                                    </span>
                                </div>
                            </label>

                            {locked && (
                                <div className="animate-in slide-in-from-top-2 duration-200">
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter room password"
                                        className="bg-slate-800/50 border-slate-700 text-white"
                                        required={locked}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Advanced Options */}
                        <div className="pt-2 border-t border-slate-700/50">
                            <button
                                type="button"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="text-sm text-primary hover:text-primary/80 flex items-center gap-2 font-medium"
                            >
                                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                            </button>

                            {showAdvanced && (
                                <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">
                                            Session Password (Optional)
                                        </label>
                                        <p className="text-xs text-slate-500">
                                            A temporary password for this specific session, separate from the room lock.
                                        </p>
                                        <Input
                                            type="text"
                                            value={sessionPassword}
                                            onChange={(e) => setSessionPassword(e.target.value)}
                                            placeholder="Enter session password"
                                            className="bg-slate-800/50 border-slate-700 text-white"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                onClick={onClose}
                                variant="outline"
                                className="flex-1 h-11 border-slate-600 text-slate-300"
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white"
                                disabled={loading}
                            >
                                {loading ? 'Creating...' : 'Create Room'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
