"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RoomTemplate } from '@/types';
import { ROOM_TEMPLATES } from '@/lib/room-templates';
import { Loader2, Check } from 'lucide-react';

interface RoomSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    roomId: string;
    currentTemplate: RoomTemplate;
    onUpdate: (newTemplate: RoomTemplate) => void;
}

export default function RoomSettingsModal({ isOpen, onClose, roomId, currentTemplate, onUpdate }: RoomSettingsModalProps) {
    const [template, setTemplate] = useState<RoomTemplate>(currentTemplate);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/rooms/${roomId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template: template,
                    actorName: 'host' // We assume only host can access this
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to update room settings');
            }

            onUpdate(template);
            onClose();
        } catch (err: any) {
            console.error('Error updating room:', err);
            setError(err.message || 'Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Room Settings</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Update the room configuration. Changing the template will affect who can join.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-300">
                            Room Template
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Object.entries(ROOM_TEMPLATES).map(([key, config]) => (
                                <label
                                    key={key}
                                    className={`flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-slate-800/50 ${template === key
                                        ? 'border-cyan-500 bg-cyan-500/10'
                                        : 'border-slate-700/50 hover:border-slate-600'
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
                                    <div className="flex items-start justify-between">
                                        <div className={`text-2xl mb-2 ${config.color}`}>
                                            {config.name.includes('Brothers') ? '👨' : config.name.includes('Sisters') ? '👩' : config.name.includes('Mixed') ? '👥' : '🌐'}
                                        </div>
                                        {template === key && (
                                            <div className="bg-cyan-500 rounded-full p-0.5">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="font-medium text-white text-sm">{config.name}</div>
                                    <div className="text-xs text-slate-400 mt-1">{config.description}</div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={loading} className="text-slate-400 hover:text-white">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading || template === currentTemplate} className="bg-cyan-500 hover:bg-cyan-600 text-white">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
