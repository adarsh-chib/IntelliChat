import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINIKEY;

if (!apiKey) {
  throw new Error("GEMINIKEY is not defined in the environment.");
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

/**
 * Generates a response from Gemini using conversation history for context.
 * @param history - Array of previous messages formatted for Gemini
 * @param message - The new message from the user
 */
export const generateResponse = async (history: any[], message: string) => {
  // 1. We "startChat" and give it the memory (history) from our database
  const chat = model.startChat({
    history: history,
  });

  // 2. We send the new message as part of this ongoing conversation
  const result = await chat.sendMessage(message);

  // 3. Return the text reply
  return result.response.text();
};

