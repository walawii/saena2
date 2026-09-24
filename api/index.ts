import type { IncomingMessage, ServerResponse } from 'http';
import { createExpressApp } from '../server/app.js';

const app = createExpressApp();

export default function handler(req: IncomingMessage, res: ServerResponse) {
  // If Vercel stripped the leading '/api' prefix, restore it so Express /api/* routers match
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req as any, res as any);
}

