"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Menu, Plus, Upload, X, MoreHorizontal, MoreVertical, MessageSquare, Trash2, Edit2, Pin, ChevronRight, Sparkles, Code, PenTool, Lightbulb, PanelLeftClose, PanelLeftOpen, Settings as SettingsIcon, Maximize2, Copy, ThumbsUp, ThumbsDown, RefreshCw, Square, ChevronDown, ArrowDown, Zap, FileText, FileCode, FileImage, File as FileIcon, Download, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, useCallback } from "react";
import { SpotlightCard } from "./spotlight-card";
import { WireframeGlobe } from "./globe";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useChatStore, Message, FileAttachment } from "@/store/chat-store";
import { InteractiveConstellation } from "@/components/ui/animated-backgrounds";
import { toast } from "sonner";
import { SettingsModal } from "./SettingsModal";
import { ArtifactPanel } from "./ArtifactPanel";
import { useIsMobile } from "../../hooks/use-mobile";
import { EmptyStateLite } from "./empty-state-lite";

export default function ChatInterface() {
    const isMobile = useIsMobile();
    const [mounted, setMounted] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open on desktop
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Artifact State
    const [artifact, setArtifact] = useState<{ isOpen: boolean; content: string; language: string; title?: string }>({
        isOpen: false,
        content: "",
        language: "",
        title: ""
    });

    // Sidebar Actions State
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);
    const [sidebarSearch, setSidebarSearch] = useState("");
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

    // Zustand Store
    const {
        currentSessionId,
        createSession,
        setCurrentSession,
        addMessage,
        updateLastMessage,
        getActiveSession,
        getSortedSessions,
        deleteSession,
        renameSession,
        togglePin,
        settings
    } = useChatStore();

    // Local state
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [fileAttachments, setFileAttachments] = useState<FileAttachment[]>([]);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editMessageContent, setEditMessageContent] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);
    const isNearBottomRef = useRef(true);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);

    // File type icons helper
    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return FileImage;
        if (type.includes('pdf')) return FileText;
        if (type.includes('javascript') || type.includes('typescript') || type.includes('json') || type.includes('html') || type.includes('css') || type.includes('python') || type.includes('java')) return FileCode;
        if (type.startsWith('text/')) return FileText;
        return FileIcon;
    };

    // Format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Initialize
    useEffect(() => {
        setMounted(true);
        // Responsive sidebar initialization
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
        if (!currentSessionId) createSession();
    }, [currentSessionId, createSession]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    const activeSession = getActiveSession();
    const messages = activeSession?.messages || [];

    // Process files into FileAttachment objects
    const processFiles = useCallback(async (files: FileList | File[]) => {
        const fileArray = Array.from(files);
        const maxSize = 10 * 1024 * 1024; // 10MB

        for (const file of fileArray) {
            if (file.size > maxSize) {
                toast.error(`${file.name} is too large (max 10MB)`);
                continue;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target?.result as string;
                const attachment: FileAttachment = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: file.name,
                    type: file.type || 'application/octet-stream',
                    size: file.size,
                    data: base64,
                };
                setFileAttachments(prev => [...prev, attachment]);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await processFiles(e.target.files);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachment = (id: string) => {
        setFileAttachments(prev => prev.filter(f => f.id !== id));
    };

    // Drag and drop handlers
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget === dropZoneRef.current) {
            setIsDragging(false);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            await processFiles(files);
            toast.success(`${files.length} file(s) added`);
        }
    }, [processFiles]);

    // Clipboard paste handler
    const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        const files: File[] = [];
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) files.push(file);
            }
        }

        if (files.length > 0) {
            e.preventDefault();
            await processFiles(files);
            toast.success('Image pasted from clipboard');
        }
    }, [processFiles]);

    const handleSubmit = async (e?: React.FormEvent, customInput?: string) => {
        e?.preventDefault();
        const textToSend = customInput || input;

        if ((!textToSend.trim() && fileAttachments.length === 0) || isLoading || !currentSessionId) return;

        // Extract image data for API compatibility
        const imageData = fileAttachments
            .filter(f => f.type.startsWith('image/'))
            .map(f => f.data);

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: textToSend,
            files: fileAttachments.length > 0 ? fileAttachments : undefined,
            images: imageData.length > 0 ? imageData : undefined  // Legacy API support
        };

        addMessage(currentSessionId, userMsg);
        if (!customInput) setInput("");
        setFileAttachments([]);
        setIsLoading(true);
        setError(null);

        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        try {
            const apiMessages = [...messages, userMsg].map(m => ({
                role: m.role,
                content: m.images && m.images.length > 0
                    ? [
                        { type: 'text', text: m.content },
                        ...m.images.map(img => ({ type: 'image', image: img }))
                    ]
                    : m.content
            }));

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: apiMessages,
                    config: {
                        systemInstruction: settings.systemInstruction,
                        temperature: settings.temperature
                    }
                }),
            });

            // Store abort controller for cancellation
            abortControllerRef.current = new AbortController();
            const signal = abortControllerRef.current.signal;

            if (!response.ok) throw new Error("Connection failed");
            if (!response.body) throw new Error("No signal received");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "" };
            addMessage(currentSessionId, assistantMsg);

            let fullContent = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const text = decoder.decode(value, { stream: true });
                fullContent += text;
                updateLastMessage(currentSessionId, fullContent);
            }
        } catch (err) {
            if ((err as Error).name === 'AbortError') {
                // User cancelled - not an error
                return;
            }
            console.error("Error:", err);
            setError(err instanceof Error ? err : new Error("Unknown error"));
            toast.error("Failed to send message");
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    // Stop generation
    const handleStopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsLoading(false);
            toast.info("Generation stopped");
        }
    };

    // Regenerate last AI response
    const handleRegenerate = () => {
        if (!currentSessionId || messages.length < 2) return;

        // Find the last user message
        const lastUserMsgIndex = messages.map(m => m.role).lastIndexOf('user');
        if (lastUserMsgIndex >= 0) {
            const lastUserMsg = messages[lastUserMsgIndex];
            // Remove the last AI message
            // Note: We'll just resend the last user message
            handleSubmit(undefined, lastUserMsg.content);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Smart auto-scroll: only scroll if user is near bottom
    useEffect(() => {
        if (scrollRef.current && isNearBottomRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading, fileAttachments]);

    // Scroll position tracking
    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        isNearBottomRef.current = distanceFromBottom < 100;
        setShowScrollButton(distanceFromBottom > 200);
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
            isNearBottomRef.current = true;
        }
    };

    // Global keyboard shortcuts
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // Ctrl+N or Cmd+N - New chat
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                createSession();
                toast.success("New chat created");
            }
            // Ctrl+/ or Cmd+/ - Toggle sidebar
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                setIsSidebarOpen(prev => !prev);
            }
            // Escape - Stop generation
            if (e.key === 'Escape' && isLoading) {
                handleStopGeneration();
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);

        // Click outside to close menus
        const handleClickOutside = () => setOpenMenuId(null);
        window.addEventListener('click', handleClickOutside);

        return () => {
            window.removeEventListener('keydown', handleGlobalKeyDown);
            window.removeEventListener('click', handleClickOutside);
        };
    }, [isLoading, createSession]);

    if (!mounted) return null;

    const suggestions = [
        { icon: Code, text: "Debug a React component", prompt: "Help me debug a React component that isn't re-rendering correctly." },
        { icon: PenTool, text: "Write a blog post", prompt: "Write an engaging blog post about the future of AI interfaces." },
        { icon: Lightbulb, text: "Explain Quantum Physics", prompt: "Explain the basics of quantum physics to a 5-year-old." },
        { icon: Sparkles, text: "Creative Story", prompt: "Write a short sci-fi story about a robot who loves gardening." },
    ];

    return (
        <div className="fixed inset-0 overflow-hidden font-sans text-zinc-100 pb-safe z-0 bg-black">
            {/* Sidebar */}
            <AnimatePresence mode="wait">
                {isSidebarOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 280, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="fixed inset-y-0 left-0 z-40 glass-sidebar flex flex-col md:relative overflow-hidden whitespace-nowrap"
                    >
                        <div className="p-4 flex gap-2">
                            <button
                                onClick={() => {
                                    createSession();
                                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 p-3 bg-violet-600 hover:bg-violet-500 rounded-xl shadow-lg shadow-violet-500/20 transition-all group"
                            >
                                <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                                <span className="font-medium">New Uplink</span>
                            </button>
                            {/* Mobile Close Button */}
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="md:hidden p-3 hover:bg-white/10 rounded-xl text-zinc-400"
                            >
                                <PanelLeftClose size={20} />
                            </button>
                        </div>

                        {/* Sidebar Search */}
                        <div className="px-3 pb-2">
                            <input
                                type="text"
                                value={sidebarSearch}
                                onChange={(e) => setSidebarSearch(e.target.value)}
                                placeholder="Search chats..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto px-3 space-y-1 scrollbar-hide">
                            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-3 mb-2 flex items-center gap-2">
                                <MessageSquare size={12} /> Recent Links
                            </div>
                            {getSortedSessions()
                                .filter(session => session.title.toLowerCase().includes(sidebarSearch.toLowerCase()))
                                .map(session => (
                                    <div
                                        key={session.id}
                                        onMouseEnter={() => setHoveredSessionId(session.id)}
                                        onMouseLeave={() => setHoveredSessionId(null)}
                                        onClick={() => {
                                            if (editingSessionId !== session.id) {
                                                setCurrentSession(session.id);
                                                if (window.innerWidth < 768) setIsSidebarOpen(false);
                                            }
                                        }}
                                        className={cn(
                                            "group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border border-transparent",
                                            currentSessionId === session.id
                                                ? "bg-white/10 active-session-glow border-white/5"
                                                : "hover:bg-white/5 text-zinc-400 hover:text-zinc-200"
                                        )}
                                    >
                                        {editingSessionId === session.id ? (
                                            <input
                                                type="text"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        renameSession(session.id, editTitle);
                                                        setEditingSessionId(null);
                                                    } else if (e.key === 'Escape') setEditingSessionId(null);
                                                }}
                                                onBlur={() => {
                                                    renameSession(session.id, editTitle);
                                                    setEditingSessionId(null);
                                                }}
                                                autoFocus
                                                className="flex-1 bg-transparent border-none outline-none text-sm text-white min-w-0"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            <>
                                                <div className="flex-1 truncate text-sm flex items-center gap-2">
                                                    {session.pinned && <Pin size={12} className="text-violet-400 fill-violet-400/20" />}
                                                    <span className={cn(session.pinned && "font-medium text-violet-200")}>{session.title || "Untitled Link"}</span>
                                                </div>

                                                {/* Kebab Menu */}
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setConfirmingDelete(null); // Reset confirm state on toggle
                                                            setOpenMenuId(openMenuId === session.id ? null : session.id);
                                                        }}
                                                        className={cn(
                                                            "p-1.5 rounded-lg transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100",
                                                            openMenuId === session.id && "bg-white/10 text-white md:opacity-100",
                                                            currentSessionId === session.id && "md:opacity-100",
                                                            !openMenuId && "text-zinc-400 hover:text-white hover:bg-white/5"
                                                        )}
                                                    >
                                                        <MoreVertical size={16} />
                                                    </button>

                                                    {/* Dropdown Menu */}
                                                    <AnimatePresence>
                                                        {openMenuId === session.id && (
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="absolute right-0 top-full mt-2 w-48 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-3xl"
                                                            >
                                                                <div className="p-1 space-y-0.5">
                                                                    <button
                                                                        onClick={() => {
                                                                            togglePin(session.id);
                                                                            setOpenMenuId(null);
                                                                        }}
                                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                                                                    >
                                                                        <Pin size={14} className={cn(session.pinned && "fill-zinc-300")} />
                                                                        {session.pinned ? "Unpin Chat" : "Pin Chat"}
                                                                    </button>

                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingSessionId(session.id);
                                                                            setEditTitle(session.title);
                                                                            setOpenMenuId(null);
                                                                        }}
                                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                                                                    >
                                                                        <Edit2 size={14} />
                                                                        Rename
                                                                    </button>

                                                                    <div className="h-px bg-white/10 my-1 mx-2" />

                                                                    {confirmingDelete === session.id ? (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                deleteSession(session.id);
                                                                                setOpenMenuId(null);
                                                                                setConfirmingDelete(null);
                                                                            }}
                                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-colors font-medium animate-in fade-in zoom-in-95 duration-200"
                                                                        >
                                                                            <Trash2 size={14} className="animate-pulse" />
                                                                            Confirm Delete?
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                setConfirmingDelete(session.id);
                                                                            }}
                                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                            Delete Chat
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            {/* Empty state for search */}
                            {sidebarSearch && getSortedSessions().filter(s => s.title.toLowerCase().includes(sidebarSearch.toLowerCase())).length === 0 && (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                        <MessageSquare size={20} className="text-zinc-500" />
                                    </div>
                                    <p className="text-sm text-zinc-400 mb-1">No chats found</p>
                                    <p className="text-xs text-zinc-500 mb-3">Try a different search</p>
                                    <button
                                        onClick={() => setSidebarSearch("")}
                                        className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                                    >
                                        Clear filter
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* User/Footer - Now clickable for Settings */}
                        <div className="p-4 border-t border-white/5">
                            <button
                                onClick={() => setIsSettingsOpen(true)}
                                className="w-full flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-left group"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-lg group-hover:shadow-violet-500/30 transition-shadow">
                                    OA
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-white truncate group-hover:text-violet-200 transition-colors">Omni User</div>
                                    <div className="text-[10px] text-zinc-500 truncate flex items-center gap-1">
                                        <SettingsIcon size={10} />
                                        <span>Pro Settings</span>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Chat Area */}
            <div
                ref={dropZoneRef}
                className="flex-1 flex flex-col relative w-full h-full overflow-hidden"
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                {/* Drag Overlay */}
                <AnimatePresence>
                    {isDragging && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
                        >
                            <motion.div
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                className="border-2 border-dashed border-violet-500 rounded-3xl p-12 text-center"
                            >
                                <Upload size={48} className="mx-auto mb-4 text-violet-400" />
                                <p className="text-xl font-medium text-white mb-2">Drop files here</p>
                                <p className="text-sm text-zinc-400">Images, PDFs, code files, and more</p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 pointer-events-none">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="pointer-events-auto p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                        title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
                    >
                        {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                    </button>

                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-full pointer-events-auto">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-medium text-zinc-300">CortexAlpha</span>
                        <span className="text-[10px] text-zinc-500 ml-1">•</span>
                        <span className="text-[10px] text-violet-400/70 font-mono">Gemini 2.5 Flash</span>
                    </div>

                    <div className="w-10" /> {/* Balance for layout */}
                </div>

                {/* Interactive Starfield Background (Canvas) */}
                <InteractiveConstellation />

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth" ref={scrollRef} onScroll={handleScroll}>
                    <div className={cn(
                        "w-full max-w-5xl mx-auto px-4 pt-4 md:pt-24 pb-24 md:pb-40 min-h-full flex flex-col justify-end transition-all duration-300 ease-in-out", // Anchor to bottom
                        artifact.isOpen && "mr-[45%] md:mr-[46%]"
                    )}>
                        {messages.length === 0 ? (
                            isMobile ? (
                                <EmptyStateLite onSuggestionClick={(prompt) => handleSubmit(undefined, prompt)} />
                            ) : (
                                <div className="flex flex-col justify-end items-center text-center space-y-2 md:space-y-8 animate-fade-in"> {/* Desktop Empty State */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="relative z-10 flex flex-col items-center justify-center p-2"
                                    >
                                        {/* Rotating Wireframe Globe Background - SIZED TO FIT */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[-1] overflow-hidden">
                                            <WireframeGlobe className="scale-[1.2] md:scale-[2.8] opacity-30 mix-blend-screen" />
                                        </div>

                                        {/* Dual Counter-Rotating Rings (Gyroscope Effect) */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            {/* Ring 1 - Horizontalish (Clockwise) */}
                                            <motion.div
                                                className="absolute w-[120%] h-[120%] md:w-[600px] md:h-[300px] rounded-[100%] border border-cyan-400/40 border-dashed"
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                                            />
                                            {/* Ring 2 - Verticalish (Counter-Clockwise) */}
                                            <motion.div
                                                className="absolute w-[120%] h-[120%] md:w-[300px] md:h-[600px] rounded-[100%] border border-violet-400/40 border-dashed"
                                                animate={{ rotate: -360 }}
                                                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                                            />
                                        </div>

                                        <h1 className="relative text-3xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 pb-2 filter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                            CortexAlpha
                                        </h1>
                                    </motion.div>
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="text-zinc-400 text-sm md:text-base max-w-sm mx-auto leading-relaxed"
                                    >
                                        Unlock the power of neural intelligence. Ask me anything about code, creativity, or complex analysis.
                                    </motion.p>

                                    {/* Keyboard Hints - Desktop Only */}
                                    {!isMobile && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.4 }}
                                            className="flex items-center justify-center gap-4 mt-8 text-[10px] text-zinc-500 font-mono"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">Ctrl</kbd>
                                                <span>+</span>
                                                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">N</kbd>
                                                <span className="ml-1">New Chat</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">Ctrl</kbd>
                                                <span>+</span>
                                                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">/</kbd>
                                                <span className="ml-1">Toggle Sidebar</span>
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className={cn(
                                        "w-full max-w-2xl px-4 mt-4 md:mt-24 relative z-20", // Reduced margin to mt-4
                                        isMobile ? "overflow-x-auto scrolbar-hide -mx-4 pb-4 snap-x flex gap-3 pr-8" : "grid grid-cols-1 md:grid-cols-2 gap-3"
                                    )}>
                                        {suggestions.map((s, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.5 + (i * 0.1) }}
                                                className={cn(isMobile && "snap-center shrink-0")}
                                            >
                                                <SpotlightCard
                                                    className={cn(
                                                        "h-full rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-colors cursor-pointer active:scale-95 duration-200",
                                                        isMobile ? "min-w-[240px] p-3 flex flex-col items-start gap-2" : "p-4 flex flex-col items-start gap-3"
                                                    )}
                                                >
                                                    <div
                                                        className="absolute inset-0 z-10"
                                                        onClick={() => handleSubmit(undefined, s.prompt)}
                                                        role="button"
                                                        tabIndex={0}
                                                    />
                                                    <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20 group-hover:scale-110 transition-all w-fit">
                                                        <s.icon size={16} />
                                                    </div>
                                                    <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">{s.text}</span>
                                                </SpotlightCard>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="space-y-6">
                                {messages.map((msg, index) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                        className={cn(
                                            "flex gap-3 w-full group",
                                            msg.role === "user" ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        {/* AI Avatar */}
                                        {msg.role === "assistant" && (
                                            <div className="ai-avatar mt-1">
                                                O
                                            </div>
                                        )}
                                        <div className={cn(
                                            "max-w-[85%] md:max-w-[80%] relative",
                                            msg.role === "assistant" ? "message-bubble-ai" : "message-bubble-user shadow-lg"
                                        )}>
                                            {msg.images && msg.images.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {msg.images.map((img, i) => (
                                                        <img key={i} src={img} alt="attachment" className="max-h-64 rounded-xl border border-white/10" />
                                                    ))}
                                                </div>
                                            )}

                                            {msg.role === "assistant" ? (
                                                <ReactMarkdown
                                                    components={{
                                                        code({ node, inline, className, children, ...props }: any) {
                                                            const match = /language-(\w+)/.exec(className || '')
                                                            const language = match ? match[1] : 'text';
                                                            const content = String(children).replace(/\n$/, '');

                                                            return !inline && match ? (
                                                                <div className="relative group my-6 rounded-xl overflow-hidden border border-white/[0.08] bg-[#1e1e1e] shadow-lg">
                                                                    {/* Terminal Header */}
                                                                    <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.05]">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="flex gap-1.5">
                                                                                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] opacity-80" />
                                                                                <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] opacity-80" />
                                                                                <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f] opacity-80" />
                                                                            </div>
                                                                            <span className="text-xs font-medium text-zinc-400 ml-2 font-mono">{language}</span>
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                            <button
                                                                                onClick={() => setArtifact({ isOpen: true, content, language, title: "Code Snippet" })}
                                                                                className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-md transition-colors"
                                                                            >
                                                                                <Maximize2 size={12} />
                                                                                <span>Full View</span>
                                                                            </button>
                                                                            <button
                                                                                onClick={() => {
                                                                                    navigator.clipboard.writeText(content);
                                                                                    toast.success("Copied to clipboard");
                                                                                }}
                                                                                className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-md transition-colors"
                                                                            >
                                                                                <Code size={12} />
                                                                                <span>Copy</span>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    {/* Code Body */}
                                                                    <div className="relative">
                                                                        <SyntaxHighlighter
                                                                            {...props}
                                                                            style={vscDarkPlus}
                                                                            language={language}
                                                                            PreTag="div"
                                                                            showLineNumbers={true}
                                                                            customStyle={{
                                                                                margin: 0,
                                                                                padding: '1.5rem',
                                                                                background: 'transparent',
                                                                                fontSize: '13px',
                                                                                lineHeight: '1.6',
                                                                                fontFamily: 'var(--font-mono)',
                                                                                overflowX: 'hidden'
                                                                            }}
                                                                            lineNumberStyle={{
                                                                                minWidth: '2.5em',
                                                                                paddingRight: '1em',
                                                                                color: '#6e7681',
                                                                                textAlign: 'right'
                                                                            }}
                                                                            wrapLongLines={true}
                                                                        >
                                                                            {content}
                                                                        </SyntaxHighlighter>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <code {...props} className={cn(
                                                                    "font-mono text-[13px] px-1.5 py-0.5 rounded-md border border-white/10",
                                                                    msg.role === "assistant" ? "bg-white/5 text-violet-200" : "bg-black/20 text-white"
                                                                )}>
                                                                    {children}
                                                                </code>
                                                            )
                                                        }
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            ) : (
                                                <div className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content}</div>
                                            )}
                                            {/* Message Actions (AI messages only) */}
                                            {msg.role === "assistant" && msg.content && (
                                                <div className="flex items-center gap-1 mt-3 pt-2 border-t border-white/5">
                                                    <span className="message-timestamp text-xs text-zinc-500 mr-auto">
                                                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(msg.content);
                                                            toast.success("Copied to clipboard");
                                                        }}
                                                        className={cn(
                                                            "rounded-lg hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors",
                                                            isMobile ? "p-2.5" : "p-1.5"
                                                        )}
                                                        title="Copy message"
                                                    >
                                                        <Copy size={isMobile ? 16 : 14} />
                                                    </button>
                                                    <button
                                                        onClick={() => toast.success("Thanks for the feedback!")}
                                                        className={cn(
                                                            "rounded-lg hover:bg-white/10 text-zinc-400 hover:text-green-400 transition-colors",
                                                            isMobile ? "p-2.5" : "p-1.5"
                                                        )}
                                                        title="Good response"
                                                    >
                                                        <ThumbsUp size={isMobile ? 16 : 14} />
                                                    </button>
                                                    <button
                                                        onClick={() => toast.info("Feedback noted")}
                                                        className={cn(
                                                            "rounded-lg hover:bg-white/10 text-zinc-400 hover:text-red-400 transition-colors",
                                                            isMobile ? "p-2.5" : "p-1.5"
                                                        )}
                                                        title="Bad response"
                                                    >
                                                        <ThumbsDown size={isMobile ? 16 : 14} />
                                                    </button>
                                                    {/* Regenerate only on last message */}
                                                    {index === messages.length - 1 && (
                                                        <button
                                                            onClick={handleRegenerate}
                                                            className={cn(
                                                                "rounded-lg hover:bg-white/10 text-zinc-400 hover:text-violet-400 transition-colors",
                                                                isMobile ? "p-2.5" : "p-1.5"
                                                            )}
                                                            title="Regenerate response"
                                                        >
                                                            <RefreshCw size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}

                                {isLoading && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
                                        <div className="ai-avatar">
                                            O
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-white/5 px-4 py-3 rounded-2xl">
                                            <div className="typing-dot" />
                                            <div className="typing-dot" />
                                            <div className="typing-dot" />
                                        </div>
                                    </motion.div>
                                )}
                                {error && (
                                    <div className="glass p-4 rounded-xl border-red-500/30 bg-red-500/5 text-red-200 text-sm flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-red-500" />
                                        {error.message}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Scroll to Bottom Button */}
                <AnimatePresence>
                    {showScrollButton && (
                        <motion.button
                            initial={{ opacity: 0, y: 20, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                            onClick={scrollToBottom}
                            className={cn(
                                "absolute bottom-32 left-1/2 -translate-x-1/2 z-40",
                                "p-3 rounded-full bg-black/60 backdrop-blur-xl border border-white/10",
                                "text-zinc-300 hover:text-white hover:bg-black/80 hover:border-violet-500/30",
                                "shadow-lg shadow-black/30 transition-all duration-200",
                                "hover:shadow-violet-500/20 hover:scale-105",
                                artifact.isOpen && "left-1/4"
                            )}
                            title="Scroll to bottom"
                        >
                            <ArrowDown size={18} />
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Floating Input Area */}
                <div className={cn(
                    "absolute bottom-6 left-0 right-0 px-4 md:px-0 z-30 pointer-events-none transition-all duration-300 pb-safe",
                    artifact.isOpen && "pr-[45%]" // Adjust input when artifact is open
                )}>
                    <div className="max-w-5xl mx-auto w-full pointer-events-auto">
                        <form
                            onSubmit={(e) => handleSubmit(e)}
                            className="glass-panel input-glow rounded-[2rem] p-2 transition-all duration-300 focus-within:bg-black/60 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
                        >
                            {/* File Attachments Preview */}
                            <AnimatePresence>
                                {fileAttachments.length > 0 && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="flex gap-3 px-4 pt-4 pb-2 overflow-x-auto"
                                    >
                                        {fileAttachments.map((file) => {
                                            const IconComponent = getFileIcon(file.type);
                                            const isImage = file.type.startsWith('image/');
                                            return (
                                                <div key={file.id} className="relative group shrink-0">
                                                    <div
                                                        onClick={() => setPreviewFile(file)}
                                                        className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2 pr-3 cursor-pointer hover:bg-white/10 transition-colors"
                                                    >
                                                        {isImage ? (
                                                            <img src={file.data} className="h-10 w-10 object-cover rounded-lg" alt={file.name} />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                                                                <IconComponent size={18} className="text-violet-400" />
                                                            </div>
                                                        )}
                                                        <div className="max-w-[100px]">
                                                            <div className="text-xs text-white truncate">{file.name}</div>
                                                            <div className="text-[10px] text-zinc-500">{formatFileSize(file.size)}</div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); removeAttachment(file.id); }}
                                                        className="absolute -top-1.5 -right-1.5 bg-zinc-800 border border-zinc-600 text-white rounded-full p-0.5 hover:bg-red-500 hover:border-red-500 transition-colors"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex items-end gap-2 pl-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-3 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                    title="Attach"
                                >
                                    <Upload size={20} strokeWidth={2} />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    accept="image/*,.pdf,.txt,.md,.json,.js,.ts,.jsx,.tsx,.html,.css,.py,.java,.c,.cpp,.h,.hpp"
                                    multiple
                                />

                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onPaste={handlePaste}
                                    placeholder={isMobile ? "Ask CortexAlpha..." : "Ask CortexAlpha... (paste images with Ctrl+V)"}
                                    className="flex-1 bg-transparent border-none outline-none text-zinc-100 placeholder:text-zinc-600 py-3.5 max-h-[150px] min-h-[52px] resize-none overflow-y-auto font-medium"
                                    rows={1}
                                    disabled={isLoading}
                                />

                                {/* Character Counter */}
                                {input.length > 0 && (
                                    <span className="char-counter self-end mb-3 mr-1">
                                        {input.length}
                                    </span>
                                )}

                                {/* Send / Stop Button */}
                                {isLoading ? (
                                    <button
                                        type="button"
                                        onClick={handleStopGeneration}
                                        className="p-3 rounded-full m-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-all duration-300"
                                        title="Stop generation"
                                    >
                                        <Square size={18} fill="currentColor" />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={!input.trim() && fileAttachments.length === 0}
                                        className={cn(
                                            input.trim() || fileAttachments.length > 0
                                                ? "bg-white text-black hover:bg-violet-200 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                                : "bg-white/5 text-zinc-600"
                                        )}
                                    >
                                        <Send size={20} strokeWidth={2.5} className={cn(input.trim() && "ml-0.5")} />
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* Artifact Panel */}
                <ArtifactPanel
                    isOpen={artifact.isOpen}
                    onClose={() => setArtifact(prev => ({ ...prev, isOpen: false }))}
                    content={artifact.content}
                    language={artifact.language}
                    title={artifact.title}
                />
            </div>

            {/* Settings Modal */}
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />

            {/* File Preview Modal */}
            <AnimatePresence>
                {previewFile && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-8"
                        onClick={() => setPreviewFile(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-4xl max-h-full overflow-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="sticky top-0 flex items-center justify-between p-4 bg-zinc-900/80 backdrop-blur-sm rounded-t-xl border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    {(() => {
                                        const Icon = getFileIcon(previewFile.type);
                                        return <Icon size={20} className="text-violet-400" />;
                                    })()}
                                    <div>
                                        <div className="text-sm font-medium text-white">{previewFile.name}</div>
                                        <div className="text-xs text-zinc-500">{formatFileSize(previewFile.size)}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={previewFile.data}
                                        download={previewFile.name}
                                        className="p-2 rounded-lg bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
                                        title="Download"
                                    >
                                        <Download size={18} />
                                    </a>
                                    <button
                                        onClick={() => setPreviewFile(null)}
                                        className="p-2 rounded-lg bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="bg-zinc-900 rounded-b-xl overflow-hidden">
                                {previewFile.type.startsWith('image/') ? (
                                    <img
                                        src={previewFile.data}
                                        alt={previewFile.name}
                                        className="max-w-full max-h-[70vh] object-contain mx-auto"
                                    />
                                ) : previewFile.type.includes('text') || previewFile.type.includes('javascript') || previewFile.type.includes('json') ? (
                                    <pre className="p-4 text-sm text-zinc-300 overflow-auto max-h-[70vh]">
                                        {atob(previewFile.data.split(',')[1] || '')}
                                    </pre>
                                ) : (
                                    <div className="p-8 text-center text-zinc-400">
                                        <FileIcon size={48} className="mx-auto mb-4 opacity-50" />
                                        <p>Preview not available for this file type</p>
                                        <p className="text-sm mt-2">Click download to save the file</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
