"use client";

import { useEffect, useRef, useState } from "react";

export default function Spotlight() {
    const spotlightRef = useRef<HTMLDivElement>(null);
    const [isOverInteractive, setIsOverInteractive] = useState(false);

    useEffect(() => {
        const spotlight = spotlightRef.current;
        if (!spotlight) return;

        // Mouse move handler
        const handleMouseMove = (e: MouseEvent) => {
            requestAnimationFrame(() => {
                spotlight.style.left = `${e.clientX}px`;
                spotlight.style.top = `${e.clientY}px`;
            });
        };

        // Add event listener
        document.addEventListener("mousemove", handleMouseMove);

        // Setup interactive element detection
        const interactables = document.querySelectorAll("button, input, a, .interactive");

        const handleMouseEnter = () => setIsOverInteractive(true);
        const handleMouseLeave = () => setIsOverInteractive(false);

        interactables.forEach((el) => {
            el.addEventListener("mouseenter", handleMouseEnter);
            el.addEventListener("mouseleave", handleMouseLeave);
        });

        // Cleanup
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            interactables.forEach((el) => {
                el.removeEventListener("mouseenter", handleMouseEnter);
                el.removeEventListener("mouseleave", handleMouseLeave);
            });
        };
    }, []);

    return (
        <div
            ref={spotlightRef}
            className="spotlight"
            style={{
                width: isOverInteractive ? "300px" : "600px",
                height: isOverInteractive ? "300px" : "600px",
                background: isOverInteractive
                    ? "radial-gradient(circle closest-side, rgba(0, 240, 255, 0.15), rgba(255, 255, 255, 0.03), transparent 100%)"
                    : "radial-gradient(circle closest-side, rgba(0, 240, 255, 0.08), rgba(255, 255, 255, 0.02), transparent 100%)",
            }}
        />
    );
}
