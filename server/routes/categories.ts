import { Router, Request, Response } from 'express';
import { productRepository } from '../repositories/postgres/productRepository.js';
import { storeRepository } from '../repositories/store.js';
import { isDatabaseConfigured } from '../db/connection.js';

const router = Router();

// GET /api/categories
router.get('/', async (_req: Request, res: Response) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      if (!isDatabaseConfigured()) {
        return res.status(503).json({
          success: false,
          message: 'Layanan basis data PostgreSQL belum terkonfigurasi pada lingkungan produksi.'
        });
      }
      const categories = await productRepository.getAllCategories();
      return res.json({ success: true, data: categories });
    }

    // Development environment fallback
    if (isDatabaseConfigured()) {
      try {
        const categories = await productRepository.getAllCategories();
        if (categories && categories.length > 0) {
          return res.json({ success: true, data: categories });
        }
      } catch (dbErr: any) {
        console.warn('[Categories DB fallback]:', dbErr.message);
      }
    }
    const categories = storeRepository.getCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat kategori' });
  }
});

export default router;
