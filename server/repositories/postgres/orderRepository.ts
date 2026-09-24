import pg from 'pg';
import { query, withTransaction } from '../../db/connection.js';
import { Order, OrderStatus, PaymentStatus } from '../../../src/types/index.js';
import { inventoryRepository } from './inventoryRepository.js';

export const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['PAID', 'CANCELLED', 'EXPIRED'],
  PAID: ['PROCESSING', 'REFUNDED'],
  PROCESSING: ['READY_TO_SHIP', 'CANCELLED'],
  READY_TO_SHIP: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['IN_TRANSIT', 'DELIVERED'],
  IN_TRANSIT: ['DELIVERED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  EXPIRED: [],
  REFUNDED: []
};

export class PostgresOrderRepository {
  /**
   * Generates a unique, chronological order number
   */
  async generateOrderNumber(client: pg.PoolClient): Promise<string> {
    const today = new Date();
    const datePrefix = `SAENA-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

    const res = await client.query(
      `SELECT COUNT(id) as count FROM orders WHERE order_number LIKE $1`,
      [`${datePrefix}-%`]
    );

    const nextSeq = Number(res.rows[0]?.count || 0) + 1;
    return `${datePrefix}-${String(nextSeq).padStart(4, '0')}`;
  }

  /**
   * Atomically creates an order, its items, and reserves variant inventory
   */
  async createOrder(data: {
    userId?: string;
    customer: { name: string; email: string; phone: string };
    shippingAddress: any;
    items: Array<{
      productId: string;
      variantId: string;
      productName: string;
      variantColor: string;
      variantSize: string;
      unitPrice: number;
      quantity: number;
      subtotal: number;
      imageUrl?: string;
    }>;
    subtotal: number;
    discount: number;
    shippingCost: number;
    total: number;
    notes?: string;
    voucherCode?: string;
    paymentMethodCode: string;
    paymentMethodName: string;
    shippingProvider?: string;
    shippingService?: string;
  }): Promise<Order> {
    return withTransaction(async (client) => {
      const orderNumber = await this.generateOrderNumber(client);
      const orderId = `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const expiresAt = new Date(Date.now() + 120 * 60 * 1000); // 2 hours expiry

      // 1. Insert order
      await client.query(
        `INSERT INTO orders (
          id, order_number, user_id, customer_name, customer_email, customer_phone,
          shipping_address, subtotal, discount, shipping_cost, total,
          order_status, payment_status, notes, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PENDING_PAYMENT', 'PENDING', $12, $13)`,
        [
          orderId,
          orderNumber,
          data.userId || null,
          data.customer.name,
          data.customer.email,
          data.customer.phone,
          JSON.stringify(data.shippingAddress),
          data.subtotal,
          data.discount,
          data.shippingCost,
          data.total,
          data.notes || '',
          expiresAt
        ]
      );

      // 2. Insert order items
      for (const item of data.items) {
        const itemId = `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await client.query(
          `INSERT INTO order_items (
            id, order_id, product_id, variant_id, product_name, variant_color,
            variant_size, unit_price, quantity, subtotal, image_url
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            itemId,
            orderId,
            item.productId,
            item.variantId,
            item.productName,
            item.variantColor,
            item.variantSize,
            item.unitPrice,
            item.quantity,
            item.subtotal,
            item.imageUrl || ''
          ]
        );
      }

      // 3. Atomically reserve inventory with row locking
      await inventoryRepository.lockAndReserveStock(
        data.items.map(i => ({ variantId: i.variantId, quantity: i.quantity })),
        orderNumber,
        client
      );

      // 4. Record initial status history
      const histId = `hist-${Date.now()}`;
      await client.query(
        `INSERT INTO order_status_history (id, order_id, from_status, to_status, note)
         VALUES ($1, $2, NULL, 'PENDING_PAYMENT', 'Pesanan baru dibuat dan menunggu pembayaran.')`,
        [histId, orderId]
      );

      // 5. Initial Payment record
      const payId = `pay-${Date.now()}`;
      await client.query(
        `INSERT INTO payments (
          id, order_id, provider, payment_method_code, payment_method_name,
          amount, status, expires_at
        ) VALUES ($1, $2, 'DOKU', $3, $4, $5, 'PENDING', $6)`,
        [
          payId,
          orderId,
          data.paymentMethodCode,
          data.paymentMethodName,
          data.total,
          expiresAt
        ]
      );

