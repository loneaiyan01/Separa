"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Copy, Check, Settings, Lock, Unlock, Users, MoreVertical, UserCheck, Mic, MicOff, UserPlus, Video, VideoOff } from "lucide-react";
import { useRouter } from "next/navigation";

interface HostConsoleProps {
    roomId: string;
    roomCode: string;
}

export default function HostConsole({ roomId, roomCode }: HostConsoleProps) {
    const router = useRouter();
    const [copiedId, setCopiedId] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [roomClosed, setRoomClosed] = useState(false);
    const [isEntering, setIsEntering] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isHoveringEnter, setIsHoveringEnter] = useState(false);
    const [hostName, setHostName] = useState('');

    // Room settings state
    const [allowBrothers, setAllowBrothers] = useState(true);
    const [allowSisters, setAllowSisters] = useState(true);
    const [requireName, setRequireName] = useState(true);
    const [autoMediaOff, setAutoMediaOff] = useState(true);
    const [requirePassword, setRequirePassword] = useState(false);
    const [sisterPasswordInput, setSisterPasswordInput] = useState('');

    const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/room/${roomId}`;

    const copyToClipboard = async (text: string, type: 'id' | 'link') => {
        try {
            await navigator.clipboard.writeText(text);
            if (type === 'id') {
                setCopiedId(true);
                setTimeout(() => setCopiedId(false), 2000);
            } else {
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
            }
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleEnterRoom = async () => {
        if (!hostName.trim()) {
            alert('Please enter your name');
            return;
        }

        try {
            setIsEntering(true);

            sessionStorage.setItem('userRole', 'host');
            sessionStorage.setItem('isHost', 'true');
            sessionStorage.setItem('roomSettings', JSON.stringify({
                allowBrothers,
                allowSisters,
                requireName,
                autoMediaOff,
                requirePassword
            }));

            const tokenRes = await fetch('/api/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: roomId,
                    participantName: hostName,
                    gender: 'male',
                    isHost: true,
                    hostConsoleSettings: {
                        allowBrothers,
                        allowSisters,
                        autoMediaOff,
                        requirePassword,
                        sisterPassword: sisterPasswordInput || undefined
                    }
                }),
            });

            if (!tokenRes.ok) {
                throw new Error('Failed to get room token');
            }

            const { token } = await tokenRes.json();

            sessionStorage.setItem('autoJoinToken', token);
            sessionStorage.setItem('autoJoinGender', 'male');
            sessionStorage.setItem('skipLobby', 'true');

            router.push(`/room/${roomId}`);
        } catch (error) {
            console.error('Error entering room:', error);
            alert('Failed to enter room. Please try again.');
            setIsEntering(false);
        }
    };

    const handleCloseRoom = async () => {
        if (roomClosed) return;

        const confirmed = confirm('Are you sure you want to close this room? This will prevent new participants from joining.');
        if (!confirmed) return;

        try {
            setIsClosing(true);

            const response = await fetch(`/api/rooms/${roomId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ locked: true }),
            });

            if (response.ok) {
                setRoomClosed(true);
                alert('Room has been closed. No new participants can join.');
            } else {
                throw new Error('Failed to close room');
            }
        } catch (error) {
            console.error('Error closing room:', error);
            alert('Failed to close room. Please try again.');
        } finally {
            setIsClosing(false);
            setShowMenu(false);
        }
    };

    const handleResetLink = async () => {
        const confirmed = confirm('Are you sure you want to reset the room link? The current invite link will stop working and a new one will be generated.');
        if (!confirmed) return;

        try {
            setIsResetting(true);

            const newRoomId = crypto.randomUUID().split('-')[0];

            const response = await fetch(`/api/rooms/${roomId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newRoomId }),
            });

            if (response.ok) {
                alert('Room link has been reset. Please share the new link with participants.');
                window.location.reload();
            } else {
                throw new Error('Failed to reset link');
            }
        } catch (error) {
            console.error('Error resetting link:', error);
            alert('Failed to reset link. Please try again.');
        } finally {
            setIsResetting(false);
            setShowMenu(false);
        }
    };

    const handleOpenSettings = () => {
        sessionStorage.setItem('openSettingsPanel', 'true');
        sessionStorage.setItem('userRole', 'host');
        sessionStorage.setItem('isHost', 'true');
        router.push(`/room/${roomId}`);
    };

    return (
        <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-2xl"
        >
            <div
                className="glass-panel p-8 rounded-2xl relative overflow-hidden"
                style={{
                    position: 'relative',
                    zIndex: 10,
                    backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}
            >
                {/* Header with Menu */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                        <Shield className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-400">Host Console</span>
                    </div>

                    {/* Three-Dot Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 rounded-lg hover:bg-slate-700/50 transition-all"
                        >
                            <MoreVertical className="w-5 h-5 text-slate-400" />
                        </button>

                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute right-0 top-12 w-48 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50"
                            >
                                <button
                                    onClick={handleCloseRoom}
                                    disabled={isClosing || roomClosed}
                                    className="w-full px-4 py-3 text-left text-sm text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Lock className="w-4 h-4" />
                                    {roomClosed ? 'Room closed' : isClosing ? 'Closing...' : 'Close room'}
                                </button>
                                <button
                                    onClick={handleResetLink}
                                    disabled={isResetting}
                                    className="w-full px-4 py-3 text-left text-sm text-slate-300 hover:bg-amber-500/10 hover:text-amber-400 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Unlock className="w-4 h-4" />
                                    {isResetting ? 'Resetting...' : 'Reset link'}
                                </button>
                                <button
                                    onClick={handleOpenSettings}
                                    className="w-full px-4 py-3 text-left text-sm text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all flex items-center gap-2"
                                >
                                    <Settings className="w-4 h-4" />
                                    Open settings
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* MASSIVE Room ID Hero Section */}
                <div className="text-center mb-8">
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-2">Room ID</div>
                    <motion.button
                        onClick={() => copyToClipboard(roomId, 'id')}
                        animate={{
                            textShadow: isHoveringEnter
                                ? ['0 0 10px rgba(0,240,255,0.5)', '0 0 20px rgba(0,240,255,0.8)', '0 0 10px rgba(0,240,255,0.5)']
                                : '0 0 10px rgba(0,240,255,0.3)'
                        }}
                        transition={{ duration: 0.5, repeat: isHoveringEnter ? Infinity : 0 }}
                        className="font-mono text-5xl font-bold text-cyan-400 tracking-wider hover:text-cyan-300 transition-all cursor-pointer"
                    >
                        {roomId}
                    </motion.button>
                    {copiedId && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs text-emerald-400 mt-2 flex items-center justify-center gap-1"
                        >
                            <Check className="w-3 h-3" />
                            Copied!
                        </motion.div>
                    )}
                </div>

                {/* Invite Link */}
                <div className="mb-8">
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Invite Link</div>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={inviteLink}
                            readOnly
                            className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-slate-400 text-xs font-mono focus:outline-none"
                        />
                        <button
                            onClick={() => copyToClipboard(inviteLink, 'link')}
                            className="px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg hover:border-cyan-400 transition-all"
                        >
                            {copiedLink ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                                <Copy className="w-4 h-4 text-slate-400" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Power Cards Grid - Room Rules */}
                <div className="mb-8">
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">Room Rules</div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Allow Brothers Card */}
                        <motion.button
                            onClick={() => setAllowBrothers(!allowBrothers)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative p-4 rounded-xl border-2 transition-all ${allowBrothers
                                ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/20'
                                : 'bg-slate-900/30 border-slate-700/50'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <Users className={`w-5 h-5 ${allowBrothers ? 'text-emerald-400' : 'text-slate-500'}`} />
                                <div className={`w-2 h-2 rounded-full ${allowBrothers ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-slate-600'}`} />
                            </div>
                            <div className="text-left">
                                <div className={`text-sm font-medium ${allowBrothers ? 'text-white' : 'text-slate-400'}`}>
                                    Brothers
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                    {allowBrothers ? 'Allowed' : 'Blocked'}
                                </div>
                            </div>
                        </motion.button>

                        {/* Allow Sisters Card */}
                        <motion.button
                            onClick={() => setAllowSisters(!allowSisters)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative p-4 rounded-xl border-2 transition-all ${allowSisters
                                ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/20'
                                : 'bg-slate-900/30 border-slate-700/50'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <Users className={`w-5 h-5 ${allowSisters ? 'text-emerald-400' : 'text-slate-500'}`} />
                                <div className={`w-2 h-2 rounded-full ${allowSisters ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-slate-600'}`} />
                            </div>
                            <div className="text-left">
                                <div className={`text-sm font-medium ${allowSisters ? 'text-white' : 'text-slate-400'}`}>
                                    Sisters
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                    {allowSisters ? 'Allowed' : 'Blocked'}
                                </div>
                            </div>
                        </motion.button>

                        {/* Auto-Media Off Card (Combined Mic + Camera) */}
                        <motion.button
                            onClick={() => setAutoMediaOff(!autoMediaOff)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative p-4 rounded-xl border-2 transition-all ${autoMediaOff
                                ? 'bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                                : 'bg-slate-900/30 border-slate-700/50'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex gap-1">
                                    {autoMediaOff ? (
                                        <>
                                            <MicOff className="w-4 h-4 text-cyan-400" />
                                            <VideoOff className="w-4 h-4 text-cyan-400" />
                                        </>
                                    ) : (
                                        <>
                                            <Mic className="w-4 h-4 text-slate-500" />
                                            <Video className="w-4 h-4 text-slate-500" />
                                        </>
                                    )}
                                </div>
                                <div className={`w-2 h-2 rounded-full ${autoMediaOff ? 'bg-cyan-400 shadow-lg shadow-cyan-400/50' : 'bg-slate-600'}`} />
                            </div>
                            <div className="text-left">
                                <div className={`text-sm font-medium ${autoMediaOff ? 'text-white' : 'text-slate-400'}`}>
                                    Auto-Media Off
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                    {autoMediaOff ? 'Enabled' : 'Disabled'}
                                </div>
                            </div>
                        </motion.button>

                        {/* Password Protection Card */}
                        <motion.button
                            onClick={() => setRequirePassword(!requirePassword)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative p-4 rounded-xl border-2 transition-all ${requirePassword
                                ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/20'
                                : 'bg-slate-900/30 border-slate-700/50'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <Lock className={`w-5 h-5 ${requirePassword ? 'text-amber-400' : 'text-slate-500'}`} />
                                <div className={`w-2 h-2 rounded-full ${requirePassword ? 'bg-amber-400 shadow-lg shadow-amber-400/50' : 'bg-slate-600'}`} />
                            </div>
                            <div className="text-left">
                                <div className={`text-sm font-medium ${requirePassword ? 'text-white' : 'text-slate-400'}`}>
                                    Password
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                    {requirePassword ? 'Required' : 'Optional'}
                                </div>
                            </div>
                        </motion.button>
                    </div>
                </div>

                {/* Sister Password Input (appears when requirePassword is enabled) */}
                {requirePassword && (
                    <div className="mb-6 animate-in slide-in-from-top-2 duration-200">
                        <label className="block text-xs font-medium text-rose-400 uppercase tracking-wider mb-2">
                            Sister Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-rose-400 z-10" />
                            <input
                                type="password"
                                value={sisterPasswordInput}
                                onChange={(e) => setSisterPasswordInput(e.target.value)}
                                placeholder="Enter password for sisters"
                                className="w-full px-4 pl-10 py-3 bg-slate-900/50 border-2 border-rose-500/50 rounded-xl text-white placeholder-rose-300/30 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50 transition-all"
                            />
                        </div>
                        <p className="text-xs text-rose-300/60 mt-2">This password will be required for sisters to join</p>
                    </div>
                )}

                {/* Host Name Input */}
                <div className="mb-6">
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                        Your Name
                    </label>
                    <input
                        type="text"
                        value={hostName}
                        onChange={(e) => setHostName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                    />
                </div>

                {/* Launch Button - ONLY */}
                <motion.button
                    onClick={handleEnterRoom}
                    onHoverStart={() => setIsHoveringEnter(true)}
                    onHoverEnd={() => setIsHoveringEnter(false)}
                    disabled={isEntering || !hostName.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold text-lg rounded-xl transition-all shadow-2xl hover:shadow-emerald-500/50 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Users className="w-6 h-6" />
                    {isEntering ? 'Joining...' : 'Enter Room as Host'}
                </motion.button>
            </div>
        </motion.div >
    );
}
