import Express from "express";
import { chatHandler } from "../controller/chat.controller";

const chatRouter = Express.Router();

chatRouter.get('/chat', chatHandler)

export default chatRouter;
