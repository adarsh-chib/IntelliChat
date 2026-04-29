import Jwt from "jsonwebtoken";
import { ACCESS_TOKEN_EXPRESS_IN, accessToken } from "../configs/jwt";

export const generateAccessToken = (payload : object)=>{
    return Jwt.sign(payload, accessToken! ,{
        expiresIn : ACCESS_TOKEN_EXPRESS_IN
    })
}