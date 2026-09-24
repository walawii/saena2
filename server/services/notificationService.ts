export interface NotificationEvent {
  type: 'ORDER_CREATED' | 'PAYMENT_SUCCESSFUL' | 'PAYMENT_FAILED' | 'ORDER_SHIPPED' | 'ORDER_DELIVERED';
  orderNumber: string;
  customerEmail: string;
  customerPhone: string;
  metadata?: Record<string, any>;
}

export interface NotificationProvider {
  name: string;
  send(event: NotificationEvent): Promise<boolean>;
}

class ConsoleLogNotificationProvider implements NotificationProvider {
  name = 'Console & Webhook Notification Logger';

  async send(event: NotificationEvent): Promise<boolean> {
    console.log(`[Notification Service] Event Dispatched: ${event.type}`);
    console.log(`  -> Order: ${event.orderNumber}`);
    console.log(`  -> Recipient: ${event.customerEmail} / ${event.customerPhone}`);
    if (event.metadata) {
      console.log(`  -> Metadata:`, JSON.stringify(event.metadata));
    }
    return true;
  }
}

class NotificationService {
  private provider: NotificationProvider;

  constructor(provider?: NotificationProvider) {
    this.provider = provider || new ConsoleLogNotificationProvider();
  }

  setProvider(provider: NotificationProvider) {
    this.provider = provider;
  }

  async notify(event: NotificationEvent): Promise<boolean> {
    try {
      return await this.provider.send(event);
    } catch (err) {
      console.error('[NotificationService] Failed to dispatch notification:', err);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
