import { Router, Request, Response } from 'express';
import { dataStore } from '../repositories/store.js';

const router = Router();

// GET /api/reviews?productId=...
router.get('/', (req: Request, res: Response) => {
  try {
    const { productId } = req.query;
    const reviews = dataStore.getReviews(productId as string);
    res.json({ success: true, data: reviews });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat review' });
  }
});

// POST /api/reviews
router.post('/', (req: Request, res: Response) => {
  try {
    const { productId, customerName, rating, comment } = req.body;

    if (!productId || !customerName || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Mohon isi rating, nama, dan ulasan produk Anda.'
      });
    }

    const prod = dataStore.getProductById(productId);
    if (!prod) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    const review = dataStore.createReview({
      productId,
      productName: prod.name,
      customerName,
      rating: Math.max(1, Math.min(5, Number(rating))),
      comment: comment.trim()
    });

    res.status(201).json({
      success: true,
      message: 'Terima kasih! Ulasan Anda berhasil diterbitkan.',
      data: review
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengirimkan review' });
  }
});

export default router;
