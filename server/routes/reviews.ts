import { Router, Request, Response } from 'express';
import { reviewRepository } from '../repositories/postgres/reviewRepository.js';
import { getErrorMessage } from '../validators/formatError.js';
import { z } from 'zod';

const router = Router();

const CreateReviewSchema = z.object({
  productId: z.string().min(1),
  customerName: z.string().min(2).max(100).trim(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5).max(1000).trim()
});

// GET /api/reviews/product/:productId - Get approved reviews
router.get('/product/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const reviews = await reviewRepository.getByProductId(productId);
    res.json({ success: true, data: reviews });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat ulasan produk' });
  }
});

// POST /api/reviews - Submit a new customer review
router.post('/', async (req: Request, res: Response) => {
  try {
    const parseResult = CreateReviewSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: getErrorMessage(parseResult.error)
      });
    }

    const review = await reviewRepository.createReview(parseResult.data);
    res.status(201).json({
      success: true,
      message: 'Terima kasih! Ulasan Anda berhasil dikirim.',
      data: review
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengirim ulasan' });
  }
});

export default router;
