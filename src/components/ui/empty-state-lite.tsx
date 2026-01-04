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
 * Uses pure CSS animations and no Framer Motion for performance.
 * Layout: Top (Title) -> Middle (Globe) -> Bottom (Suggestions)
 */
export function EmptyStateLite({ onSuggestionClick }: EmptyStateLiteProps) {
    return (
        <div className="flex flex-col h-full justify-between items-center text-center px-4 py-6 animate-fade-in">
            {/* 1. TOP: Title and Text */}
            <div className="flex flex-col items-center pt-4 animate-fade-in-up">
                <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 pb-2 filter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    CortexAlpha
                </h1>
                <p className="text-zinc-400 text-sm max-w-xs mx-auto leading-relaxed mt-2 animation-delay-100 animate-fade-in">
                    Unlock the power of neural intelligence.
                </p>
            </div>

            {/* 2. MIDDLE: Globe (Centered, Static) */}
            <div className="flex-1 flex items-center justify-center w-full relative pointer-events-none animate-fade-in animation-delay-200">
                <WireframeGlobe className="scale-[1.5] opacity-40 mix-blend-screen" />
                {/* Single Rotating Ring (CSS Spin) */}
                <div className="absolute w-[200px] h-[200px] rounded-full border border-cyan-400/30 border-dashed animate-spin-slow" />
            </div>

            {/* 3. BOTTOM: Suggestions (Horizontal Scroll) */}
            <div className="w-full overflow-x-auto scrollbar-hide -mx-4 pb-4 snap-x flex gap-3 pr-8 animate-fade-in-up animation-delay-300">
                {suggestions.map((s, i) => (
                    <div
                        key={i}
                        onClick={() => onSuggestionClick(s.prompt)}
                        className="snap-center shrink-0 cursor-pointer active:scale-95 transition-transform duration-200"
                    >
                        <SpotlightCard
                            className="min-w-[200px] p-3 flex flex-col items-start gap-2 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-colors"
                        >
                            <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400 w-fit">
                                <s.icon size={16} />
                            </div>
                            <span className="text-xs font-medium text-zinc-300">{s.text}</span>
                        </SpotlightCard>
                    </div>
                ))}
            </div>
        </div>
    )
}
