import { PaymentProvider } from './types.js';
import { DokuPaymentProvider } from './DokuPaymentProvider.js';
import { MockPaymentProvider } from './MockPaymentProvider.js';

class PaymentService {
  private dokuProvider: DokuPaymentProvider;
  private mockProvider?: MockPaymentProvider;

  constructor() {
    this.dokuProvider = new DokuPaymentProvider();
    if (process.env.NODE_ENV === 'development') {
      this.mockProvider = new MockPaymentProvider();
    }
  }

  getProvider(): PaymentProvider {
    if (this.dokuProvider.isConfigured()) {
      return this.dokuProvider;
    }

    if (process.env.NODE_ENV === 'production') {
      // In production, NEVER use mock provider
      return this.dokuProvider; // createPayment will throw descriptive BLOCKED / REQUIRES CONFIGURATION error
    }

    // In local development only
    return this.mockProvider || this.dokuProvider;
  }

  isLiveProvider(): boolean {
    return this.dokuProvider.isConfigured();
  }

  getStatus() {
    const isConfigured = this.dokuProvider.isConfigured();
    return {
      providerName: 'DOKU Payment Gateway',
      isLive: isConfigured,
      hasCredentials: isConfigured,
      environment: process.env.DOKU_ENVIRONMENT || 'sandbox',
      status: isConfigured ? 'READY' : 'BLOCKED / REQUIRES CONFIGURATION',
      requiredVariables: ['DOKU_CLIENT_ID', 'DOKU_SECRET_KEY', 'DOKU_ENVIRONMENT'],
      documentationUrl: 'https://jokul.doku.com'
    };
  }
}

export const paymentService = new PaymentService();
