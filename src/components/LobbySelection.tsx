"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Gender } from "@/types";
import { User, ShieldCheck, Crown, ArrowLeft, Lock, History, Plus, Mic, MicOff, Video, VideoOff } from "lucide-react";
import CreateRoomModal from "@/components/CreateRoomModal";

interface LobbySelectionProps {
    onJoin: (name: string, gender: Gender, isHost: boolean, roomPassword?: string, roomId?: string, initialMic?: boolean, initialCam?: boolean) => Promise<void>;
    roomId?: string;
    roomName?: string;
}

type WorkflowStep = 1 | 2;
type RoleStep = 'brother-joining' | 'sister-password' | 'host-password';

export default function LobbySelection({ onJoin, roomId, roomName }: LobbySelectionProps) {
    // 2-step workflow state
    // If roomId is provided via URL, skip Step 1 and go directly to Step 2
    const [step, setStep] = useState<WorkflowStep>(roomId ? 2 : 1);
    const [enteredRoomID, setEnteredRoomID] = useState<string>("");
    const [displayName, setDisplayName] = useState("");

    // Role/password state
    const [selectedRole, setSelectedRole] = useState<'brother' | 'sister' | 'host'>('brother');
    const [roleStep, setRoleStep] = useState<RoleStep | null>(null);
    const [hostPassword, setHostPassword] = useState("");
    const [sisterPassword, setSisterPassword] = useState("");
    const [roomPassword, setRoomPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [roomInfo, setRoomInfo] = useState<{ locked: boolean; name: string } | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [roomHistory, setRoomHistory] = useState<Array<{ id: string; name: string; lastJoined: string }>>([]);
    const [showSettings, setShowSettings] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [isCameraLoading, setIsCameraLoading] = useState(false);
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
    const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
    const searchParams = useSearchParams();
    const [isMicEnabled, setIsMicEnabled] = useState(searchParams.get('audio') !== 'false');
    const [isCamEnabled, setIsCamEnabled] = useState(searchParams.get('video') !== 'false');

    // Audio visualization ref
    const micBarRef = useRef<HTMLDivElement>(null);

    // Load room info and stored password when component mounts with roomId
    useEffect(() => {
        const fetchRoomInfo = async () => {
            if (roomId) {
                // If roomId exists, skip to Step 2
                setStep(2);

                try {
                    const res = await fetch(`/api/rooms/${roomId}`);
                    if (res.ok) {
                        const room = await res.json();
                        setRoomInfo({ locked: room.locked, name: room.name });

                        // Check for stored password from RoomCard
                        const storedPassword = sessionStorage.getItem(`room_${roomId}_password`);
                        if (storedPassword) {
                            setRoomPassword(storedPassword);
                            sessionStorage.removeItem(`room_${roomId}_password`);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching room info:', error);
                }
            }
        };

        fetchRoomInfo();

        // Load room history from localStorage
        const loadRoomHistory = () => {
            try {
                const history = localStorage.getItem('room_history');
                if (history) {
                    const parsed = JSON.parse(history);
                    setRoomHistory(parsed.slice(0, 3)); // Show only last 3 rooms
                }
            } catch (error) {
                console.error('Error loading room history:', error);
            }
        };

        loadRoomHistory();
    }, [roomId]);

    // Step 1: Validate room ID and proceed to step 2
    const handleContinueToStep2 = async (roomIdOverride?: string) => {
        setError("");
        setIsLoading(true);

        const idToValidate = roomIdOverride || enteredRoomID;

        if (!idToValidate.trim()) {
            setError("Please enter a Room ID.");
            setIsLoading(false);
            return;
        }

        // Validate that the room exists
        try {
            const res = await fetch(`/api/rooms/${idToValidate.trim()}`);

            if (!res.ok) {
                if (res.status === 404) {
                    setError("Room not found. Please check the Room ID and try again.");
                } else {
                    setError("Failed to validate room. Please try again.");
                }
                setIsLoading(false);
                return;
            }

            // Get room info to check if locked
            const room = await res.json();
            setRoomInfo({ locked: room.locked, name: room.name });

            // Check if there's a stored password from RoomCard
            const storedPassword = sessionStorage.getItem(`room_${idToValidate.trim()}_password`);
            if (storedPassword) {
                setRoomPassword(storedPassword);
                sessionStorage.removeItem(`room_${idToValidate.trim()}_password`);
            }

            // Room exists, proceed to step 2
            setStep(2);
            setIsLoading(false);
        } catch (error) {
            console.error('Error validating room:', error);
            setError("Failed to validate room. Please try again.");
            setIsLoading(false);
        }
    };

    // Step 2: Go back to step 1
    const handleBackToStep1 = () => {
        setError("");
        setStep(1);
        setRoleStep(null);
        setHostPassword("");
        setSisterPassword("");
        setIsLoading(false);
    };

    // Save room to history
    const saveToHistory = (roomId: string, roomName: string) => {
        try {
            const history = localStorage.getItem('room_history');
            let rooms = history ? JSON.parse(history) : [];

            // Remove existing entry if present
            rooms = rooms.filter((r: any) => r.id !== roomId);

            // Add to beginning
            rooms.unshift({
                id: roomId,
                name: roomName,
                lastJoined: new Date().toISOString()
            });

            // Keep only last 10 rooms
            rooms = rooms.slice(0, 10);

            localStorage.setItem('room_history', JSON.stringify(rooms));
        } catch (error) {
            console.error('Error saving to history:', error);
        }
    };

    // Handle initial role selection (just updates state)
    const handleRoleSelectionChange = (role: 'brother' | 'sister' | 'host') => {
        setSelectedRole(role);
        setError("");
    };

    // Handle proceeding from role selection
    const handleProceed = async () => {
        setError("");

        if (!displayName.trim()) {
            setError("Please enter your display name first.");
            return;
        }

        const actualRoomId = roomId || enteredRoomID;

        // Save to history before joining
        if (actualRoomId) {
            saveToHistory(actualRoomId, roomInfo?.name || 'Unknown Room');
        }

        if (selectedRole === 'brother') {
            setRoleStep('brother-joining');
            setIsLoading(true);
            try {
                await onJoin(displayName, 'male', false, roomPassword || undefined, actualRoomId, isMicEnabled, isCamEnabled);
            } catch (err: any) {
                setError(err.message || "Failed to join. Please try again.");
                setIsLoading(false);
                setRoleStep(null);
            }
        } else if (selectedRole === 'sister') {
            setRoleStep('sister-password');
        } else if (selectedRole === 'host') {
            setRoleStep('host-password');
        }
    };

    // Handle password submission for Sister/Host
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setError("");
        setIsLoading(true);

        const hostPwd = process.env.NEXT_PUBLIC_HOST_PASSWORD;
        // Fallback to 'sister' if env var is missing, for smoother dev experience
        const sisterPwd = process.env.NEXT_PUBLIC_SISTER_PASSWORD || 'sister';
        const actualRoomId = roomId || enteredRoomID;

        if (roleStep === 'host-password') {
            if (hostPassword !== hostPwd) {
                setError("Incorrect host password. Please try again.");
                setIsLoading(false);
                return;
            }
            try {
                await onJoin(displayName, 'host', true, roomPassword || undefined, actualRoomId, isMicEnabled, isCamEnabled);
            } catch (err: any) {
                setError(err.message || "Failed to join. Please try again.");
                setIsLoading(false);
            }
        } else if (roleStep === 'sister-password') {
            if (sisterPassword !== sisterPwd) {
                setError("Incorrect sister password. Please try again.");
                setIsLoading(false);
                return;
            }
            try {
                await onJoin(displayName, 'female', false, roomPassword || undefined, actualRoomId, isMicEnabled, isCamEnabled);
            } catch (err: any) {
                setError(err.message || "Failed to join. Please try again.");
                setIsLoading(false);
            }
        }
    };

    // Back from password screen to role selection
    const handleBackToRoleSelection = () => {
        setError("");
        setRoleStep(null);
        setHostPassword("");
        setSisterPassword("");
        setIsLoading(false);
    };

    // Handle room creation
    const handleCreateRoom = async (roomData: {
        name: string;
        description: string;
        template: any;
        locked: boolean;
        password?: string;
        sessionPassword?: string;
    }) => {
        try {
            // Add the required 'creator' field
            const requestData = {
                ...roomData,
                creator: 'anonymous' // Default creator since we don't have auth yet
            };

            const res = await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to create room');
            }

            const room = await res.json();

            // Save to history
            saveToHistory(room.id, room.name);

            // Redirect to the new room
            window.location.href = `/?room=${room.id}`;
        } catch (error) {
            console.error('Error creating room:', error);
            throw error;
        }
    };
    // Camera preview functions
    const startCameraPreview = async () => {
        try {
            setIsCameraLoading(true);

            // Request access to video and audio
            const constraints: MediaStreamConstraints = {
                video: selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true,
                audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            setCameraStream(stream);
            setIsCameraLoading(false);

            // Enumerate devices after permission is granted
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter(device => device.kind === 'videoinput');
            const audioInputs = devices.filter(device => device.kind === 'audioinput');

            setVideoDevices(videoInputs);
            setAudioDevices(audioInputs);

            // Set default selected devices if not set
            if (!selectedVideoDevice && videoInputs.length > 0) {
                const videoTrack = stream.getVideoTracks()[0];
                const currentDeviceId = videoTrack?.getSettings().deviceId;
                if (currentDeviceId) setSelectedVideoDevice(currentDeviceId);
                else setSelectedVideoDevice(videoInputs[0].deviceId);
            }

            if (!selectedAudioDevice && audioInputs.length > 0) {
                const audioTrack = stream.getAudioTracks()[0];
                const currentDeviceId = audioTrack?.getSettings().deviceId;
                if (currentDeviceId) setSelectedAudioDevice(currentDeviceId);
                else setSelectedAudioDevice(audioInputs[0].deviceId);
            }

            console.log("Camera started successfully!");
        } catch (err: any) {
            console.error("Error accessing media devices:", err);

            // Provide specific error messages based on error type
            let errorMessage = "Could not access camera/microphone.";

            if (err.name === 'NotReadableError') {
                errorMessage = "Camera/microphone is in use by another application. Please close other apps using your camera/mic and try again.";
            } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMessage = "Camera/microphone permission denied. Please allow access in your browser settings.";
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                errorMessage = "No camera/microphone found. Please connect a device and try again.";
            } else if (err.name === 'OverconstrainedError') {
                errorMessage = "Selected device not available. Trying with default device...";
                // Retry with default devices
                setTimeout(() => {
                    setSelectedVideoDevice("");
                    setSelectedAudioDevice("");
                    startCameraPreview();
                }, 1000);
            }

            setError(errorMessage);
            setIsCameraLoading(false);
        }
    };

    const stopCameraPreview = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
    };

    const switchCamera = async (deviceId: string) => {
        try {
            setSelectedVideoDevice(deviceId);
            setIsCameraLoading(true);

            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: deviceId } },
                audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true
            });

            setCameraStream(stream);
            setIsCameraLoading(false);
        } catch (err) {
            console.error("Error switching camera:", err);
            setIsCameraLoading(false);
        }
    };

    const switchAudio = async (deviceId: string) => {
        try {
            setSelectedAudioDevice(deviceId);
            setIsCameraLoading(true);

            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true,
                audio: { deviceId: { exact: deviceId } }
            });

            setCameraStream(stream);
            setIsCameraLoading(false);
        } catch (err) {
            console.error("Error switching audio:", err);
            setIsCameraLoading(false);
        }
    };

    const toggleMic = () => {
        if (cameraStream) {
            const audioTracks = cameraStream.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = !isMicEnabled;
            });
            setIsMicEnabled(!isMicEnabled);
        }
    };

    const toggleCam = () => {
        if (cameraStream) {
            const videoTracks = cameraStream.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = !isCamEnabled;
            });
            setIsCamEnabled(!isCamEnabled);
        }
    };

    // Handle settings toggle - start/stop camera
    useEffect(() => {
        if (showSettings) {
            startCameraPreview();
        } else {
            stopCameraPreview();
        }

        // Cleanup on unmount
        return () => {
            stopCameraPreview();
        };
    }, [showSettings]);

    // Audio visualization effect
    useEffect(() => {
        if (!cameraStream) {
            if (micBarRef.current) micBarRef.current.style.width = '0%';
            return;
        }

        let animationFrameId: number;
        let audioContext: AudioContext;
        let analyser: AnalyserNode;

        if (cameraStream.getAudioTracks().length > 0) {
            try {
                console.log('[Audio Viz] Starting audio visualization...');
                console.log('[Audio Viz] Audio tracks:', cameraStream.getAudioTracks());

                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                audioContext = new AudioContextClass();

                console.log('[Audio Viz] AudioContext state:', audioContext.state);

                if (audioContext.state === 'suspended') {
                    audioContext.resume().then(() => {
                        console.log('[Audio Viz] AudioContext resumed, new state:', audioContext.state);
                    });
                }

                analyser = audioContext.createAnalyser();
                const microphone = audioContext.createMediaStreamSource(cameraStream);
                microphone.connect(analyser);

                analyser.smoothingTimeConstant = 0.8;
                analyser.fftSize = 1024;

                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);

                console.log('[Audio Viz] Analyser configured, bufferLength:', bufferLength);

                const updateAudioLevel = () => {
                    if (!micBarRef.current) {
                        console.warn('[Audio Viz] micBarRef.current is null, stopping animation');
                        return;
                    }

                    analyser.getByteFrequencyData(dataArray);
                    let sum = 0;
                    for (let i = 0; i < bufferLength; i++) {
                        sum += dataArray[i];
                    }
                    const average = sum / bufferLength;

                    // Map volume (0-100) to percentage
                    // Multiply by 2 as requested
                    const volumePercent = Math.min(100, average * 2);

                    // Debug: Log every 60 frames (once per second at 60fps)
                    if (Math.random() < 0.016) {
                        console.log('[Audio Viz] average:', average, 'volumePercent:', volumePercent, 'sum:', sum);
                    }

                    // Update the CSS Bar directly
                    micBarRef.current.style.width = volumePercent + '%';

                    // Change color if too loud (clipping)
                    if (volumePercent > 90) {
                        micBarRef.current.style.background = '#FF0055'; // Red
                    } else {
                        micBarRef.current.style.background = '#00F0FF'; // Cyan
                    }

                    animationFrameId = requestAnimationFrame(updateAudioLevel);
                };

                updateAudioLevel();
                console.log('[Audio Viz] Animation loop started');
            } catch (e) {
                console.error("Audio viz error:", e);
            }
        } else {
            console.warn('[Audio Viz] No audio tracks found in stream');
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (audioContext) audioContext.close();
        };
    }, [cameraStream]);

    // Update video element when stream changes
    useEffect(() => {
        const videoElement = document.getElementById('local-preview') as HTMLVideoElement;
        if (videoElement && cameraStream) {
            videoElement.srcObject = cameraStream;
            videoElement.play().catch(err => console.error("Error playing video:", err));
        }
    }, [cameraStream]);

    // Determine the room ID to display (from URL param or user input)
    const displayRoomID = roomId || enteredRoomID;
    const displayRoomName = roomName;

    return (
        <>
            {/* Create Room Modal */}
            <CreateRoomModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreateRoom={handleCreateRoom}
            />

            <div className={`cards-wrapper ${showSettings ? 'settings-open' : ''}`}>
                <Card className="w-full max-w-md glass-strong glass-panel frosted-edge border-0 shadow-2xl p-6 md:p-10 animate-scale-in mx-auto login-panel">
                    {/* Only show header on Step 1 */}
                    {step === 1 && (
                        <CardHeader className="text-center space-y-2 pb-6 px-0">
                            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/30 to-emerald-600/30 rounded-2xl flex items-center justify-center mb-3 pulse-glow">
                                <ShieldCheck className="w-10 h-10 text-primary" />
                            </div>
                            <CardTitle className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                                Separa
                            </CardTitle>
                            <CardDescription className="text-slate-300 text-base">
                                Secure, gender‑segregated video conferencing.
                            </CardDescription>
                        </CardHeader>
                    )}

                    <CardContent className="space-y-5 px-0">
                        {/* Error Display */}
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
                                {error}
                            </div>
                        )}

                        {/* STEP 1: Room Entry */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="space-y-2">
                                    <label htmlFor="roomId" className="text-sm font-medium text-slate-300">
                                        Enter Room ID
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10" />
                                        <Input
                                            id="roomId"
                                            placeholder="Enter room code"
                                            value={enteredRoomID}
                                            onChange={(e) => setEnteredRoomID(e.target.value)}
                                            className="glass-input w-full h-12 pl-10 pr-4 text-white placeholder:text-slate-500 rounded-lg"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleContinueToStep2();
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={() => handleContinueToStep2()}
                                    className="glass-button premium-glow w-full h-12 md:h-14 text-white font-semibold transition-all hover:scale-[1.02] active:micro-bounce"
                                    disabled={!enteredRoomID.trim() || isLoading}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            Validating...
                                        </span>
                                    ) : 'Continue'}
                                </Button>

                                {/* Create Room Button - Glass effect like history items */}
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(true)}
                                    className="glass-subtle w-full h-12 md:h-14 px-4 rounded-lg border-2 border-emerald-500/50 hover:border-emerald-500 text-emerald-400 hover:text-emerald-300 transition-all hover:scale-[1.02] active:micro-bounce premium-glow flex items-center justify-center gap-2 font-semibold"
                                >
                                    <Plus className="h-5 w-5" />
                                    Create New Room
                                </button>

                                {/* History Section */}
                                <div className="pt-2 border-t border-slate-700/50">
                                    <Button
                                        type="button"
                                        onClick={() => window.location.href = '/rooms'}
                                        variant="ghost"
                                        className="w-full text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                                    >
                                        <History className="mr-2 h-4 w-4" />
                                        History
                                    </Button>

                                    {/* Show recent rooms if available */}
                                    {roomHistory.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            <p className="text-xs text-slate-500 px-2">Recently Joined:</p>
                                            {roomHistory.map((room, index) => (
                                                <button
                                                    key={room.id}
                                                    onClick={async () => {
                                                        setEnteredRoomID(room.id);
                                                        handleContinueToStep2(room.id);
                                                    }}
                                                    className="glass-subtle w-full text-left px-3 py-2 rounded-lg transition-all hover:scale-[1.01] border border-slate-700/30 hover:border-emerald-500/30 group animate-slide-up"
                                                    style={{ animationDelay: `${index * 0.05}s` }}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-white font-medium truncate group-hover:text-emerald-400 transition-colors">
                                                                {room.name}
                                                            </p>
                                                            <p className="text-xs text-slate-500 truncate">
                                                                {room.id}
                                                            </p>
                                                        </div>
                                                        <div className="text-xs text-slate-600 ml-2">
                                                            {new Date(room.lastJoined).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Identity & Role Selection (No password prompt yet) */}
                        {step === 2 && roleStep === null && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Back Button - Only show if we came from Step 1 (no roomId prop) */}
                                {!roomId && (
                                    <div className="flex items-center gap-2 mb-2">
                                        <Button
                                            onClick={handleBackToStep1}
                                            variant="ghost"
                                            size="sm"
                                            className="text-slate-400 hover:text-white -ml-2"
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-1" />
                                            Back
                                        </Button>
                                    </div>
                                )}

                                {/* Input Row: Room ID and Display Name Side-by-Side */}
                                <div className="input-row">
                                    {/* Group 1: Room ID (Read Only) */}
                                    <div className="space-y-2">
                                        <label htmlFor="roomIdDisplay" className="text-sm font-medium text-slate-300">
                                            Room ID
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400 z-10" />
                                            <Input
                                                id="roomIdDisplay"
                                                value={displayRoomID}
                                                readOnly
                                                className="glass-input w-full h-12 pl-10 pr-4 text-emerald-400 font-mono font-bold rounded-lg cursor-default"
                                            />
                                        </div>
                                    </div>

                                    {/* Group 2: Display Name */}
                                    <div className="space-y-2">
                                        <label htmlFor="displayName" className="text-sm font-medium text-slate-300">
                                            Display Name
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10" />
                                            <Input
                                                id="displayName"
                                                placeholder="Enter your name"
                                                value={displayName}
                                                onChange={(e) => setDisplayName(e.target.value)}
                                                className="glass-input w-full h-12 pl-10 pr-4 text-white placeholder:text-slate-500 rounded-lg"
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Copy Invite Link Button */}
                                <div className="mb-4">
                                    <Button
                                        onClick={() => {
                                            const url = `${window.location.origin}/room/${displayRoomID}`;
                                            navigator.clipboard.writeText(url);
                                            const btn = document.getElementById('copy-link-btn');
                                            if (btn) {
                                                const originalText = btn.innerText;
                                                btn.innerText = 'Copied!';
                                                setTimeout(() => btn.innerText = originalText, 2000);
                                            }
                                        }}
                                        variant="outline"
                                        size="sm"
                                        id="copy-link-btn"
                                        className="w-full text-xs h-8 border-slate-600 text-slate-300 hover:text-white hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all"
                                    >
                                        Copy Invite Link
                                    </Button>
                                </div>

                                {/* Room Password (only if room requires it) */}
                                {(roomId || enteredRoomID) && roomInfo?.locked && (
                                    <div className="space-y-2 mb-4">
                                        <label htmlFor="roomPassword" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                            Room Password
                                            {roomInfo?.locked && <span className="text-xs text-red-400 font-bold">(Required)</span>}
                                        </label>
                                        <div className="relative">
                                            <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 z-10 ${roomInfo?.locked ? 'text-amber-400' : 'text-slate-400'}`} />
                                            <Input
                                                id="roomPassword"
                                                type="password"
                                                placeholder={roomInfo?.locked ? "Enter room password (required)" : "Enter room password"}
                                                value={roomPassword}
                                                onChange={(e) => setRoomPassword(e.target.value)}
                                                className={`glass-input w-full h-12 pl-10 pr-4 text-white placeholder:text-slate-500 rounded-lg ${roomInfo?.locked ? 'border-amber-500/50' : ''}`}
                                                required={roomInfo?.locked}
                                            />
                                        </div>
                                        {roomInfo?.locked && !roomPassword && (
                                            <p className="text-xs text-amber-400">This room is locked and requires a password</p>
                                        )}
                                    </div>
                                )}

                                <label className="text-sm font-medium text-slate-300 block mb-3">Select Your Identity</label>

                                {/* Identity Grid */}
                                <div className="identity-grid">
                                    {/* Brother Option */}
                                    <label className={`identity-card male ${displayName.trim() ? '' : 'opacity-50 cursor-not-allowed'} ${selectedRole === 'brother' ? 'ring-2 ring-emerald-500' : ''}`}>
                                        <input
                                            type="radio"
                                            name="role"
                                            value="brother"
                                            checked={selectedRole === 'brother'}
                                            onChange={() => handleRoleSelectionChange("brother")}
                                            disabled={!displayName.trim()}
                                        />
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2 border border-emerald-500/30 text-emerald-400">
                                                <User className="w-6 h-6" />
                                            </div>
                                            <span className="role-title">Brother</span>
                                            <span className="role-desc">Join Male Section</span>
                                        </div>
                                    </label>

                                    {/* Sister Option */}
                                    <label className={`identity-card female ${displayName.trim() ? '' : 'opacity-50 cursor-not-allowed'} ${selectedRole === 'sister' ? 'ring-2 ring-rose-500' : ''}`}>
                                        <input
                                            type="radio"
                                            name="role"
                                            value="sister"
                                            checked={selectedRole === 'sister'}
                                            onChange={() => handleRoleSelectionChange("sister")}
                                            disabled={!displayName.trim()}
                                        />
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center mb-2 border border-rose-500/30 text-rose-400">
                                                <User className="w-6 h-6" />
                                            </div>
                                            <span className="role-title">Sister</span>
                                            <span className="role-desc">Join Female Section</span>
                                        </div>
                                    </label>
                                </div>

                                {/* Join Button */}
                                <Button
                                    onClick={handleProceed}
                                    className={`w-full h-12 text-white font-semibold transition-all shadow-md mt-4 ${selectedRole === 'brother' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                        selectedRole === 'sister' ? 'bg-rose-600 hover:bg-rose-700' :
                                            'bg-slate-600 hover:bg-slate-700'
                                        }`}
                                    disabled={!displayName.trim() || isLoading}
                                >
                                    {isLoading ? 'Joining...' : `Join as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`}
                                </Button>

                                {/* Admin Link */}
                                <div className="admin-footer">
                                    <button
                                        onClick={() => handleRoleSelectionChange("host")}
                                        className={`admin-link hover:text-amber-400 transition-colors ${selectedRole === 'host' ? 'text-amber-400 font-bold' : ''}`}
                                        disabled={!displayName.trim()}
                                    >
                                        <Lock className="w-3 h-3" />
                                        Are you the Host?
                                    </button>
                                </div>

                                {/* Settings Link */}
                                <div className="settings-footer">
                                    <button
                                        onClick={() => setShowSettings(!showSettings)}
                                        className="text-link-btn"
                                    >
                                        ⚙️ Settings
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Password Entry (Sister or Host) */}
                        {(roleStep === 'sister-password' || roleStep === 'host-password') && (
                            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center gap-2 mb-2">
                                    <Button
                                        onClick={handleBackToRoleSelection}
                                        variant="ghost"
                                        size="sm"
                                        className="text-slate-400 hover:text-white -ml-2"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-1" />
                                        Back
                                    </Button>
                                </div>

                                {/* Role indicator card */}
                                <div className={`p-3 rounded-lg border ${roleStep === 'host-password'
                                    ? 'bg-amber-500/10 border-amber-500/30'
                                    : 'bg-rose-500/10 border-rose-500/30'
                                    }`}>
                                    <p className="text-sm text-slate-300">
                                        Joining as <strong className="text-white">{displayName}</strong> • <strong className={roleStep === 'host-password' ? 'text-amber-400' : 'text-rose-400'}>
                                            {roleStep === 'host-password' ? 'Host' : 'Sister'}
                                        </strong>
                                    </p>
                                </div>

                                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                                    <div className="space-y-2">
                                        <label htmlFor="rolePassword" className="text-sm font-medium text-slate-300">
                                            {roleStep === 'host-password' ? 'Host Password' : 'Sister Password'}
                                        </label>
                                    </div>

                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10" />
                                        <Input
                                            id="rolePassword"
                                            type="password"
                                            placeholder={`Enter ${roleStep === 'host-password' ? 'host' : 'sister'} password`}
                                            value={roleStep === 'host-password' ? hostPassword : sisterPassword}
                                            onChange={(e) => roleStep === 'host-password' ? setHostPassword(e.target.value) : setSisterPassword(e.target.value)}
                                            className="glass-input w-full h-12 pl-10 pr-4 text-white placeholder:text-slate-500 rounded-lg"
                                            autoFocus
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        className={`w-full h-12 text-white transition-all shadow-md ${roleStep === 'host-password'
                                            ? 'bg-amber-600 hover:bg-amber-700'
                                            : 'bg-rose-600 hover:bg-rose-700'
                                            }`}
                                        disabled={isLoading || (roleStep === 'host-password' ? !hostPassword : !sisterPassword)}
                                    >
                                        {roleStep === 'host-password' ? <Crown className="mr-2 h-5 w-5" /> : <User className="mr-2 h-5 w-5" />}
                                        {isLoading ? 'Joining...' : `Join as ${roleStep === 'host-password' ? 'Host' : 'Sister'}`}
                                    </Button>
                                </form>
                            </div>
                        )}

                        {/* Loading State for Brother Joining */}
                        {roleStep === 'brother-joining' && (
                            <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-in fade-in duration-300">
                                <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                                <p className="text-emerald-400 font-medium">Joining as Brother...</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Preview Panel */}
                <Card className="glass-strong glass-panel frosted-edge border-0 shadow-2xl preview-panel">
                    <CardContent className="px-0">
                        <h3 className="preview-panel-title">Audio/Video Check</h3>

                        {/* Video Preview */}
                        <div className={`video-preview ${isCameraLoading ? 'loading' : ''}`}>
                            {!cameraStream && !isCameraLoading && (
                                <div className="video-preview-placeholder">
                                    📹 Camera preview will appear here
                                </div>
                            )}
                            {isCameraLoading && (
                                <div className="video-preview-placeholder">
                                    Loading camera...
                                </div>
                            )}
                            <video
                                id="local-preview"
                                autoPlay
                                muted
                                playsInline
                                style={{ display: cameraStream ? 'block' : 'none' }}
                            />
                        </div>

                        {/* Device Controls */}
                        <div className="device-controls">
                            <div className="device-control-group">
                                <label className="device-control-label">Camera</label>
                                <select
                                    className="device-select"
                                    value={selectedVideoDevice}
                                    onChange={(e) => switchCamera(e.target.value)}
                                >
                                    {videoDevices.length === 0 && <option>Default Camera</option>}
                                    {videoDevices.map((device, index) => (
                                        <option key={device.deviceId} value={device.deviceId}>
                                            {device.label || `Camera ${index + 1}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="device-control-group">
                                <label className="device-control-label">Microphone</label>
                                <div className="flex flex-col gap-2">
                                    <select
                                        className="device-select"
                                        value={selectedAudioDevice}
                                        onChange={(e) => switchAudio(e.target.value)}
                                    >
                                        {audioDevices.length === 0 && <option>Default Microphone</option>}
                                        {audioDevices.map((device, index) => (
                                            <option key={device.deviceId} value={device.deviceId}>
                                                {device.label || `Microphone ${index + 1}`}
                                            </option>
                                        ))}
                                    </select>
                                    {/* Audio Meter */}
                                    <div className="mic-test-container">
                                        <div className="mic-icon">🎤</div>
                                        <div className="mic-bar-wrapper">
                                            <div ref={micBarRef} className="mic-bar-fill"></div>
                                        </div>
                                    </div>
                                    <p className="mic-status-text">Speak to test...</p>
                                </div>
                            </div>
                        </div>

                        {/* Pre-Join Control Bar */}
                        <div className="preview-controls-footer">
                            {/* Mic Toggle */}
                            <button
                                onClick={toggleMic}
                                className={`circle-control-btn ${isMicEnabled ? 'active' : 'off'}`}
                                title={isMicEnabled ? "Mute Microphone" : "Unmute Microphone"}
                            >
                                {isMicEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                            </button>

                            {/* Camera Toggle */}
                            <button
                                onClick={toggleCam}
                                className={`circle-control-btn ${isCamEnabled ? 'active' : 'off'}`}
                                title={isCamEnabled ? "Turn Off Camera" : "Turn On Camera"}
                            >
                                {isCamEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
