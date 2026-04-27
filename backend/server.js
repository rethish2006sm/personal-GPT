import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { OpenRouter } from '@openrouter/sdk';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment variables and ESM pathing
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash-lite';
const maxCompletionTokens = Number(process.env.MAX_COMPLETION_TOKENS || 400);
const maxHistoryMessages = Number(process.env.MAX_HISTORY_MESSAGES || 8);
const preferredMaxLatency = Number(process.env.PREFERRED_MAX_LATENCY_SECONDS || 2);
const preferredMinThroughput = Number(process.env.PREFERRED_MIN_THROUGHPUT || 20);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Initialize OpenRouter SDK
const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  appTitle: 'C Expert AI'
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body ?? {};

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).send('Missing OPENROUTER_API_KEY in .env');
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).send('Request body must include a non-empty messages array.');
  }

  // Enforce the C-Expert Persona
  const systemPrompt = {
    role: "system",
    content: "You are an expert C programmer. Your goal is to provide accurate, highly optimized, and robust C code. Adhere to best practices in C programming and use Markdown for code blocks. Do not include comments in generated code unless the user explicitly asks for comments. If the user asks for only code, code only, no explanation, or similar wording, return only the code with no intro, bullets, or explanation."
  };

  const recentMessages = messages.slice(-maxHistoryMessages);
  const fullMessages = [systemPrompt, ...recentMessages];

  try {
    // Setup headers for HTTP chunked streaming
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const stream = await openrouter.chat.send({
      chatRequest: {
        model,
        messages: fullMessages,
        stream: true,
        temperature: 0.2,
        maxCompletionTokens,
        provider: {
          allowFallbacks: true,
          sort: 'latency',
          preferredMaxLatency,
          preferredMinThroughput
        },
        reasoning: {
          effort: 'none'
        }
      }
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        // Stream the text straight to the client
        res.write(content);
      }

      // Log reasoning tokens to the server console if they exist
      if (chunk.usage && chunk.usage.reasoningTokens) {
        console.log("\n[Server] Reasoning tokens used:", chunk.usage.reasoningTokens);
      }
    }
    
    // Close the connection when done
    res.end();
  } catch (error) {
    console.error("OpenRouter Error:", error);
    if (!res.headersSent) {
      res.status(500).send(`Error generating response: ${error.message}`);
      return;
    }

    res.write(`\n\nError generating response: ${error.message}`);
    res.end();
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
