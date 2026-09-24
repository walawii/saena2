import { Router, Request, Response } from 'express';
import { productRepository } from '../repositories/postgres/productRepository.js';
import { storeRepository } from '../repositories/store.js';
import { isDatabaseConfigured } from '../db/connection.js';

const router = Router();

// GET /api/products - Get all products with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, search, featured, best_seller } = req.query;

    if (process.env.NODE_ENV === 'production') {
      if (!isDatabaseConfigured()) {
        return res.status(503).json({
          success: false,
          message: 'Layanan basis data PostgreSQL belum terkonfigurasi pada lingkungan produksi.'
        });
      }

      const products = await productRepository.getAllProducts({
        categorySlug: category as string,
        search: search as string,
        isFeatured: featured === 'true' ? true : undefined,
        isBestSeller: best_seller === 'true' ? true : undefined,
      });

      return res.json({
        success: true,
        data: products
      });
    }

    // Development environment fallback
    if (isDatabaseConfigured()) {
      try {
        const products = await productRepository.getAllProducts({
          categorySlug: category as string,
          search: search as string,
          isFeatured: featured === 'true' ? true : undefined,
          isBestSeller: best_seller === 'true' ? true : undefined,
        });
        if (products && products.length > 0) {
          return res.json({
            success: true,
            data: products
          });
        }
      } catch (dbErr: any) {
        console.warn('[Products DB query fallback]:', dbErr.message);
      }
    }

    let products = storeRepository.getProducts({
      category: category as string,
      search: search as string,
    });
    if (featured === 'true') {
      products = products.filter(p => p.isFeatured);
    }
    if (best_seller === 'true') {
      products = products.filter(p => p.isBestSeller);
    }

    res.json({
      success: true,
      data: products
    });
  } catch (err: any) {
    console.error('[Products Route Error]:', err.message);
    res.status(500).json({ success: false, message: 'Gagal memuat produk' });
  }
});

// GET /api/products/:slug - Product detail
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    if (process.env.NODE_ENV === 'production') {
      if (!isDatabaseConfigured()) {
        return res.status(503).json({
          success: false,
          message: 'Layanan basis data PostgreSQL belum terkonfigurasi pada lingkungan produksi.'
        });
      }

      const product = await productRepository.getProductBySlug(slug);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Produk "${slug}" tidak ditemukan.`
        });
      }

      return res.json({
        success: true,
        data: product
      });
    }

    // Development environment fallback
    if (isDatabaseConfigured()) {
      try {
        const product = await productRepository.getProductBySlug(slug);
        if (product) {
          return res.json({
            success: true,
            data: product
          });
        }
      } catch (dbErr: any) {
        console.warn('[Product slug DB fallback]:', dbErr.message);
      }
    }

    const product = storeRepository.getProductBySlug(slug);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Produk "${slug}" tidak ditemukan.`
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat produk' });
  }
});

export default router;
