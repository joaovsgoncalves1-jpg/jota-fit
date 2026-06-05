/**
 * API local — chat Gemini + serve Vite em dev.
 * Rode: npm run dev:own (com GEMINI_API_KEY no .env.local)
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      gemini: Boolean(ai),
      backend: process.env.VITE_DATA_BACKEND || 'base44',
    });
  });

  app.post('/api/chat', async (req, res) => {
    if (!ai) {
      return res.status(503).json({ error: 'GEMINI_API_KEY não configurada' });
    }
    try {
      const { contents, systemInstruction } = req.body;
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
      res.json({ text: response.text });
    } catch (error) {
      console.error('[api/chat]', error);
      res.status(500).json({ error: 'Failed to generate response' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      root: path.join(__dirname, '..'),
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, '..', 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Jota Fit server http://localhost:${PORT}`);
  });
}

startServer();