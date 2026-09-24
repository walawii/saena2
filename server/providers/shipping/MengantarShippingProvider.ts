import {
  ShippingProvider,
  ShippingCalculationRequest,
  ShippingServiceOption,
  ShipmentCreateRequest,
  ShipmentResult,
  TrackingResult
} from './types.js';

export interface MengantarProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  originSubdistrict?: string;
  originPostal?: string;
  fetchFn?: typeof fetch;
}

export class MengantarShippingProvider implements ShippingProvider {
  name = 'Mengantar Shipping Aggregator';
  private apiKey: string;
  private baseUrl: string;
  private originSubdistrict: string;
  private originPostal: string;
  private fetchFn: typeof fetch;

  constructor(config?: MengantarProviderConfig) {
    this.apiKey = (config?.apiKey ?? process.env.MENGANTAR_API_KEY ?? '').trim();
    this.baseUrl = (config?.baseUrl ?? process.env.MENGANTAR_BASE_URL ?? 'https://api-public.mengantar.com').trim().replace(/\/$/, '');
    this.originSubdistrict = (config?.originSubdistrict ?? process.env.MENGANTAR_ORIGIN_SUBDISTRICT ?? 'Cilandak').trim();
    this.originPostal = (config?.originPostal ?? process.env.MENGANTAR_ORIGIN_POSTAL ?? process.env.MENGANTAR_ORIGIN_POSTAL_CODE ?? '12430').trim();
    this.fetchFn = config?.fetchFn ?? fetch;
  }

  isConfigured(): boolean {
    return Boolean(
      this.apiKey &&
      this.apiKey !== 'MENGANTAR_SECRET_API_KEY' &&
      this.apiKey.length > 8
    );
  }

  /**
   * Safe server-side structured logger that redacts secrets and auth tokens
   */
  private logSafe(level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, any>) {
    const sanitizedMeta: Record<string, any> = {};
    if (meta) {
      for (const [key, value] of Object.entries(meta)) {
        if (/key|secret|auth|token|password/i.test(key)) {
          sanitizedMeta[key] = '[REDACTED]';
        } else {
          sanitizedMeta[key] = value;
        }
      }
    }
    const metaStr = Object.keys(sanitizedMeta).length > 0 ? ` ${JSON.stringify(sanitizedMeta)}` : '';
    if (level === 'error') {
      console.error(`[MengantarProvider] ${message}${metaStr}`);
    } else if (level === 'warn') {
      console.warn(`[MengantarProvider] ${message}${metaStr}`);
    } else {
      console.log(`[MengantarProvider] ${message}${metaStr}`);
    }
  }

  async calculateRates(request: ShippingCalculationRequest): Promise<ShippingServiceOption[]> {
    if (!this.isConfigured()) {
      throw new Error(
        'BLOCKED / REQUIRES CONFIGURATION: Mengantar API Key belum dikonfigurasi. Atur MENGANTAR_API_KEY dan MENGANTAR_BASE_URL (https://api-public.mengantar.com) di file .env.'
      );
    }

    // Server-side validation of destination fields
    const destSubdistrict = request.destinationSubdistrict?.trim();
    const destPostal = request.destinationPostalCode?.trim();
    const destCity = request.destinationCity?.trim();
    const destProvince = request.destinationProvince?.trim();

    if (!destSubdistrict || !destPostal) {
      throw new Error('Alamat tujuan tidak lengkap: Kecamatan dan Kode Pos wajib diisi untuk kalkulasi tarif Mengantar.');
    }

    const weightGrams = Math.max(Math.round(request.weightInGrams || 100), 100);

    const payload = {
      origin_subdistrict: this.originSubdistrict,
      origin_district: this.originSubdistrict,
      origin_postal_code: request.originPostalCode?.trim() || this.originPostal,
      origin_postal: request.originPostalCode?.trim() || this.originPostal,
      destination_province: destProvince,
      destination_city: destCity,
      destination_subdistrict: destSubdistrict,
      destination_district: destSubdistrict,
      destination_postal_code: destPostal,
      destination_postal: destPostal,
      weight: weightGrams,
      weight_in_grams: weightGrams,
      cod: false
    };

    const targetUrl = `${this.baseUrl}/v1/shipping/rates`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'x-api-key': this.apiKey
    };

