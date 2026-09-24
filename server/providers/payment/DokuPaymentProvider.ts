import crypto from 'crypto';
import {
  PaymentProvider,
  PaymentCreateRequest,
  PaymentCreateResult,
  PaymentWebhookPayload
} from './types.js';

export class DokuPaymentProvider implements PaymentProvider {
  name = 'DOKU Payment Gateway';
  private clientId: string;
  private secretKey: string;
  private environment: string;
  private baseUrl: string;

  constructor() {
    this.clientId = process.env.DOKU_CLIENT_ID || '';
    this.secretKey = process.env.DOKU_SECRET_KEY || '';
    this.environment = process.env.DOKU_ENVIRONMENT || 'sandbox';
    this.baseUrl = this.environment === 'production' 
      ? 'https://api.doku.com' 
      : 'https://api-sandbox.doku.com';
  }

  isConfigured(): boolean {
    return Boolean(
      this.clientId && 
      this.secretKey && 
      this.clientId !== 'MALL-CLIENT-ID-EXAMPLE' && 
      this.secretKey !== 'SK-DOKU-SECRET-KEY-EXAMPLE'
    );
  }

  private generateDigest(jsonBody: string): string {
    const hash = crypto.createHash('sha256').update(jsonBody).digest('base64');
    return hash;
  }

  private generateSignature(
    clientId: string,
    requestId: string,
    timestamp: string,
    requestTarget: string,
    digest: string
  ): string {
    const component = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${requestTarget}\nDigest:${digest}`;
    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(component);
    return `HMACSHA256=${hmac.digest('base64')}`;
  }

  async createPayment(request: PaymentCreateRequest): Promise<PaymentCreateResult> {
    if (!this.isConfigured()) {
      throw new Error('DOKU credentials are not configured in environment variables');
    }

    const requestId = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const expiryMinutes = request.expiryMinutes || 120;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();

    let endpoint = '/bca-virtual-account/v2/payment-code';
    let targetMethod = 'BCA Virtual Account';
    let payload: any = {
      order: {
        invoice_number: request.orderNumber,
        amount: request.amount,
        line_items: request.items.map(i => ({
          name: i.name,
          price: i.price,
          quantity: i.quantity
        }))
      },
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        phone: request.customer.phone
      },
      virtual_account_info: {
        expired_time: expiryMinutes,
        reusable_status: false,
        info1: 'Pembayaran Saena.id',
        info2: request.orderNumber
      }
    };

    if (request.paymentMethodCode === 'MANDIRI_VA') {
      endpoint = '/mandiri-virtual-account/v2/payment-code';
      targetMethod = 'Mandiri Virtual Account';
    } else if (request.paymentMethodCode === 'BRI_VA') {
      endpoint = '/bri-virtual-account/v2/payment-code';
      targetMethod = 'BRI Virtual Account';
    } else if (request.paymentMethodCode === 'BNI_VA') {
      endpoint = '/bni-virtual-account/v2/payment-code';
      targetMethod = 'BNI Virtual Account';
    } else if (request.paymentMethodCode === 'QRIS') {
      endpoint = '/qris/v2/generate-code';
      targetMethod = 'QRIS';
      payload = {
        order: {
          invoice_number: request.orderNumber,
          amount: request.amount
        },
        qris_info: {
          expired_time: expiryMinutes
        }
      };
    } else {
      // General DOKU Checkout / Credit Card
      endpoint = '/checkout/v1/payment';
      targetMethod = 'DOKU Secure Checkout';
      payload = {
        order: {
          invoice_number: request.orderNumber,
          amount: request.amount,
          callback_url: request.callbackUrl || `${process.env.APP_URL || ''}/order/${request.orderNumber}`
        },
        payment: {
          payment_due_date: expiryMinutes
        },
        customer: {
          id: request.customer.email,
          name: request.customer.name,
          email: request.customer.email,
          phone: request.customer.phone
        }
      };
    }

    const bodyString = JSON.stringify(payload);
    const digest = this.generateDigest(bodyString);
    const signature = this.generateSignature(this.clientId, requestId, timestamp, endpoint, digest);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Id': this.clientId,
          'Request-Id': requestId,
          'Request-Timestamp': timestamp,
          'Signature': signature
        },
        body: bodyString
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || data.message || `DOKU HTTP Error ${response.status}`);
      }

      const vaNumber = data.virtual_account_info?.virtual_account_number || data.va_number;
      const qrString = data.qris_info?.qr_code || data.qr_string;
      const paymentUrl = data.payment?.url || data.checkout_url;

      return {
        success: true,
        paymentId: data.transaction?.id || requestId,
        orderNumber: request.orderNumber,
        amount: request.amount,
        paymentMethod: {
          code: request.paymentMethodCode,
          name: targetMethod,
          instructions: `Selesaikan pembayaran sebelum batas waktu yang ditentukan.`,
          vaNumber,
          qrString,
          paymentUrl,
          expiresAt
        },
        rawResponse: data
      };
    } catch (err: any) {
      console.error('[DokuPaymentProvider] Error creating payment:', err.message);
      throw err;
    }
  }

  verifySignature(headers: Record<string, string | string[] | undefined>, rawBody: string): boolean {
    if (!this.isConfigured()) return true;

    try {
      const clientId = headers['client-id'] as string;
      const requestId = headers['request-id'] as string;
      const timestamp = headers['request-timestamp'] as string;
      const signatureHeader = headers['signature'] as string;
      const target = headers['request-target'] as string || '/api/payments/doku/webhook';

      if (!signatureHeader || !clientId || !requestId || !timestamp) {
        return false;
      }

      const digest = this.generateDigest(rawBody);
      const expectedSignature = this.generateSignature(clientId, requestId, timestamp, target, digest);
      return signatureHeader === expectedSignature;
    } catch (e) {
      return false;
    }
  }

  parseWebhook(body: any): PaymentWebhookPayload {
    const orderNumber = body.order?.invoice_number || body.invoice_number;
    const paymentId = body.transaction?.id || body.payment_id || `DOKU-NOTIF-${Date.now()}`;
    const statusRaw = (body.transaction?.status || body.payment_status || '').toUpperCase();
    const amount = Number(body.order?.amount || body.amount || 0);

    let status: 'PAID' | 'FAILED' | 'EXPIRED' = 'PAID';
    if (statusRaw === 'SUCCESS' || statusRaw === 'PAID') {
      status = 'PAID';
    } else if (statusRaw === 'EXPIRED') {
      status = 'EXPIRED';
    } else {
      status = 'FAILED';
    }

    return {
      orderNumber,
      paymentId,
      status,
      amount,
      paidAt: body.transaction?.date || new Date().toISOString(),
      rawPayload: body
    };
  }
}
