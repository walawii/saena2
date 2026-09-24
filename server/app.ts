import express from 'express';
import dotenv from 'dotenv';
import productsRouter from './routes/products.js';
import categoriesRouter from './routes/categories.js';
import shippingRouter from './routes/shipping.js';
import paymentsRouter from './routes/payments.js';
import ordersRouter from './routes/orders.js';
import vouchersRouter from './routes/vouchers.js';
import reviewsRouter from './routes/reviews.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import { errorHandler } from './middleware/errorHandler.js';
import { getDatabaseStatus } from './db/connection.js';

dotenv.config();

export function createExpressApp() {
  const app = express();

  // Basic security and parsing middleware
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Sanitize request logging (never logs auth headers or body secrets)
  app.use((req, _res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`[${req.method}] ${req.url}`);
    }
    next();
  });

  // Health check endpoint with real database status
  app.get('/api/health', (_req, res) => {
    const dbStatus = getDatabaseStatus();
    res.json({
      status: 'ok',
      service: 'Saena.id E-Commerce Production API',
      database: dbStatus,
      timestamp: new Date().toISOString()
    });
  });

  // Mount API routes
  app.use('/api/products', productsRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/shipping', shippingRouter);
  app.use('/api/payments', paymentsRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/vouchers', vouchersRouter);
  app.use('/api/reviews', reviewsRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);

  // 404 for unmatched API routes only (does NOT intercept non-API / SPA routes)
  app.all(['/api', '/api/*'], (_req, res) => {
    res.status(404).json({ success: false, message: 'API endpoint tidak ditemukan' });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
