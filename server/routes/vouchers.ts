import { Router, Request, Response } from 'express';
import { dataStore } from '../repositories/store.js';

const router = Router();

// GET /api/vouchers - Available active vouchers
router.get('/', (_req: Request, res: Response) => {
  try {
    const vouchers = dataStore.getVouchers().filter(v => v.active);
    res.json({ success: true, data: vouchers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat voucher' });
  }
});

// POST /api/vouchers/validate - Check code against subtotal
router.post('/validate', (req: Request, res: Response) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Kode voucher harus diisi.' });
    }

    const result = dataStore.validateVoucher(code, Number(subtotal || 0));
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.json({
      success: true,
      data: {
        code: result.voucher!.code,
        discount: result.discount,
        description: result.voucher!.description,
        message: result.message
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memvalidasi voucher' });
  }
});

export default router;
