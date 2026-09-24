export interface ShippingCalculationRequest {
  originPostalCode: string;
  originSubdistrict?: string;
  destinationPostalCode: string;
  destinationProvince: string;
  destinationCity: string;
  destinationSubdistrict: string;
  weightInGrams: number;
}

export interface ShippingServiceOption {
  provider: string; // 'mengantar'
  courierCode: string; // e.g. 'jne', 'jnt', 'sicepat'
  serviceCode: string; // 'REG', 'EXP', 'CARGO'
  serviceName: string;
  estimatedDays: string;
  cost: number;
  description?: string;
}

export interface ShipmentCreateRequest {
  orderNumber: string;
  serviceCode: string;
  recipientName: string;
  recipientPhone: string;
  fullAddress: string;
  postalCode: string;
  subdistrict: string;
  city: string;
  province: string;
  totalWeightGrams: number;
  goodsValue: number;
  notes?: string;
}

export interface ShipmentResult {
  success: boolean;
  trackingNumber: string;
  courierName: string;
  serviceName: string;
  estimatedDeliveryDate?: string;
  message?: string;
}

export interface TrackingCheckpoint {
  timestamp: string;
  status: string;
  location: string;
  description: string;
}

export interface TrackingResult {
  trackingNumber: string;
  status: 'PENDING' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED';
  checkpoints: TrackingCheckpoint[];
}

export interface ShippingProvider {
  name: string;
  isConfigured(): boolean;
  calculateRates(request: ShippingCalculationRequest): Promise<ShippingServiceOption[]>;
  createShipment(request: ShipmentCreateRequest): Promise<ShipmentResult>;
  trackShipment(trackingNumber: string): Promise<TrackingResult>;
}
