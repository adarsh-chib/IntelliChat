import Express from "express";
import { chatHandler, getAllChats, getChatMessages, deleteChat, deleteAllChats } from "../controller/chat.controller";
import { authenticationMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { chatValidator } from "../validators/auth.validation";

const chatRouter = Express.Router()

chatRouter.post("/chat", authenticationMiddleware, validate(chatValidator), chatHandler);
chatRouter.get("/chats", authenticationMiddleware, getAllChats);
chatRouter.get("/chats/:chatId/messages", authenticationMiddleware, getChatMessages);
chatRouter.delete("/chats/clear", authenticationMiddleware, deleteAllChats);
chatRouter.delete("/chats/:chatId", authenticationMiddleware, deleteChat);


export default chatRouter;


