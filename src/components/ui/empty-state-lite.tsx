"use client"

import { WireframeGlobe } from "./globe"
import { SpotlightCard } from "./spotlight-card"
import { Code, PenTool, BarChart3, Lightbulb } from "lucide-react"

// Static suggestions for mobile
const suggestions = [
    { icon: Code, text: "Debug a React component", prompt: "Help me debug this React component that's not rendering correctly" },
    { icon: PenTool, text: "Write a blog post", prompt: "Write a blog post about the future of AI" },
    { icon: BarChart3, text: "Analyze this data", prompt: "Analyze this sales data and provide insights" },
    { icon: Lightbulb, text: "Brainstorm ideas", prompt: "Brainstorm innovative startup ideas in the AI space" },
]

interface EmptyStateLiteProps {
    onSuggestionClick: (prompt: string) => void
}

/**
 * Mobile-optimized empty state component.
 * Layout: Top (Title) -> Middle (Globe + Suggestions) -> Bottom (Input handled by parent)
 * Uses pure CSS animations for performance.
 */
export function EmptyStateLite({ onSuggestionClick }: EmptyStateLiteProps) {
    return (
        <div className="flex flex-col h-full items-center text-center px-4 animate-fade-in overflow-hidden relative">
            {/* 1. TOP: Title and Text - Moved Lower */}
            <div className="flex flex-col items-center pt-24 pb-2 animate-fade-in-up shrink-0 z-10">
                <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-indigo-100 to-indigo-300/80 pb-2 filter drop-shadow-[0_0_25px_rgba(99,102,241,0.3)]">
                    CortexAlpha
                </h1>
                <p className="text-indigo-200/60 text-sm max-w-xs mx-auto leading-relaxed short-description animate-fade-in font-medium">
                    Unlock the power of neural intelligence.
                </p>
            </div>

            {/* 2. MIDDLE: Dual Rings (Desktop Style) + Suggestions */}
            <div className="flex-1 flex flex-col items-center justify-center w-full relative -mt-8">
                {/* Dual Counter-Rotating Rings */}
                <div className="relative w-[320px] h-[320px] flex items-center justify-center mb-8">
                    {/* Inner Ring (Clockwise) - BRIGHTER */}
                    <div className="absolute inset-0 rounded-full border border-indigo-400/40 border-dashed animate-spin-slow shadow-[0_0_50px_rgba(99,102,241,0.25)]" />
                    {/* Outer Ring (Counter-Clockwise) - BRIGHTER */}
                    <div className="absolute inset-[-20px] rounded-full border border-violet-400/30 border-dashed animate-spin-reverse-slow" />

                    {/* Center Glow */}
                    <div className="absolute w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
                </div>

                {/* 3. MIDDLE: Suggestions (2x2 Grid Stack) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-2 w-full max-w-[340px] grid grid-cols-2 gap-3 px-4 animate-fade-in-up animation-delay-300 z-20">
                    {suggestions.map((s, i) => (
                        <div
                            key={i}
                            onClick={() => onSuggestionClick(s.prompt)}
                            className="cursor-pointer active:scale-95 transition-transform duration-200"
                        >
                            <SpotlightCard
                                className="h-full p-3 flex flex-col items-start gap-2 rounded-2xl border border-indigo-500/30 bg-black/60 backdrop-blur-xl shadow-lg shadow-black/40 hover:bg-white/5 transition-colors"
                            >
                                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 w-fit">
                                    <s.icon size={16} />
                                </div>
                                <span className="text-xs font-medium text-indigo-100/90 leading-tight">{s.text}</span>
                            </SpotlightCard>
                        </div>
                    ))}
                </div>
            </div>

            {/* Spacer to push content up from bottom input */}
            <div className="flex-1" />

            {/* 4. BOTTOM: Input/Chatbox is handled by ChatInterface.tsx (parent component) */}
        </div>
    )
}
