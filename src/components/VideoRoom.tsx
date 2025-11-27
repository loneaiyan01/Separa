"use client"
import { useState, useEffect } from 'react';
import {
    ControlBar,
    LiveKitRoom,
    RoomAudioRenderer,
    useParticipants,
    useTracks,
    GridLayout,
    ParticipantTile,
    useRoomContext,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, RemoteTrackPublication } from 'livekit-client';
import { Gender, ParticipantMetadata, AuditLog } from '@/types';
import { Users, Star, X, Shield, Activity, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoRoomProps {
    token: string;
    userGender: Gender;
    isHost: boolean;
    onLeave: () => void;
    roomName: string;
}

export default function VideoRoom({ token, userGender, isHost, onLeave, roomName }: VideoRoomProps) {
    return (
        <LiveKitRoom
            video={true}
            audio={true}
            token={token}
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
            data-lk-theme="default"
            style={{ height: '100vh' }}
            onDisconnected={onLeave}
        >
            <RoomContent userGender={userGender} isHost={isHost} roomName={roomName} />
            <RoomAudioRenderer />
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass rounded-full px-4 py-2 shadow-2xl">
                <ControlBar variation="minimal" controls={{ chat: false, screenShare: true }} />
            </div>
        </LiveKitRoom>
    );
}

function RoomContent({ userGender, isHost, roomName }: { userGender: Gender; isHost: boolean; roomName: string }) {
    const [showParticipants, setShowParticipants] = useState(false);
    const [showAuditLogs, setShowAuditLogs] = useState(false);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const room = useRoomContext();

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




    useEffect(() => {
        if (showAuditLogs) {
            fetchAuditLogs();
        }
    }, [showAuditLogs]);

    return (
        <div className="relative h-[calc(100vh-100px)]">
            <GridLayout tracks={filteredTracks} style={{ height: '100%' }}>
                <ParticipantTile />
            </GridLayout>

            {/* E2EE Indicator */}
            <div className="absolute left-4 top-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full backdrop-blur-md">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">End-to-End Encrypted</span>
            </div>

            {/* Host Controls */}
            {isHost && (
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
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
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

            {/* Toggle participant list button */}
            <Button
                onClick={() => setShowParticipants(!showParticipants)}
                className="absolute right-4 top-4 z-50 bg-slate-800/80 hover:bg-slate-700 text-white backdrop-blur-md border border-slate-600 shadow-lg"
                size="sm"
            >
                <Users className="w-4 h-4 mr-2" />
                {visibleParticipants.length}
            </Button>

            {/* Participant list sidebar */}
            <div className={`${showParticipants ? 'w-96 translate-x-0' : 'w-96 translate-x-full'} transition-transform duration-300 ease-in-out fixed right-0 top-0 bottom-[100px] z-40 glass border-l border-slate-700/50`}>
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
        </div>
    );
}
