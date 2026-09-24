import { Router, Request, Response } from 'express';
import { dataStore } from '../repositories/store.js';

const router = Router();

// GET /api/products - list and filter products
router.get('/', (req: Request, res: Response) => {
  try {
    const { category, search, minPrice, maxPrice, size, color, sort } = req.query;

    const products = dataStore.getProducts({
      category: category as string,
      search: search as string,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      size: size as string,
      color: color as string,
      sort: sort as string,
    });

    res.json({
      success: true,
      total: products.length,
      data: products
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat produk', error: err.message });
  }
});

// GET /api/products/:identifier - get by slug or id
router.get('/:identifier', (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;
    let product = dataStore.getProductBySlug(identifier);
    if (!product) {
      product = dataStore.getProductById(identifier);
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    // Related products in the same category
    const related = dataStore
      .getProducts({ category: product.category })
      .filter(p => p.id !== product!.id)
      .slice(0, 4);

    res.json({
      success: true,
      data: product,
      related
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat detail produk', error: err.message });
  }
});

export default router;