    this.logSafe('info', 'Requesting shipping rates from Mengantar', {
      endpoint: '/v1/shipping/rates',
      origin: `${payload.origin_subdistrict} (${payload.origin_postal_code})`,
      destination: `${destSubdistrict}, ${destCity} (${destPostal})`,
      weight: `${weightGrams}g`
    });

    let response: Response;
    try {
      response = await this.fetchFn(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
    } catch (fetchErr: any) {
      this.logSafe('error', 'Network failure when connecting to Mengantar API', {
        endpoint: '/v1/shipping/rates',
        error: fetchErr.message || 'Connection refused or timeout'
      });
      throw new Error(`Koneksi ke server Mengantar gagal: ${fetchErr.message || 'Network error'}. Silakan coba beberapa saat lagi.`);
    }

    const requestId = response.headers.get('x-request-id') || response.headers.get('cf-ray') || undefined;
    const responseText = await response.text();

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      this.logSafe('error', 'Malformed non-JSON response from Mengantar API', {
        status: response.status,
        endpoint: '/v1/shipping/rates',
        requestId,
        rawPreview: responseText.slice(0, 150)
      });
      throw new Error('Format respons dari server Mengantar tidak sesuai spesifikasi JSON yang diharapkan.');
    }

    if (!response.ok) {
      const errorMsg =
        data?.message ||
        data?.error?.message ||
        data?.error ||
        (typeof data?.data === 'string' ? data.data : '') ||
        `HTTP Error ${response.status}`;

      this.logSafe('error', `Mengantar API returned error status ${response.status}`, {
        status: response.status,
        endpoint: '/v1/shipping/rates',
        requestId,
        errorDetail: String(errorMsg).slice(0, 200)
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error(`Autentikasi Mengantar gagal (${response.status}): Kredensial MENGANTAR_API_KEY tidak valid atau tidak memiliki izin.`);
      }
      if (response.status === 400 || response.status === 422) {
        throw new Error(`Alamat tujuan pengiriman tidak valid untuk kurir Mengantar (${response.status}): ${errorMsg}. Periksa kembali kecamatan dan kode pos.`);
      }
      if (response.status === 404) {
        throw new Error(`Endpoint Mengantar tidak ditemukan (${response.status}). Periksa konfigurasi MENGANTAR_BASE_URL.`);
      }
      if (response.status >= 500) {
        throw new Error(`Layanan agregator logistik Mengantar sedang mengalami gangguan sementara (${response.status}). Silakan coba beberapa saat lagi.`);
      }
      throw new Error(`Gagal memperoleh tarif dari Mengantar (${response.status}): ${errorMsg}`);
    }

    // Parse rates array from diverse valid Mengantar response wrappers
    const rawServices =
      (Array.isArray(data) ? data : null) ||
      data.services ||
      data.data?.services ||
      data.data?.rates ||
      (Array.isArray(data.data) ? data.data : null) ||
      data.rates ||
      data.results ||
      [];

    if (!Array.isArray(rawServices) || rawServices.length === 0) {
      this.logSafe('warn', 'Mengantar returned empty services list for route', {
        destinationSubdistrict: destSubdistrict,
        destinationPostal: destPostal
      });
      throw new Error(`Tidak ditemukan kurir ekspedisi Mengantar yang melayani rute ke kecamatan "${destSubdistrict}" (${destPostal}). Periksa kembali alamat.`);
    }

    const mappedServices: ShippingServiceOption[] = rawServices.map((s: any) => {
      const courierCode = (s.courier || s.courier_code || s.expedition || s.code || 'MGT').toUpperCase();
      const serviceCode = (s.service_code || s.service || s.code || 'REG').toUpperCase();
      const courierName = s.courier_name || s.courier || courierCode;
      const serviceName = s.service_name || s.service || serviceCode;
      const cost = Number(s.cost ?? s.price ?? s.tariff ?? s.total_fee ?? s.fee ?? 0);
      const rawEtd = s.etd || s.estimated_days || s.estimation || s.duration || '2-3 hari kerja';
      const estimatedDays = String(rawEtd).toLowerCase().includes('hari') ? String(rawEtd) : `${rawEtd} hari kerja`;
      const description = s.description || s.desc || `Layanan pengiriman resmi via ${courierName}`;

      return {
        provider: 'mengantar',
        courierCode,
        serviceCode,
        serviceName: `Mengantar - ${courierName} ${serviceName}`,
        estimatedDays,
        cost: Math.max(cost, 0),
        description
      };
    });

    this.logSafe('info', `Successfully retrieved ${mappedServices.length} shipping rates from Mengantar`, {
      couriers: mappedServices.map(m => m.courierCode).join(', ')
    });

    return mappedServices;
  }

