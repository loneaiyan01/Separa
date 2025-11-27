"use client";

import { useState } from "react";
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
import { User, ShieldCheck, Crown, ArrowLeft, Lock } from "lucide-react";

interface LobbySelectionProps {
    onJoin: (name: string, gender: Gender, isHost: boolean, roomPassword?: string) => void;
    roomId?: string;
    roomName?: string;
}

type WorkflowStep = 1 | 2;
type RoleStep = 'brother-joining' | 'sister-password' | 'host-password';

export default function LobbySelection({ onJoin, roomId, roomName }: LobbySelectionProps) {
    // 2-step workflow state
    const [step, setStep] = useState<WorkflowStep>(1);
    const [enteredRoomID, setEnteredRoomID] = useState<string>("");
    const [displayName, setDisplayName] = useState("");
    
    // Role/password state
    const [roleStep, setRoleStep] = useState<RoleStep | null>(null);
    const [hostPassword, setHostPassword] = useState("");
    const [sisterPassword, setSisterPassword] = useState("");
    const [roomPassword, setRoomPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Step 1: Validate and proceed to step 2
    const handleContinueToStep2 = () => {
        setError("");
        
        if (!enteredRoomID.trim()) {
            setError("Please enter a Room ID.");
            return;
        }
        
        setStep(2);
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

    // Step 2: Handle role selection
    const handleRoleSelect = async (role: 'brother' | 'sister' | 'host') => {
        setError("");

        if (!displayName.trim()) {
            setError("Please enter your display name first.");
            return;
        }

        if (role === 'brother') {
            setRoleStep('brother-joining');
            setIsLoading(true);
            try {
                onJoin(displayName, 'male', false, roomPassword || undefined);
            } catch (err) {
                setError("Failed to join. Please try again.");
                setIsLoading(false);
                setRoleStep(null);
            }
        } else if (role === 'sister') {
            setRoleStep('sister-password');
        } else if (role === 'host') {
            setRoleStep('host-password');
        }
    };

    // Handle password submission for Sister/Host
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setError("");
        setIsLoading(true);

        const hostPwd = process.env.NEXT_PUBLIC_HOST_PASSWORD;
        const sisterPwd = process.env.NEXT_PUBLIC_SISTER_PASSWORD;

        if (roleStep === 'host-password') {
            if (hostPassword !== hostPwd) {
                setError("Incorrect host password. Please try again.");
                setIsLoading(false);
                return;
            }
            try {
                onJoin(displayName, 'host', true, roomPassword || undefined);
            } catch (err) {
                setError("Failed to join. Please try again.");
                setIsLoading(false);
            }
        } else if (roleStep === 'sister-password') {
            if (sisterPassword !== sisterPwd) {
                setError("Incorrect sister password. Please try again.");
                setIsLoading(false);
                return;
            }
            try {
                onJoin(displayName, 'female', false, roomPassword || undefined);
            } catch (err) {
                setError("Failed to join. Please try again.");
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

    // Determine the room ID to display (from URL param or user input)
    const displayRoomID = roomId || enteredRoomID;
    const displayRoomName = roomName;

    return (
        <div className="flex items-center justify-center min-h-screen p-4 md:p-6">
            <Card className="w-full max-w-md glass border-0 shadow-2xl p-6 md:p-10">
                <CardHeader className="text-center space-y-2 pb-6 px-0">
                    <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight text-white">Separa</CardTitle>
                    <CardDescription className="text-slate-300">
                        {step === 1 ? (
                            "Secure, gender‑segregated video conferencing."
                        ) : (
                            <span>Joining: <strong>{displayRoomName || displayRoomID}</strong></span>
                        )}
                    </CardDescription>
                </CardHeader>

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
                                <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 transition-colors duration-200 hover:bg-slate-700/70 focus-within:border-primary">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                    <Input
                                        id="roomId"
                                        placeholder="Enter room code"
                                        value={enteredRoomID}
                                        onChange={(e) => setEnteredRoomID(e.target.value)}
                                        className="flex-1 bg-transparent border-none text-white placeholder:text-slate-500 focus:outline-none focus:ring-0"
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
                                onClick={handleContinueToStep2}
                                className="w-full h-12 md:h-14 bg-primary hover:bg-primary/90 text-white transition-all hover:scale-[1.02] shadow-md"
                                disabled={!enteredRoomID.trim()}
                            >
                                Continue
                            </Button>

                            {/* Browse Rooms Footer */}
                            <div className="pt-2 border-t border-slate-700/50">
                                <Button
                                    type="button"
                                    onClick={() => window.location.href = '/rooms'}
                                    variant="ghost"
                                    className="w-full text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                                >
                                    Browse Existing Rooms
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Identity & Role Selection (No password prompt yet) */}
                    {step === 2 && roleStep === null && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Back Button */}
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

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="displayName" className="text-sm font-medium text-slate-300">
                                        Display Name
                                    </label>
                                    <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 transition-colors duration-200 hover:bg-slate-700/70 focus-within:border-primary">
                                        <User className="h-5 w-5 text-slate-400" />
                                        <Input
                                            id="displayName"
                                            placeholder="Enter your name"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="flex-1 bg-transparent border-none text-white placeholder:text-slate-500 focus:outline-none focus:ring-0"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                {/* Room Password (if joining a specific room via URL) */}
                                {roomId && (
                                    <div className="space-y-2">
                                        <label htmlFor="roomPassword" className="text-sm font-medium text-slate-300">
                                            Room Password (if required)
                                        </label>
                                        <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 transition-colors duration-200 hover:bg-slate-700/70 focus-within:border-primary">
                                            <Lock className="h-5 w-5 text-slate-400" />
                                            <Input
                                                id="roomPassword"
                                                type="password"
                                                placeholder="Enter room password"
                                                value={roomPassword}
                                                onChange={(e) => setRoomPassword(e.target.value)}
                                                className="flex-1 bg-transparent border-none text-white placeholder:text-slate-500 focus:outline-none focus:ring-0"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-slate-300">Select Your Role</label>
                                <div className="flex flex-col gap-3">
                                    <Button
                                        onClick={() => handleRoleSelect("brother")}
                                        className="w-full h-12 md:h-14 bg-emerald-600 hover:bg-emerald-700 text-white transition-all hover:scale-[1.02] shadow-md"
                                        disabled={!displayName.trim()}
                                    >
                                        <User className="mr-2 h-5 w-5" />
                                        Join as Brother
                                    </Button>

                                    <Button
                                        onClick={() => handleRoleSelect("sister")}
                                        className="w-full h-12 md:h-14 bg-rose-600 hover:bg-rose-700 text-white transition-all hover:scale-[1.02] shadow-md relative"
                                        disabled={!displayName.trim()}
                                    >
                                        <User className="mr-2 h-5 w-5" />
                                        Join as Sister
                                        <Lock className="absolute right-4 h-4 w-4 opacity-60" />
                                    </Button>

                                    <Button
                                        onClick={() => handleRoleSelect("host")}
                                        variant="outline"
                                        className="w-full h-12 md:h-14 border-amber-500/50 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400 transition-all relative"
                                        disabled={!displayName.trim()}
                                    >
                                        <Crown className="mr-2 h-5 w-5" />
                                        Join as Host (Admin)
                                        <Lock className="absolute right-4 h-4 w-4 opacity-60" />
                                    </Button>
                                </div>
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

                                <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 transition-colors duration-200 hover:bg-slate-700/70 focus-within:border-primary">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                    <Input
                                        id="rolePassword"
                                        type="password"
                                        placeholder={`Enter ${roleStep === 'host-password' ? 'host' : 'sister'} password`}
                                        value={roleStep === 'host-password' ? hostPassword : sisterPassword}
                                        onChange={(e) => roleStep === 'host-password' ? setHostPassword(e.target.value) : setSisterPassword(e.target.value)}
                                        className="flex-1 bg-transparent border-none text-white placeholder:text-slate-500 focus:outline-none focus:ring-0"
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
        </div>
    );
}
