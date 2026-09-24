import { query } from '../../db/connection.js';

export class PostgresPaymentRepository {
  async updatePaymentInfo(data: {
    orderNumber: string;
    providerPaymentId?: string;
    vaNumber?: string;
    qrString?: string;
    paymentUrl?: string;
    rawResponse?: any;
  }): Promise<void> {
    const oRes = await query('SELECT id FROM orders WHERE order_number = $1', [data.orderNumber]);
    if (oRes.rows.length === 0) return;
    const orderId = oRes.rows[0].id;

    await query(
      `UPDATE payments
       SET provider_payment_id = COALESCE($1, provider_payment_id),
           va_number = COALESCE($2, va_number),
           qr_string = COALESCE($3, qr_string),
           payment_url = COALESCE($4, payment_url),
           raw_response = COALESCE($5, raw_response),
           updated_at = NOW()
       WHERE order_id = $6`,
      [
        data.providerPaymentId || null,
        data.vaNumber || null,
        data.qrString || null,
        data.paymentUrl || null,
        data.rawResponse ? JSON.stringify(data.rawResponse) : null,
        orderId
      ]
    );
  }

  async recordPaymentEvent(paymentId: string, eventType: string, payload: any): Promise<void> {
    const id = `pevt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await query(
      `INSERT INTO payment_events (id, payment_id, event_type, payload)
       VALUES ($1, $2, $3, $4)`,
      [id, paymentId, eventType, JSON.stringify(payload)]
    );
  }
}

export const paymentRepository = new PostgresPaymentRepository();
