import "dotenv/config";
import Express from "express";
import chatRouter from "./route/chat.route";
import { requestLogger } from "./middleware/global.logger";
import userRouter from "./route/user.route";

const app = Express();
app.use(Express.json());
app.use(requestLogger);

app.use("/", chatRouter);
app.use("/user", userRouter);

// Global Error Handler - Must be after all routes
app.use((err: any, req: any, res: any, next: any) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

const PORT = 2000;


app.listen(PORT, () => {
  console.log("server has been running on port", PORT);
});

export default app;
