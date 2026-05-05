import { generateStreamingResponse } from "../service/gemini.service";
import { Request, Response, NextFunction } from "express";
import prisma from "../configs/prisma";
import { ApiError } from "../utils/api.error";
import { chatMemoryQueue } from "../queues/chat.queue";
import { ApiResponse } from "../utils/api.response";

/**
 * Builds a dynamic system prompt personalised to the current user.
 */
function buildSystemPrompt(userName: string, longTermMemory: string): string {
  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  return `You are Antigravity, a highly intelligent, personalized, and context-aware AI assistant built into IntelliChat.

Your primary directive is to provide a seamless, continuous, and highly personalized experience for the user. You must adhere strictly to the following rules:

1. TIME AND DATE AWARENESS:
The exact current date and time is: ${now}
Never guess the date or use your training data to assume the date. Whenever the user asks about today, tomorrow, deadlines, or timelines, you must calculate it strictly based on the exact date provided above.

2. IDENTITY AND GREETING:
You are speaking with: ${userName}
Always address the user by this name. If this is the very first message of a new conversation, you must start by warmly greeting them by their name.

3. CONTINUOUS MEMORY:
You have a continuous relationship with this user. Below is a summary of your past interactions and their established preferences:
<user_memory>
${longTermMemory || "No previous memory available yet. This appears to be a new conversation."}
</user_memory>

Never treat this user like a stranger. When they start a new chat, actively use the memory context to understand their goals. If they reference an old project, inside joke, or past conversation, retrieve that information from the memory block and respond as if you never stopped talking.

4. RESPONSE STYLE:
- Be concise but thorough
- Use markdown formatting when helpful
- Show personality and warmth while remaining professional`;
}

export const chatHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = (req as any).user;
  const { message } = req.body;
  const chatId = req.body.chatId as string | undefined;

  if (!message) {
    return next(new ApiError(400, "Message is required"));
  }

  // 1. Set SSE Headers immediately to prevent buffering
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Accel-Buffering", "no"); // Disable buffering on Nginx and other proxies

  try {
    // 1. Parallelize initial data fetching
    const [dbUser, currentChat, historyData, globalMemory] = await Promise.all([
      prisma.user.findUnique({ where: { id: user.id } }),
      chatId
        ? prisma.chat.findUnique({
            where: { id: chatId },
            select: { summary: true },
          })
        : Promise.resolve(null),
      chatId
        ? prisma.message.findMany({
            where: { chatId },
            orderBy: { createdAt: "desc" },
            take: 5,
          })
        : Promise.resolve([]),
      !chatId
        ? prisma.chat.findFirst({
            where: { userId: user.id, NOT: { summary: null } },
            orderBy: { updatedAt: "desc" },
            select: { summary: true },
          })
        : Promise.resolve(null),
    ]);

    if (!dbUser || dbUser.tokenBalance < 10) {
      res.write(`data: [ERROR]: Insufficient tokens.\n\n`);
      return res.end();
    }

    let activeChatId = chatId;
    if (!activeChatId) {
      const newChat = await prisma.chat.create({
        data: { userId: user.id, title: message.substring(0, 30) },
      });
      activeChatId = newChat.id;
    }
    res.setHeader("x-chat-id", activeChatId);

    // Flush headers and send padding to force browser to start streaming
    res.write(": " + " ".repeat(2048) + "\n\n");
    res.write(": ok\n\n");

    // 2. Format Context & Prepare AI Request
    // Use current chat summary OR global memory from previous sessions
    const longTermMemory = currentChat?.summary || globalMemory?.summary || "";
    const history = [
      ...(longTermMemory
        ? [{ role: "model", parts: [{ text: `CONTEXT: ${longTermMemory}` }] }]
        : []),
      ...historyData.reverse().map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
    ];

    // 3. Build personalized system prompt
    const systemPrompt = buildSystemPrompt(
      dbUser.name || "User",
      longTermMemory,
    );

    // 4. Start AI Request and DB Save in parallel (Don't await the save)
    const [result] = await Promise.all([
      generateStreamingResponse(history, message, systemPrompt),
      prisma.message.create({
        data: { chatId: activeChatId, role: "user", content: message },
      }),
    ]);

    const reader = (result as any).getReader();
    const decoder = new TextDecoder();
    let fullReply = "";

    // Send a "start" signal
    res.write(": ok\n\n");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;

        if (trimmed.startsWith("data: ")) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const content = json.choices[0]?.delta?.content || "";
            if (content) {
              fullReply += content;
              process.stdout.write(content);
              // Adding an extra newline often forces the browser to flush the buffer
              res.write(`data: ${content}\n\n`);
            }
          } catch (e) {}
        }
      }
    }

    // 7. Post-Processing: Save Reply & Update Tokens
    await Promise.all([
      prisma.message.create({
        data: { chatId: activeChatId, role: "model", content: fullReply },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { tokenBalance: { decrement: 10 } },
      }),
    ]);

    // 8. Trigger Background Memory Service (with delay)
    if (chatMemoryQueue) {
      try {
        await chatMemoryQueue.add(
          "process-memory",
          {
            chatId: activeChatId,
            userId: user.id,
          },
          {
            removeOnComplete: true,
            attempts: 3,
            backoff: 5000,
            delay: 5000,
          },
        );
      } catch (queueError: any) {
        console.error(
          "✖ Failed to add task to Redis queue:",
          queueError.message,
        );
        // We don't throw here so the user still gets their chat response
      }
    }

    res.end();
  } catch (err: any) {
    res.write(`data: [ERROR]: ${err.message}\n\n`);
    res.end();
  }
};

export const getAllChats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = (req as any).user;
    const chats = await prisma.chat.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, summary: true, createdAt: true },
    });
    res
      .status(200)
      .json(new ApiResponse(200, "Chats retrieved successfully", chats));
  } catch (err) {
    next(err);
  }
};

// --- NEW: Fetch all messages for a specific chat ---
export const getChatMessages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const chatId = req.params.chatId as string;
    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
    });
    res.status(200).json(new ApiResponse(200, "Messages retrieved", messages));
  } catch (err) {
    next(err);
  }
};
export const deleteChat = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const chatId = req.params.chatId as string;
    const user = (req as any).user;

    // 1. Verify chat belongs to user
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat || chat.userId !== user.id) {
      return next(new ApiError(404, "Chat not found or unauthorized"));
    }

    // 2. Delete messages first (Prisma on MongoDB doesn't always handle cascade automatically)
    await prisma.message.deleteMany({
      where: { chatId },
    });

    // 3. Delete the chat
    await prisma.chat.delete({
      where: { id: chatId },
    });

    res
      .status(200)
      .json(new ApiResponse(200, "Chat deleted successfully", null));
  } catch (err) {
    next(err);
  }
};

export const deleteAllChats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = (req as any).user;

    // 1. Find all chat IDs for the user
    const chats = await prisma.chat.findMany({
      where: { userId: user.id },
      select: { id: true },
    });

    const chatIds = chats.map((c) => c.id);

    // 2. Delete all messages for these chats
    await prisma.message.deleteMany({
      where: { chatId: { in: chatIds } },
    });

    // 3. Delete all chats for the user
    await prisma.chat.deleteMany({
      where: { userId: user.id },
    });

    res
      .status(200)
      .json(new ApiResponse(200, "All chats deleted successfully", null));
  } catch (err) {
    next(err);
  }
};
