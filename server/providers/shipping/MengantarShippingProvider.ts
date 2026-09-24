import {
  ShippingProvider,
  ShippingCalculationRequest,
  ShippingServiceOption,
  ShipmentCreateRequest,
  ShipmentResult,
  TrackingResult
} from './types.js';

export class MengantarShippingProvider implements ShippingProvider {
  name = 'Mengantar';
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.MENGANTAR_API_KEY || '';
    this.baseUrl = (process.env.MENGANTAR_BASE_URL || 'https://api.mengantar.com').replace(/\/$/, '');
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey !== 'MENGANTAR_SECRET_API_KEY');
  }

  async calculateRates(request: ShippingCalculationRequest): Promise<ShippingServiceOption[]> {
    if (!this.isConfigured()) {
      throw new Error('Mengantar API key is not configured in environment variables');
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/shipping/rates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          origin_postal_code: request.originPostalCode,
          destination_postal_code: request.destinationPostalCode,
          weight: Math.max(request.weightInGrams, 100),
          subdistrict: request.destinationSubdistrict,
          city: request.destinationCity,
          province: request.destinationProvince
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Mengantar API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      // Map Mengantar response format into standard options
      return (data.services || []).map((s: any) => ({
        provider: 'mengantar',
        courierCode: s.courier || 'mengantar-exp',
        serviceCode: s.service_code || 'REG',
        serviceName: `Mengantar ${s.courier_name || 'Express'} (${s.service_name || 'Regular'})`,
        estimatedDays: s.etd || '2-3 hari',
        cost: Number(s.cost || s.price || 18000),
        description: s.description || 'Pengiriman terpercaya via aggregator Mengantar'
      }));
    } catch (error: any) {
      console.error('[MengantarShippingProvider] calculateRates error:', error.message);
      throw error;
    }
  }

  async createShipment(request: ShipmentCreateRequest): Promise<ShipmentResult> {
    if (!this.isConfigured()) {
      throw new Error('Mengantar API key is not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/shipments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          order_id: request.orderNumber,
          service_code: request.serviceCode,
          recipient: {
            name: request.recipientName,
            phone: request.recipientPhone,
            address: request.fullAddress,
            postal_code: request.postalCode,
            subdistrict: request.subdistrict,
            city: request.city,
            province: request.province
          },
          weight: request.totalWeightGrams,
          goods_value: request.goodsValue,
          notes: request.notes
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Gagal membuat pengiriman di Mengantar');
      }

      return {
        success: true,
        trackingNumber: result.tracking_number || result.waybill_number || `MGT-${Date.now()}`,
        courierName: result.courier_name || 'Mengantar Express',
        serviceName: result.service_name || request.serviceCode,
        estimatedDeliveryDate: result.etd
      };
    } catch (error: any) {
      console.error('[MengantarShippingProvider] createShipment error:', error.message);
      throw error;
    }
  }

  async trackShipment(trackingNumber: string): Promise<TrackingResult> {
    if (!this.isConfigured()) {
      throw new Error('Mengantar API key is not configured');
    }

    const response = await fetch(`${this.baseUrl}/v1/shipments/track/${encodeURIComponent(trackingNumber)}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      }
    });

    if (!response.ok) {
      throw new Error('Gagal melacak pengiriman dari Mengantar');
    }

    const data = await response.json();
    return {
      trackingNumber,
      status: data.status || 'IN_TRANSIT',
      checkpoints: (data.history || []).map((h: any) => ({
        timestamp: h.time,
        status: h.status,
        location: h.location,
        description: h.message
      }))
    };
  }
}
