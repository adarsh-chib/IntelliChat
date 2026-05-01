import { generateStreamingResponse } from "../service/gemini.service";
import { Request, Response, NextFunction } from "express";
import prisma from "../configs/prisma";
import { ApiError } from "../utils/api.error";
import { ApiResponse } from "../utils/api.response";

export const chatHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = (req as any).user;
  const { message, chatId } = req.body;

  if (!message) {
    return next(new ApiError(400, "Message is required"));
  }

  try {
    // 1. Fetch current user to check token balance
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    // messar --> simmar

    if (!dbUser) {
      return next(new ApiError(404, "User not found"));
    }

    // --- TOKEN RESET LOGIC (Every 6 Hours) ---
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    const now = new Date();
    const lastReset = dbUser.lastTokenReset
      ? new Date(dbUser.lastTokenReset as any)
      : new Date(0);

    if (now.getTime() - lastReset.getTime() >= SIX_HOURS) {
      // Reset tokens to 1000 (default) and update the reset timestamp
      await prisma.user.update({
        where: { id: user.id },
        data: {
          tokenBalance: 1000,
          lastTokenReset: now,
        },
      });
      // Update local dbUser object for the current request
      dbUser.tokenBalance = 1000;
    }
    // ------------------------------------------

    if (dbUser.tokenBalance < 10) {
      return next(
        new ApiError(
          403,
          "Insufficient tokens. checkout our plans to get more token.",
        ),
      );
    }

    let activeChatId = chatId;

    // 1. If no chatId exists, create a new "Conversation" in the DB
    if (!activeChatId) {
      const newChat = await prisma.chat.create({
        data: {
          userId: user.id,
          title: message.substring(0, 30),
        },
      });
      activeChatId = newChat.id;
    }

    // 2. Fetch the LATEST 15 messages to give Gemini "Memory" (Context)
    const historyData = await prisma.message.findMany({
      where: { chatId: activeChatId },
      orderBy: { createdAt: "desc" },
      take: 15,
    });

    // 3. Save the CURRENT USER'S message to the database
    await prisma.message.create({
      data: {
        chatId: activeChatId,
        role: "user",
        content: message,
      },
    });

    // 4. Format history for Gemini (Reverse it so it's Chronological: Oldest -> Newest)
    const history = historyData.reverse().map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // 5. Get Streaming Response from Gemini
    const result = await generateStreamingResponse(history, message);

    // 6. Set headers for streaming
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("x-chat-id", activeChatId); // Send the ID back to the user!

    let fullReply = "";

    // 7. Stream the chunks to the client
    const reader = (result as any).getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.trim() === "" || line.includes("data: [DONE]")) continue;

        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            const content = data.choices[0]?.delta?.content || "";
            if (content) {
              fullReply += content;
              res.write(content);
            }
          } catch (err) {
            // Ignore parse errors for partial chunks
          }
        }
      }
    }

    // 8. Save the FULL reply to the database after streaming finishes
    await prisma.message.create({
      data: {
        chatId: activeChatId,
        role: "model",
        content: fullReply,
      },
    });

    // 9. Deduct tokens
    await prisma.user.update({
      where: { id: user.id },
      data: { tokenBalance: { decrement: 10 } },
    });

    // 10. Close the stream
    res.end();
  } catch (err) {
    next(err);
  }
};
