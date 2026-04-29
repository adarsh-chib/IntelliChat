import { Request, Response, NextFunction } from "express";
import logger from "../configs/logger";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.on("finish", () => {
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode}`);
  });
  next();
};
