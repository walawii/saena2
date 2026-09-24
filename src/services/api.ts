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
  // Use admin token if available for admin routes, otherwise standard auth token
  const adminToken = localStorage.getItem('saena_admin_token');
  const authToken = localStorage.getItem('saena_auth_token');
  const token = (url.startsWith('/admin') ? adminToken : authToken) || adminToken || authToken;

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

  async getProduct(identifier: string): Promise<{ data: Product; related?: Product[] }> {
    return fetchJson<{ data: Product; related?: Product[] }>(`/products/${identifier}`);
  },

  // Categories
  async getCategories(): Promise<{ data: any[] }> {
    return fetchJson<{ data: any[] }>('/categories');
  },

  // Vouchers
  async getVouchers(): Promise<{ data: Voucher[] }> {
    return fetchJson<{ data: Voucher[] }>('/vouchers');
  },

  async validateVoucher(code: string, subtotal: number): Promise<{ data: { code: string; calculatedDiscount: number; discount: number; name: string; message: string } }> {
    return fetchJson(`/vouchers/validate?code=${encodeURIComponent(code)}&subtotal=${subtotal}`);
  },

  // Shipping
  async calculateShippingRates(payload: {
    destinationProvince: string;
    destinationCity: string;
    destinationSubdistrict: string;
    destinationPostalCode: string;
    weightInGrams: number;
  }): Promise<{ data: ShippingServiceOption[]; isConfigured: boolean; warning?: string }> {
    return fetchJson('/shipping/rates', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async trackShipping(trackingNumber: string): Promise<{ data: any }> {
    return fetchJson(`/shipping/track/${encodeURIComponent(trackingNumber)}`);
  },

  async getShippingStatus(): Promise<{ data: any }> {
    return fetchJson('/shipping/status');
  },

  // Payments
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
    const q = productId ? `/product/${productId}` : '';
    return fetchJson(`/reviews${q}`);
  },

  async submitReview(payload: { productId: string; customerName: string; rating: number; comment: string }): Promise<{ data: Review }> {
    return fetchJson('/reviews', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Customer Auth
  async login(email: string, password: string): Promise<{ user: User; token: string; message: string }> {
    return fetchJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async register(payload: { name: string; email: string; phone: string; password: string }): Promise<{ user: User; token: string }> {
    return fetchJson('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getCurrentUser(): Promise<{ user: User }> {
    return fetchJson('/auth/me');
  },

  async addAddress(address: ShippingAddress): Promise<{ data: ShippingAddress }> {
    return fetchJson('/auth/addresses', {
      method: 'POST',
      body: JSON.stringify(address)
    });
  },

  // Admin Auth & Management
  async adminLogin(email: string, password: string): Promise<{ user: User; token: string; message: string }> {
    return fetchJson('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async getAdminDashboard(): Promise<{ data: any }> {
    return fetchJson('/admin/dashboard');
  },

  async getAdminOrders(params?: { status?: string; search?: string }): Promise<{ data: Order[] }> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    const q = query.toString() ? `?${query.toString()}` : '';
    return fetchJson(`/admin/orders${q}`);
  },

  async adminSetOrderTracking(orderNumber: string, trackingNumber: string, courierName?: string): Promise<any> {
    return fetchJson(`/admin/orders/${orderNumber}/tracking`, {
      method: 'PATCH',
      body: JSON.stringify({ trackingNumber, courierName })
    });
  },

  async adminUpdateOrderStatus(orderNumber: string, status: string, note?: string): Promise<any> {
    return fetchJson(`/admin/orders/${orderNumber}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note })
    });
  },

  async getAdminInventory(): Promise<{ data: any[] }> {
    return fetchJson('/admin/inventory');
  },

  async adminAdjustStock(variantId: string, delta: number, reason: string): Promise<any> {
    return fetchJson('/admin/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({ variantId, delta, reason })
    });
  },

  async getAdminInventoryMovements(): Promise<{ data: any[] }> {
    return fetchJson('/admin/inventory/movements');
  },

  async adminCreateProduct(data: any): Promise<any> {
    return fetchJson('/admin/products', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async adminUpdateProduct(id: string, data: any): Promise<any> {
    return fetchJson(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async adminDeleteProduct(id: string): Promise<any> {
    return fetchJson(`/admin/products/${id}`, {
      method: 'DELETE'
    });
  },

  async getAdminVouchers(): Promise<{ data: Voucher[] }> {
    return fetchJson('/admin/vouchers');
  },

  async adminCreateVoucher(data: any): Promise<any> {
    return fetchJson('/admin/vouchers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getAdminReviews(status?: string): Promise<{ data: Review[] }> {
    const q = status ? `?status=${status}` : '';
    return fetchJson(`/admin/reviews${q}`);
  },

  async adminModerateReview(reviewId: string, status: 'APPROVED' | 'REJECTED'): Promise<any> {
    return fetchJson(`/admin/reviews/${reviewId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  async getAdminCustomers(): Promise<{ data: any[] }> {
    return fetchJson('/admin/customers');
  },

  async getAdminAuditLogs(): Promise<{ data: any[] }> {
    return fetchJson('/admin/audit-logs');
  }
};
