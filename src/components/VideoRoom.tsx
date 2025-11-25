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
import { Gender, ParticipantMetadata } from '@/types';
import { Users, Star, X } from 'lucide-react';
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
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 glass rounded-full px-4 py-2 shadow-2xl">
                <ControlBar variation="minimal" controls={{ chat: false, screenShare: true }} />
            </div>
        </LiveKitRoom>
    );
}

function RoomContent({ userGender, isHost, roomName }: { userGender: Gender; isHost: boolean; roomName: string }) {
    const [showParticipants, setShowParticipants] = useState(false);
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
    };

    return (
        <div className="relative h-[calc(100vh-80px)]">
            <GridLayout tracks={filteredTracks} style={{ height: '100%' }}>
                <ParticipantTile />
            </GridLayout>

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
            <div className={`${showParticipants ? 'w-80 translate-x-0' : 'w-80 translate-x-full'} transition-transform duration-300 ease-in-out fixed right-0 top-0 bottom-[80px] z-40 glass border-l border-slate-700/50`}>
                <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                    <h3 className="font-semibold text-white">
                        Participants ({visibleParticipants.length})
                    </h3>
                    <Button variant="ghost" size="icon" onClick={() => setShowParticipants(false)} className="text-slate-400 hover:text-white hover:bg-slate-700/50">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="p-4 h-[calc(100%-60px)] overflow-y-auto space-y-2">
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
                                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors border border-slate-700/30"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${participant.isLocal ? 'bg-emerald-500' : 'bg-blue-500'
                                        }`} />
                                    <span className="text-sm text-slate-200 truncate font-medium">
                                        {participant.identity}
                                        {participant.isLocal && ' (You)'}
                                    </span>
                                </div>
                                {isHost && !participant.isLocal && metadata && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => toggleSpotlight(participant.identity, participant.metadata || '')}
                                        className={`flex-shrink-0 hover:bg-slate-600/50 ${metadata.isSpotlighted ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'}`}
                                    >
                                        <Star className="w-4 h-4" fill={metadata.isSpotlighted ? 'currentColor' : 'none'} />
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
