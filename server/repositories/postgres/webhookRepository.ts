import { query } from '../../db/connection.js';

export interface WebhookEventRecord {
  id: string;
  provider: string;
  event_id?: string;
  event_type: string;
  idempotency_key: string;
  payload: any;
  status: 'RECEIVED' | 'PROCESSED' | 'FAILED';
  error_message?: string;
  processed_at?: string;
  created_at: string;
}

export class PostgresWebhookRepository {
  /**
   * Checks if an event has already been processed or received (idempotency key protection)
   */
  async isAlreadyProcessed(idempotencyKey: string): Promise<boolean> {
    const res = await query(
      'SELECT id, status FROM webhook_events WHERE idempotency_key = $1 LIMIT 1',
      [idempotencyKey]
    );
    if (res.rows.length === 0) return false;
    return res.rows[0].status === 'PROCESSED';
  }

  /**
   * Atomically records a webhook event. Returns true if newly created, false if duplicate.
   */
  async recordEvent(data: {
    provider: 'DOKU' | 'MENGANTAR';
    eventId?: string;
    eventType: string;
    idempotencyKey: string;
    payload: any;
  }): Promise<{ isDuplicate: boolean; eventId: string }> {
    const existing = await query(
      'SELECT id, status FROM webhook_events WHERE idempotency_key = $1 LIMIT 1',
      [data.idempotencyKey]
    );

    if (existing.rows.length > 0) {
      return { isDuplicate: true, eventId: existing.rows[0].id };
    }

    const id = `wevt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await query(
      `INSERT INTO webhook_events (id, provider, event_id, event_type, idempotency_key, payload, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'RECEIVED')
       ON CONFLICT (idempotency_key) DO NOTHING`,
      [
        id,
        data.provider,
        data.eventId || null,
        data.eventType,
        data.idempotencyKey,
        JSON.stringify(data.payload)
      ]
    );

    return { isDuplicate: false, eventId: id };
  }

  async markProcessed(idempotencyKey: string, status: 'PROCESSED' | 'FAILED', errorMessage?: string): Promise<void> {
    await query(
      `UPDATE webhook_events
       SET status = $1, error_message = $2, processed_at = NOW()
       WHERE idempotency_key = $3`,
      [status, errorMessage || null, idempotencyKey]
    );
  }
}

export const webhookRepository = new PostgresWebhookRepository();
