import { ShippingProvider } from './types.js';
import { MengantarShippingProvider } from './MengantarShippingProvider.js';
import { MockShippingProvider } from './MockShippingProvider.js';

class ShippingService {
  private mengantarProvider: MengantarShippingProvider;
  private mockProvider?: MockShippingProvider;

  constructor() {
    this.mengantarProvider = new MengantarShippingProvider();
    if (process.env.NODE_ENV === 'development') {
      this.mockProvider = new MockShippingProvider();
    }
  }

  getProvider(): ShippingProvider {
    if (this.mengantarProvider.isConfigured()) {
      return this.mengantarProvider;
    }

    if (process.env.NODE_ENV === 'production') {
      // In production, NEVER silently fake rates with mock
      return this.mengantarProvider;
    }

    // In local development only
    return this.mockProvider || this.mengantarProvider;
  }

  isLiveProvider(): boolean {
    return this.mengantarProvider.isConfigured();
  }

  getStatus() {
    const isConfigured = this.mengantarProvider.isConfigured();
    return {
      providerName: 'Mengantar Shipping Aggregator',
      isLive: isConfigured,
      hasApiKey: isConfigured,
      baseUrl: process.env.MENGANTAR_BASE_URL || 'https://api-public.mengantar.com',
      status: isConfigured ? 'READY' : 'BLOCKED / REQUIRES CONFIGURATION',
      requiredVariables: [
        'MENGANTAR_API_KEY',
        'MENGANTAR_BASE_URL',
        'MENGANTAR_ORIGIN_SUBDISTRICT',
        'MENGANTAR_ORIGIN_POSTAL'
      ],
      documentationUrl: 'https://mengantar.com'
    };
  }
}

export const shippingService = new ShippingService();