  async createShipment(request: ShipmentCreateRequest): Promise<ShipmentResult> {
    if (!this.isConfigured()) {
      throw new Error(
        'BLOCKED / REQUIRES CONFIGURATION: Mengantar API Key belum dikonfigurasi untuk membuat pengiriman otomatis.'
      );
    }

    const payload = {
      order_id: request.orderNumber,
      service_code: request.serviceCode,
      sender: {
        subdistrict: this.originSubdistrict,
        postal_code: this.originPostal
      },
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
    };

    const targetUrl = `${this.baseUrl}/v1/shipments/create`;
    this.logSafe('info', 'Creating shipment with Mengantar', {
      orderNumber: request.orderNumber,
      serviceCode: request.serviceCode
    });

    const response = await this.fetchFn(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'x-api-key': this.apiKey
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) {
      const errorMsg = result.message || result.error || 'Gagal membuat pengiriman di Mengantar';
      this.logSafe('error', `Failed to create shipment: ${errorMsg}`, {
        status: response.status,
        orderNumber: request.orderNumber
      });
      throw new Error(errorMsg);
    }

    return {
      success: true,
      trackingNumber: result.tracking_number || result.waybill_number || result.data?.waybill_number,
      courierName: result.courier_name || result.data?.courier_name || 'Mengantar Express',
      serviceName: result.service_name || result.data?.service_name || request.serviceCode,
      estimatedDeliveryDate: result.etd || result.data?.etd
    };
  }

  async trackShipment(trackingNumber: string): Promise<TrackingResult> {
    if (!this.isConfigured()) {
      throw new Error(
        'BLOCKED / REQUIRES CONFIGURATION: Mengantar API Key belum dikonfigurasi untuk pelacakan resi.'
      );
    }

    const targetUrl = `${this.baseUrl}/v1/shipments/track/${encodeURIComponent(trackingNumber)}`;
    this.logSafe('info', 'Tracking shipment via Mengantar', { trackingNumber });

    const response = await this.fetchFn(targetUrl, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'x-api-key': this.apiKey
      }
    });

    if (!response.ok) {
      this.logSafe('error', `Track shipment failed with status ${response.status}`, {
        status: response.status,
        trackingNumber
      });
      throw new Error(`Gagal melacak pengiriman dari Mengantar (${response.status})`);
    }

    const data = await response.json();
    return {
      trackingNumber,
      status: data.status || data.data?.status || 'IN_TRANSIT',
      checkpoints: (data.history || data.data?.history || []).map((h: any) => ({
        timestamp: h.time || h.timestamp,
        status: h.status,
        location: h.location,
        description: h.message || h.description
      }))
    };
  }

  getStatus() {
    return {
      providerName: this.name,
      isConfigured: this.isConfigured(),
      baseUrl: this.baseUrl,
      originSubdistrict: this.originSubdistrict,
      originPostal: this.originPostal,
      status: this.isConfigured() ? 'READY' : 'BLOCKED / REQUIRES CONFIGURATION',
      requiredVariables: [
        'MENGANTAR_API_KEY',
        'MENGANTAR_BASE_URL',
        'MENGANTAR_ORIGIN_SUBDISTRICT',
        'MENGANTAR_ORIGIN_POSTAL'
      ]
    };
  }
}
