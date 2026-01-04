"use client"

import { SpotlightCard } from "./spotlight-card"
import { Code, PenTool, BarChart3, Lightbulb } from "lucide-react"

// Static suggestions for mobile
const suggestions = [
    { icon: Code, text: "Debug a React component", prompt: "Help me debug this React component that's not rendering correctly" },
    { icon: PenTool, text: "Write a blog post", prompt: "Write a blog post about the future of AI" },
    { icon: BarChart3, text: "Analyze data", prompt: "Analyze this sales data and provide insights" },
    { icon: Lightbulb, text: "Brainstorm ideas", prompt: "Brainstorm innovative startup ideas in the AI space" },
]

interface EmptyStateLiteProps {
    onSuggestionClick: (prompt: string) => void
}

/**
 * Mobile-optimized empty state component.
 * Layout: Top (Title) -> Middle (Desktop-Style Rings + Suggestions) -> Bottom (Input handled by parent)
 * Uses pure CSS animations for performance.
 */
export function EmptyStateLite({ onSuggestionClick }: EmptyStateLiteProps) {
    return (
        <div className="flex flex-col h-full items-center text-center px-4 animate-fade-in overflow-hidden relative">
            {/* 1. TOP: Title and Text */}
            <div className="flex flex-col items-center pt-24 pb-2 animate-fade-in-up shrink-0 z-10">
                <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-indigo-100 to-indigo-300/80 pb-2 filter drop-shadow-[0_0_25px_rgba(99,102,241,0.3)]">
                    CortexAlpha
                </h1>
                <p className="text-indigo-200/60 text-sm max-w-xs mx-auto leading-relaxed short-description animate-fade-in font-medium">
                    Unlock the power of neural intelligence.
                </p>
            </div>

            {/* 2. MIDDLE: Desktop-Style Gyroscope Rings + Suggestions */}
            <div className="flex-1 flex flex-col items-center justify-center w-full relative -mt-8">
                {/* 
                   Desktop Ring Replication (Gyroscope Effect)
                   - Scaled down but maintaining the Oval aspect ratio logic
                   - Ring 1: Wide Oval (Cyan-ish)
                   - Ring 2: Tall Oval (Violet-ish)
                */}
                <div className="relative w-[300px] h-[300px] flex items-center justify-center mb-8 pointer-events-none">
                    {/* Center Glow */}
                    <div className="absolute w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />

                    {/* Ring 1 - Horizontalish (Clockwise) - Cyan/Indigo Accent */}
                    <div className="absolute w-[280px] h-[140px] rounded-[100%] border border-cyan-400/30 border-dashed animate-spin-slow shadow-[0_0_30px_rgba(34,211,238,0.1)]" />

                    {/* Ring 2 - Verticalish (Counter-Clockwise) - Violet Accent */}
                    <div className="absolute w-[140px] h-[280px] rounded-[100%] border border-violet-400/30 border-dashed animate-spin-reverse-slow shadow-[0_0_30px_rgba(139,92,246,0.1)]" />
                </div>

                {/* 3. MIDDLE: Suggestions (2x2 Grid Stack) - FIXED DIMENSIONS */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-2 w-full max-w-[340px] grid grid-cols-2 gap-3 px-4 animate-fade-in-up animation-delay-300 z-20">
                    {suggestions.map((s, i) => (
                        <div
                            key={i}
                            onClick={() => onSuggestionClick(s.prompt)}
                            className="cursor-pointer active:scale-95 transition-transform duration-200"
                        >
                            <SpotlightCard
                                className="h-[80px] p-3 flex flex-row items-center gap-3 rounded-2xl border border-indigo-500/30 bg-black/80 backdrop-blur-xl shadow-lg shadow-black/50 hover:bg-white/5 transition-colors"
                            >
                                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 w-fit shrink-0">
                                    <s.icon size={18} />
                                </div>
                                <span className="text-xs font-medium text-indigo-100/90 leading-tight line-clamp-2 text-left">{s.text}</span>
                            </SpotlightCard>
                        </div>
                    ))}
                </div>
            </div>

            {/* Spacer to push content up from bottom input */}
            <div className="flex-1" />
        </div>
    )
}
