import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { handleApiRequest } from './src/server/handler';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Pass /api requests to our unified Gemma handler
app.all('/api/*', (req, res) => {
  handleApiRequest(req, res);
});

// Serve frontend static build files if dist folder exists
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

// For SPA routing, fallback to index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`PinkAware Gemma server running at http://localhost:${PORT}`);
  console.log(`Active AI Provider: ${process.env.PROVIDER || 'api'}`);
  console.log(`Gemma Model: ${process.env.GEMMA_API_MODEL || 'gemma-4-26b-a4b-it'}`);
  console.log(`Ollama Local Fallback: ${process.env.OLLAMA_ENDPOINT || 'http://localhost:11434'} (${process.env.OLLAMA_MODEL || 'gemma4:e2b'})`);
});
