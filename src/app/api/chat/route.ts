import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

// Configuration strategy
const MODELS = {
    PRIMARY: "gemini-flash-latest",       // Canonical pointer for 2026
    FALLBACK: "gemini-flash-lite-latest", // Fast backup
    LAST_RESORT: "gemini-pro-latest"      // High-intelligence fallback
};

function logServer(message: string) {
    const timestamp = new Date().toISOString();
    const cleanMsg = message.replace(/\n/g, ' ');
    const logLine = `[${timestamp}] ${cleanMsg}`;
    console.log(logLine);
}

// --- Hydra Protocol: Key Management ---
class KeyManager {
    private keys: string[] = [];

    constructor() {
        this.loadKeys();
    }

    private loadKeys() {
        const gathered: string[] = [];
        if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) gathered.push(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
        Object.keys(process.env).forEach(key => {
            if (key.startsWith('GOOGLE_GENERATIVE_AI_API_KEY_') && process.env[key]) {
                gathered.push(process.env[key] as string);
            }
        });
        this.keys = Array.from(new Set(gathered.filter(Boolean))).sort(() => Math.random() - 0.5);
        logServer(`Hydra initialized with ${this.keys.length} keys.`);
    }

    getKey(index: number): string | null {
        if (index >= this.keys.length) return null;
        return this.keys[index];
    }

    getKeyCount(): number {
        return this.keys.length;
    }
}

const keyManager = new KeyManager();

export async function POST(req: Request) {
    try {
        const { messages, config } = await req.json();
        const systemPrompt = config?.systemInstruction || "You are CortexAlpha, an AI assistant. Keep responses brief and use markdown.";
        const temperature = config?.temperature ?? 0.7;

        logServer(`Request received. Messages: ${messages.length}`);

        if (keyManager.getKeyCount() === 0) {
            throw new Error("CRITICAL: No API Keys available in environment.");
        }

        const modelsToTry = [MODELS.PRIMARY, MODELS.FALLBACK, MODELS.LAST_RESORT];
        let lastError: any = null;

        // --- Hydra Protocol Loop ---
        for (const model of modelsToTry) {
            logServer(`Strategy: Attempting Model chain: ${model}`);

            for (let i = 0; i < keyManager.getKeyCount(); i++) {
                const currentKey = keyManager.getKey(i);
                if (!currentKey) continue;
                const keyFingerprint = `...${currentKey.slice(-4)}`;

                try {
                    logServer(`[Attempt] Model: ${model} | Key: ${keyFingerprint} (#${i + 1})`);

                    const google = createGoogleGenerativeAI({ apiKey: currentKey });
                    const { generateText } = await import("ai");

                    // 1. PROBE: Cheap call to validate Key & Quota immediately
                    // This creates a small latency (ms) but guarantees the key is alive.
                    // We verify with a dummy message to ensure the model responds.
                    logServer(`[Probe] Checking validity...`);
                    await generateText({
                        model: google(model),
                        message: "Hydra Probe",
                        messages: [{ role: 'user', content: 'Ping' }],
                    });

                    // 2. STREAM: If probe passed, we are 99% sure streaming will start safely
                    logServer(`[Probe] Success! Starting Stream...`);
                    const result = streamText({
                        model: google(model),
                        system: systemPrompt,
                        temperature: temperature,
                        messages,
                    });

                    return result.toTextStreamResponse();

                } catch (error: any) {
                    lastError = error;
                    const isRetryable =
                        error.message.includes("429") ||
                        error.message.includes("403") ||
                        error.message.includes("503") ||
                        error.message.includes("quota") ||
                        error.message.includes("fetch failed"); // Network blip

                    logServer(`[Failure] Model: ${model} | Key: ${keyFingerprint} | Error: ${error.message}`);

                    if (isRetryable) {
                        logServer(`[Hydra] Retryable error. Rotating key...`);
                        continue;
                    } else {
                        // Fallback for weird errors
                        if (error.message.includes("400")) {
                            // If bad request, we bubble it up unless it's model-specific (e.g. 2.0 experimental feature not supp)
                            // For now, assume 400 is user error OR model mismatch. 
                            // Let's rotate anyway just in case it's a specific key permission issue.
                        }
                        logServer(`[Hydra] Ambiguous error. Rotating key.`);
                        continue;
                    }
                }
            }
            logServer(`[Hydra] Model ${model} failed on ALL keys.`);
        }

        throw new Error(`Hydra Exhaustion: ${lastError?.message}`);

    } catch (error: any) {
        logServer(`FATAL: ${error.message}`);
        return new Response(JSON.stringify({
            error: "CortexAlpha is currently overloaded. Please try again."
        }), { status: 503 });
    }
}
