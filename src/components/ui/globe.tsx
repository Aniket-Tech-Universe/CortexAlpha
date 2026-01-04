"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlobeProps {
    className?: string;
}

export function WireframeGlobe({ className }: GlobeProps) {
    return (
        <div className={cn("relative flex items-center justify-center perspective-[1000px]", className)}>
            {/* Main Outer Sphere - Rotating Y Axis */}
            <motion.div
                className="relative w-[500px] h-[500px] md:w-[600px] md:h-[600px] preserve-3d"
                animate={{ rotateY: 360, rotateZ: 23 }} // Tilt axis (23deg like Earth) and spin Y
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
                {/* Core glow */}
                <div className="absolute inset-0 bg-cyan-500/10 blur-[80px] rounded-full transform-gpu" />

                <svg viewBox="0 0 100 100" className="w-full h-full text-cyan-500/50 overflow-visible transform-gpu">
                    {/* Meridians (Longitude) - Reduced for performance */}
                    {[0, 45, 90, 135].map((deg, i) => (
                        <ellipse
                            key={`long-${i}`}
                            cx="50"
                            cy="50"
                            rx="48"
                            ry="48"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="0.3"
                            vectorEffect="non-scaling-stroke"
                            style={{ transform: `rotateY(${deg}deg)`, transformOrigin: "center" }}
                            className="opacity-50"
                        />
                    ))}

                    {/* Parallels (Latitude) - Reduced for performance */}
                    {[20, 50, 80].map((dia, i) => (
                        <circle
                            key={`lat-${i}`}
                            cx="50"
                            cy="50"
                            r={dia / 2}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="0.3"
                            style={{ transform: `rotateX(90deg) translateZ(${i * 15}px)` }} // Fake 3D stacking
                            className="opacity-40"
                        />
                    ))}
                </svg>

                {/* Additional detailed wireframe SVG for visual complexity ("More Resources") */}
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-violet-500/30 overflow-visible">
                    {/* Equator/Ecliptic rings */}
                    <ellipse cx="50" cy="50" rx="50" ry="10" fill="none" stroke="currentColor" strokeWidth="0.5" className="opacity-80" />
                    <ellipse cx="50" cy="50" rx="10" ry="50" fill="none" stroke="currentColor" strokeWidth="0.5" className="opacity-80" />
                </svg>
            </motion.div>

            {/* Inner Core Sphere - Counter Rotating */}
            <motion.div
                className="absolute w-[300px] h-[300px] opacity-40 mix-blend-screen pointer-events-none"
                animate={{ rotateY: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
                <div className="w-full h-full rounded-full border border-violet-500/50 border-dotted" />
            </motion.div>
        </div>
    );
}
