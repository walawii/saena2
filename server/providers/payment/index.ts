import { PaymentProvider } from './types.js';
import { DokuPaymentProvider } from './DokuPaymentProvider.js';
import { MockPaymentProvider } from './MockPaymentProvider.js';

class PaymentService {
  private activeProvider: PaymentProvider;
  private dokuProvider: DokuPaymentProvider;
  private mockProvider: MockPaymentProvider;

  constructor() {
    this.dokuProvider = new DokuPaymentProvider();
    this.mockProvider = new MockPaymentProvider();

    if (this.dokuProvider.isConfigured()) {
      this.activeProvider = this.dokuProvider;
      console.log('[PaymentService] Using Live DOKU Payment Gateway');
    } else {
      this.activeProvider = this.mockProvider;
      console.log('[PaymentService] Using Simulated DOKU Payment Provider (Credentials not set in .env)');
    }
  }

  getProvider(): PaymentProvider {
    return this.activeProvider;
  }

  isLiveProvider(): boolean {
    return this.activeProvider === this.dokuProvider;
  }

  getStatus() {
    return {
      providerName: this.activeProvider.name,
      isLive: this.isLiveProvider(),
      hasCredentials: this.dokuProvider.isConfigured(),
      environment: process.env.DOKU_ENVIRONMENT || 'sandbox',
    };
  }
}

export const paymentService = new PaymentService();
