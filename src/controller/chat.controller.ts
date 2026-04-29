import logger from "../configs/logger";
import { generateResponse } from "../service/gemini.service";
import { Request, Response } from "express";

export const chatHandler = async (req: Request, res: Response) => {
  const { message } = req.body;

  try {
    const reply = await generateResponse(message);

    res.status(200).json({
      status: 200,
      message: "response ok",
      data: reply,
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      message: "quota exceeded",
    });
  }
};
