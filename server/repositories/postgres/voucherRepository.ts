import { query } from '../../db/connection.js';
import { Voucher } from '../../../src/types/index.js';

export class PostgresVoucherRepository {
  async findByCode(code: string): Promise<Voucher | null> {
    const res = await query<any>(
      `SELECT * FROM vouchers WHERE UPPER(code) = $1 AND is_active = TRUE LIMIT 1`,
      [code.trim().toUpperCase()]
    );
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      code: r.code,
      name: r.name,
      discountType: r.discount_type,
      discountValue: Number(r.discount_value),
      minSpend: Number(r.min_spend),
      maxDiscount: r.max_discount ? Number(r.max_discount) : undefined,
      quota: Number(r.quota),
      usedCount: Number(r.used_count),
      startDate: r.start_date.toISOString(),
      endDate: r.end_date.toISOString(),
      isActive: Boolean(r.is_active)
    };
  }

  async getAllVouchers(): Promise<Voucher[]> {
    const res = await query('SELECT * FROM vouchers ORDER BY created_at DESC');
    return res.rows.map(r => ({
      id: r.id,
      code: r.code,
      name: r.name,
      discountType: r.discount_type,
      discountValue: Number(r.discount_value),
      minSpend: Number(r.min_spend),
      maxDiscount: r.max_discount ? Number(r.max_discount) : undefined,
      quota: Number(r.quota),
      usedCount: Number(r.used_count),
      startDate: r.start_date.toISOString(),
      endDate: r.end_date.toISOString(),
      isActive: Boolean(r.is_active)
    }));
  }

  async getActiveVouchers(): Promise<Voucher[]> {
    const res = await query('SELECT * FROM vouchers WHERE is_active = TRUE ORDER BY created_at DESC');
    return res.rows.map(r => ({
      id: r.id,
      code: r.code,
      name: r.name,
      discountType: r.discount_type,
      discountValue: Number(r.discount_value),
      minSpend: Number(r.min_spend),
      maxDiscount: r.max_discount ? Number(r.max_discount) : undefined,
      quota: Number(r.quota),
      usedCount: Number(r.used_count),
      startDate: r.start_date.toISOString(),
      endDate: r.end_date.toISOString(),
      isActive: Boolean(r.is_active)
    }));
  }

  async createVoucher(data: Partial<Voucher>): Promise<Voucher> {
    const id = `vouch-${Date.now()}`;
    const code = (data.code || `PROMO${Date.now()}`).toUpperCase().trim();
    const res = await query(
      `INSERT INTO vouchers (
        id, code, name, discount_type, discount_value, min_spend, max_discount, quota, start_date, end_date, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)
      RETURNING *`,
      [
        id,
        code,
        data.name || code,
        data.discountType || 'FIXED',
        data.discountValue || 10000,
        data.minSpend || 0,
        data.maxDiscount || null,
        data.quota || 100,
        data.startDate ? new Date(data.startDate) : new Date(),
        data.endDate ? new Date(data.endDate) : new Date(Date.now() + 90 * 24 * 3600 * 1000)
      ]
    );
    const r = res.rows[0];
    return {
      id: r.id,
      code: r.code,
      name: r.name,
      discountType: r.discount_type,
      discountValue: Number(r.discount_value),
      minSpend: Number(r.min_spend),
      maxDiscount: r.max_discount ? Number(r.max_discount) : undefined,
      quota: Number(r.quota),
      usedCount: Number(r.used_count),
      startDate: r.start_date.toISOString(),
      endDate: r.end_date.toISOString(),
      isActive: Boolean(r.is_active)
    };
  }
}

export const voucherRepository = new PostgresVoucherRepository();
