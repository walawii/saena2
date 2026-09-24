export interface PaymentCustomer {
  name: string;
  email: string;
  phone: string;
}

export interface PaymentItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface PaymentCreateRequest {
  orderNumber: string;
  amount: number;
  paymentMethodCode: string; // 'BCA_VA' | 'MANDIRI_VA' | 'BRI_VA' | 'BNI_VA' | 'QRIS' | 'CC' | 'SHOPEEPAY' | 'OVO' | 'DANA'
  customer: PaymentCustomer;
  items: PaymentItem[];
  callbackUrl?: string;
  expiryMinutes?: number;
}

export interface PaymentCreateResult {
  success: boolean;
  paymentId: string;
  orderNumber: string;
  amount: number;
  paymentMethod: {
    code: string;
    name: string;
    instructions: string;
    vaNumber?: string;
    qrString?: string;
    paymentUrl?: string;
    expiresAt: string;
  };
  rawResponse?: any;
}

export interface PaymentWebhookPayload {
  orderNumber: string;
  paymentId: string;
  status: 'PAID' | 'FAILED' | 'EXPIRED';
  amount: number;
  paidAt?: string;
  rawPayload: any;
}

export interface PaymentProvider {
  name: string;
  isConfigured(): boolean;
  createPayment(request: PaymentCreateRequest): Promise<PaymentCreateResult>;
  verifySignature(headers: Record<string, string | string[] | undefined>, rawBody: string): boolean;
  parseWebhook(body: any): PaymentWebhookPayload;
}
