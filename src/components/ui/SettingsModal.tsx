import { motion } from "framer-motion";
import { X, Settings, Thermometer, BrainCircuit, Download, FileJson, FileText } from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { settings, updateSettings, sessions, currentSessionId } = useChatStore();
    const [activeTab, setActiveTab] = useState<'general' | 'data'>('general');

    const handleExport = (format: 'json' | 'md') => {
        const session = sessions.find(s => s.id === currentSessionId);
        if (!session) return;

        let content = "";
        let mimeType = "";
        let extension = "";

        if (format === 'json') {
            content = JSON.stringify(session, null, 2);
            mimeType = "application/json";
            extension = "json";
        } else {
            content = `# ${session.title}\n\n`;
            session.messages.forEach(msg => {
                content += `### ${msg.role.toUpperCase()}\n\n${msg.content}\n\n---\n\n`;
            });
            mimeType = "text/markdown";
            extension = "md";
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `omni-chat-${session.id}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg glass-panel text-zinc-100 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-violet-400" />
                        <h2 className="font-medium text-lg">Configuration</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                        <X size={20} className="text-zinc-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-col h-[60vh] md:h-auto">
                    {/* Tabs */}
                    <div className="flex border-b border-white/5">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={cn(
                                "flex-1 p-3 text-sm font-medium transition-colors border-b-2",
                                activeTab === 'general' ? "border-violet-500 text-violet-200 bg-violet-500/5" : "border-transparent text-zinc-400 hover:text-zinc-200"
                            )}
                        >
                            General
                        </button>
                        <button
                            onClick={() => setActiveTab('data')}
                            className={cn(
                                "flex-1 p-3 text-sm font-medium transition-colors border-b-2",
                                activeTab === 'data' ? "border-violet-500 text-violet-200 bg-violet-500/5" : "border-transparent text-zinc-400 hover:text-zinc-200"
                            )}
                        >
                            Data & Export
                        </button>
                    </div>

                    <div className="p-6 space-y-6 overflow-y-auto">
                        {activeTab === 'general' ? (
                            <>
                                {/* System Instructions */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                                        <BrainCircuit size={16} className="text-indigo-400" />
                                        System Instructions
                                    </div>
                                    <textarea
                                        value={settings.systemInstruction}
                                        onChange={(e) => updateSettings({ systemInstruction: e.target.value })}
                                        placeholder="E.g., 'You are a senior React engineer. Be concise and prioritize performance.'"
                                        className="w-full h-32 bg-black/30 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/50 resize-none placeholder:text-zinc-600"
                                    />
                                    <p className="text-xs text-zinc-500">
                                        These instructions will be prepended to every conversation, guiding the AI's behavior.
                                    </p>
                                </div>

                                {/* Temperature */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm font-medium text-zinc-300">
                                        <div className="flex items-center gap-2">
                                            <Thermometer size={16} className="text-indigo-400" />
                                            Creativity (Temperature)
                                        </div>
                                        <span className="text-violet-300 font-mono">{settings.temperature}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={settings.temperature}
                                        onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })}
                                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
                                    />
                                    <div className="flex justify-between text-xs text-zinc-500">
                                        <span>Precise</span>
                                        <span>Balanced</span>
                                        <span>Creative</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-6">
                                <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                                    <h3 className="font-medium text-violet-200 mb-1">Export Current Session</h3>
                                    <p className="text-xs text-zinc-400 mb-4">Download your current chat history to keep locally.</p>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleExport('json')}
                                            className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg bg-black/40 border border-white/10 hover:bg-white/5 transition-colors"
                                        >
                                            <FileJson size={16} className="text-yellow-500" />
                                            <span className="text-sm">JSON</span>
                                        </button>
                                        <button
                                            onClick={() => handleExport('md')}
                                            className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg bg-black/40 border border-white/10 hover:bg-white/5 transition-colors"
                                        >
                                            <FileText size={16} className="text-blue-500" />
                                            <span className="text-sm">Markdown</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-white/5 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition-colors shadow-lg shadow-violet-500/20"
                    >
                        Done
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
