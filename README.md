# IntelliChat AI - Backend

A powerful, authenticated AI chat system powered by Google Gemini, Express, and Prisma (MongoDB). This backend supports real-time streaming, persistent chat history, and a token-based usage system.

## 🚀 Tech Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (via Prisma ORM)
- **AI Engine**: Google Generative AI (Gemini 2.5 Flash Lite)
- **Security**: JWT Authentication & Bcrypt Password Hashing
- **Monitoring**: Sentry Integration

## ✨ Features Implemented
- [x] **User Authentication**: Secure Signup/Login with JWT tokens.
- [x] **Token System**: Users start with 50 tokens; 10 tokens are deducted per AI interaction.
- [x] **Streaming Responses**: Real-time message delivery using `chunked` transfer encoding.
- [x] **Persistent Storage**: All conversations and messages are stored in MongoDB.
- [x] **Context Awareness (Memory)**: Gemini remembers the last 15 messages for a natural conversation flow.

---

## 🛠 Step-by-Step Implementation Journey

### Phase 1: Foundation & Authentication
- Setup the project with **TypeScript** and **Express**.
- Integrated **Prisma ORM** with MongoDB for data persistence.
- Implemented **Auth Middleware** to protect AI routes using JWT.
- Created `User` model with `tokenBalance` to manage usage limits.

### Phase 2: Gemini AI Integration
- Configured the Google Generative AI SDK.
- Created the `gemini.service.ts` to handle interactions with the `gemini-2.5-flash-lite` model.
- Implemented `sendMessageStream` to support low-latency streaming responses.

### Phase 3: Database & Streaming Flow
- Implemented the `chatHandler` to:
    1. Create a `Chat` session if one doesn't exist.
    2. Save the User's message to the database immediately.
    3. Stream chunks of AI text back to the client using `res.write()`.
    4. Save the full AI reply to the database once the stream finishes.
    5. Deduct 10 tokens from the user's balance.

### Phase 4: Long-Term Memory (Context Awareness)
- **The Challenge**: Making the AI remember previous parts of the conversation without sending too much data.
- **The Solution**: 
    1. **Fetch Latest**: Query the DB for the last 15 messages using `orderBy: { createdAt: "desc" }`.
    2. **Reverse for AI**: Since Gemini needs history in chronological order, we `.reverse()` the array in the backend before sending it to the SDK.
    3. **Start Chat**: Use `model.startChat({ history })` to initialize the AI with the correct context.

---

## 🔑 Environment Variables
Create a `.env` file in the root directory:
```env
PORT=5000
DATABASE_URL=your_mongodb_connection_string
JWT_SECRET=your_secret_key
GEMINIKEY=your_google_gemini_api_key
```

## 🏃 How to Run
1. Install dependencies:
   ```bash
   npm install
   ```
2. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```
3. Run in development mode:
   ```bash
   npm run dev
   ```

---
*Created as part of the IntelliChat development sprint.*
