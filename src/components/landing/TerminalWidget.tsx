"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const LINES = [
    "> System Check... OK",
    "> Encryption Protocol: AES-256 [ACTIVE]",
    "> Room Segregation Logic: ENFORCED",
    "> Server Latency: 14ms",
];

export default function TerminalWidget() {
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [displayedLines, setDisplayedLines] = useState<string[]>([]);

    useEffect(() => {
        if (currentLineIndex >= LINES.length) {
            const timeout = setTimeout(() => {
                setDisplayedLines([]);
                setCurrentLineIndex(0);
            }, 3000);
            return () => clearTimeout(timeout);
        }

        const timeout = setTimeout(() => {
            setDisplayedLines((prev) => [...prev, LINES[currentLineIndex]]);
            setCurrentLineIndex((prev) => prev + 1);
        }, 800);

        return () => clearTimeout(timeout);
    }, [currentLineIndex]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="absolute bottom-10 left-8 md:left-20 w-80 bg-black/80 border border-emerald-500/30 rounded-lg p-4 font-mono text-xs text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)] backdrop-blur-md hidden md:block z-5"
            data-speed="4"
        >
            <div className="flex flex-col gap-1">
                {displayedLines.map((line, i) => (
                    <div key={i} className="typewriter">
                        {line}
                    </div>
                ))}
                <div className="animate-pulse">_</div>
            </div>
        </motion.div>
    );
}
