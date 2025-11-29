"use client";

import dynamic from "next/dynamic";
import { Shield } from "lucide-react";
import ScrambleText from "@/components/landing/ScrambleText";
import TerminalWidget from "@/components/landing/TerminalWidget";
import GlassVault from "@/components/landing/GlassVault";
import Spotlight from "@/components/landing/Spotlight";
import ParallaxEffect from "@/components/landing/ParallaxEffect";

const ParticleGlobe = dynamic(() => import("@/components/landing/ParticleGlobe"), { ssr: false });

export default function Home() {
    return (
        <main className="min-h-screen w-full bg-[#020617] text-slate-200 overflow-hidden flex flex-col md:flex-row relative">
            {/* Spotlight Effect */}
            <Spotlight />

            {/* Parallax Effect */}
            <ParallaxEffect />

            {/* Left Section: The Narrative (60%) */}
            <section className="relative w-full md:w-[60%] h-[50vh] md:h-screen flex flex-col justify-center px-8 md:px-20 z-10">
                {/* Background Globe - Moves slowly opposite (data-speed="-1") */}
                <div className="absolute inset-0 z-0" data-speed="-1">
                    <ParticleGlobe />
                </div>

                {/* Content - Left Aligned - Moves slightly with mouse (data-speed="2") */}
                <div className="relative z-10 max-w-[650px] flex flex-col items-start" data-speed="2">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight text-white">
                        <ScrambleText text="Privacy." className="block text-cyan-400" />
                        <ScrambleText text="Segregated." className="block" />
                        <ScrambleText text="Secured." className="block" />
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 max-w-lg mb-8 leading-relaxed">
                        End-to-end encrypted video conferencing designed for gender-segregated environments.
                        Experience the future of modest communication.
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

            {/* Right Section: The Vault (40%) */}
            <section className="relative w-full md:w-[40%] h-[50vh] md:h-screen flex items-center justify-center bg-[linear-gradient(225deg,rgba(30,41,59,0.4)_0%,rgba(2,6,23,0)_100%)] backdrop-blur-[10px] z-10">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <GlassVault />
            </section>
        </main>
    );
}
