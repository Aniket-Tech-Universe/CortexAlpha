import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface FileAttachment {
    id: string;
    name: string;
    type: string;          // MIME type
    size: number;          // bytes
    data: string;          // base64 data URI
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    files?: FileAttachment[];  // Enhanced file attachments
    images?: string[];         // Legacy support
}

export interface ChatSession {
    id: string;
    title: string;
    timestamp: number;
    messages: Message[];
    pinned?: boolean;
}

interface Settings {
    systemInstruction: string;
    temperature: number;
}

interface ChatState {
    sessions: ChatSession[];
    currentSessionId: string | null;
    settings: Settings;

    // Actions
    createSession: () => string;
    setCurrentSession: (id: string) => void;
    addMessage: (sessionId: string, message: Message) => void;
    updateLastMessage: (sessionId: string, content: string) => void;
    deleteSession: (id: string) => void;
    renameSession: (id: string, title: string) => void;
    togglePin: (id: string) => void;
    clearHistory: () => void;
    updateSettings: (settings: Partial<Settings>) => void;
    getActiveSession: () => ChatSession | undefined;
    getSortedSessions: () => ChatSession[];
}

export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => ({
            sessions: [],
            currentSessionId: null,
            settings: {
                systemInstruction: "",
                temperature: 0.7
            },

            createSession: () => {
                const id = Date.now().toString();
                const newSession: ChatSession = {
                    id,
                    title: 'New Chat',
                    timestamp: Date.now(),
                    messages: [],
                };
                set((state) => ({
                    sessions: [newSession, ...state.sessions],
                    currentSessionId: id,
                }));
                return id;
            },

            setCurrentSession: (id) => set({ currentSessionId: id }),

            addMessage: (sessionId, message) => set((state) => {
                const sessionIndex = state.sessions.findIndex(s => s.id === sessionId);
                if (sessionIndex === -1) return state;

                const updatedSessions = [...state.sessions];
                const session = { ...updatedSessions[sessionIndex] };
                session.messages = [...session.messages, message];

                // Update title if it's the first user message
                if (session.messages.length === 1 && message.role === 'user') {
                    session.title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
                }

                updatedSessions[sessionIndex] = session;
                // Move to top
                updatedSessions.splice(sessionIndex, 1);
                updatedSessions.unshift(session);

                return { sessions: updatedSessions };
            }),

            updateLastMessage: (sessionId, content) => set((state) => {
                const sessionIndex = state.sessions.findIndex(s => s.id === sessionId);
                if (sessionIndex === -1) return state;

                const updatedSessions = [...state.sessions];
                const session = { ...updatedSessions[sessionIndex] };
                const lastMsgIndex = session.messages.length - 1;

                if (lastMsgIndex >= 0) {
                    const updatedMsgs = [...session.messages];
                    updatedMsgs[lastMsgIndex] = { ...updatedMsgs[lastMsgIndex], content };
                    session.messages = updatedMsgs;
                    updatedSessions[sessionIndex] = session;
                }

                return { sessions: updatedSessions };
            }),

            deleteSession: (id) => set((state) => ({
                sessions: state.sessions.filter(s => s.id !== id),
                currentSessionId: state.currentSessionId === id ? null : state.currentSessionId
            })),

            renameSession: (id, title) => set((state) => ({
                sessions: state.sessions.map(s =>
                    s.id === id ? { ...s, title } : s
                )
            })),

            togglePin: (id) => set((state) => ({
                sessions: state.sessions.map(s =>
                    s.id === id ? { ...s, pinned: !s.pinned } : s
                )
            })),

            clearHistory: () => set({ sessions: [], currentSessionId: null }),

            updateSettings: (newSettings) => set((state) => ({
                settings: { ...state.settings, ...newSettings }
            })),

            getActiveSession: () => {
                const { sessions, currentSessionId } = get();
                return sessions.find(s => s.id === currentSessionId);
            },

            getSortedSessions: () => {
                const { sessions } = get();
                return [...sessions].sort((a, b) => {
                    // Pinned first
                    if (a.pinned && !b.pinned) return -1;
                    if (!a.pinned && b.pinned) return 1;
                    // Then by timestamp (newest first)
                    return b.timestamp - a.timestamp;
                });
            }
        }),
        {
            name: 'omni-agent-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
