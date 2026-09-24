import {
  ShippingProvider,
  ShippingCalculationRequest,
  ShippingServiceOption,
  ShipmentCreateRequest,
  ShipmentResult,
  TrackingResult
} from './types.js';

export class MockShippingProvider implements ShippingProvider {
  name = 'Mengantar (Simulation Mode)';

  isConfigured(): boolean {
    return true;
  }

  async calculateRates(request: ShippingCalculationRequest): Promise<ShippingServiceOption[]> {
    const weightKg = Math.max(1, Math.ceil(request.weightInGrams / 1000));
    
    // Realistic Indonesian shipping rates calculation based on destination
    let baseRate = 12000;
    const dest = (request.destinationProvince + ' ' + request.destinationCity).toLowerCase();
    
    if (dest.includes('jakarta') || dest.includes('tangerang') || dest.includes('bekasi') || dest.includes('depok') || dest.includes('bogor')) {
      baseRate = 10000;
    } else if (dest.includes('jawa')) {
      baseRate = 18000;
    } else if (dest.includes('sumatera') || dest.includes('bali')) {
      baseRate = 28000;
    } else if (dest.includes('kalimantan') || dest.includes('sulawesi')) {
      baseRate = 38000;
    } else {
      baseRate = 48000;
    }

    return [
      {
        provider: 'mengantar',
        courierCode: 'mengantar-reg',
        serviceCode: 'MGT-REG',
        serviceName: 'Mengantar Regular (SiCepat / JNE)',
        estimatedDays: '2-3 hari',
        cost: baseRate * weightKg,
        description: 'Layanan reguler hemat dan terpercaya ke seluruh Indonesia'
      },
      {
        provider: 'mengantar',
        courierCode: 'mengantar-exp',
        serviceCode: 'MGT-EXP',
        serviceName: 'Mengantar Express (Next Day / J&T Super)',
        estimatedDays: '1-2 hari',
        cost: Math.round(baseRate * 1.6 * weightKg),
        description: 'Pengiriman prioritas cepat kilat'
      },
      {
        provider: 'mengantar',
        courierCode: 'mengantar-cargo',
        serviceCode: 'MGT-CARGO',
        serviceName: 'Mengantar Hemat Kargo (JTR / SiCepat Gokil)',
        estimatedDays: '3-5 hari',
        cost: Math.round(baseRate * 0.75 * Math.max(weightKg, 2)),
        description: 'Pilihan hemat untuk pesanan grosir dan paket bervolume'
      }
    ];
  }

  async createShipment(request: ShipmentCreateRequest): Promise<ShipmentResult> {
    const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
    const trackingNumber = `MGT-${randomDigits}`;

    return {
      success: true,
      trackingNumber,
      courierName: 'Mengantar Express Multi-Courier',
      serviceName: request.serviceCode === 'MGT-EXP' ? 'Express Next Day' : 'Regular Service',
      estimatedDeliveryDate: '2-3 hari kerja'
    };
  }

  async trackShipment(trackingNumber: string): Promise<TrackingResult> {
    const now = new Date();
    const d1 = new Date(now.getTime() - 24 * 3600 * 1000).toLocaleString('id-ID');
    const d2 = new Date(now.getTime() - 12 * 3600 * 1000).toLocaleString('id-ID');
    const d3 = now.toLocaleString('id-ID');

    return {
      trackingNumber,
      status: 'IN_TRANSIT',
      checkpoints: [
        {
          timestamp: d1,
          status: 'PICKED_UP',
          location: 'Hub Gudang Saena Jakarta Selatan',
          description: 'Paket telah di-pickup oleh kurir partner Mengantar'
        },
        {
          timestamp: d2,
          status: 'SORTING',
          location: 'Sorting Center Gateway Jakarta',
          description: 'Paket tiba di pusat penyortiran Mengantar logistik'
        },
        {
          timestamp: d3,
          status: 'IN_TRANSIT',
          location: 'Dalam Perjalanan ke Kota Tujuan',
          description: 'Paket sedang diberangkatkan ke fasilitas transit tujuan'
        }
      ]
    };
  }
}
