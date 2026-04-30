import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/api.error";
import { accessToken } from "../configs/jwt";

export const authenticationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new ApiError(401, "Access token is required (Bearer token)"));
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return next(new ApiError(401, "Malformed authorization header"));
    }

    if (!accessToken) {
      return next(new ApiError(500, "JWT secret is not configured on server"));
    }

    const decoded = jwt.verify(token, accessToken);

    (req as any).user = decoded;

    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return next(new ApiError(401, "Token has expired"));
    }
    return next(new ApiError(401, "Invalid or expired token"));
  }
};
