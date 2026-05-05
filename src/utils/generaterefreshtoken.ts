import Jwt from "jsonwebtoken";
import { REFRESH_TOKEN_EXPIRES_IN, refreshToken } from "../configs/jwt";

export const generateRefreshToken = (payload: object) => {
  return Jwt.sign(payload, refreshToken!, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
};

