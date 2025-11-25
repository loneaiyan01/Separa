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
import { User, ShieldCheck, Crown } from "lucide-react";

interface LobbySelectionProps {
    onJoin: (name: string, gender: Gender, isHost: boolean) => void;
}

export default function LobbySelection({ onJoin }: LobbySelectionProps) {
    const [name, setName] = useState("");
    const [hostPassword, setHostPassword] = useState("");
    const [sisterPassword, setSisterPassword] = useState("");
    const [selectedGender, setSelectedGender] = useState<Gender | null>(null);

    const handleJoin = (gender: Gender) => {
        const hostPwd = process.env.NEXT_PUBLIC_HOST_PASSWORD;
        const sisterPwd = process.env.NEXT_PUBLIC_SISTER_PASSWORD;

        if (gender === "host" && hostPassword !== hostPwd) {
            alert("Incorrect host password");
            return;
        }
        if (gender === "female" && sisterPassword !== sisterPwd) {
            alert("Incorrect sister password");
            return;
        }
        if (!name) return;
        onJoin(name, gender, gender === "host");
        // Reset UI after successful join
        setSelectedGender(null);
        setHostPassword("");
        setSisterPassword("");
    };

    // Render password fields based on the role selected
    const renderPasswordSection = () => {
        if (selectedGender === "host") {
            return (
                <>
                    <div className="space-y-2 mb-4">
                        <label className="text-sm font-medium text-slate-300">Host Password</label>
                        <Input
                            placeholder="Enter host password"
                            type="password"
                            value={hostPassword}
                            onChange={(e) => setHostPassword(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 focus:outline-none focus:ring-0 text-white placeholder:text-slate-500"
                        />
                    </div>
                    <Button
                        onClick={() => handleJoin("host")}
                        variant="outline"
                        className="w-full h-12 border-amber-500/50 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400 transition-colors"
                    >
                        <Crown className="mr-2 h-5 w-5" />
                        Join as Host (Admin)
                    </Button>
                </>
            );
        }
        if (selectedGender === "female") {
            return (
                <>
                    <div className="space-y-2 mb-4">
                        <label className="text-sm font-medium text-slate-300">Sister Password</label>
                        <Input
                            placeholder="Enter sister password"
                            type="password"
                            value={sisterPassword}
                            onChange={(e) => setSisterPassword(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 focus:outline-none focus:ring-0 text-white placeholder:text-slate-500"
                        />
                    </div>
                    <Button
                        onClick={() => handleJoin("female")}
                        className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white transition-all hover:scale-[1.02] shadow-md"
                        disabled={!name || sisterPassword === ""}
                    >
                        <User className="mr-2 h-5 w-5" />
                        Join as Sister
                    </Button>
                </>
            );
        }
        return null;
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-sm glass border-0 shadow-2xl p-8">
                <CardHeader className="text-center space-y-2 pb-4">
                    <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight text-white">Separa</CardTitle>
                    <CardDescription className="text-slate-300">
                        Secure, gender‑segregated video conferencing.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Display name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Display Name</label>
                        <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 transition-colors duration-200 hover:bg-slate-700/70">
                            <User className="h-5 w-5 text-slate-400" />
                            <Input
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="flex-1 bg-transparent border-none text-white placeholder:text-slate-500 focus:outline-none focus:ring-0"
                            />
                        </div>
                    </div>

                    {/* Role selection */}
                    {selectedGender === null && (
                        <div className="flex flex-col space-y-4">
                            <Button
                                onClick={() => handleJoin("male")}
                                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white transition-all hover:scale-[1.02] shadow-md"
                                disabled={!name}
                            >
                                <User className="mr-2 h-5 w-5" />
                                Join as Brother
                            </Button>
                            <Button
                                onClick={() => setSelectedGender("female")}
                                className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white transition-all hover:scale-[1.02] shadow-md"
                                disabled={!name}
                            >
                                <User className="mr-2 h-5 w-5" />
                                Join as Sister
                            </Button>
                            <Button
                                onClick={() => setSelectedGender("host")}
                                variant="outline"
                                className="w-full h-12 border-amber-500/50 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
                                disabled={!name}
                            >
                                <Crown className="mr-2 h-5 w-5" />
                                Join as Host (Admin)
                            </Button>
                        </div>
                    )}

                    {/* Password sections */}
                    {renderPasswordSection()}
                </CardContent>
            </Card>
        </div>
    );
}
