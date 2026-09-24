import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createExpressApp } from './server/app.js';
import { isDatabaseConfigured, testConnection } from './server/db/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Check database connection status on startup (NO automatic migrations or seeding)
  // Schema migrations must only be run manually via: npm run db:migrate
  // Database seeding must only be run manually via: npm run db:seed
  if (isDatabaseConfigured()) {
    try {
      const status = await testConnection();
      if (status.isConnected) {
        console.log('[PostgreSQL] Database connection verified.');
      } else {
        console.warn('[PostgreSQL Warning]:', status.errorMessage);
      }
    } catch (dbErr: any) {
      console.warn('[PostgreSQL Startup Notice]:', dbErr.message);
    }
  } else {
    console.log('[PostgreSQL Info]: DATABASE_URL is not set or set to mock. Database integration ready for live PostgreSQL URL.');
  }

  const app = createExpressApp();
  const port = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      if (_req.path.startsWith('/api')) {
        return res.status(404).json({ success: false, message: 'API endpoint tidak ditemukan' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[Saena.id] Server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch(err => {
  console.error('[Saena.id] Fatal startup error:', err);
  process.exit(1);
});
