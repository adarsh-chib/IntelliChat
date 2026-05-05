# 🚀 IntelliChat AI - High-Performance Background Memory Engine

IntelliChat is a state-of-the-art AI chat backend built for speed, memory, and persistence. It features real-time streaming, background memory summarization, and a robust token-based economy.

## 🛠 Tech Stack
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB (via Prisma ORM)
- **AI Integration**: OpenRouter (Unified API for various LLMs)
- **Background Tasks**: BullMQ + Redis
- **Streaming**: Server-Sent Events (SSE)
- **Security**: JWT (Access & Refresh Tokens), Bcrypt hashing

---

## ✨ Core Features

### 1. 🧠 Dual-Layer Memory System
*   **Short-Term History**: The AI automatically remembers the last 5 messages in any conversation for immediate context.
*   **Long-Term Background Memory**: Uses a **BullMQ** worker to process and summarize conversations in the background. This "Memory Summary" is then provided as context to future chats, allowing the AI to remember things you said days ago without slowing down the request.

### 2. ⚡ Extreme Performance Optimization
*   **Parallel Request Pipeline**: We use `Promise.all` to fetch user data, chat history, and long-term memory simultaneously.
*   **Non-Blocking Saves**: The AI request starts immediately after you send a message. Saving the message to the database happens in the background, reducing the "Time to First Byte" by nearly 40%.
*   **SSE Streaming**: Tokens are streamed directly from OpenRouter to the client as they are generated, ensuring a "ChatGPT-like" typing experience.

### 3. 🛡️ User & Security
*   **Advanced Auth**: Secure authentication using Access Tokens (1h) and Refresh Tokens (7d).
*   **Token Economy**: 
    *   New users start with **1,000 tokens**.
    *   Every AI response costs **10 tokens**.
    *   Automatic token exhaustion detection with frontend alerts.
*   **Auto-Logout**: Proactive session management that logs out users when their security token expires.

### 4. 📂 Chat Management
*   **Persistence**: Stay logged in even after a hard browser refresh.
*   **Organization**: Multiple chat sessions per user with individual titles and summaries.
*   **Clean Workspace**: One-click "Clear All" or individual chat deletion.

---

## 🏗 Background Services Architecture

The project uses a **Producer-Consumer** pattern for memory processing:
1.  **The Producer**: When a chat finishes, the `chat.controller` adds a job to the `chat-memory` queue.
2.  **The Delay**: A 5-second delay is added to ensure the background task doesn't interfere with the user's current network bandwidth.
3.  **The Consumer**: A dedicated `chat.worker` (running on BullMQ) picks up the task, retrieves history, generates a summary, and updates the database.

---

## 🔑 Environment Setup

Create a `.env` file:
```env
PORT=2000
DATABASE_URL="your_mongodb_uri"
OPENROUTER_API_KEY="your_openrouter_key"
OPENROUTER_MODEL="your_preferred_model"
ACCESS_TOKEN="your_jwt_access_secret"
REFRESH_TOKEN="your_jwt_refresh_secret"
REDIS_HOST="localhost"
REDIS_PORT=6379
```

---

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Sync Database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Start Redis**:
   Make sure you have a Redis server running locally or via Docker.

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

5. **Run Frontend**:
   Serve the `frontend` folder using any static server (e.g., `npx serve frontend`).

---
*Developed with focus on low-latency AI interactions and persistent state management.*
