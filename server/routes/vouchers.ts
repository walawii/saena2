import { Router, Request, Response } from 'express';
import { voucherRepository } from '../repositories/postgres/voucherRepository.js';
import { storeRepository } from '../repositories/store.js';
import { isDatabaseConfigured } from '../db/connection.js';

const router = Router();

// GET /api/vouchers - List active vouchers
router.get('/', async (_req: Request, res: Response) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      if (!isDatabaseConfigured()) {
        return res.status(503).json({
          success: false,
          message: 'Layanan basis data PostgreSQL belum terkonfigurasi pada lingkungan produksi.'
        });
      }
      const vouchers = await voucherRepository.getActiveVouchers();
      return res.json({ success: true, data: vouchers });
    }

    if (isDatabaseConfigured()) {
      try {
        const vouchers = await voucherRepository.getActiveVouchers();
        if (vouchers && vouchers.length > 0) {
          return res.json({ success: true, data: vouchers });
        }
      } catch (dbErr: any) {
        console.warn('[Vouchers DB query fallback]:', dbErr.message);
      }
    }
    const vouchers = storeRepository.getVouchers();
    res.json({ success: true, data: vouchers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat voucher' });
  }
});

// GET or POST /api/vouchers/validate - Validate voucher code against cart subtotal
router.all('/validate', async (req: Request, res: Response) => {
  try {
    const code = (req.method === 'POST' ? req.body.code : req.query.code) as string;
    const subtotal = Number(req.method === 'POST' ? req.body.subtotal : req.query.subtotal) || 0;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Kode voucher wajib diisi' });
    }

    let voucher: any = null;

    if (process.env.NODE_ENV === 'production') {
      if (!isDatabaseConfigured()) {
        return res.status(503).json({
          success: false,
          message: 'Layanan basis data PostgreSQL belum terkonfigurasi pada lingkungan produksi.'
        });
      }
      voucher = await voucherRepository.findByCode(code);
    } else {
      if (isDatabaseConfigured()) {
        try {
          voucher = await voucherRepository.findByCode(code);
        } catch (dbErr: any) {
          console.warn('[Voucher validation DB fallback]:', dbErr.message);
        }
      }

      if (!voucher) {
        voucher = storeRepository.getVoucherByCode(code);
      }
    }

    if (!voucher || (!voucher.isActive && !voucher.active)) {
      return res.status(404).json({ success: false, message: 'Kode voucher tidak valid atau sudah kedaluwarsa' });
    }

    const quota = voucher.quota ?? voucher.usageLimit ?? 1000;
    if (voucher.usedCount >= quota) {
      return res.status(400).json({ success: false, message: 'Kuota penggunaan voucher ini telah habis' });
    }

    const minSpend = voucher.minSpend ?? voucher.minimumPurchase ?? 0;
    if (subtotal < minSpend) {
      return res.status(400).json({
        success: false,
        message: `Minimal belanja untuk voucher ini adalah Rp ${minSpend.toLocaleString('id-ID')}`
      });
    }

    let calculatedDiscount = 0;
    const discountType = voucher.discountType || voucher.type || 'PERCENTAGE';
    const discountValue = voucher.discountValue ?? voucher.value ?? 0;
    const maxDiscount = voucher.maxDiscount ?? voucher.maximumDiscount;

    if (discountType === 'PERCENTAGE') {
      calculatedDiscount = Math.round((subtotal * discountValue) / 100);
      if (maxDiscount && calculatedDiscount > maxDiscount) {
        calculatedDiscount = maxDiscount;
      }
    } else {
      calculatedDiscount = discountValue;
    }

    calculatedDiscount = Math.min(calculatedDiscount, subtotal);

    const discountMsg = discountType === 'PERCENTAGE'
      ? `Diskon ${discountValue}% (Hemat Rp ${calculatedDiscount.toLocaleString('id-ID')})`
      : `Potongan langsung Rp ${calculatedDiscount.toLocaleString('id-ID')}`;

    res.json({
      success: true,
      data: {
        code: voucher.code,
        name: voucher.name || voucher.description || voucher.code,
        discountType,
        discountValue,
        calculatedDiscount,
        discount: calculatedDiscount,
        message: `Voucher berhasil diterapkan! ${discountMsg}`
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memvalidasi voucher' });
  }
});

export default router;
