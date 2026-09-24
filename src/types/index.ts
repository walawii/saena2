export interface ProductVariant {
  id: string;
  sku?: string;
  colorName?: string;
  colorHex?: string;
  color?: string;
  size: 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'All Size' | string;
  stock: number;
  reservedStock?: number;
  availableStock?: number;
}

export interface ProductColor {
  name: string;
  hex: string;
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  category: string;
  categoryName?: string;
  categorySlug?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  weightInGrams?: number;
  weight?: number;
  dimensions?: { length: number; width: number; height: number } | any;
  images: string[];
  colors: ProductColor[];
  sizes: ('S' | 'M' | 'L' | 'XL' | 'XXL' | 'All Size' | string)[];
  materials?: string[];
  material?: string;
  careInstructions?: string[] | string;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  variants: ProductVariant[];
  rating: number;
  reviewCount: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
}

export interface CartItem {
  id: string; // composite key: productId-variantId
  productId: string;
  variantId: string;
  product: Product;
  variant: ProductVariant;
  selectedColor: string;
  selectedSize: string;
  quantity: number;
  price: number; // discountPrice or regular price at time of adding
  totalPrice?: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount: number;
  voucherCode?: string;
  shippingFee?: number;
  totalWeight: number; // grams
  total: number;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

export interface ShippingAddress {
  id: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  subdistrict: string;
  village?: string;
  postalCode: string;
  fullAddress: string;
  notes?: string;
  isDefault?: boolean;
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUNDED';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED'
  | 'REFUNDED';

export interface ShippingOption {
  provider: string; // e.g. 'mengantar'
  courierCode?: string;
  serviceCode: string; // e.g. 'REG', 'EXP', 'CARGO'
  serviceName: string; // e.g. 'Mengantar Regular (JNE/J&T/SiCepat)'
  estimatedDays?: string; // e.g. '2-3 hari'
  cost: number;
  description?: string;
}

export type ShippingServiceOption = ShippingOption;

export interface OrderItem {
  productId: string;
  variantId: string;
  name: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  subtotal: number;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. SAENA-20260923-0001
  userId?: string;
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  voucherCode?: string;
  shippingCost: number;
  total: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentMethod: {
    code: string; // e.g. 'BCA_VA', 'QRIS', 'CC', 'MANDIRI_VA'
    name: string;
    instructions?: string;
    vaNumber?: string;
    qrString?: string;
    paymentUrl?: string;
    expiresAt?: string;
  };
  shippingProvider: string;
  shippingService: string;
  trackingNumber?: string;
  shippingAddress: ShippingAddress;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: {
    status: OrderStatus;
    timestamp: string;
    note: string;
  }[];
}

export interface Voucher {
  id: string;
  code: string;
  name?: string;
  type?: 'PERCENTAGE' | 'FIXED';
  discountType?: 'PERCENTAGE' | 'FIXED';
  value?: number; // e.g. 15 (%) or 25000 (IDR)
  discountValue?: number;
  minimumPurchase?: number;
  minSpend?: number;
  maximumDiscount?: number;
  maxDiscount?: number;
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  quota?: number;
  usedCount: number;
  perUserLimit?: number;
  active?: boolean;
  isActive?: boolean;
  description?: string;
}

export interface Review {
  id: string;
  productId: string;
  productName?: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'CUSTOMER' | 'ADMIN';
  addresses: ShippingAddress[];
  createdAt: string;
}
