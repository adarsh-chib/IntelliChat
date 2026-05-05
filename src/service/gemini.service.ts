import "dotenv/config";

/**
 * Generates a streaming response from OpenRouter.
 * @param history - Array of previous messages in Gemini format
 * @param message - The new user message
 * @param systemPrompt - Optional system prompt for personalisation
 */
export const generateStreamingResponse = async (
  history: any[],
  message: string,
  systemPrompt?: string,
) => {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  const MODEL = process.env.OPENROUTER_MODEL;

  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not defined in the environment.");
  }

  if (!MODEL) {
    throw new Error("OPENROUTER_MODEL is not defined in the environment.");
  }

  // OpenRouter uses OpenAI format: [{ role: "user", content: "..." }]
  const messages: Array<{ role: string; content: string }> = [];

  // Inject system prompt if provided
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  // Convert Gemini-format history to OpenAI format
  messages.push(
    ...history.map((h) => ({
      role: h.role === "model" ? "assistant" : h.role,
      content: h.parts[0].text,
    })),
  );

  // Add the current user message
  messages.push({ role: "user", content: message });

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000", // Optional, for OpenRouter rankings
        "X-Title": "IntelliChat AI", // Optional
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: true,
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `OpenRouter Error: ${(errorData as any).error?.message || response.statusText}`,
    );
  }

  return response.body; // Returns a ReadableStream
};
