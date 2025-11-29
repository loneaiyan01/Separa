"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GlassVault() {
    const [isCreateMode, setIsCreateMode] = useState(false);
    const [roomId, setRoomId] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const router = useRouter();

    const handleCreateRoom = async () => {
        try {
            setIsCreating(true);

            // 1. Generate a unique, secure room ID
            const uniqueId = crypto.randomUUID().split('-')[0];

            // 2. Create the room in the database
            const response = await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `Room ${uniqueId}`,
                    template: 'brothers-only',
                    locked: false,
                    creator: 'Anonymous',
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create room');
            }

            const { id: createdRoomId } = await response.json();

            // 3. Mark user as Host in sessionStorage
            sessionStorage.setItem('userRole', 'host');
            sessionStorage.setItem('isHost', 'true');

            // 4. Instant redirect to room lobby (< 200ms)
            router.push(`/room/${createdRoomId}`);
        } catch (error) {
            console.error('Error creating room:', error);
            setIsCreating(false);
        }
    };

    const handleJoinRoom = () => {
        if (roomId.trim()) {
            router.push(`/room/${roomId}`);
        }
    };

    return (
        <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-md"
        >
            <div className="glass-panel p-8 rounded-2xl relative overflow-hidden" style={{ position: 'relative', zIndex: 10 }}>
                {/* Toggle */}
                <div className="flex bg-slate-900/50 p-1 rounded-full mb-8 relative">
                    <motion.div
                        className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-slate-700/50 rounded-full z-0"
                        animate={{ x: isCreateMode ? "100%" : "0%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                    <button
                        onClick={() => setIsCreateMode(false)}
                        className={`flex-1 py-2 text-sm font-medium z-10 transition-colors ${!isCreateMode ? "text-cyan-400" : "text-slate-400"}`}
                        disabled={isCreating}
                    >
                        Join Room
                    </button>
                    <button
                        onClick={() => setIsCreateMode(true)}
                        className={`flex-1 py-2 text-sm font-medium z-10 transition-colors ${isCreateMode ? "text-cyan-400" : "text-slate-400"}`}
                        disabled={isCreating}
                    >
                        Create Room
                    </button>
                </div>

                {/* Form Fields */}
                <div className="space-y-6">
                    <AnimatePresence mode="wait">
                        {!isCreateMode && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="relative group overflow-hidden">
                                    <input
                                        type="text"
                                        value={roomId}
                                        onChange={(e) => setRoomId(e.target.value)}
                                        placeholder="Enter Room Code"
                                        disabled={isCreating}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all glass-input relative z-10"
                                        onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                                    />
                                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg opacity-0 group-focus-within:opacity-100 group-focus-within:animate-[scanHorizontal_1.5s_ease-in-out]">
                                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Action Button */}
                    <motion.button
                        onClick={isCreateMode ? handleCreateRoom : handleJoinRoom}
                        disabled={isCreating || (!isCreateMode && !roomId.trim())}
                        whileHover={{ scale: isCreating ? 1 : 1.05 }}
                        whileTap={{ scale: isCreating ? 1 : 0.95 }}
                        className="w-full py-4 px-6 rounded-xl font-bold text-white glass-button relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isCreating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="relative z-10">Creating Room...</span>
                            </>
                        ) : (
                            <>
                                <span className="relative z-10 flex items-center gap-2">
                                    {isCreateMode ? "Create Secure Room" : "Enter Secure Room"}
                                    <Lock className="w-4 h-4" />
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            </>
                        )}
                    </motion.button>
                </div>

                {/* Footer */}
                <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
                    <Lock className={`w-3 h-3 ${roomId.length > 0 || isCreateMode ? "text-cyan-400" : "text-slate-600"}`} />
                    <span>Protected by End-to-End Encryption</span>
                </div>
            </div>
        </motion.div>
    );
}
