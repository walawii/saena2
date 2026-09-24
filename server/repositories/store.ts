import {
  Product,
  Order,
  Voucher,
  Review,
  User,
  ShippingAddress,
  OrderStatus,
  PaymentStatus,
  ProductVariant
} from '../../src/types/index.js';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_VOUCHERS } from '../../src/data/initialProducts.js';

class DataStore {
  private products: Product[] = [];
  private categories = [...INITIAL_CATEGORIES];
  private vouchers: Voucher[] = [...INITIAL_VOUCHERS];
  private orders: Order[] = [];
  private users: User[] = [];
  private reviews: Review[] = [];
  private orderCounter = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Clone products
    this.products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));

    // Seed default admin and customer
    const demoAdmin: User = {
      id: 'usr-admin-1',
      name: 'Admin Saena',
      email: 'admin@saena.id',
      phone: '081234567890',
      role: 'ADMIN',
      addresses: [
        {
          id: 'addr-1',
          recipientName: 'Kantor Pusat Saena.id',
          phone: '081234567890',
          province: 'DKI Jakarta',
          city: 'Jakarta Selatan',
          subdistrict: 'Cilandak',
          village: 'Cilandak Barat',
          postalCode: '12430',
          fullAddress: 'Jl. TB Simatupang No. 88, Wisma Saena Lantai 4',
          isDefault: true
        }
      ],
      createdAt: '2026-01-01T00:00:00Z'
    };

    const demoCustomer: User = {
      id: 'usr-cust-1',
      name: 'Aisyah Nurul',
      email: 'aisyah@example.com',
      phone: '081987654321',
      role: 'CUSTOMER',
      addresses: [
        {
          id: 'addr-2',
          recipientName: 'Aisyah Nurul',
          phone: '081987654321',
          province: 'Jawa Barat',
          city: 'Bandung',
          subdistrict: 'Coblong',
          village: 'Dago',
          postalCode: '40135',
          fullAddress: 'Jl. Ir. H. Djuanda No. 120, Komplek Dago Asri Blok C-4',
          notes: 'Pagar warna putih, titip satpam jika tidak ada orang',
          isDefault: true
        },
        {
          id: 'addr-3',
          recipientName: 'Ibu Fatimah (Orang Tua)',
          phone: '081223344556',
          province: 'DI Yogyakarta',
          city: 'Sleman',
          subdistrict: 'Depok',
          village: 'Condongcatur',
          postalCode: '55281',
          fullAddress: 'Jl. Kaliurang KM 6, Gg. Kenanga No. 15',
          isDefault: false
        }
      ],
      createdAt: '2026-08-10T10:00:00Z'
    };

    this.users = [demoAdmin, demoCustomer];

    // Seed sample reviews
    this.reviews = [
      {
        id: 'rev-1',
        productId: 'prod-1',
        productName: 'Ameera Silk Gamis Dress',
        customerName: 'Siti Rahmawati',
        rating: 5,
        comment: 'MasyaAllah bahannya jatuh banget, silk-nya adem dan mewah. Manset wudhu-nya beneran praktis dan ukurannya pas banget di badan!',
        createdAt: '2026-09-15T10:30:00Z',
        status: 'APPROVED'
      },
      {
        id: 'rev-2',
        productId: 'prod-1',
        productName: 'Ameera Silk Gamis Dress',
        customerName: 'Nurul Hidayah',
        rating: 5,
        comment: 'Jahitannya rapi standar butik premium. Tidak menerawang sama sekali. Pengiriman Mengantar juga kilat cuma 2 hari sampai.',
        createdAt: '2026-09-18T14:15:00Z',
        status: 'APPROVED'
      },
      {
        id: 'rev-3',
        productId: 'prod-4',
        productName: 'Khawla Royal Silk Mukena Eksklusif',
        customerName: 'Dewi Anggraini',
        rating: 5,
        comment: 'Mukena terindah yang pernah saya beli! Sutra armani-nya halus dingin, rendanya mewah ga gatal di kening. Cocok banget buat hantaran.',
        createdAt: '2026-09-20T09:00:00Z',
        status: 'APPROVED'
      },
      {
        id: 'rev-4',
        productId: 'prod-5',
        productName: 'Madina Voal Scarf Laser Cut 115x115',
        customerName: 'Zahra Amanda',
        rating: 5,
        comment: 'Tegak paripurna di dahi tanpa kusut! Bakal repeat order warna lain. Saena.id mantap kualitasnya!',
        createdAt: '2026-09-21T11:45:00Z',
        status: 'APPROVED'
      }
    ];

    // Seed a couple sample orders for tracking demonstration
    const sampleOrder1: Order = {
      id: 'ord-seed-1',
      orderNumber: 'SAENA-20260920-0088',
      customer: {
        name: 'Aisyah Nurul',
        email: 'aisyah@example.com',
        phone: '081987654321'
      },
      items: [
        {
          productId: 'prod-1',
          variantId: 'v1-1',
          name: 'Ameera Silk Gamis Dress',
          color: 'Midnight Navy',
          size: 'M',
          price: 329000,
          quantity: 1,
          subtotal: 329000,
          image: this.products[0]?.images[0] || ''
        }
      ],
      subtotal: 329000,
      discount: 32900,
      voucherCode: 'SAENABARU',
      shippingCost: 18000,
      total: 314100,
      paymentStatus: 'PAID',
      orderStatus: 'SHIPPED',
      paymentMethod: {
        code: 'BCA_VA',
        name: 'BCA Virtual Account',
        vaNumber: '88081234567890'
      },
      shippingProvider: 'Mengantar',
      shippingService: 'Mengantar Regular (SiCepat)',
      trackingNumber: 'MGT-88492011',
      shippingAddress: demoCustomer.addresses[0],
      notes: 'Harap dibungkus rapi untuk kado',
      createdAt: '2026-09-20T10:00:00Z',
      updatedAt: '2026-09-21T08:00:00Z',
      statusHistory: [
        { status: 'PENDING_PAYMENT', timestamp: '2026-09-20T10:00:00Z', note: 'Pesanan dibuat' },
        { status: 'PAID', timestamp: '2026-09-20T10:15:00Z', note: 'Pembayaran DOKU BCA VA terverifikasi' },
        { status: 'PROCESSING', timestamp: '2026-09-20T11:00:00Z', note: 'Pesanan disiapkan oleh tim gudang Saena' },
        { status: 'SHIPPED', timestamp: '2026-09-21T08:00:00Z', note: 'Paket diserahkan ke Mengantar Express (No Resi: MGT-88492011)' }
      ]
    };

    this.orders.push(sampleOrder1);
  }

  // --- PRODUCTS ---
  getProducts(filters?: {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    size?: string;
    color?: string;
    sort?: string;
    status?: string;
  }): Product[] {
    let result = [...this.products];

    if (filters?.status) {
      result = result.filter(p => p.status === filters.status);
    } else {
      // By default only return active products for customers
      result = result.filter(p => p.status === 'ACTIVE');
    }

    if (filters?.category && filters.category !== 'all') {
      if (filters.category === 'best-seller') {
        result = result.filter(p => p.isBestSeller);
      } else {
        result = result.filter(p => p.category === filters.category);
      }
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    }

    if (filters?.minPrice !== undefined) {
      result = result.filter(p => (p.discountPrice || p.price) >= filters.minPrice!);
    }

    if (filters?.maxPrice !== undefined) {
      result = result.filter(p => (p.discountPrice || p.price) <= filters.maxPrice!);
    }

    if (filters?.size) {
      result = result.filter(p => p.sizes.includes(filters.size!));
    }

    if (filters?.color) {
      result = result.filter(p => p.colors.some(c => c.name.toLowerCase() === filters.color!.toLowerCase()));
    }

    // Sorting
    switch (filters?.sort) {
      case 'price-asc':
        result.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
        break;
      case 'price-desc':
        result.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'best-seller':
        result.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0) || b.reviewCount - a.reviewCount);
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }

  getProductById(id: string): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  getProductBySlug(slug: string): Product | undefined {
    return this.products.find(p => p.slug === slug);
  }

  createProduct(productData: Partial<Product>): Product {
    const id = `prod-${Date.now()}`;
    const slug = (productData.name || 'product')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const newProduct: Product = {
      id,
      sku: productData.sku || `SAE-${Math.floor(100 + Math.random() * 900)}`,
      name: productData.name || 'Produk Saena',
      slug,
      description: productData.description || '',
      category: productData.category || 'gamis',
      categoryName: productData.categoryName || 'Gamis',
      price: productData.price || 0,
      discountPrice: productData.discountPrice,
      stock: productData.stock || 10,
      weight: productData.weight || 300,
      dimensions: productData.dimensions || { length: 30, width: 20, height: 4 },
      images: productData.images || [],
      variants: productData.variants || [],
      colors: productData.colors || [],
      sizes: productData.sizes || ['All Size'],
      status: productData.status || 'ACTIVE',
      rating: 5.0,
      reviewCount: 0,
      isBestSeller: Boolean(productData.isBestSeller),
      isFeatured: Boolean(productData.isFeatured),
      isNewArrival: true,
      createdAt: new Date().toISOString()
    };

    this.products.unshift(newProduct);
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) return null;

    this.products[index] = {
      ...this.products[index],
      ...updates
    };
    return this.products[index];
  }

  deleteProduct(id: string): boolean {
    const initialLen = this.products.length;
    this.products = this.products.filter(p => p.id !== id);
    return this.products.length < initialLen;
  }

  // --- CATEGORIES ---
  getCategories() {
    return this.categories;
  }

  // --- VOUCHERS ---
  getVouchers() {
    return this.vouchers;
  }

  getVoucherByCode(code: string): Voucher | undefined {
    return this.vouchers.find(v => v.code.toUpperCase() === code.toUpperCase() && v.active);
  }

  createVoucher(voucher: Omit<Voucher, 'id' | 'usedCount'>): Voucher {
    const newVoucher: Voucher = {
      ...voucher,
      id: `vouc-${Date.now()}`,
      usedCount: 0
    };
    this.vouchers.push(newVoucher);
    return newVoucher;
  }

  validateVoucher(code: string, subtotal: number): { valid: boolean; discount: number; message: string; voucher?: Voucher } {
    const voucher = this.getVoucherByCode(code);
    if (!voucher) {
      return { valid: false, discount: 0, message: 'Kode voucher tidak ditemukan atau sudah tidak aktif.' };
    }

    const now = new Date();
    if (new Date(voucher.startDate) > now || new Date(voucher.endDate) < now) {
      return { valid: false, discount: 0, message: 'Masa berlaku voucher telah berakhir.' };
    }

    if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) {
      return { valid: false, discount: 0, message: 'Kuota penggunaan voucher ini telah habis.' };
    }

    if (subtotal < voucher.minimumPurchase) {
      return {
        valid: false,
        discount: 0,
        message: `Minimal belanja untuk voucher ini adalah Rp ${voucher.minimumPurchase.toLocaleString('id-ID')}`
      };
    }

    let discount = 0;
    if (voucher.type === 'PERCENTAGE') {
      discount = Math.round((subtotal * voucher.value) / 100);
      if (voucher.maximumDiscount && discount > voucher.maximumDiscount) {
        discount = voucher.maximumDiscount;
      }
    } else {
      discount = voucher.value;
    }

    // Ensure discount does not exceed subtotal
    discount = Math.min(discount, subtotal);

    return {
      valid: true,
      discount,
      message: `Voucher berhasil digunakan! Hemat Rp ${discount.toLocaleString('id-ID')}`,
      voucher
    };
  }

  // --- STOCK MANAGEMENT & RESERVATION ---
  validateAndReserveStock(items: { productId: string; variantId: string; quantity: number }[]): {
    success: boolean;
    error?: string;
  } {
    // 1. Verify availability
    for (const item of items) {
      const product = this.getProductById(item.productId);
      if (!product) {
        return { success: false, error: `Produk ID ${item.productId} tidak ditemukan.` };
      }

      const variant = product.variants.find(v => v.id === item.variantId);
      if (!variant) {
        if (product.stock < item.quantity) {
          return { success: false, error: `Maaf, stok ${product.name} tidak mencukupi (sisa ${product.stock}).` };
        }
      } else {
        if (variant.stock < item.quantity) {
          return {
            success: false,
            error: `Maaf, stok ${product.name} varian ${variant.colorName} (${variant.size}) sisa ${variant.stock}.`
          };
        }
      }
    }

    // 2. Reserve / deduct stock
    for (const item of items) {
      const product = this.getProductById(item.productId)!;
      product.stock -= item.quantity;
      const variant = product.variants.find(v => v.id === item.variantId);
      if (variant) {
        variant.stock -= item.quantity;
      }
    }

    return { success: true };
  }

  releaseStock(items: { productId: string; variantId: string; quantity: number }[]) {
    for (const item of items) {
      const product = this.getProductById(item.productId);
      if (product) {
        product.stock += item.quantity;
        const variant = product.variants.find(v => v.id === item.variantId);
        if (variant) {
          variant.stock += item.quantity;
        }
      }
    }
  }

  // --- ORDERS ---
  generateOrderNumber(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const seq = String(this.orderCounter++).padStart(4, '0');
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    return `SAENA-${yyyy}${mm}${dd}-${seq}`;
  }

  createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'statusHistory'>): Order {
    const orderNumber = this.generateOrderNumber();
    const now = new Date().toISOString();

    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber,
      createdAt: now,
      updatedAt: now,
      statusHistory: [
        {
          status: orderData.orderStatus,
          timestamp: now,
          note: 'Pesanan baru berhasil dibuat dan menunggu pembayaran.'
        }
      ]
    };

    if (newOrder.voucherCode) {
      const voucher = this.getVoucherByCode(newOrder.voucherCode);
      if (voucher) {
        voucher.usedCount++;
      }
    }

    this.orders.unshift(newOrder);
    return newOrder;
  }

  getOrders(filters?: { customerEmail?: string; status?: OrderStatus; search?: string }): Order[] {
    let result = [...this.orders];

    if (filters?.customerEmail) {
      result = result.filter(o => o.customer.email.toLowerCase() === filters.customerEmail!.toLowerCase());
    }

    if (filters?.status) {
      result = result.filter(o => o.orderStatus === filters.status);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.phone.includes(q) ||
        (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q))
      );
    }

    return result;
  }

  getOrderByNumber(orderNumber: string): Order | undefined {
    return this.orders.find(o => o.orderNumber.toUpperCase() === orderNumber.toUpperCase());
  }

  updateOrderStatus(orderNumber: string, status: OrderStatus, note: string): Order | null {
    const order = this.getOrderByNumber(orderNumber);
    if (!order) return null;

    order.orderStatus = status;
    order.updatedAt = new Date().toISOString();
    order.statusHistory.push({
      status,
      timestamp: order.updatedAt,
      note
    });

    if (status === 'CANCELLED' || status === 'EXPIRED') {
      // Release reserved stock back to inventory
      this.releaseStock(order.items.map(i => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity
      })));
    }

    return order;
  }

  updatePaymentStatus(orderNumber: string, paymentStatus: PaymentStatus, note?: string): Order | null {
    const order = this.getOrderByNumber(orderNumber);
    if (!order) return null;

    order.paymentStatus = paymentStatus;
    order.updatedAt = new Date().toISOString();

    if (paymentStatus === 'PAID') {
      order.orderStatus = 'PAID';
      order.statusHistory.push({
        status: 'PAID',
        timestamp: order.updatedAt,
        note: note || 'Pembayaran DOKU berhasil diverifikasi.'
      });
    } else if (paymentStatus === 'EXPIRED') {
      this.updateOrderStatus(orderNumber, 'EXPIRED', 'Waktu pembayaran telah habis.');
    } else if (paymentStatus === 'FAILED') {
      this.updateOrderStatus(orderNumber, 'CANCELLED', 'Pembayaran transaksi gagal.');
    }

    return order;
  }

  setOrderTracking(orderNumber: string, trackingNumber: string, serviceName?: string): Order | null {
    const order = this.getOrderByNumber(orderNumber);
    if (!order) return null;

    order.trackingNumber = trackingNumber;
    order.orderStatus = 'SHIPPED';
    if (serviceName) order.shippingService = serviceName;
    order.updatedAt = new Date().toISOString();

    order.statusHistory.push({
      status: 'SHIPPED',
      timestamp: order.updatedAt,
      note: `Paket diserahkan ke Mengantar (${trackingNumber}).`
    });

    return order;
  }

  // --- REVIEWS ---
  getReviews(productId?: string): Review[] {
    if (productId) {
      return this.reviews.filter(r => r.productId === productId && r.status === 'APPROVED');
    }
    return this.reviews;
  }

  createReview(review: Omit<Review, 'id' | 'createdAt' | 'status'>): Review {
    const newRev: Review = {
      ...review,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'APPROVED' // Auto-approve for friendly demo review flow
    };
    this.reviews.unshift(newRev);

    // Update product rating
    const prod = this.getProductById(review.productId);
    if (prod) {
      const prodRevs = this.getReviews(prod.id);
      const totalScore = prodRevs.reduce((acc, curr) => acc + curr.rating, 0);
      prod.reviewCount = prodRevs.length;
      prod.rating = Number((totalScore / prod.reviewCount).toFixed(1));
    }

    return newRev;
  }

  // --- USERS & ADDRESSES ---
  getUserByEmail(email: string): User | undefined {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(userData: { name: string; email: string; phone: string; role?: 'CUSTOMER' | 'ADMIN' }): User {
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      role: userData.role || 'CUSTOMER',
      addresses: [],
      createdAt: new Date().toISOString()
    };
    this.users.push(newUser);
    return newUser;
  }

  addUserAddress(userId: string, address: ShippingAddress): ShippingAddress | null {
    const user = this.users.find(u => u.id === userId);
    if (!user) return null;

    const newAddr: ShippingAddress = {
      ...address,
      id: `addr-${Date.now()}`
    };

    if (newAddr.isDefault || user.addresses.length === 0) {
      user.addresses.forEach(a => { a.isDefault = false; });
      newAddr.isDefault = true;
    }

    user.addresses.push(newAddr);
    return newAddr;
  }

  // --- ADMIN STATS ---
  getAdminStats() {
    const totalOrders = this.orders.length;
    const paidOrders = this.orders.filter(o => o.paymentStatus === 'PAID');
    const totalSales = paidOrders.reduce((acc, curr) => acc + curr.total, 0);
    const pendingPayment = this.orders.filter(o => o.orderStatus === 'PENDING_PAYMENT').length;
    const processing = this.orders.filter(o => o.orderStatus === 'PROCESSING' || (o.orderStatus === 'PAID' && !o.trackingNumber)).length;
    const shipped = this.orders.filter(o => o.orderStatus === 'SHIPPED').length;
    const lowStockProducts = this.products.filter(p => p.stock < 10);

    return {
      totalSales,
      totalOrders,
      pendingPayment,
      processing,
      shipped,
      lowStockCount: lowStockProducts.length,
      lowStockProducts
    };
  }
}

export const dataStore = new DataStore();
