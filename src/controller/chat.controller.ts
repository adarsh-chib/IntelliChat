import { generateResponse } from "../service/gemini.service";
import { Request, Response, NextFunction } from "express";
import prisma from "../configs/prisma";
import { ApiError } from "../utils/api.error";
import { ApiResponse } from "../utils/api.response";

export const chatHandler = async (req: Request, res: Response, next: NextFunction) => {
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

    if (!dbUser || dbUser.tokenBalance <= 0) {
      return next(new ApiError(403, "Token budget exceeded. Please recharge."));
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

    // 2. Save the USER'S message to the database
    await prisma.message.create({
      data: {
        chatId: activeChatId,
        role: "user",
        content: message,
      },
    });

    // 3. Fetch the last 10 messages to give Gemini "Memory"
    const historyData = await prisma.message.findMany({
      where: { chatId: activeChatId },
      orderBy: { createdAt: "asc" },
      take: 10,
    });

    // 4. Format history for Gemini
    const history = historyData.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Remove the current message from history before sending to Gemini
    history.pop();

    // 5. Get AI Response
    const reply = await generateResponse(history, message);

    // 6. Save GEMINI'S reply to the database
    await prisma.message.create({
      data: {
        chatId: activeChatId,
        role: "model",
        content: reply,
      },
    });

    // 7. Deduct tokens (e.g., 10 tokens per request)
    await prisma.user.update({
      where: { id: user.id },
      data: { tokenBalance: { decrement: 10 } },
    });

    // 8. Use ApiResponse helper

    res.status(200).json(
      new ApiResponse(200, "Response received successfully", {
        reply,
        chatId: activeChatId,
      })
    );
  } catch (err) {
    next(err);
  }
};


