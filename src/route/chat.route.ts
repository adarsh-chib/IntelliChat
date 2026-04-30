import Express from "express";
import { chatHandler } from "../controller/chat.controller";
import { authenticationMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { chatValidator } from "../validators/auth.validation";

const chatRouter = Express.Router();

chatRouter.post("/chat", authenticationMiddleware, validate(chatValidator), chatHandler);

export default chatRouter;

