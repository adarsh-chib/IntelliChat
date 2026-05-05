import { Queue } from "bullmq";
import { redisConnection, USE_REDIS } from "../configs/redis";

// This creates the "Mailbox" where background tasks will be stored
export const chatMemoryQueue = USE_REDIS 
  ? new Queue("chat-memory", { connection: redisConnection })
  : null;

if (chatMemoryQueue) {
  chatMemoryQueue.on("error", (err) => {
    console.error("✖ Redis Queue Error:", err.message);
  });

  chatMemoryQueue.client.then(() => {
    console.log("✔ Chat Memory Queue connected to Redis");
  }).catch((err) => {
    console.error("✖ Chat Memory Queue failed to connect to Redis:", err.message);
  });
} else {
  console.log("ℹ Redis Queue disabled (Set USE_REDIS=true to enable)");
}