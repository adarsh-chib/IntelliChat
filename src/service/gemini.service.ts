import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINIKEY;

if (!apiKey) {
  throw new Error("GEMINIKEY is not defined in the environment.");
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

export const generateResponse = async (message: string) => {
  const result = await model.generateContent(message);
  return result.response.text();
};
