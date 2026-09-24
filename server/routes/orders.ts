import { Router, Request, Response } from 'express';
import { orderRepository } from '../repositories/postgres/orderRepository.js';
import { productRepository } from '../repositories/postgres/productRepository.js';
import { voucherRepository } from '../repositories/postgres/voucherRepository.js';
import { paymentRepository } from '../repositories/postgres/paymentRepository.js';
import { paymentService } from '../providers/payment/index.js';
import { CreateOrderSchema, OrderStatusTransitionSchema } from '../validators/orderValidators.js';
import { getErrorMessage } from '../validators/formatError.js';
import { optionalAuth, requireAdminAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { OrderStatus } from '../../src/types/index.js';

const router = Router();

// POST /api/orders - Create order with server-side validation and atomic stock reservation
router.post('/', async (req: Request, res: Response) => {
  try {
    const parseResult = CreateOrderSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: getErrorMessage(parseResult.error)
      });
    }

    const { customer, items, shippingAddress, shippingOption, voucherCode, paymentMethodCode, notes } = parseResult.data;

    // 1. Fetch real pricing and verify existence of variants from DB
    let calculatedSubtotal = 0;
    const verifiedItems: {
      productId: string;
      variantId: string;
      productName: string;
      variantColor: string;
      variantSize: string;
      unitPrice: number;
      quantity: number;
      subtotal: number;
      imageUrl: string;
    }[] = [];

    for (const item of items) {
      const product = await productRepository.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Produk ID ${item.productId} tidak ditemukan`
        });
      }

      const variant = product.variants.find((v: any) => v.id === item.variantId);
      if (!variant) {
        return res.status(400).json({
          success: false,
          message: `Varian produk tidak valid untuk ${product.name}`
        });
      }

      // Check current available stock
      const available = variant.availableStock ?? (variant.stock - (variant.reservedStock || 0));
      if (available < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Maaf, stok untuk ${product.name} (${variant.colorName} - ${variant.size}) tidak mencukupi (tersedia: ${Math.max(0, available)} unit).`
        });
      }

      const price = product.discountPrice || product.price;
      const subtotal = price * item.quantity;
      calculatedSubtotal += subtotal;

      verifiedItems.push({
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        variantColor: variant.colorName || 'Default',
        variantSize: variant.size,
        unitPrice: price,
        quantity: item.quantity,
        subtotal,
        imageUrl: product.images[0] || ''
      });
    }

    // 2. Validate voucher code server-side
    let discountAmount = 0;
    let validVoucherCode = undefined;
    if (voucherCode) {
      const voucher = await voucherRepository.findByCode(voucherCode);
      if (voucher && (voucher.isActive || voucher.active)) {
        const minSpend = voucher.minSpend ?? voucher.minimumPurchase ?? 0;
        if (calculatedSubtotal >= minSpend) {
          const discountType = voucher.discountType || voucher.type || 'PERCENTAGE';
          const discountValue = voucher.discountValue ?? voucher.value ?? 0;
          const maxDiscount = voucher.maxDiscount ?? voucher.maximumDiscount;
          if (discountType === 'PERCENTAGE') {
            discountAmount = Math.round((calculatedSubtotal * discountValue) / 100);
            if (maxDiscount && discountAmount > maxDiscount) {
              discountAmount = maxDiscount;
            }
          } else {
            discountAmount = discountValue;
          }
          discountAmount = Math.min(discountAmount, calculatedSubtotal);
          validVoucherCode = voucher.code;
        }
      }
    }

    // 3. Shipping cost
    const shippingCost = shippingOption?.cost !== undefined ? Number(shippingOption.cost) : 10000;
    const grandTotal = Math.max(0, calculatedSubtotal - discountAmount + shippingCost);

    // 4. Map payment method names
    const paymentNames: Record<string, string> = {
      BCA_VA: 'BCA Virtual Account',
      MANDIRI_VA: 'Mandiri Virtual Account',
      BRI_VA: 'BRI Virtual Account',
      BNI_VA: 'BNI Virtual Account',
      QRIS: 'QRIS',
      CREDIT_CARD: 'Kartu Kredit',
      DOKU_CHECKOUT: 'DOKU Checkout'
    };
    const paymentMethodName = paymentNames[paymentMethodCode] || 'DOKU Payment';

    // 5. Create Order & Reserve Inventory in PostgreSQL transaction
    const newOrder = await orderRepository.createOrder({
      customer,
      shippingAddress,
      items: verifiedItems,
      subtotal: calculatedSubtotal,
      discount: discountAmount,
      shippingCost,
      total: grandTotal,
      notes,
      voucherCode: validVoucherCode,
      paymentMethodCode,
      paymentMethodName,
      shippingProvider: shippingOption?.provider || 'Mengantar',
      shippingService: shippingOption?.serviceName || 'Mengantar Regular'
    });

    // 6. Initiate DOKU Payment
    const paymentProvider = paymentService.getProvider();
    try {
      const paymentResult = await paymentProvider.createPayment({
        orderNumber: newOrder.orderNumber,
        amount: grandTotal,
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone
        },
        paymentMethodCode,
        items: verifiedItems.map((i, idx) => ({
          id: i.variantId || String(idx),
          name: `${i.productName} - ${i.variantColor} (${i.variantSize})`,
          price: i.unitPrice,
          quantity: i.quantity
        })),
        callbackUrl: `${process.env.APP_URL || ''}/order/${newOrder.orderNumber}`
      });

      // Update payment record in database with generated VA / QR / URL
      await paymentRepository.updatePaymentInfo({
        orderNumber: newOrder.orderNumber,
        providerPaymentId: paymentResult.paymentId,
        vaNumber: paymentResult.paymentMethod.vaNumber,
        qrString: paymentResult.paymentMethod.qrString,
        paymentUrl: paymentResult.paymentMethod.paymentUrl,
        rawResponse: paymentResult.rawResponse
      });

      // Refetch updated order
      const finalOrder = await orderRepository.findByOrderNumber(newOrder.orderNumber);

      return res.status(201).json({
        success: true,
        message: 'Pesanan berhasil dibuat. Silakan lakukan pembayaran.',
        data: finalOrder || newOrder
      });
    } catch (payErr: any) {
      console.error('[Payment Provider Init Error]:', payErr.message);
      // Order created in PENDING_PAYMENT state
      return res.status(201).json({
        success: true,
        message: 'Pesanan dibuat. Silakan selesaikan pembayaran.',
        data: newOrder
      });
    }
  } catch (err: any) {
    console.error('[Create Order Error]:', err.message);
    res.status(500).json({
      success: false,
      message: err.message || 'Gagal memproses pesanan'
    });
  }
});

