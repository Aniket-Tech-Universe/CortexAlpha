import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Code as CodeIcon, RotateCw, Maximize2 } from "lucide-react";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from "@/lib/utils";

interface ArtifactPanelProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    language: string;
    title?: string;
}

export function ArtifactPanel({ isOpen, onClose, content, language, title = "Code Snippet" }: ArtifactPanelProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: "100%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "100%", opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed inset-y-0 right-0 w-full md:w-[45%] z-30 bg-[#0a0a0a]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                        <div className="flex items-center gap-2 text-zinc-100">
                            <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400">
                                <CodeIcon size={18} />
                            </div>
                            <h2 className="font-medium text-sm">{title}</h2>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleCopy}
                                className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title="Copy Code"
                            >
                                {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-auto relative bg-[#1e1e1e]">
                        <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={language || 'text'}
                            showLineNumbers={true}
                            customStyle={{
                                margin: 0,
                                padding: '1.5rem',
                                background: 'transparent',
                                fontSize: '14px',
                                lineHeight: '1.5'
                            }}
                            wrapLongLines={true}
                        >
                            {content}
                        </SyntaxHighlighter>
                    </div>

                    {/* Footer / Status */}
                    <div className="p-3 border-t border-white/10 bg-[#1e1e1e] flex justify-between items-center text-xs text-zinc-500">
                        <span>{language}</span>
                        <span>{content.length} chars</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
