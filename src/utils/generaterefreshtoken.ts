import Jwt from "jsonwebtoken";
import { REFRESH_TOKEN_EXPIRES_IN, refreshTOken } from "../configs/jwt";

export const generateRefreshToken = (payload: object) => {
  return Jwt.sign(payload, refreshTOken!, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
};
