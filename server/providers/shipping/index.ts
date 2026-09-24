import { ShippingProvider } from './types.js';
import { MengantarShippingProvider } from './MengantarShippingProvider.js';
import { MockShippingProvider } from './MockShippingProvider.js';

class ShippingService {
  private activeProvider: ShippingProvider;
  private mengantarProvider: MengantarShippingProvider;
  private mockProvider: MockShippingProvider;

  constructor() {
    this.mengantarProvider = new MengantarShippingProvider();
    this.mockProvider = new MockShippingProvider();

    // Use Mengantar if configured, else use Mock
    if (this.mengantarProvider.isConfigured()) {
      this.activeProvider = this.mengantarProvider;
      console.log('[ShippingService] Using live Mengantar Shipping Provider');
    } else {
      this.activeProvider = this.mockProvider;
      console.log('[ShippingService] Using Mock Shipping Provider (Mengantar API credentials not set or in test mode)');
    }
  }

  getProvider(): ShippingProvider {
    return this.activeProvider;
  }

  isLiveProvider(): boolean {
    return this.activeProvider === this.mengantarProvider;
  }

  getStatus() {
    return {
      providerName: this.activeProvider.name,
      isLive: this.isLiveProvider(),
      hasApiKey: this.mengantarProvider.isConfigured(),
      baseUrl: process.env.MENGANTAR_BASE_URL || 'https://api.mengantar.com',
    };
  }
}

export const shippingService = new ShippingService();
