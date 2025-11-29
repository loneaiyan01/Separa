"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import dynamic from "next/dynamic";
import { Shield, Loader2, ArrowLeft } from "lucide-react";
import LobbySelection from '@/components/LobbySelection';
import VideoRoom from '@/components/VideoRoom';
import ScrambleText from "@/components/landing/ScrambleText";
import TerminalWidget from "@/components/landing/TerminalWidget";
import Spotlight from "@/components/landing/Spotlight";
import ParallaxEffect from "@/components/landing/ParallaxEffect";
import { Gender } from '@/types';

const ParticleGlobe = dynamic(() => import("@/components/landing/ParticleGlobe"), { ssr: false });

export default function RoomPage() {
    const params = useParams();
    const router = useRouter();
    const roomId = params.roomId as string;

    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [roomData, setRoomData] = useState<any>(null);
    const [showLobby, setShowLobby] = useState(true);
    const [userGender, setUserGender] = useState<Gender>('male');
    const [isHost, setIsHost] = useState(false);

    useEffect(() => {
        const fetchRoomData = async () => {
            try {
                const roomRes = await fetch(`/api/rooms/${roomId}`);
                if (!roomRes.ok) {
                    throw new Error('Room not found');
                }
                const data = await roomRes.json();
                setRoomData(data);
            } catch (err) {
                console.error('Error fetching room:', err);
                setError(err instanceof Error ? err.message : 'Failed to load room');
            } finally {
                setLoading(false);
            }
        };

        if (roomId) {
            fetchRoomData();
        }
    }, [roomId]);

    const handleJoin = async (participantName: string, gender: Gender, isHostRole: boolean, password?: string, providedRoomId?: string) => {
        try {
            setLoading(true);

            // Use the provided roomId or the one from the URL
            const targetRoomId = providedRoomId || roomId;

            const tokenRes = await fetch('/api/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: targetRoomId,
                    participantName,
                    gender,
                    isHost: isHostRole,
                    roomPassword: password,
                }),
            });

            if (!tokenRes.ok) {
                const errorData = await tokenRes.json();
                throw new Error(errorData.error || 'Failed to join room');
            }

            const { token: roomToken } = await tokenRes.json();
            setToken(roomToken);
            setUserGender(gender);
            setIsHost(isHostRole);
            setShowLobby(false);
        } catch (err) {
            console.error('Error joining room:', err);
            setError(err instanceof Error ? err.message : 'Failed to join room');
        } finally {
            setLoading(false);
        }
    };

    const handleLeave = () => {
        router.push('/rooms');
    };

    // If token exists, show the video room (full screen)
    if (token) {
        return (
            <VideoRoom
                token={token}
                userGender={userGender}
                isHost={isHost}
                onLeave={handleLeave}
                roomName={roomData?.name || ''}
            />
        );
    }

    // Default Layout (Split Screen) for Lobby/Loading/Error
    return (
        <main className="min-h-screen w-full bg-[#020617] text-slate-200 overflow-hidden flex flex-col md:flex-row relative">
            {/* Spotlight Effect */}
            <Spotlight />

            {/* Parallax Effect */}
            <ParallaxEffect />

            {/* Left Section: The Narrative (60%) */}
            <section className="relative w-full md:w-[60%] h-[50vh] md:h-screen flex flex-col justify-center px-8 md:px-20 z-10">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/')}
                    className="absolute top-8 left-8 z-20 flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-800/80 hover:border-emerald-500/50 transition-all backdrop-blur-sm"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Home
                </button>

                {/* Background Globe - Moves slowly opposite (data-speed="-1") */}
                <div className="absolute inset-0 z-0" data-speed="-1">
                    <ParticleGlobe />
                </div>

                {/* Content - Left Aligned - Moves slightly with mouse (data-speed="2") */}
                <div className="relative z-10 max-w-[650px] flex flex-col items-start" data-speed="2">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight text-white">
                        <ScrambleText text="Secure." className="block text-cyan-400" />
                        <ScrambleText text="Private." className="block" />
                        <ScrambleText text="Connected." className="block" />
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 max-w-lg mb-8 leading-relaxed">
                        {roomData ? `You are joining "${roomData.name}".` : "Connecting to secure room..."}
                        <br />
                        Please verify your identity before entering.
                    </p>
                </div>

                {/* Terminal Widget - Anchored to bottom-left */}
                <TerminalWidget />
            </section>

            {/* The Bridge (Divider) */}
            <div className="hidden md:block absolute left-[60%] top-[10%] bottom-[10%] w-[1px] bg-gradient-to-b from-transparent via-[rgba(0,240,255,0.5)] to-transparent z-20">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#020617] p-[10px] rounded-full border border-[rgba(0,240,255,0.3)] text-[#00F0FF]">
                    <Shield className="w-5 h-5" />
                </div>
            </div>

            {/* Right Section: The Lobby (40%) */}
            <section className="relative w-full md:w-[40%] h-[50vh] md:h-screen flex items-center justify-center bg-[linear-gradient(225deg,rgba(30,41,59,0.4)_0%,rgba(2,6,23,0)_100%)] backdrop-blur-[10px] z-10 p-4">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

                {loading && !roomData && (
                    <div className="glass-card rounded-2xl p-8 flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                        <p className="text-slate-300">Loading room details...</p>
                    </div>
                )}

                {error && (
                    <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center">
                        <h2 className="text-2xl font-bold text-red-400 mb-4">Room Not Found</h2>
                        <p className="text-slate-300 mb-6">
                            {error === 'Room not found'
                                ? 'This room doesn\'t exist or may have been deleted.'
                                : error}
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => router.push('/')}
                                className="glass-button text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-500/20 transition-all"
                            >
                                Go to Home
                            </button>
                            <button
                                onClick={() => router.push('/rooms')}
                                className="glass-subtle text-slate-300 px-6 py-3 rounded-lg font-semibold hover:bg-slate-700/50 transition-all"
                            >
                                Browse Rooms
                            </button>
                        </div>
                    </div>
                )}

                {showLobby && roomData && (
                    <div className="w-full max-w-[480px]">
                        <LobbySelection
                            onJoin={handleJoin}
                            roomId={roomId}
                            roomName={roomData.name}
                        />
                    </div>
                )}
            </section>
        </main>
    );
}
