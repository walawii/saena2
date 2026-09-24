import { Router, Request, Response } from 'express';
import { dataStore } from '../repositories/store.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  try {
    const categories = dataStore.getCategories();
    res.json({ success: true, data: categories });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat kategori' });
  }
});

export default router;
