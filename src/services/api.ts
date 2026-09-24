import {
  Product,
  Order,
  Voucher,
  Review,
  User,
  ShippingAddress,
  ShippingServiceOption
} from '../types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('saena_auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Terjadi kesalahan pada sistem.');
  }

  return data;
}

export const api = {
  // Products
  async getProducts(params?: Record<string, any>): Promise<{ data: Product[]; total: number }> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          query.append(k, String(v));
        }
      });
    }
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return fetchJson<{ data: Product[]; total: number }>(`/products${qStr}`);
  },

  async getProduct(identifier: string): Promise<{ data: Product; related: Product[] }> {
    return fetchJson<{ data: Product; related: Product[] }>(`/products/${identifier}`);
  },

  // Categories
  async getCategories(): Promise<{ data: any[] }> {
    return fetchJson<{ data: any[] }>('/categories');
  },

  // Vouchers
  async getVouchers(): Promise<{ data: Voucher[] }> {
    return fetchJson<{ data: Voucher[] }>('/vouchers');
  },

  async validateVoucher(code: string, subtotal: number): Promise<{ data: { code: string; discount: number; description: string; message: string } }> {
    return fetchJson('/vouchers/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal })
    });
  },

  // Shipping
  async calculateShippingRates(payload: {
    destinationProvince: string;
    destinationCity: string;
    destinationSubdistrict?: string;
    destinationPostalCode?: string;
    weightInGrams?: number;
  }): Promise<{ data: ShippingServiceOption[]; provider: string; isLive: boolean }> {
    return fetchJson('/shipping/mengantar/rates', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async trackShipping(trackingNumber: string): Promise<{ data: any }> {
    return fetchJson(`/shipping/mengantar/track/${trackingNumber}`);
  },

  async getShippingStatus(): Promise<{ data: any }> {
    return fetchJson('/shipping/status');
  },

  // Payments
  async createPayment(orderNumber: string, paymentMethodCode: string): Promise<{ data: any; provider: string; isLive: boolean }> {
    return fetchJson('/payments/doku/create', {
      method: 'POST',
      body: JSON.stringify({ orderNumber, paymentMethodCode })
    });
  },

  async simulatePayment(orderNumber: string, status: 'PAID' | 'FAILED'): Promise<{ data: Order }> {
    return fetchJson('/payments/simulate', {
      method: 'POST',
      body: JSON.stringify({ orderNumber, status })
    });
  },

  async getPaymentStatus(): Promise<{ data: any }> {
    return fetchJson('/payments/status');
  },

  // Orders
  async createOrder(payload: any): Promise<{ data: Order; message: string }> {
    return fetchJson('/orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getOrderByNumber(orderNumber: string): Promise<{ data: Order }> {
    return fetchJson(`/orders/${orderNumber}`);
  },

  async getCustomerOrders(email: string): Promise<{ data: Order[] }> {
    return fetchJson(`/orders?email=${encodeURIComponent(email)}`);
  },

  // Reviews
  async getReviews(productId?: string): Promise<{ data: Review[] }> {
    const q = productId ? `?productId=${productId}` : '';
    return fetchJson(`/reviews${q}`);
  },

  async submitReview(payload: { productId: string; customerName: string; rating: number; comment: string }): Promise<{ data: Review }> {
    return fetchJson('/reviews', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Auth
  async login(email: string, password?: string): Promise<{ user: User; token: string; message: string }> {
    return fetchJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async register(payload: { name: string; email: string; phone: string }): Promise<{ user: User; token: string }> {
    return fetchJson('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async addAddress(userId: string, address: ShippingAddress): Promise<{ data: ShippingAddress }> {
    return fetchJson('/auth/addresses', {
      method: 'POST',
      body: JSON.stringify({ userId, address })
    });
  },

  // Admin
  async getAdminDashboard(adminKey?: string): Promise<{ data: any }> {
    const key = adminKey || localStorage.getItem('saena_admin_key') || 'admin_saena_secret_pass';
    return fetchJson(`/admin/dashboard?adminKey=${key}`);
  },

  async getAdminOrders(params?: { status?: string; search?: string }): Promise<{ data: Order[] }> {
    const key = localStorage.getItem('saena_admin_key') || 'admin_saena_secret_pass';
    const query = new URLSearchParams({ adminKey: key });
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    return fetchJson(`/admin/orders?${query.toString()}`);
  },

  async adminSetOrderTracking(orderNumber: string, trackingNumber: string, courierName?: string): Promise<any> {
    const key = localStorage.getItem('saena_admin_key') || 'admin_saena_secret_pass';
    return fetchJson(`/admin/orders/${orderNumber}/tracking?adminKey=${key}`, {
      method: 'PATCH',
      body: JSON.stringify({ trackingNumber, courierName })
    });
  },

  async adminUpdateOrderStatus(orderNumber: string, status: string, note?: string): Promise<any> {
    return fetchJson(`/orders/${orderNumber}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note })
    });
  }
};
