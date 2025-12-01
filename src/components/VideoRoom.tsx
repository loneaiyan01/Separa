"use client"
import { useState, useEffect, useCallback } from 'react';
import {
    ControlBar,
    LiveKitRoom,
    RoomAudioRenderer,
    useParticipants,
    useTracks,
    GridLayout,
    ParticipantTile,
    useRoomContext,
    useConnectionState,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, RemoteTrackPublication, ConnectionState } from 'livekit-client';
import { Gender, ParticipantMetadata, AuditLog } from '@/types';
import { Users, Star, X, Shield, Activity, Ban, Loader2, Home, WifiOff, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import ChatPanel from '@/components/ChatPanel';
import {
    logConnectionEvent,
    saveSessionState,
    clearSessionState,
} from '@/lib/connection-utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { VideoLayoutMode } from '@/types/layout';
import LayoutSelector from '@/components/LayoutSelector';
import GalleryLayout from '@/components/layouts/GalleryLayout';
import SpeakerLayout from '@/components/layouts/SpeakerLayout';
import SidebarLayout from '@/components/layouts/SidebarLayout';
import PiPLayout from '@/components/layouts/PiPLayout';

interface VideoRoomProps {
    token: string;
    userGender: Gender;
    isHost: boolean;
    onLeave: () => void;
    roomName: string;
    initialMicOn?: boolean;
    initialCamOn?: boolean;
}

export default function VideoRoom({ token, userGender, isHost, onLeave, roomName, initialMicOn = true, initialCamOn = true }: VideoRoomProps) {
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const maxReconnectAttempts = 5;
    const isMobile = useIsMobile();
    const networkStatus = useNetworkStatus();

    const handleDisconnected = useCallback(() => {
        logConnectionEvent('Disconnected from room', { roomName });
        clearSessionState(roomName);

        // Always leave the room when disconnected to return to lobby
        onLeave();
    }, [onLeave, roomName]);

    const handleError = useCallback((error: Error) => {
        console.error('LiveKit error:', error);
        logConnectionEvent('Connection error', { error: error.message });
    }, []);

    // Adjust video quality based on network conditions
    const getVideoQuality = () => {
        if (!networkStatus.isOnline) {
            return { width: 320, height: 240, frameRate: 10 };
        }

        if (networkStatus.isSlow) {
            return { width: 480, height: 360, frameRate: 15 };
        }

        if (networkStatus.effectiveType === '3g') {
            return { width: 640, height: 480, frameRate: 20 };
        }

        // 4G or better
        return isMobile
            ? { width: 1280, height: 720, frameRate: 30 }
            : { width: 1920, height: 1080, frameRate: 30 };
    };

    const videoQuality = getVideoQuality();

    console.log('[VideoRoom] Initial Media State:', { initialMicOn, initialCamOn });

    return (
        <LiveKitRoom
            video={initialCamOn ? {
                resolution: `${videoQuality.width}x${videoQuality.height}` as any,
                frameRate: videoQuality.frameRate,
            } : false}
            audio={initialMicOn}
            token={token}
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
            data-lk-theme="default"
            style={{ height: '100vh' }}
            onDisconnected={handleDisconnected}
            onError={handleError}
            connectOptions={{
                autoSubscribe: true,
            }}
        >
            <RoomContent
                userGender={userGender}
                isHost={isHost}
                roomName={roomName}
                reconnectAttempts={reconnectAttempts}
                setReconnectAttempts={setReconnectAttempts}
                maxReconnectAttempts={maxReconnectAttempts}
                onLeave={onLeave}
                isMobile={isMobile}
                networkStatus={networkStatus}
            />
            <RoomAudioRenderer />

            {/* Floating Island Control Bar */}
            <div
                className={`fixed bottom-6 left-1/2 z-50 transition-all duration-300 ease-out`}
                style={{
                    transform: 'translateX(-50%)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(-50%) translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(-50%)'}
            >
                <div
                    className={`flex items-center gap-2 ${isMobile ? 'px-3 py-2' : 'px-4 py-3'} rounded-full border border-white/10`}
                    style={{
                        background: 'rgba(30, 41, 59, 0.6)',
                        backdropFilter: 'blur(16px)',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                    }}
                >
                    <ControlBar variation="minimal" controls={{ chat: false, screenShare: !isMobile }} />
                </div>
            </div>
        </LiveKitRoom>
    );
}

function RoomContent({
    userGender,
    isHost,
    roomName,
    reconnectAttempts,
    setReconnectAttempts,
    maxReconnectAttempts,
    onLeave,
    isMobile,
    networkStatus,
}: {
    userGender: Gender;
    isHost: boolean;
    roomName: string;
    reconnectAttempts: number;
    setReconnectAttempts: (value: number | ((prev: number) => number)) => void;
    maxReconnectAttempts: number;
    onLeave: () => void;
    isMobile: boolean;
    networkStatus: any;
}) {
    const [showParticipants, setShowParticipants] = useState(false);
    const [showAuditLogs, setShowAuditLogs] = useState(false);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [layoutMode, setLayoutMode] = useState<VideoLayoutMode>('gallery');
    const room = useRoomContext();
    const router = useRouter();
    const connectionState = useConnectionState();
    const localParticipant = room?.localParticipant;

    const allParticipants = useParticipants();

    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
        { onlySubscribed: false }
    );

    // Apply gender isolation filtering
    useEffect(() => {
        if (!room) return;

        tracks.forEach((trackRef) => {
            const participant = trackRef.participant;

            // Don't filter local participant
            if (participant.isLocal) return;

            let shouldSubscribe = false;

            if (!participant.metadata) {
                shouldSubscribe = true; // Subscribe by default if no metadata
            } else {
                try {
                    const metadata: ParticipantMetadata = JSON.parse(participant.metadata);

                    // Everyone sees host
                    if (metadata.isHost) {
                        shouldSubscribe = true;
                    }
                    // Everyone sees spotlighted participants
                    else if (metadata.isSpotlighted) {
                        shouldSubscribe = true;
                    }
                    // Male participants: visible to males and host only
                    else if (metadata.gender === 'male') {
                        if (userGender === 'male' || userGender === 'host') {
                            shouldSubscribe = true;
                        } else {
                            shouldSubscribe = false; // females cannot see males
                        }
                    }
                    // Female participants: only visible to other females
                    else if (metadata.gender === 'female') {
                        if (userGender === 'female') {
                            shouldSubscribe = true;
                        } else {
                            shouldSubscribe = false; // males and host cannot see females
                        }
                    }
                } catch {
                    shouldSubscribe = true; // Subscribe on parse error
                }
            }

            // Apply subscription decision
            if (trackRef.publication && 'setSubscribed' in trackRef.publication) {
                if (shouldSubscribe) {
                    if (trackRef.publication instanceof RemoteTrackPublication) {
                        trackRef.publication.setSubscribed(true);
                    }
                } else {
                    if (trackRef.publication instanceof RemoteTrackPublication) {
                        trackRef.publication.setSubscribed(false);
                    }
                }
            }
        });
    }, [tracks, room, isHost, userGender]);

    // Filter tracks for display (only show subscribed)
    const filteredTracks = tracks.filter((trackRef) => {
        const participant = trackRef.participant;
        if (participant.isLocal) return true;
        if (!trackRef.publication) return false;
        return trackRef.publication.isSubscribed || !participant.metadata;
    });

    // Filter participants list
    const visibleParticipants = allParticipants.filter((participant) => {
        if (participant.isLocal) return true;
        if (!participant.metadata) return true;

        let metadata: ParticipantMetadata;
        try {
            metadata = JSON.parse(participant.metadata);
        } catch {
            return true;
        }

        // Everyone sees host
        if (metadata.isHost) return true;
        // Everyone sees spotlighted participants
        if (metadata.isSpotlighted) return true;
        // Male participants: visible to males and host only
        if (metadata.gender === 'male' && (userGender === 'male' || userGender === 'host')) return true;
        // Female participants: only visible to other females
        if (metadata.gender === 'female' && userGender === 'female') return true;

        return false;
    });

    const toggleSpotlight = async (participantIdentity: string, currentMetadata: string) => {
        if (!isHost) return;

        let metadata: ParticipantMetadata = { gender: 'male', isHost: false };
        if (currentMetadata) {
            try {
                metadata = JSON.parse(currentMetadata);
            } catch { }
        }

        const newSpotlightState = !metadata.isSpotlighted;

        try {
            await fetch('/api/spotlight', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomName,
                    participantIdentity,
                    isSpotlighted: newSpotlightState,
                }),
            });
        } catch (e) {
            console.error('Failed to toggle spotlight:', e);
        }
    }

    const fetchAuditLogs = async () => {
        if (!isHost) return;
        try {
            const res = await fetch(`/api/audit-logs?roomId=${roomName.replace('room-', '')}`);
            if (res.ok) {
                const data = await res.json();
                setAuditLogs(data);
            }
        } catch (e) {
            console.error('Failed to fetch audit logs:', e);
        }
    };

    const handleBlockIp = async (participantIdentity: string) => {
        if (!isHost || !confirm(`Are you sure you want to block ${participantIdentity}? This will prevent them from rejoining.`)) return;

        try {
            await fetch(`/api/rooms/${roomName.replace('room-', '')}/block`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ participantIdentity }),
            });
            // Ideally, we should also kick the user here
        } catch (e) {
            console.error('Failed to block IP:', e);
            alert('Failed to block user');
        }
    };


    // Monitor connection state and handle reconnection
    useEffect(() => {
        if (connectionState === ConnectionState.Connected) {
            logConnectionEvent('Connection state: Connected');
            setReconnectAttempts(0); // Reset on successful connection
        } else if (connectionState === ConnectionState.Reconnecting) {
            logConnectionEvent('Connection state: Reconnecting');
            setReconnectAttempts(prev => prev + 1);
        } else if (connectionState === ConnectionState.Disconnected) {
            logConnectionEvent('Connection state: Disconnected');
        }
    }, [connectionState, setReconnectAttempts]);

    // Save session state periodically
    useEffect(() => {
        if (!room || connectionState !== ConnectionState.Connected) return;

        const interval = setInterval(() => {
            const spotlighted = new Set<string>();
            allParticipants.forEach(p => {
                if (p.metadata) {
                    try {
                        const meta: ParticipantMetadata = JSON.parse(p.metadata);
                        if (meta.isSpotlighted) {
                            spotlighted.add(p.identity);
                        }
                    } catch { }
                }
            });

            saveSessionState(roomName, {
                spotlightedParticipants: spotlighted,
                participantMetadata: new Map(),
                lastUpdateTime: Date.now(),
            });
        }, 5000); // Save every 5 seconds

        return () => clearInterval(interval);
    }, [room, allParticipants, roomName, connectionState]);

    const handleNavigateHome = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        e?.preventDefault();
        setShowLeaveConfirm(true);
    };

    const handleCancelLeave = (e?: React.MouseEvent) => {
        try {
            e?.stopPropagation();
            e?.preventDefault();
            setShowLeaveConfirm(false);
        } catch (error) {
            console.error('Error closing modal:', error);
            setShowLeaveConfirm(false);
        }
    };

    const confirmLeave = async (e?: React.MouseEvent) => {
        try {
            e?.stopPropagation();
            e?.preventDefault();

            // Close modal first to prevent UI issues
            setShowLeaveConfirm(false);

            // Disconnect from LiveKit room properly
            if (room) {
                await room.disconnect(true); // Force disconnect
            }

            clearSessionState(roomName);

            // Small delay to allow cleanup
            setTimeout(() => {
                onLeave();
                // Force full page reload to clear URL query parameters and reset state
                window.location.href = '/';
            }, 150);
        } catch (error) {
            console.error('Error leaving room:', error);
            // Force leave even if there's an error
            clearSessionState(roomName);
            onLeave();
            window.location.href = '/';
        }
    };

    useEffect(() => {
        if (showAuditLogs) {
            fetchAuditLogs();
        }
    }, [showAuditLogs]);

    const isReconnecting = connectionState === ConnectionState.Reconnecting;

    // Render the appropriate layout based on mode
    const renderLayout = () => {
        switch (layoutMode) {
            case 'speaker':
                return <SpeakerLayout tracks={filteredTracks} isMobile={isMobile} />;
            case 'sidebar':
                return <SidebarLayout tracks={filteredTracks} isMobile={isMobile} />;
            case 'pip':
                return <PiPLayout tracks={filteredTracks} isMobile={isMobile} />;
            case 'gallery':
            default:
                return <GalleryLayout tracks={filteredTracks} isMobile={isMobile} />;
        }
    };

    return (
        <div className="relative w-full h-full">
            {/* Network Status Indicator */}
            {networkStatus.isSlow && (
                <div className="absolute left-4 bottom-4 z-50 flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full backdrop-blur-md shadow-lg animate-slide-up">
                    <WifiOff className="w-4 h-4 text-orange-400 animate-pulse" />
                    <span className="text-xs font-semibold text-orange-400">Slow Connection - Reducing Quality</span>
                </div>
            )}

            {/* Dynamic Layout Rendering */}
            <div className="w-full h-full">
                {renderLayout()}
            </div>

            {/* E2EE Indicator */}
            <div className="absolute left-4 top-4 z-50 flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full backdrop-blur-md shadow-lg animate-fade-in">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">End-to-End Encrypted</span>
            </div>

            {/* Clickable Separa Branding */}
            <button
                onClick={handleNavigateHome}
                className="absolute left-1/2 -translate-x-1/2 top-4 z-50 px-6 py-2.5 glass-strong border border-slate-600/50 rounded-full shadow-xl transition-all hover:scale-105 group animate-fade-in"
            >
                <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-primary group-hover:text-emerald-400 transition-colors" />
                    <span className="text-lg font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Separa</span>
                </div>
            </button>

            {/* Reconnection Overlay */}
            {isReconnecting && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="glass rounded-2xl p-8 max-w-md w-full mx-4 border-slate-700/50 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative">
                                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                                <WifiOff className="w-8 h-8 text-red-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-2xl font-bold text-white">Reconnecting...</h3>
                                <p className="text-slate-400">
                                    Connection lost. Attempting to reconnect.
                                </p>
                                <p className="text-sm text-slate-500">
                                    Attempt {reconnectAttempts} of {maxReconnectAttempts}
                                </p>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-300 rounded-full"
                                    style={{ width: `${(reconnectAttempts / maxReconnectAttempts) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave Confirmation Dialog */}
            {showLeaveConfirm && (
                <div
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
                    onClick={handleCancelLeave}
                >
                    <div
                        className="glass-strong rounded-2xl p-8 max-w-md w-full border border-slate-700/50 shadow-2xl animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="space-y-6">
                            <div className="text-center space-y-3">
                                <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
                                    <Home className="w-8 h-8 text-red-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">Leave Room?</h3>
                                <p className="text-slate-400 text-base">
                                    Are you sure you want to leave this room and return to the home page?
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleCancelLeave}
                                    variant="ghost"
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold"
                                    type="button"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={confirmLeave}
                                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-lg"
                                    type="button"
                                >
                                    Leave Room
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Host Controls - Mobile optimized */}
            {isHost && !isMobile && (
                <div className="absolute right-28 top-4 z-50">
                    <Button
                        onClick={() => setShowAuditLogs(true)}
                        className="bg-slate-800/80 hover:bg-slate-700 text-white backdrop-blur-md border border-slate-600 shadow-lg"
                        size="sm"
                    >
                        <Activity className="w-4 h-4 mr-2" />
                        Audit Logs
                    </Button>
                </div>
            )}

            {/* Audit Logs Modal */}
            {showAuditLogs && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-slate-800">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary" />
                                Audit Logs
                            </h3>
                            <Button variant="ghost" size="icon" onClick={() => setShowAuditLogs(false)}>
                                <X className="w-5 h-5 text-slate-400" />
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {auditLogs.length === 0 ? (
                                <div className="text-center text-slate-500 py-8">No logs found</div>
                            ) : (
                                auditLogs.map((log) => (
                                    <div key={log.id} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-1 rounded">{log.action}</span>
                                            <span className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm text-slate-300">{log.details}</p>
                                        {log.ipAddress && (
                                            <p className="text-xs text-slate-500 mt-2 font-mono">IP: {log.ipAddress}</p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Top Right Controls - Mobile optimized */}
            <div className={`absolute ${isMobile ? 'right-2 top-2' : 'right-4 top-4'} z-50 flex gap-2 animate-fade-in`}>
                {/* Layout Selector */}
                <LayoutSelector
                    currentLayout={layoutMode}
                    onLayoutChange={setLayoutMode}
                    isMobile={isMobile}
                />

                {/* Chat Button */}
                <Button
                    onClick={() => setShowChat(!showChat)}
                    className={`glass-strong hover:bg-slate-700/80 text-white border border-slate-600/50 shadow-xl transition-all hover:scale-105 relative ${isMobile ? 'min-h-[44px] min-w-[44px]' : ''}`}
                    size={isMobile ? "sm" : "sm"}
                >
                    <MessageSquare className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4 mr-2'}`} />
                    {!isMobile && 'Chat'}
                </Button>

                {/* Participants Button */}
                <Button
                    onClick={() => setShowParticipants(!showParticipants)}
                    className={`glass-strong hover:bg-slate-700/80 text-white border border-slate-600/50 shadow-xl transition-all hover:scale-105 ${isMobile ? 'min-h-[44px] min-w-[44px]' : ''}`}
                    size={isMobile ? "sm" : "sm"}
                >
                    <Users className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4 mr-2'}`} />
                    {!isMobile && visibleParticipants.length}
                    {isMobile && (
                        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-primary to-emerald-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                            {visibleParticipants.length}
                        </span>
                    )}
                </Button>
            </div>

            {/* Participant list sidebar - Mobile responsive */}
            <div className={`${showParticipants ? 'translate-x-0' : 'translate-x-full'} ${isMobile ? 'w-full' : 'w-96'} transition-transform duration-300 ease-in-out fixed right-0 top-0 bottom-[100px] z-40 glass border-l border-slate-700/50`}>
                <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                    <h3 className="font-semibold text-white">
                        Participants ({visibleParticipants.length})
                    </h3>
                    <Button variant="ghost" size="icon" onClick={() => setShowParticipants(false)} className="text-slate-400 hover:text-white hover:bg-slate-700/50">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="p-6 h-[calc(100%-80px)] overflow-y-auto space-y-3">
                    {visibleParticipants.map((participant) => {
                        let metadata: ParticipantMetadata | null = null;
                        if (participant.metadata) {
                            try {
                                metadata = JSON.parse(participant.metadata);
                            } catch { }
                        }

                        return (
                            <div
                                key={participant.identity}
                                className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors border border-slate-700/30"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${participant.isLocal ? 'bg-emerald-500' : 'bg-blue-500'
                                        }`} />
                                    <span className="text-sm text-slate-200 truncate font-medium">
                                        {participant.identity}
                                        {participant.isLocal && ' (You)'}
                                    </span>
                                </div>
                                {isHost && !participant.isLocal && (
                                    <div className="flex items-center gap-1">
                                        {metadata && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => toggleSpotlight(participant.identity, participant.metadata || '')}
                                                className={`flex-shrink-0 hover:bg-slate-600/50 ${metadata.isSpotlighted ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'}`}
                                                title={metadata.isSpotlighted ? "Remove Spotlight" : "Spotlight User"}
                                            >
                                                <Star className="w-4 h-4" fill={metadata.isSpotlighted ? 'currentColor' : 'none'} />
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleBlockIp(participant.identity)}
                                            className="flex-shrink-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                                            title="Block User (IP Ban)"
                                        >
                                            <Ban className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Chat Panel */}
            <ChatPanel
                isOpen={showChat}
                onClose={() => setShowChat(false)}
                userGender={userGender}
                userId={localParticipant?.identity || ''}
                userName={localParticipant?.name || localParticipant?.identity || 'User'}
                isHost={isHost}
                roomName={roomName}
            />
        </div>
    );
}
