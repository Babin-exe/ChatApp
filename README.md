# ChatApplication

A full-stack realtime chat application built with React, Express, MongoDB, and WebSockets. The app focuses on private one-to-one conversations with Google authentication, message requests, online presence, typing indicators, message delivery states, image messages, replies, reactions, profile editing, theme settings, and user blocking.

## Highlights

- Google OAuth login with HTTP-only JWT session cookies.
- Realtime messaging over WebSockets with online presence and typing indicators.
- Message lifecycle support for sent, delivered, and seen states.
- Chat request workflow before users can start a conversation.
- Image message upload with server-side MIME validation and Cloudinary storage.
- Reply, reaction, and edit support for messages.
- User discovery, contacts, profile editing, username availability checks, and blocking.
- Backend request validation with Zod, centralized error handling, CSRF origin checks, security headers, and Arcjet protection.
- Focused frontend and backend tests using Vitest.

## Tech Stack

Frontend: React 19, Vite, React Router, Axios, Tailwind CSS, Vitest, Testing Library  
Backend: Node.js, Express 5, MongoDB, Mongoose, ws, Zod, Google Auth Library, Cloudinary, Multer, Arcjet, Vitest, Supertest

## Project Structure

```text
backend/
  src/
    controllers/   HTTP request handlers
    services/      Business logic for auth, chat, block, upload
    middleware/    Auth, validation, upload, security, error handling
    models/        Mongoose schemas
    routes/        Express route definitions
    lib/           WebSocket, Cloudinary, Arcjet setup
    cron/          Session cleanup job
  tests/           Backend unit/route tests

frontend/
  src/
    context/       Auth, socket, presence, notification state
    pages/         Login, messages, contacts, profile, settings, themes
    lib/           API client, theme, notification helpers
    hooks/         Shared React hooks
    __tests__/     Frontend component tests
```

## Core Flows

1. A user signs in with Google and receives an HTTP-only session cookie.
2. The frontend loads the authenticated user and opens a WebSocket connection.
3. Users discover people and send a chat request.
4. Once accepted, both users can exchange messages in realtime.
5. The socket layer syncs presence, typing indicators, delivery receipts, seen receipts, reactions, and edited-message events.
6. Blocking removes realtime presence between users and prevents new messages.

## Getting Started

Install dependencies:

```bash
npm install --prefix backend
npm install --prefix frontend
```

Create environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Update the copied `.env` files with MongoDB, Google OAuth, Cloudinary, and Arcjet values.

Run the backend:

```bash
npm run dev --prefix backend
```

Run the frontend:

```bash
npm run dev --prefix frontend
```

Frontend defaults to `http://localhost:5173` and backend defaults to `http://localhost:4000`.

## Useful Scripts

```bash
npm test --prefix backend
npm test --prefix frontend
npm run lint --prefix frontend
npm run build --prefix frontend
```

From the repository root:

```bash
npm run build
npm start
```

## Environment Variables

Backend:

```text
NODE_ENV
PORT
MONGO_URI
JWT_SECRET
GOOGLE_AUTH_CLIENT_ID
FRONTEND_URL
BACKEND_URL
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
ARCJET_KEY
```

Frontend:

```text
VITE_BACKEND_URL
VITE_SOCKET_URL
VITE_GOOGLE_AUTH_CLIENT_ID
```

## Diagram Ideas

- Auth and session flow.
- Chat request lifecycle: discover, request, accept/decline, contact creation.
- WebSocket message lifecycle: send, deliver, seen, edit, reaction.
- Blocking and access-control flow.
- Database schema diagram for users, chats, messages, and blocks.


