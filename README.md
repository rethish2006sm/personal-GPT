# personal-GPT

A simple full-stack AI chat app focused on C programming help.

The project serves a clean frontend chat interface from an Express backend, then streams model responses from OpenRouter back to the browser in real time.

## Features

- C-programming-focused assistant persona
- Streaming chat responses
- Markdown rendering for answers
- Copy button for code blocks
- Lightweight frontend with no build step
- Express API with OpenRouter SDK

## Project Structure

```text
personal-GPT/
├─ backend/
│  ├─ package.json
│  ├─ package-lock.json
│  └─ server.js
├─ frontend/
│  └─ index.html
└─ README.md
```

## Tech Stack

- Frontend: HTML, CSS, vanilla JavaScript
- Backend: Node.js, Express
- AI provider: OpenRouter
- Utilities: `cors`, `dotenv`, `marked`

## How It Works

The frontend sends the recent conversation to `POST /api/chat`.

The backend:

- injects a system prompt that makes the assistant act like an expert C programmer
- trims chat history to a configurable number of messages
- sends the request to OpenRouter with streaming enabled
- streams the response back to the browser as plain text chunks

The frontend reads the stream progressively and renders the assistant output as Markdown.

## Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Create your environment file

Create `backend/.env` with:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
PORT=3000
OPENROUTER_MODEL=google/gemini-2.5-flash-lite
MAX_COMPLETION_TOKENS=400
MAX_HISTORY_MESSAGES=8
PREFERRED_MAX_LATENCY_SECONDS=2
PREFERRED_MIN_THROUGHPUT=20
```

## Run the Project

From the `backend` folder:

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

## API Endpoints

### `GET /api/health`

Returns a simple health response:

```json
{ "ok": true }
```

### `POST /api/chat`

Request body:

```json
{
  "messages": [
    { "role": "user", "content": "Write a linked list in C" }
  ]
}
```

Returns a streamed text response from the model.

## Notes

- The backend serves the frontend statically, so there is no separate frontend server.
- The conversation history kept in memory on the client is limited to recent messages.
- The project currently has no automated tests.

## Future Improvements

- Add syntax highlighting for code blocks
- Add a real `backend/.env.example` file
- Add chat export and conversation reset controls
- Add model selection in the UI

## License

This project is currently unlicensed.
