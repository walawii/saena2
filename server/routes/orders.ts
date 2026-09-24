import { Router, Request, Response } from 'express';
import { dataStore } from '../repositories/store.js';
import { shippingService } from '../providers/shipping/index.js';
import { notificationService } from '../services/notificationService.js';

const router = Router();

// POST /api/orders - Create Order with strict server-side validation & stock reservation
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      customer,
      items,
      shippingAddress,
      shippingOption,
      voucherCode,
      notes
    } = req.body;

    // 1. Validate customer info
    if (!customer?.name || !customer?.email || !customer?.phone) {
      return res.status(400).json({
        success: false,
        message: 'Informasi customer (nama, email, no HP) wajib diisi lengkap.'
      });
    }

    // 2. Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Keranjang belanja tidak boleh kosong.'
      });
    }

    // 3. Validate shipping address
    if (
      !shippingAddress?.recipientName ||
      !shippingAddress?.phone ||
      !shippingAddress?.province ||
      !shippingAddress?.city ||
      !shippingAddress?.fullAddress
    ) {
      return res.status(400).json({
        success: false,
        message: 'Alamat pengiriman belum lengkap.'
      });
    }

    // 4. Server-Side Price & Stock Verification (NEVER trust frontend calculations)
    const orderItems: any[] = [];
    let calculatedSubtotal = 0;
    let totalWeight = 0;

    for (const item of items) {
      const product = dataStore.getProductById(item.productId);
      if (!product || product.status !== 'ACTIVE') {
        return res.status(400).json({
          success: false,
          message: `Maaf, produk "${item.name || item.productId}" tidak tersedia atau sedang nonaktif.`
        });
      }

      const variant = product.variants.find(v => v.id === item.variantId);
      const availableStock = variant ? variant.stock : product.stock;

      if (availableStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Maaf, stok untuk ${product.name} varian ${item.color || ''} (${item.size || ''}) sisa ${availableStock}.`
        });
      }

      // Always calculate using verified server price
      const actualUnitPrice = product.discountPrice || product.price;
      const itemSubtotal = actualUnitPrice * item.quantity;
      calculatedSubtotal += itemSubtotal;
      totalWeight += (product.weight || 300) * item.quantity;

      orderItems.push({
        productId: product.id,
        variantId: item.variantId || '',
        name: product.name,
        color: item.color || (variant ? variant.colorName : 'Standard'),
        size: item.size || (variant ? variant.size : 'All Size'),
        price: actualUnitPrice,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        image: product.images[0] || ''
      });
    }

    // 5. Reserve Stock atomically
    const reserveResult = dataStore.validateAndReserveStock(
      orderItems.map(i => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity
      }))
    );

    if (!reserveResult.success) {
      return res.status(400).json({
        success: false,
        message: reserveResult.error || 'Gagal mereservasi stok produk.'
      });
    }

    // 6. Recalculate Shipping Rate Server-Side via Mengantar provider
    let verifiedShippingCost = 18000;
    let shippingServiceName = 'Mengantar Regular';

    try {
      const provider = shippingService.getProvider();
      const rates = await provider.calculateRates({
        originPostalCode: process.env.MENGANTAR_ORIGIN_POSTAL_CODE || '12430',
        destinationPostalCode: shippingAddress.postalCode || '10110',
        destinationProvince: shippingAddress.province,
        destinationCity: shippingAddress.city,
        destinationSubdistrict: shippingAddress.subdistrict || shippingAddress.city,
        weightInGrams: Math.max(totalWeight, 100)
      });

      if (shippingOption?.serviceCode) {
        const matched = rates.find(r => r.serviceCode === shippingOption.serviceCode);
        if (matched) {
          verifiedShippingCost = matched.cost;
          shippingServiceName = matched.serviceName;
        } else if (rates.length > 0) {
          verifiedShippingCost = rates[0].cost;
          shippingServiceName = rates[0].serviceName;
        }
      } else if (rates.length > 0) {
        verifiedShippingCost = rates[0].cost;
        shippingServiceName = rates[0].serviceName;
      }
    } catch (e: any) {
      console.warn('Fallback shipping cost applied:', e.message);
    }

    // 7. Recalculate Voucher Discount Server-Side
    let verifiedDiscount = 0;
    let validVoucherCode: string | undefined = undefined;

    if (voucherCode) {
      const voucherRes = dataStore.validateVoucher(voucherCode, calculatedSubtotal);
      if (voucherRes.valid) {
        verifiedDiscount = voucherRes.discount;
        validVoucherCode = voucherCode.toUpperCase();
      }
    }

    // 8. Calculate Grand Total
    const grandTotal = Math.max(0, calculatedSubtotal - verifiedDiscount + verifiedShippingCost);

    // 9. Persist Order
    const newOrder = dataStore.createOrder({
      customer,
      items: orderItems,
      subtotal: calculatedSubtotal,
      discount: verifiedDiscount,
      voucherCode: validVoucherCode,
      shippingCost: verifiedShippingCost,
      total: grandTotal,
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING_PAYMENT',
      paymentMethod: {
        code: req.body.paymentMethodCode || 'BCA_VA',
        name: 'Menunggu Pembayaran'
      },
      shippingProvider: 'Mengantar',
      shippingService: shippingServiceName,
      shippingAddress,
      notes: notes || ''
    });

    // Notify event
    await notificationService.notify({
      type: 'ORDER_CREATED',
      orderNumber: newOrder.orderNumber,
      customerEmail: newOrder.customer.email,
      customerPhone: newOrder.customer.phone,
      metadata: { total: grandTotal, itemCount: orderItems.length }
    });

    res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat.',
      data: newOrder
    });
  } catch (err: any) {
    console.error('Order creation error:', err);
    res.status(500).json({
      success: false,
      message: 'Terjadi masalah saat memproses pesanan. Silakan coba lagi.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// GET /api/orders/:orderNumber - Tracking and detail
router.get('/:orderNumber', (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const order = dataStore.getOrderByNumber(orderNumber);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Pesanan dengan nomor ${orderNumber} tidak ditemukan.`
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat pesanan' });
  }
});

// GET /api/orders - List customer orders
router.get('/', (req: Request, res: Response) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email customer wajib dicantumkan.' });
    }

    const orders = dataStore.getOrders({ customerEmail: email as string });
    res.json({
      success: true,
      data: orders
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat riwayat pesanan' });
  }
});

// PATCH /api/orders/:orderNumber/status - Admin or customer cancellation
router.patch('/:orderNumber/status', (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const { status, note } = req.body;

    const updated = dataStore.updateOrderStatus(orderNumber, status, note || `Status diperbarui ke ${status}`);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    res.json({
      success: true,
      data: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui status pesanan' });
  }
});

export default router;
