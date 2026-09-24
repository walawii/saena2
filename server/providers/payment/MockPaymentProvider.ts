import {
  PaymentProvider,
  PaymentCreateRequest,
  PaymentCreateResult,
  PaymentWebhookPayload
} from './types.js';

export class MockPaymentProvider implements PaymentProvider {
  name = 'DOKU (Simulated Sandbox)';

  isConfigured(): boolean {
    return true;
  }

  async createPayment(request: PaymentCreateRequest): Promise<PaymentCreateResult> {
    const paymentId = `DOKU-MOCK-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours
    const suffix = Math.floor(10000000 + Math.random() * 90000000);

    let methodName = 'BCA Virtual Account';
    let vaNumber: string | undefined = undefined;
    let qrString: string | undefined = undefined;
    let instructions = 'Transfer ke nomor Virtual Account di bawah ini melalui ATM, Mobile Banking, atau Internet Banking.';

    if (request.paymentMethodCode === 'BCA_VA') {
      methodName = 'BCA Virtual Account';
      vaNumber = `8808${suffix}`;
      instructions = 'Buka BCA Mobile > m-Transfer > BCA Virtual Account > Masukkan nomor VA.';
    } else if (request.paymentMethodCode === 'MANDIRI_VA') {
      methodName = 'Mandiri Livin Virtual Account';
      vaNumber = `8902${suffix}`;
      instructions = 'Buka Livin\' by Mandiri > Bayar > Cari DOKU / Saena > Masukkan nomor VA.';
    } else if (request.paymentMethodCode === 'BRI_VA') {
      methodName = 'BRI BRIVA';
      vaNumber = `1280${suffix}`;
      instructions = 'Buka BRImo > Pembayaran > BRIVA > Masukkan kode pembayaran.';
    } else if (request.paymentMethodCode === 'BNI_VA') {
      methodName = 'BNI Virtual Account';
      vaNumber = `9881${suffix}`;
      instructions = 'Buka BNI Mobile Banking > Transfer > Virtual Account Billing.';
    } else if (request.paymentMethodCode === 'QRIS') {
      methodName = 'QRIS (Gopay, OVO, Dana, ShopeePay, BCA, All Bank)';
      qrString = `00020101021226670016ID.DOKU.WWW01189360099900000000010215${request.orderNumber}520459995303360540${request.amount}5802ID5908SAENA ID6007JAKARTA6304`;
      instructions = 'Pindai kode QRIS menggunakan aplikasi e-wallet atau mobile banking favorit Anda.';
    } else if (request.paymentMethodCode === 'CC') {
      methodName = 'Kartu Kredit / Debit Online (Visa & Mastercard)';
      instructions = 'Verifikasi pembayaran 3D Secure dengan OTP yang dikirimkan bank Anda.';
    } else {
      methodName = 'E-Wallet (OVO / ShopeePay / DANA)';
      instructions = 'Buka notifikasi di ponsel Anda untuk menyetujui transaksi pembayaran.';
    }

    return {
      success: true,
      paymentId,
      orderNumber: request.orderNumber,
      amount: request.amount,
      paymentMethod: {
        code: request.paymentMethodCode,
        name: methodName,
        instructions,
        vaNumber,
        qrString,
        expiresAt
      }
    };
  }

  verifySignature(): boolean {
    return true;
  }

  parseWebhook(body: any): PaymentWebhookPayload {
    return {
      orderNumber: body.orderNumber || body.invoice_number,
      paymentId: body.paymentId || `MOCK-${Date.now()}`,
      status: body.status || 'PAID',
      amount: Number(body.amount || 0),
      paidAt: new Date().toISOString(),
      rawPayload: body
    };
  }
}
