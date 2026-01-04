import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

// Helper to get all keys
function getAllKeys() {
    const keys: string[] = [];
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) keys.push(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    Object.keys(process.env).forEach(key => {
        if (key.startsWith('GOOGLE_GENERATIVE_AI_API_KEY_') && process.env[key]) {
            keys.push(process.env[key] as string);
        }
    });
    // Remove duplicates
    return Array.from(new Set(keys.filter(Boolean)));
}

const PRIMARY_MODEL = "gemini-2.0-flash";
const BACKUP_MODEL = "gemini-flash-latest";

const fs = require('fs');
const path = require('path');

function logDebug(message: string) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}\n`;
    try {
        fs.appendFileSync(path.join(process.cwd(), 'server-debug.log'), logLine);
    } catch (e) {
        // ignore logging errors
    }
}

export async function POST(req: Request) {
    try {
        const { messages, config } = await req.json();
        const allKeys = getAllKeys();

        const systemPrompt = config?.systemInstruction || "You are OmniAgent, an AI assistant. Keep responses brief and use markdown.";
        const temperature = config?.temperature ?? 0.7;

        logDebug(`Received request. Messages: ${messages.length}. Config: ${JSON.stringify(config)}`);

        if (allKeys.length === 0) {
            throw new Error("No Google API keys found in environment variables");
        }

        // Pick a random key to distribute load
        const randomKey = allKeys[Math.floor(Math.random() * allKeys.length)];
        const keyIndex = allKeys.indexOf(randomKey);

        const keyInfo = `Key #${keyIndex + 1}/${allKeys.length} (...${randomKey.slice(-4)})`;
        console.log(`[API] Using ${keyInfo}`);
        logDebug(`Using ${keyInfo}`);

        const google = createGoogleGenerativeAI({ apiKey: randomKey });

        // Helper to attempt streaming with fallback
        try {
            console.log(`[API] Attempting Primary Model: ${PRIMARY_MODEL}`);
            logDebug(`Attempting Primary Model: ${PRIMARY_MODEL}`);

            // Pre-validate Primary Model (2.0 Flash) to catch Quota/Suspended errors synchronously
            const { generateText } = await import("ai");
            await generateText({
                model: google(PRIMARY_MODEL),
                messages: [{ role: 'user', content: 'check' }],
                maxRetries: 0, // FAIL FAST if quota is 0. Don't wait 6s.
            });

            // If we get here, Primary is good. Stream it.
            const result = streamText({
                model: google(PRIMARY_MODEL),
                system: systemPrompt,
                temperature: temperature,
                messages,
            });

            return result.toTextStreamResponse();

        } catch (primaryError: any) {
            const warnMsg = `Primary Model (${PRIMARY_MODEL}) failed: ${primaryError.message}`;
            console.warn(`[API] ${warnMsg}`);
            logDebug(warnMsg);

            // Attempt 2: Backup Model
            console.log(`[API] Falling back to Backup Model: ${BACKUP_MODEL}`);
            logDebug(`Falling back to Backup Model: ${BACKUP_MODEL}`);
            try {
                const result = streamText({
                    model: google(BACKUP_MODEL),
                    system: systemPrompt,
                    temperature: temperature,
                    messages,
                    onFinish: ({ text, usage }) => {
                        logDebug(`Backup Stream Finished. generated text length: ${text.length}`);
                        logDebug(`Usage: ${JSON.stringify(usage)}`);
                        if (text.length === 0) {
                            logDebug(`WARNING: Backup model generated EMPTY text.`);
                        }
                    },
                });
                return result.toTextStreamResponse();
            } catch (backupError: any) {
                const errMsg = `Backup Model (${BACKUP_MODEL}) failed: ${backupError.message}`;
                console.error(`[API] ${errMsg}`);
                logDebug(errMsg);
                throw backupError;
            }
        }


    } catch (error: any) {
        logDebug(`FATAL ERROR: ${error.message}`);
        console.error('[API] Error:', error);
        return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : String(error)
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
