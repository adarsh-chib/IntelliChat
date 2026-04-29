import Express from "express";
import chatRouter from "./route/chat.route";
import { requestLogger } from "./middleware/global.logger";
import userRouter from "./route/user.route";

const app = Express();
app.use(Express.json());
app.use(requestLogger);

app.use("/", chatRouter);
app.use("/user", userRouter);

const PORT = 2000;

app.listen(PORT, () => {
  console.log("server has been running on port", PORT);
});

export default app;
