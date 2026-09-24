import pg from 'pg';
import { query, withTransaction, getDatabasePool } from '../../db/connection.js';

export class InsufficientStockError extends Error {
  constructor(public variantId: string, public available: number, public requested: number) {
    super(`Stok tidak mencukupi untuk varian ${variantId}. Tersedia: ${available}, diminta: ${requested}`);
    this.name = 'InsufficientStockError';
  }
}

export interface InventoryMovementRecord {
  id: string;
  variant_id: string;
  product_name?: string;
  color_name?: string;
  size?: string;
  type: 'STOCK_IN' | 'RESERVE' | 'RELEASE_RESERVE' | 'ORDER_FULFILLED' | 'MANUAL_ADJUSTMENT';
  quantity: number;
  reference_id?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export class PostgresInventoryRepository {
  /**
   * Concurrently-safe stock reservation using SELECT ... FOR UPDATE
   */
  async lockAndReserveStock(
    items: Array<{ variantId: string; quantity: number }>,
    orderNumber: string,
    existingClient?: pg.PoolClient
  ): Promise<void> {
    const execute = async (client: pg.PoolClient) => {
      // Sort variantIds to prevent deadlock when multiple checkouts happen concurrently
      const sortedItems = [...items].sort((a, b) => a.variantId.localeCompare(b.variantId));

      for (const item of sortedItems) {
        // Lock the specific inventory row
        const invRes = await client.query(
          `SELECT id, stock, reserved FROM inventory WHERE variant_id = $1 FOR UPDATE`,
          [item.variantId]
        );

        if (invRes.rows.length === 0) {
          throw new Error(`Inventory record not found for variant ${item.variantId}`);
        }

        const currentStock = Number(invRes.rows[0].stock);
        const currentReserved = Number(invRes.rows[0].reserved);
        const availableStock = currentStock - currentReserved;

        if (availableStock < item.quantity) {
          throw new InsufficientStockError(item.variantId, Math.max(0, availableStock), item.quantity);
        }

        // Atomically increase reserved stock
        await client.query(
          `UPDATE inventory
           SET reserved = reserved + $1, updated_at = NOW()
           WHERE variant_id = $2`,
          [item.quantity, item.variantId]
        );

        // Record movement ledger
        const movId = `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await client.query(
          `INSERT INTO inventory_movements (id, variant_id, type, quantity, reference_id, notes)
           VALUES ($1, $2, 'RESERVE', $3, $4, $5)`,
          [movId, item.variantId, item.quantity, orderNumber, `Reservasi stok pesanan ${orderNumber}`]
        );
      }
    };

    if (existingClient) {
      await execute(existingClient);
    } else {
      await withTransaction(execute);
    }
  }

  /**
   * Release reserved stock on order cancellation or expiration
   */
  async releaseReservedStock(
    items: Array<{ variantId: string; quantity: number }>,
    orderNumber: string,
    existingClient?: pg.PoolClient
  ): Promise<void> {
    const execute = async (client: pg.PoolClient) => {
      for (const item of items) {
        await client.query(
          `UPDATE inventory
           SET reserved = GREATEST(0, reserved - $1), updated_at = NOW()
           WHERE variant_id = $2`,
          [item.quantity, item.variantId]
        );

        const movId = `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await client.query(
          `INSERT INTO inventory_movements (id, variant_id, type, quantity, reference_id, notes)
           VALUES ($1, $2, 'RELEASE_RESERVE', $3, $4, $5)`,
          [movId, item.variantId, item.quantity, orderNumber, `Pelepasan reservasi stok pesanan ${orderNumber}`]
        );
      }
    };

    if (existingClient) {
      await execute(existingClient);
    } else {
      await withTransaction(execute);
    }
  }

  /**
   * Deduct stock on payment completion (Order status = PAID)
   */
  async deductStockOnPayment(
    items: Array<{ variantId: string; quantity: number }>,
    orderNumber: string,
    existingClient?: pg.PoolClient
  ): Promise<void> {
    const execute = async (client: pg.PoolClient) => {
      for (const item of items) {
        await client.query(
          `SELECT id FROM inventory WHERE variant_id = $1 FOR UPDATE`,
          [item.variantId]
        );

        await client.query(
          `UPDATE inventory
           SET stock = GREATEST(0, stock - $1),
               reserved = GREATEST(0, reserved - $1),
               updated_at = NOW()
           WHERE variant_id = $2`,
          [item.quantity, item.variantId]
        );

        const movId = `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await client.query(
          `INSERT INTO inventory_movements (id, variant_id, type, quantity, reference_id, notes)
           VALUES ($1, $2, 'ORDER_FULFILLED', $3, $4, $5)`,
          [movId, item.variantId, item.quantity, orderNumber, `Pengurangan stok pesanan dibayar ${orderNumber}`]
        );
      }
    };

    if (existingClient) {
      await execute(existingClient);
    } else {
      await withTransaction(execute);
    }
  }

  /**
   * Manual admin adjustment
   */
  async adjustStock(
    variantId: string,
    delta: number,
    reason: string,
    adminId?: string
  ): Promise<void> {
    await withTransaction(async (client) => {
      await client.query(
        `SELECT id FROM inventory WHERE variant_id = $1 FOR UPDATE`,
        [variantId]
      );

      await client.query(
        `UPDATE inventory
         SET stock = GREATEST(0, stock + $1), updated_at = NOW()
         WHERE variant_id = $2`,
        [delta, variantId]
      );

      const movId = `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await client.query(
        `INSERT INTO inventory_movements (id, variant_id, type, quantity, notes, created_by)
         VALUES ($1, $2, 'MANUAL_ADJUSTMENT', $3, $4, $5)`,
        [movId, variantId, delta, reason, adminId || null]
      );
    });
  }

  async getMovements(limit = 100): Promise<InventoryMovementRecord[]> {
    const res = await query<InventoryMovementRecord>(
      `SELECT m.*, p.name as product_name, pv.color_name, pv.size
       FROM inventory_movements m
       LEFT JOIN product_variants pv ON m.variant_id = pv.id
       LEFT JOIN products p ON pv.product_id = p.id
       ORDER BY m.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows;
  }

  async getInventoryList(): Promise<any[]> {
    const res = await query(
      `SELECT inv.id, inv.variant_id, inv.stock, inv.reserved,
              (inv.stock - inv.reserved) as available,
              pv.sku, pv.color_name, pv.size,
              p.id as product_id, p.name as product_name
       FROM inventory inv
       JOIN product_variants pv ON inv.variant_id = pv.id
       JOIN products p ON pv.product_id = p.id
       ORDER BY p.name ASC, pv.color_name ASC`
    );
    return res.rows;
  }
}

export const inventoryRepository = new PostgresInventoryRepository();
