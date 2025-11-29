"use client";

import { useEffect } from "react";

export default function ParallaxEffect() {
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const layers = document.querySelectorAll<HTMLElement>("[data-speed]");

            layers.forEach((layer) => {
                const speed = parseFloat(layer.getAttribute("data-speed") || "0");

                // Calculate movement based on center of screen
                const x = (window.innerWidth - e.pageX * speed) / 100;
                const y = (window.innerHeight - e.pageY * speed) / 100;

                // Apply smooth transform
                layer.style.transform = `translateX(${x}px) translateY(${y}px)`;
            });
        };

        document.addEventListener("mousemove", handleMouseMove);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    return null; // This component doesn't render anything
}
