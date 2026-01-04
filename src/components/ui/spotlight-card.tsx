"use client";

import { useMotionTemplate, useMotionValue, motion } from "framer-motion";
import { MouseEvent as ReactMouseEvent } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export const SpotlightCard = ({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const isMobile = useIsMobile();

    function handleMouseMove({
        currentTarget,
        clientX,
        clientY,
    }: ReactMouseEvent) {
        if (isMobile) return;

        let { left, top } = currentTarget.getBoundingClientRect();

        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <div
            className={cn(
                "group relative border border-neutral-800 bg-neutral-900 overflow-hidden",
                className
            )}
            onMouseMove={handleMouseMove}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(139, 92, 246, 0.15),
              transparent 80%
            )
          `,
                }}
            />
            {/* Mobile fallback static gradient */}
            <div className={cn(
                "pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 md:hidden",
                isMobile && "opacity-100 bg-gradient-to-br from-violet-500/10 to-transparent"
            )}
            />

            <div className="relative h-full">
                {children}
            </div>
        </div>
    );
};