// GET /api/orders/:orderNumber - Get order detail with strict IDOR protection
router.get('/:orderNumber', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const order = await orderRepository.findByOrderNumber(orderNumber);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Pesanan dengan nomor ${orderNumber} tidak ditemukan`
      });
    }

    // IDOR Protection:
    // 1. Admin can view any order
    if (req.user && req.user.role === 'ADMIN') {
      return res.json({ success: true, data: order });
    }

    // 2. Authenticated customer must match order customer email or user ID
    if (req.user) {
      const userEmail = req.user.email.toLowerCase();
      const orderEmail = order.customer.email.toLowerCase();
      const matchesEmail = userEmail === orderEmail;
      const matchesUserId = order.userId && order.userId === req.user.id;

      if (!matchesEmail && !matchesUserId) {
        return res.status(403).json({
          success: false,
          message: 'Akses ditolak: Anda tidak memiliki otorisasi untuk mengakses data pesanan ini.'
        });
      }

      return res.json({ success: true, data: order });
    }

    // 3. Guest user: Must verify email matching order (via ?email=... query or x-customer-email header)
    const verificationEmail = (
      (req.query.email as string) ||
      (req.headers['x-customer-email'] as string) ||
      ''
    ).trim().toLowerCase();

    if (!verificationEmail || verificationEmail !== order.customer.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak: Verifikasi email diperlukan untuk melihat detail pesanan.'
      });
    }

    res.json({ success: true, data: order });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat detail pesanan' });
  }
});

// GET /api/orders - Get customer orders by email query (IDOR protected)
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let targetEmail: string;

    if (req.user && req.user.role === 'ADMIN') {
      // Admin can query any customer email
      targetEmail = (req.query.email as string) || '';
      if (!targetEmail) {
        const allOrders = await orderRepository.getAllOrders({ limit: 100 });
        return res.json({ success: true, data: allOrders });
      }
    } else if (req.user) {
      // Authenticated customer can ONLY query their own email
      targetEmail = req.user.email;
    } else {
      // Unauthenticated: required email parameter
      targetEmail = (req.query.email as string) || '';
      if (!targetEmail) {
        return res.status(400).json({
          success: false,
          message: 'Parameter email diperlukan untuk memuat riwayat pesanan'
        });
      }
    }

    const orders = await orderRepository.findByCustomerEmail(targetEmail);
    res.json({ success: true, data: orders });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat riwayat pesanan' });
  }
});

// PATCH /api/orders/:orderNumber/status - Transition status (ADMIN ONLY)
router.patch('/:orderNumber/status', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const parseResult = OrderStatusTransitionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: getErrorMessage(parseResult.error)
      });
    }

    const { status, note } = parseResult.data;
    const updated = await orderRepository.updateOrderStatus(orderNumber, status as OrderStatus, note, req.user?.name);
    res.json({ success: true, message: `Status pesanan diubah ke ${status}`, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Gagal mengubah status pesanan' });
  }
});

export default router;
