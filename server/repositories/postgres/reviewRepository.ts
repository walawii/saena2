import { query } from '../../db/connection.js';
import { Review } from '../../../src/types/index.js';

export class PostgresReviewRepository {
  async getByProductId(productId: string): Promise<Review[]> {
    const res = await query(
      `SELECT r.*, p.name as product_name
       FROM reviews r
       JOIN products p ON r.product_id = p.id
       WHERE r.product_id = $1 AND r.status = 'APPROVED'
       ORDER BY r.created_at DESC`,
      [productId]
    );
    return res.rows.map(r => ({
      id: r.id,
      productId: r.product_id,
      productName: r.product_name,
      customerName: r.customer_name,
      rating: r.rating,
      comment: r.comment,
      status: r.status,
      createdAt: r.created_at.toISOString()
    }));
  }

  async getAllReviews(status?: string): Promise<Review[]> {
    let sql = `
      SELECT r.*, p.name as product_name
      FROM reviews r
      JOIN products p ON r.product_id = p.id
    `;
    const params: any[] = [];
    if (status) {
      params.push(status);
      sql += ` WHERE r.status = $1`;
    }
    sql += ` ORDER BY r.created_at DESC LIMIT 100`;

    const res = await query(sql, params);
    return res.rows.map(r => ({
      id: r.id,
      productId: r.product_id,
      productName: r.product_name,
      customerName: r.customer_name,
      rating: r.rating,
      comment: r.comment,
      status: r.status,
      createdAt: r.created_at.toISOString()
    }));
  }

  async createReview(data: {
    productId: string;
    userId?: string;
    customerName: string;
    rating: number;
    comment: string;
  }): Promise<Review> {
    const id = `rev-${Date.now()}`;
    const pRes = await query('SELECT name FROM products WHERE id = $1', [data.productId]);
    const productName = pRes.rows[0]?.name || 'Produk Saena';

    await query(
      `INSERT INTO reviews (id, product_id, user_id, customer_name, rating, comment, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'APPROVED')`,
      [id, data.productId, data.userId || null, data.customerName, data.rating, data.comment]
    );

    return {
      id,
      productId: data.productId,
      productName,
      customerName: data.customerName,
      rating: data.rating,
      comment: data.comment,
      status: 'APPROVED',
      createdAt: new Date().toISOString()
    };
  }

  async updateStatus(reviewId: string, status: 'APPROVED' | 'REJECTED'): Promise<boolean> {
    const res = await query(
      `UPDATE reviews SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, reviewId]
    );
    return (res.rowCount || 0) > 0;
  }
}

export const reviewRepository = new PostgresReviewRepository();
