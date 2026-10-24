import type { IncomingMessage, ServerResponse } from 'http';
import { runGemmaAssessment, getProviderConfig } from './gemmaProvider';
import type { AssessmentInput } from '../types';

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Set standard CORS & JSON headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Health check endpoint
  if (pathname === '/api/health' && req.method === 'GET') {
    const config = getProviderConfig();
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: 'ok',
      provider: config.provider,
      model: config.provider === 'local' ? config.ollamaModel : config.gemmaApiModel,
      hasGeminiApiKey: Boolean(config.geminiApiKey),
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  // Provider configuration status
  if (pathname === '/api/config' && req.method === 'GET') {
    const config = getProviderConfig();
    res.statusCode = 200;
    res.end(JSON.stringify({
      provider: config.provider,
      gemmaApiModel: config.gemmaApiModel,
      ollamaEndpoint: config.ollamaEndpoint,
      ollamaModel: config.ollamaModel,
      isApiKeyConfigured: Boolean(config.geminiApiKey),
    }));
    return;
  }

  // Breast Cancer Research & Awareness Analysis endpoint
  if (pathname === '/api/analyze' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        const input: AssessmentInput = JSON.parse(body || '{}');

        // Validation: Required fields as specified by user
        if (!input.birthDate) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Birth date is required (YYYY-MM-DD)' }));
          return;
        }

        if (!input.motherDiagnosed) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Maternal breast cancer history selection is required (yes, no, or unsure)' }));
          return;
        }

        if (!input.maritalStatus) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Marital status is required' }));
          return;
        }

        const result = await runGemmaAssessment(input);
        res.statusCode = 200;
        res.end(JSON.stringify(result));
      } catch (err: any) {
        console.error('Error during Gemma assessment:', err);
        res.statusCode = 500;
        res.end(JSON.stringify({
          error: err.message || 'An error occurred while analyzing breast cancer risk factors.',
        }));
      }
    });
    return;
  }

  // Not found
  res.statusCode = 404;
  res.end(JSON.stringify({ error: `Not found: ${pathname}` }));
}
