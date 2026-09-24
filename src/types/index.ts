// Common type definitions for Saena.id

export type ProductCategory = 
  | 'gamis'
  | 'dress-muslim'
  | 'daster'
  | 'mukena'
  | 'hijab'
  | 'setelan'
  | 'anak'
  | 'best-seller';

export interface ProductVariant {
  id: string;
  sku: string;
  colorName: string;
  colorHex: string;
  size: 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'All Size';
  stock: number;
  priceModifier?: number; // difference from base price
  image?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  category: ProductCategory;
  categoryName: string;
  price: number;
  discountPrice?: number;
  stock: number;
  weight: number; // in grams
  dimensions: {
    length: number; // cm
    width: number;
    height: number;
  };
  images: string[];
  variants: ProductVariant[];
  colors: { name: string; hex: string }[];
  sizes: string[];
  status: 'ACTIVE' | 'DRAFT' | 'OUT_OF_STOCK';
  rating: number;
  reviewCount: number;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  createdAt: string;
}

export interface CartItem {
  id: string; // unique item cart id
  productId: string;
  variantId: string;
  product: Product;
  selectedColor: string;
  selectedSize: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount: number;
  voucherCode?: string;
  appliedVoucherCode?: string;
  total: number;
  totalWeight: number; // in grams
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

export interface ShippingAddress {
  id?: string;
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
  | 'SHIPPED'
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
  serviceCode: string; // e.g. 'REG', 'EXP', 'CARGO'
  serviceName: string; // e.g. 'Mengantar Regular (JNE/J&T/SiCepat)'
  estimatedDays: string; // e.g. '2-3 hari'
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
  type: 'PERCENTAGE' | 'FIXED';
  value: number; // e.g. 15 (%) or 25000 (IDR)
  minimumPurchase: number;
  maximumDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  active: boolean;
  description: string;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
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
