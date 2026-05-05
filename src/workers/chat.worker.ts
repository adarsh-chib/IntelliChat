import { Worker } from "bullmq";
import { redisConnection, USE_REDIS } from "../configs/redis";
import prisma from "../configs/prisma";

// This is the background service that "listens" for memory tasks
export const chatWorker = USE_REDIS
  ? new Worker(
      "chat-memory",
      async (job) => {
        const { chatId } = job.data;
        console.log(`[Background] Processing memory for chat: ${chatId}`);

        try {
          // 1. Fetch chat history
          const messages = await prisma.message.findMany({
            where: { chatId },
            orderBy: { createdAt: "asc" },
            take: 20, // Summarize the last 20 messages
          });

          // Trigger summary if we have at least 2 messages (1 user, 1 AI)
          if (messages.length >= 2) {
            const historyText = messages
              .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
              .join("\n");

            console.log(`[Background] Generating AI summary for ${chatId}...`);

            // 2. Call OpenRouter to generate a REAL summary
            const response = await fetch(
              "https://openrouter.ai/api/v1/chat/completions",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: process.env.OPENROUTER_MODEL,
                  messages: [
                    {
                      role: "system",
                      content:
                        "Summarize the following chat conversation into 2-3 concise sentences. Focus on the user's name, preferences, and the main topics discussed. Keep it factual and brief for use as long-term memory.",
                    },
                    {
                      role: "user",
                      content: `Please summarize this chat history:\n\n${historyText}`,
                    },
                  ],
                }),
              },
            );

            if (!response.ok) throw new Error("Failed to fetch summary from AI");

            const data = await response.json();
            const generatedSummary = (data as any).choices[0]?.message?.content;

            if (generatedSummary) {
              // 3. Update the Chat model with the REAL summary
              await prisma.chat.update({
                where: { id: chatId },
                data: { summary: generatedSummary },
              });
              console.log(`✔ [Background] REAL summary updated for ${chatId}`);
            }
          }
        } catch (error) {
          console.error(
            `✖ [Background] Error processing memory for ${chatId}:`,
            error,
          );
        }
      },
      {
        connection: redisConnection,
      },
    )
  : null;

if (chatWorker) {
  chatWorker.on("error", (err) => {
    console.error("✖ Redis Worker Error:", err.message);
  });

  chatWorker.on("failed", (job, err) => {
    console.error(`✖ Job ${job?.id} failed:`, err.message);
  });
} else {
  console.log("ℹ Redis Worker disabled (Set USE_REDIS=true to enable)");
}

export default chatWorker;