      // 6. Initial Shipment record
      const shipId = `ship-${Date.now()}`;
      await client.query(
        `INSERT INTO shipments (
          id, order_id, provider, service_code, service_name, status
        ) VALUES ($1, $2, 'MENGANTAR', $3, $4, 'PENDING')`,
        [
          shipId,
          orderId,
          data.shippingService || 'MGT-REG',
          data.shippingProvider || 'Mengantar Regular (SiCepat / JNE)'
        ]
      );

      // 7. Voucher usage record if applied
      if (data.voucherCode && data.discount > 0) {
        const vRes = await client.query('SELECT id FROM vouchers WHERE code = $1', [data.voucherCode]);
        if (vRes.rows.length > 0) {
          const voucherId = vRes.rows[0].id;
          await client.query(
            `INSERT INTO voucher_usages (id, voucher_id, user_id, order_id, discount_amount)
             VALUES ($1, $2, $3, $4, $5)`,
            [`vuse-${Date.now()}`, voucherId, data.userId || null, orderId, data.discount]
          );
          await client.query(
            `UPDATE vouchers SET used_count = used_count + 1 WHERE id = $1`,
            [voucherId]
          );
        }
      }

      const created = await this.getOrderByIdInternal(orderId, client);
      return created!;
    });
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    const res = await query('SELECT id FROM orders WHERE order_number = $1 LIMIT 1', [orderNumber]);
    if (res.rows.length === 0) return null;
    return this.getOrderByIdInternal(res.rows[0].id);
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    return this.getOrderByIdInternal(orderId);
  }

  private async getOrderByIdInternal(orderId: string, client?: pg.PoolClient): Promise<Order | null> {
    const runner = client || { query: (text: string, params?: any[]) => query(text, params) };

    const orderRes = await runner.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (orderRes.rows.length === 0) return null;
    const o = orderRes.rows[0];

    // Fetch items
    const itemsRes = await runner.query('SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at ASC', [orderId]);
    const items = itemsRes.rows.map(i => ({
      productId: i.product_id,
      variantId: i.variant_id,
      name: i.product_name,
      color: i.variant_color,
      size: i.variant_size,
      price: Number(i.unit_price),
      quantity: Number(i.quantity),
      subtotal: Number(i.subtotal),
      image: i.image_url
    }));

    // Fetch payment
    const payRes = await runner.query('SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1', [orderId]);
    const payment = payRes.rows[0] ? {
      code: payRes.rows[0].payment_method_code,
      name: payRes.rows[0].payment_method_name,
      vaNumber: payRes.rows[0].va_number,
      qrString: payRes.rows[0].qr_string,
      paymentUrl: payRes.rows[0].payment_url,
      expiresAt: payRes.rows[0].expires_at ? payRes.rows[0].expires_at.toISOString() : undefined
    } : undefined;

    // Fetch shipment
    const shipRes = await runner.query('SELECT * FROM shipments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1', [orderId]);
    const shipment = shipRes.rows[0];

    // Fetch status history
    const histRes = await runner.query(
      'SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC',
      [orderId]
    );
    const statusHistory = histRes.rows.map(h => ({
      status: h.to_status,
      timestamp: h.created_at.toISOString(),
      note: h.note || ''
    }));

    return {
      id: o.id,
      orderNumber: o.order_number,
      customer: {
        name: o.customer_name,
        email: o.customer_email,
        phone: o.customer_phone
      },
      shippingAddress: typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address,
      items,
      subtotal: Number(o.subtotal),
      discount: Number(o.discount),
      shippingCost: Number(o.shipping_cost),
      total: Number(o.total),
      orderStatus: o.order_status as OrderStatus,
      paymentStatus: o.payment_status as PaymentStatus,
      paymentMethod: payment || {
        code: o.payment_method_code || 'BCA_VA',
        name: o.payment_method_name || 'Virtual Account'
      },
      shippingProvider: shipment?.provider === 'MENGANTAR' ? 'Mengantar' : shipment?.provider || 'Mengantar',
      shippingService: shipment?.service_name || 'Mengantar Regular',
      trackingNumber: shipment?.tracking_number || undefined,
      notes: o.notes || '',
      createdAt: o.created_at.toISOString(),
      updatedAt: o.updated_at.toISOString(),
      statusHistory
    };
  }

  async findByTrackingNumber(trackingNumber: string): Promise<Order | null> {
    const res = await query('SELECT order_id FROM shipments WHERE tracking_number = $1 LIMIT 1', [trackingNumber]);
    if (res.rows.length === 0) return null;
    return this.getOrderByIdInternal(res.rows[0].order_id);
  }

  async getAllOrders(filters?: {
    status?: OrderStatus;
    search?: string;
    userEmail?: string;
    userId?: string;
    limit?: number;
  }): Promise<Order[]> {
    let sql = 'SELECT id FROM orders WHERE 1=1';
    const params: any[] = [];

    if (filters?.status) {
      params.push(filters.status);
      sql += ` AND order_status = $${params.length}`;
    }

    if (filters?.userId) {
      params.push(filters.userId);
      sql += ` AND user_id = $${params.length}`;
    }

    if (filters?.userEmail) {
      params.push(filters.userEmail.toLowerCase());
      sql += ` AND LOWER(customer_email) = $${params.length}`;
    }

    if (filters?.search) {
      params.push(`%${filters.search.toLowerCase()}%`);
      sql += ` AND (LOWER(order_number) LIKE $${params.length} OR LOWER(customer_name) LIKE $${params.length} OR LOWER(customer_phone) LIKE $${params.length})`;
    }

    sql += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      params.push(filters.limit);
      sql += ` LIMIT $${params.length}`;
    }

    const res = await query(sql, params);
    const orders: Order[] = [];
    for (const r of res.rows) {
      const order = await this.getOrderByIdInternal(r.id);
      if (order) orders.push(order);
    }
    return orders;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const res = await query('SELECT id FROM orders WHERE order_number = $1 LIMIT 1', [orderNumber]);
    if (res.rows.length === 0) return null;
    return this.getOrderByIdInternal(res.rows[0].id);
  }

  async findByCustomerEmail(email: string): Promise<Order[]> {
    return this.getAllOrders({ userEmail: email });
  }

  /**
   * Updates order status with state machine validation and inventory deduction
   */
  async updateOrderStatus(
    orderNumber: string,
    newStatus: OrderStatus,
    note?: string,
    changedBy?: string
  ): Promise<Order> {
    return withTransaction(async (client) => {
      const orderRes = await client.query('SELECT * FROM orders WHERE order_number = $1 FOR UPDATE', [orderNumber]);
      if (orderRes.rows.length === 0) {
        throw new Error(`Order ${orderNumber} tidak ditemukan.`);
      }

      const order = orderRes.rows[0];
      const currentStatus = order.order_status as OrderStatus;

      // Validate state machine transition
      const allowedNext = VALID_ORDER_TRANSITIONS[currentStatus] || [];
      if (!allowedNext.includes(newStatus)) {
        throw new Error(
          `Transisi status tidak valid: dari "${currentStatus}" ke "${newStatus}". Pilihan yang diizinkan: [${allowedNext.join(', ')}]`
        );
      }

      // If transitioning to PAID: deduct reserved stock and record movement
      if (newStatus === 'PAID') {
        const itemsRes = await client.query('SELECT variant_id, quantity FROM order_items WHERE order_id = $1', [order.id]);
        const items = itemsRes.rows.map(r => ({ variantId: r.variant_id, quantity: Number(r.quantity) }));
        await inventoryRepository.deductStockOnPayment(items, orderNumber, client);
      }

      // If transitioning to CANCELLED or EXPIRED: release reserved stock
      if (newStatus === 'CANCELLED' || newStatus === 'EXPIRED') {
        const itemsRes = await client.query('SELECT variant_id, quantity FROM order_items WHERE order_id = $1', [order.id]);
        const items = itemsRes.rows.map(r => ({ variantId: r.variant_id, quantity: Number(r.quantity) }));
        await inventoryRepository.releaseReservedStock(items, orderNumber, client);
      }

      // Update order status
      const paymentStatus = newStatus === 'PAID' ? 'PAID' : (newStatus === 'EXPIRED' ? 'EXPIRED' : order.payment_status);
      await client.query(
        `UPDATE orders
         SET order_status = $1, payment_status = $2, updated_at = NOW()
         WHERE id = $3`,
        [newStatus, paymentStatus, order.id]
      );

      // Record history
      await client.query(
        `INSERT INTO order_status_history (id, order_id, from_status, to_status, note, changed_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [`hist-${Date.now()}`, order.id, currentStatus, newStatus, note || `Status diubah menjadi ${newStatus}`, changedBy || null]
      );

      const updated = await this.getOrderByIdInternal(order.id, client);
      return updated!;
    });
  }

  /**
   * Sets tracking number and moves status to SHIPPED
   */
  async setOrderTracking(orderNumber: string, trackingNumber: string, courierName?: string): Promise<Order> {
    return withTransaction(async (client) => {
      const orderRes = await client.query('SELECT id, order_status FROM orders WHERE order_number = $1 FOR UPDATE', [orderNumber]);
      if (orderRes.rows.length === 0) {
        throw new Error('Pesanan tidak ditemukan');
      }
      const orderId = orderRes.rows[0].id;

      await client.query(
        `UPDATE shipments
         SET tracking_number = $1, service_name = COALESCE($2, service_name), status = 'SHIPPED', updated_at = NOW()
         WHERE order_id = $3`,
        [trackingNumber, courierName, orderId]
      );

      // Record initial shipment event
      await client.query(
        `INSERT INTO shipment_events (id, shipment_id, tracking_number, status, description)
         SELECT $1, s.id, $2, 'PICKED_UP', $3
         FROM shipments s WHERE s.order_id = $4 LIMIT 1`,
        [`sevt-${Date.now()}`, trackingNumber, `Paket diserahkan ke kurir Mengantar (${courierName || 'Regular'})`, orderId]
      );

      // Update order status to SHIPPED if currently PAID or PROCESSING or READY_TO_SHIP
      const currentStatus = orderRes.rows[0].order_status;
      if (['PAID', 'PROCESSING', 'READY_TO_SHIP'].includes(currentStatus)) {
        await client.query(
          `UPDATE orders SET order_status = 'SHIPPED', updated_at = NOW() WHERE id = $1`,
          [orderId]
        );
        await client.query(
          `INSERT INTO order_status_history (id, order_id, from_status, to_status, note)
           VALUES ($1, $2, $3, 'SHIPPED', $4)`,
          [`hist-${Date.now()}`, orderId, currentStatus, `Pesanan dikirim dengan no resi ${trackingNumber}`]
        );
      }

      const updated = await this.getOrderByIdInternal(orderId, client);
      return updated!;
    });
  }

  async getAdminStats(): Promise<any> {
    const res = await query(`
      SELECT
        COUNT(id) as total_orders,
        COUNT(CASE WHEN order_status = 'PENDING_PAYMENT' THEN 1 END) as pending_payment,
        COUNT(CASE WHEN order_status = 'PAID' THEN 1 END) as paid,
        COUNT(CASE WHEN order_status = 'PROCESSING' THEN 1 END) as processing,
        COUNT(CASE WHEN order_status = 'SHIPPED' OR order_status = 'IN_TRANSIT' THEN 1 END) as shipped,
        COUNT(CASE WHEN order_status = 'DELIVERED' THEN 1 END) as delivered,
        COUNT(CASE WHEN order_status = 'CANCELLED' THEN 1 END) as cancelled,
        COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN total ELSE 0 END), 0) as total_revenue
      FROM orders
    `);
    const row = res.rows[0];
    return {
      totalOrders: Number(row.total_orders || 0),
      pendingPaymentOrders: Number(row.pending_payment || 0),
      paidOrders: Number(row.paid || 0),
      processingOrders: Number(row.processing || 0),
      shippedOrders: Number(row.shipped || 0),
      deliveredOrders: Number(row.delivered || 0),
      cancelledOrders: Number(row.cancelled || 0),
      totalRevenue: Number(row.total_revenue || 0)
    };
  }
}

export const orderRepository = new PostgresOrderRepository();
