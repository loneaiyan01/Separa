"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ScrambleTextProps {
    text: string;
    className?: string;
}

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*";

export default function ScrambleText({ text, className }: ScrambleTextProps) {
    const [displayText, setDisplayText] = useState("");

    const scramble = () => {
        let iteration = 0;
        const interval = setInterval(() => {
            setDisplayText(
                text
                    .split("")
                    .map((char, index) => {
                        if (index < iteration) {
                            return text[index];
                        }
                        return CHARS[Math.floor(Math.random() * CHARS.length)];
                    })
                    .join("")
            );

            if (iteration >= text.length) {
                clearInterval(interval);
            }

            iteration += 1 / 3;
        }, 30);
    };

    // Scramble on mount
    useEffect(() => {
        scramble();
    }, [text]);

    return (
        <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`${className} cursor-default select-none`}
            onMouseOver={scramble}
        >
            {displayText}
        </motion.span>
    );
}
