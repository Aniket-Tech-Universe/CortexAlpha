import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

// Configuration strategy
const MODELS = {
    PRIMARY: "gemini-2.0-flash-exp",   // Try the best first
    FALLBACK: "gemini-1.5-flash",      // Reliable fallback
    LAST_RESORT: "gemini-1.5-flash-8b"  // Fast/Cheap last resort
};

const fs = require('fs');
const path = require('path');

function logServer(message: string) {
    const timestamp = new Date().toISOString();
    const cleanMsg = message.replace(/\n/g, ' '); // linear logs
    const logLine = `[${timestamp}] ${cleanMsg}\n`;
    try {
        fs.appendFileSync(path.join(process.cwd(), 'server-debug.log'), logLine);
    } catch (e) { /* ignore */ }
}

// --- Hydra Protocol: Key Management ---
class KeyManager {
    private keys: string[] = [];
    
    constructor() {
        this.loadKeys();
    }

    private loadKeys() {
        // Gather keys from env
        const gathered: string[] = [];
        if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) gathered.push(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
        Object.keys(process.env).forEach(key => {
            if (key.startsWith('GOOGLE_GENERATIVE_AI_API_KEY_') && process.env[key]) {
                gathered.push(process.env[key] as string);
            }
        });
        
        // Dedupe and Shuffle for load balancing
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

        // --- Hydra Protocol: The Loop ---
        // Strategy: 
        // 1. Try PRIMARY model with Key 0. 
        // 2. If retryable error (Quota/Limit), try Key 1...
        // 3. If ALL keys fail for PRIMARY, switch to FALLBACK model and reset Key index.

        const modelsToTry = [MODELS.PRIMARY, MODELS.FALLBACK, MODELS.LAST_RESORT];
        let lastError: any = null;

        for (const model of modelsToTry) {
            logServer(`Strategy: Attempting Model chain: ${model}`);
            
            // Iterate through ALL usable keys for this model
            for (let i = 0; i < keyManager.getKeyCount(); i++) {
                const currentKey = keyManager.getKey(i);
                if (!currentKey) continue;

                const keyFingerprint = `...${currentKey.slice(-4)}`;
                
                try {
                    logServer(`[Attempt] Model: ${model} | Key: ${keyFingerprint} (#${i+1})`);
                    
                    const google = createGoogleGenerativeAI({ apiKey: currentKey });
                    
                    // Pre-flight check (sync) to fail fast if key is dead
                    // (We can't easily sync check, so we trust streamText to throw or we catch the stream start)
                    
                    const result = streamText({
                        model: google(model),
                        system: systemPrompt,
                        temperature: temperature,
                        messages,
                    });

                    // Verification hook: If streamText creates an object, we assume success. 
                    // Actual network errors might happen during iteration, but that's handled by client reconnection usually,
                    // or Next.js will bubble it. 
                    
                    return result.toTextStreamResponse();

                } catch (error: any) {
                    lastError = error;
                    const isRetryable = 
                        error.message.includes("429") || // Too Many Requests
                        error.message.includes("403") || // Quota / Permission
                        error.message.includes("503") || // Service Unavailable
                        error.message.includes("quota"); // Explicit quota text

                    logServer(`[Failure] Model: ${model} | Key: ${keyFingerprint} | Error: ${error.message}`);

                    if (isRetryable) {
                        logServer(`[Hydra] Error is retryable. Switching to next key...`);
                        continue; // Try next key
                    } else {
                        // If it's a BAD REQUEST (400), don't rotate. The user sent garbage.
                        if (error.message.includes("400")) {
                            logServer(`[Hydra] Non-retryable error (400). Aborting.`);
                            throw error;
                        }
                        // For other unknown errors, we ALSO try rotating just in case it's key-specific weirdness
                         logServer(`[Hydra] Ambiguous error. Rotating key to be safe.`);
                         continue;
                    }
                }
            }
            
            logServer(`[Hydra] Model ${model} failed on ALL keys. Demoting to next model...`);
        }

        // If we exit the loop, we failed completely.
        throw new Error(`Hydra Exhaustion: All models and keys failed. Last error: ${lastError?.message}`);

    } catch (error: any) {
        logServer(`FATAL: Request failed completely. ${error.message}`);
        console.error("Hydra Fatal:", error);
        return new Response(JSON.stringify({
            error: "Service unavailable: Our neural pathways are currently overloaded. Please try again in a moment."
        }), { status: 503 });
    }
}
