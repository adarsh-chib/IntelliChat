import "dotenv/config";
import { any } from "zod";

/**
 * Generates a streaming response from OpenRouter.
 * @param history - Array of previous messages
 * @param message - The new message
 */
export const generateStreamingResponse = async (history: any[], message: string) => {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  const MODEL = process.env.OPENROUTER_MODEL;

  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not defined in the environment.");
  }

  if (!MODEL) {
    throw new Error("OPENROUTER_MODEL is not defined in the environment.");
  }
  // OpenRouter uses OpenAI format: [{ role: "user", content: "..." }]
  const messages = [
    ...history.map(h => ({
      role: h.role === "model" ? "assistant" : h.role,
      content: h.parts[0].text
    })),
    { role: "user", content: message }
  ];

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000", // Optional, for OpenRouter rankings
      "X-Title": "IntelliChat AI", // Optional
    },
    body: JSON.stringify({
      model: MODEL,
      messages: messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenRouter Error: ${(errorData as any).error?.message || response.statusText}`);
  }

  return response.body; // Returns a ReadableStream
};
