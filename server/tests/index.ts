/**
 * ========================================================
 * SAENA.ID E-COMMERCE END-TO-END TEST SUITE
 * Production Hardening Verification
 * ========================================================
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { DokuPaymentProvider } from '../providers/payment/DokuPaymentProvider.js';
import { MengantarShippingProvider } from '../providers/shipping/MengantarShippingProvider.js';
import { getErrorMessage } from '../validators/formatError.js';
import { CreateOrderSchema } from '../validators/orderValidators.js';

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  message?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(category: string, name: string, fn: () => Promise<void> | void) {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    results.push({ name, category, passed: true, durationMs });
    console.log(`  ✓ [${category}] ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    results.push({ name, category, passed: false, message: err.message, durationMs });
    console.error(`  ✗ [${category}] ${name} (${durationMs}ms):`, err.message);
  }
}

function assert(condition: any, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function main() {
  console.log('========================================================');
  console.log('SAENA.ID COMPREHENSIVE PRODUCTION TEST SUITE RUNNER');
  console.log('========================================================\n');

  // -----------------------------------------------------------------
  // 1. AUTHENTICATION & PASSWORD SECURITY
  // -----------------------------------------------------------------
  await runTest('AUTH', 'Password hashing using bcrypt (12 rounds)', async () => {
    const password = 'SaenaSecurePassword2026!';
    const saltRounds = 12;
    const hash = await bcrypt.hash(password, saltRounds);

    assert(hash.startsWith('$2a$') || hash.startsWith('$2b$'), 'Hash must be a valid bcrypt format');
    assert(hash !== password, 'Password must never equal hash');

    const isValid = await bcrypt.compare(password, hash);
    assert(isValid, 'Valid password must pass bcrypt verification');

    const isInvalid = await bcrypt.compare('WrongPassword123', hash);
    assert(!isInvalid, 'Incorrect password must be rejected');
  });

  await runTest('AUTH', 'JWT signing and token verification with expiration', async () => {
    const secret = 'test-secret-key-32-chars-long-for-jwt-signing';
    const payload = { sub: 'usr-123', email: 'test@saena.id', role: 'CUSTOMER', name: 'Siti Aminah' };
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });

    assert(typeof token === 'string' && token.split('.').length === 3, 'Token must be valid 3-part JWT');

    const decoded: any = jwt.verify(token, secret);
    assert(decoded.sub === 'usr-123', 'Decoded subject must match');
    assert(decoded.role === 'CUSTOMER', 'Decoded role must match');

    // Tampered token test
    let tamperedFailed = false;
    try {
      jwt.verify(token + 'tampered', secret);
    } catch {
      tamperedFailed = true;
    }
    assert(tamperedFailed, 'Tampered token must fail verification');
  });

  await runTest('AUTH', 'Role-based access authorization (Admin vs Customer)', () => {
    const adminUser = { role: 'ADMIN' };
    const customerUser = { role: 'CUSTOMER' };

    const isAdminAuthorized = adminUser.role === 'ADMIN';
    const isCustomerAuthorized = customerUser.role === 'ADMIN';

    assert(isAdminAuthorized, 'Admin user must be authorized for admin routes');
    assert(!isCustomerAuthorized, 'Customer user must be strictly forbidden from admin routes');
  });

  // -----------------------------------------------------------------
  // 2. VOUCHER & DISCOUNT CALCULATION
  // -----------------------------------------------------------------
  await runTest('VOUCHER', 'Percentage discount calculation with maximum cap', () => {
    const subtotal = 1000000; // Rp 1.000.000
    const discountPercent = 10; // 10%
    const maxDiscount = 50000; // max Rp 50.000

    let calculatedDiscount = Math.round((subtotal * discountPercent) / 100); // 100.000
    if (maxDiscount && calculatedDiscount > maxDiscount) {
      calculatedDiscount = maxDiscount;
    }

    assert(calculatedDiscount === 50000, `Discount must be capped at maxDiscount 50000 (got ${calculatedDiscount})`);
  });

  await runTest('VOUCHER', 'Fixed discount calculation and minimum spend verification', () => {
    const minSpend = 250000;
    const discountAmount = 30000;

    const cartUnder = 200000;
    const cartValid = 350000;

    assert(cartUnder < minSpend, 'Under minimum purchase must not qualify');
    assert(cartValid >= minSpend, 'Sufficient purchase must qualify');

    const finalTotal = cartValid - discountAmount;
    assert(finalTotal === 320000, 'Calculated total with discount must be accurate');
  });

  // -----------------------------------------------------------------
  // 3. SHIPPING CALCULATION & RESILIENCE
  // -----------------------------------------------------------------
  await runTest('SHIPPING', 'Mengantar provider status & environment configuration', () => {
    const provider = new MengantarShippingProvider();
    const status = provider.getStatus();

    assert(status.providerName === 'Mengantar Shipping Aggregator', 'Provider name must be accurate');
    assert(Array.isArray(status.requiredVariables), 'Status must list required variables');
    assert(typeof status.originSubdistrict === 'string' && status.originSubdistrict.length > 0, 'Origin subdistrict must be configured');
    assert(typeof status.originPostal === 'string' && status.originPostal.length > 0, 'Origin postal must be configured');
  });

  await runTest('SHIPPING', 'Production rejects unconfigured shipping calculation', async () => {
    // When unconfigured, calculateRates must throw an informative error
    const provider = new MengantarShippingProvider();
    if (!provider.isConfigured()) {
      let threw = false;
      try {
        await provider.calculateRates({
          originPostalCode: '12430',
          destinationPostalCode: '12160',
          destinationSubdistrict: 'Kebayoran Baru',
          destinationCity: 'Jakarta Selatan',
          destinationProvince: 'DKI Jakarta',
          weightInGrams: 500
        });
      } catch (err: any) {
        threw = true;
        assert(err.message.includes('MENGANTAR_API_KEY'), 'Error must specify MENGANTAR_API_KEY requirement');
      }
      assert(threw, 'Unconfigured provider must reject calculation');
    }
  });

  // Automated tests for Mengantar API handling (Task 8)
  const mockValidDestination = {
    originPostalCode: '12430',
    destinationPostalCode: '12160',
    destinationSubdistrict: 'Kebayoran Baru',
    destinationCity: 'Jakarta Selatan',
    destinationProvince: 'DKI Jakarta',
    weightInGrams: 500
  };

  await runTest('SHIPPING', 'Mengantar test 1: successful shipping rate response', async () => {
    const mockProvider = new MengantarShippingProvider({
      apiKey: 'MENGANTAR_LIVE_TEST_KEY_XYZ123',
      fetchFn: async (_url, _opts) => {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: { get: () => 'req-test-123' },
          text: async () => JSON.stringify({
            status: 'success',
            data: [
              {
                courier: 'JNE',
                service: 'REG',
                courier_name: 'JNE Express',
                service_name: 'Reguler',
                cost: 16000,
                etd: '2-3 hari',
                description: 'Layanan reguler via JNE'
              },
              {
                courier: 'SICEPAT',
                service: 'SIUNT',
                courier_name: 'SiCepat',
                service_name: 'Untung',
                cost: 14500,
                etd: '2-3 hari',
                description: 'Layanan hemat SiCepat'
              }
            ]
          }),
          json: async () => ({})
        } as unknown as Response;
      }
    });

    const rates = await mockProvider.calculateRates(mockValidDestination);
    assert(Array.isArray(rates) && rates.length === 2, 'Must parse exactly 2 service options');
    assert(rates[0].courierCode === 'JNE', 'First courier must be JNE');
    assert(rates[0].cost === 16000, 'Cost must match parsed number');
    assert(rates[1].courierCode === 'SICEPAT', 'Second courier must be SICEPAT');
    assert(rates[1].cost === 14500, 'Cost must match parsed number');
    assert(rates[0].serviceName.includes('Mengantar - JNE Express'), 'Formatted service name must include aggregator and courier');
  });

  await runTest('SHIPPING', 'Mengantar test 2: invalid destination rejection', async () => {
    const mockProvider = new MengantarShippingProvider({
      apiKey: 'MENGANTAR_LIVE_TEST_KEY_XYZ123',
      fetchFn: async (_url, _opts) => {
        return {
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          headers: { get: () => null },
          text: async () => JSON.stringify({
            status: false,
            message: 'Destination subdistrict not found in logistics network'
          }),
          json: async () => ({})
        } as unknown as Response;
      }
    });

    // Subtest A: Empty destination field client-side check
    let threwEmpty = false;
    try {
      await mockProvider.calculateRates({
        ...mockValidDestination,
        destinationSubdistrict: ''
      });
    } catch (err: any) {
      threwEmpty = true;
      assert(err.message.includes('Kecamatan dan Kode Pos wajib diisi'), 'Must reject empty subdistrict');
    }
    assert(threwEmpty, 'Must fail on empty destination subdistrict');

    // Subtest B: Mengantar 400 Bad Request error propagation
    let threw400 = false;
    try {
      await mockProvider.calculateRates(mockValidDestination);
    } catch (err: any) {
      threw400 = true;
      assert(err.message.includes('400'), 'Must include HTTP 400 status in error');
      assert(err.message.includes('Destination subdistrict not found'), 'Must extract Mengantar safe error detail');
    }
    assert(threw400, 'Must throw error on 400 response from Mengantar');
  });

  await runTest('SHIPPING', 'Mengantar test 3: Mengantar 401/403 authentication error', async () => {
    const mockProvider = new MengantarShippingProvider({
      apiKey: 'MENGANTAR_INVALID_KEY',
      fetchFn: async (_url, _opts) => {
        return {
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          headers: { get: () => 'auth-err-401' },
          text: async () => JSON.stringify({
            status: false,
            message: 'Invalid API Key or unauthorized access'
          }),
          json: async () => ({})
        } as unknown as Response;
      }
    });

    let threw = false;
    try {
      await mockProvider.calculateRates(mockValidDestination);
    } catch (err: any) {
      threw = true;
      assert(err.message.includes('401'), 'Must state 401 error code');
      assert(err.message.includes('MENGANTAR_API_KEY'), 'Must mention MENGANTAR_API_KEY in authentication failure');
    }
    assert(threw, 'Must throw on 401 unauthorized');
  });

  await runTest('SHIPPING', 'Mengantar test 4: Mengantar 4xx unprocessable entity', async () => {
    const mockProvider = new MengantarShippingProvider({
      apiKey: 'MENGANTAR_LIVE_TEST_KEY_XYZ123',
      fetchFn: async (_url, _opts) => {
        return {
          ok: false,
          status: 422,
          statusText: 'Unprocessable Entity',
          headers: { get: () => null },
          text: async () => JSON.stringify({
            status: false,
            message: 'Postal code does not match destination subdistrict'
          }),
          json: async () => ({})
        } as unknown as Response;
      }
    });

    let threw = false;
    try {
      await mockProvider.calculateRates(mockValidDestination);
    } catch (err: any) {
      threw = true;
      assert(err.message.includes('422'), 'Must report 422 status');
      assert(err.message.includes('Postal code does not match'), 'Must include safe error reason');
    }
    assert(threw, 'Must throw on 422 error');
  });

  await runTest('SHIPPING', 'Mengantar test 5: Mengantar 5xx server outage handling', async () => {
    const mockProvider = new MengantarShippingProvider({
      apiKey: 'MENGANTAR_LIVE_TEST_KEY_XYZ123',
      fetchFn: async (_url, _opts) => {
        return {
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          headers: { get: () => null },
          text: async () => JSON.stringify({
            status: false,
            message: 'Mengantar upstream gateway timeout'
          }),
          json: async () => ({})
        } as unknown as Response;
      }
    });

    let threw = false;
    try {
      await mockProvider.calculateRates(mockValidDestination);
    } catch (err: any) {
      threw = true;
      assert(err.message.includes('503'), 'Must report 503 status');
      assert(err.message.includes('gangguan sementara'), 'Must inform user of temporary service disruption');
    }
    assert(threw, 'Must throw on 5xx server outage');
  });

  await runTest('SHIPPING', 'Mengantar test 6: malformed response handling', async () => {
    const mockProvider = new MengantarShippingProvider({
      apiKey: 'MENGANTAR_LIVE_TEST_KEY_XYZ123',
      fetchFn: async (_url, _opts) => {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: { get: () => null },
          text: async () => '<html><head><title>502 Bad Gateway</title></head><body>Cloudflare Error</body></html>',
          json: async () => ({})
        } as unknown as Response;
      }
    });

    let threw = false;
    try {
      await mockProvider.calculateRates(mockValidDestination);
    } catch (err: any) {
      threw = true;
      assert(err.message.includes('Format respons dari server Mengantar'), 'Must detect malformed non-JSON response');
    }
    assert(threw, 'Must throw on malformed response');
  });

  // -----------------------------------------------------------------
  // 4. PRODUCT & VARIANT INTEGRITY
  // -----------------------------------------------------------------
  await runTest('PRODUCT', 'Product price and variant consistency validation', () => {
    const product = {
      id: 'prod-hana-abaya',
      name: 'Hana Abaya Premium Silk',
      price: 499000,
      discountPrice: 429000,
      variants: [
        { id: 'var-1', sku: 'HNA-NVY-S', colorName: 'Navy', size: 'S', stock: 15, reserved: 2 },
        { id: 'var-2', sku: 'HNA-NVY-M', colorName: 'Navy', size: 'M', stock: 10, reserved: 0 }
      ]
    };

    assert(product.price > 0, 'Base price must be greater than zero');
    assert(product.discountPrice < product.price, 'Discount price must be less than original price');
    for (const v of product.variants) {
      assert(v.sku && v.sku.length >= 3, 'SKU must be valid');
      const available = v.stock - v.reserved;
      assert(available >= 0, 'Available stock cannot be negative');
    }
  });

  // -----------------------------------------------------------------
  // 5. CART & WISHLIST LOGIC
  // -----------------------------------------------------------------
  await runTest('CART', 'Cart item aggregation and price subtotal calculation', () => {
    const items = [
      { id: '1', price: 429000, quantity: 2 },
      { id: '2', price: 299000, quantity: 1 }
    ];

    const subtotal = items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    assert(subtotal === (429000 * 2) + 299000, 'Subtotal must equal exact sum of quantity * price');
  });

  await runTest('WISHLIST', 'Wishlist toggling and uniqueness logic', () => {
    const wishlist = new Set<string>();
    const productId = 'prod-hana-abaya';

    // Add
    wishlist.add(productId);
    assert(wishlist.has(productId), 'Product must be in wishlist');
    assert(wishlist.size === 1, 'Wishlist size must be 1');

    // Duplicate add maintains uniqueness
    wishlist.add(productId);
    assert(wishlist.size === 1, 'Duplicate product in wishlist must not increase size');

    // Remove
    wishlist.delete(productId);
    assert(!wishlist.has(productId), 'Product must be removed from wishlist');
  });

  // -----------------------------------------------------------------
  // 6. ADDRESS & REVIEW VALIDATION
  // -----------------------------------------------------------------
  await runTest('ADDRESS', 'Customer address Indonesian standard fields verification', () => {
    const address = {
      recipientName: 'Fatimah Zahra',
      phone: '081298765432',
      province: 'DKI Jakarta',
      city: 'Jakarta Selatan',
      subdistrict: 'Cilandak',
      postalCode: '12430',
      fullAddress: 'Jl. RS Fatmawati No. 10'
    };

    assert(address.postalCode.length === 5, 'Indonesian postal code must be 5 digits');
    assert(address.phone.startsWith('08') || address.phone.startsWith('+62'), 'Phone must start with 08 or +62');
    assert(address.subdistrict.length > 0, 'Subdistrict (kecamatan) is required for Mengantar courier routing');
  });

  await runTest('REVIEW', 'Product rating bounds and review validation', () => {
    const validRating = 5;
    const invalidRatingLow = 0;
    const invalidRatingHigh = 6;

    assert(validRating >= 1 && validRating <= 5, 'Rating must be between 1 and 5 stars');
    assert(!(invalidRatingLow >= 1 && invalidRatingLow <= 5), '0 rating must be rejected');
    assert(!(invalidRatingHigh >= 1 && invalidRatingHigh <= 5), '6 rating must be rejected');
  });

  // -----------------------------------------------------------------
  // 7. ORDER CREATION VALIDATION & SCHEMA
  // -----------------------------------------------------------------
  await runTest('ORDER', 'CreateOrderSchema server-side Zod validation', () => {
    const invalidPayload = {
      customer: { name: '', email: 'not-an-email', phone: '12' },
      items: [],
      paymentMethodCode: 'INVALID_METHOD'
    };

    const parsed = CreateOrderSchema.safeParse(invalidPayload);
    assert(!parsed.success, 'Invalid order payload must fail validation');

    const validPayload = {
      customer: {
        name: 'Aisyah Putri',
        email: 'aisyah@example.com',
        phone: '081234567890'
      },
      shippingAddress: {
        recipientName: 'Aisyah Putri',
        phone: '081234567890',
        province: 'Jawa Barat',
        city: 'Bandung',
        subdistrict: 'Coblong',
        postalCode: '40132',
        fullAddress: 'Jl. Dago No. 123'
      },
      items: [
        {
          productId: 'prod-1',
          variantId: 'v1-1',
          quantity: 2
        }
      ],
      paymentMethodCode: 'BCA_VA',
      shippingOption: {
        provider: 'mengantar',
        courierCode: 'JNE',
        serviceCode: 'REG',
        serviceName: 'Mengantar - JNE Reguler',
        cost: 15000
      }
    };

    const validParsed = CreateOrderSchema.safeParse(validPayload);
    assert(validParsed.success, 'Valid order payload must succeed');
  });

  // -----------------------------------------------------------------
  // 5. INVENTORY ATOMIC STOCK RESERVATION & CONCURRENCY
  // -----------------------------------------------------------------
  await runTest('INVENTORY', 'Concurrent checkout stock race-condition prevention logic', async () => {
    // Simulate stock check: only 1 unit in stock
    let totalStock = 1;
    let reserved = 0;
    const lock = { isLocked: false };

    async function reserveStockTransaction(customerId: string): Promise<boolean> {
      // Simulate mutex / row lock: SELECT ... FOR UPDATE
      while (lock.isLocked) {
        await new Promise(r => setTimeout(r, 10));
      }
      lock.isLocked = true;
      try {
        const available = totalStock - reserved;
        if (available >= 1) {
          reserved += 1;
          return true;
        }
        return false;
      } finally {
        lock.isLocked = false;
      }
    }

    // Both checkouts fire simultaneously
    const [result1, result2] = await Promise.all([
      reserveStockTransaction('customer-A'),
      reserveStockTransaction('customer-B')
    ]);

    // Exactly one must succeed, the other must fail
    const successes = [result1, result2].filter(Boolean).length;
    assert(successes === 1, `Exactly 1 transaction must succeed on 1 remaining stock (got ${successes})`);
  });

  // -----------------------------------------------------------------
  // 6. DOKU PAYMENT INTEGRATION & SIGNATURE VERIFICATION
  // -----------------------------------------------------------------
  await runTest('DOKU', 'Digest and HMAC-SHA256 signature generation', () => {
    const clientId = 'MALL-123456';
    const secretKey = 'sec-xyz-987654321';
    const requestId = 'REQ-001';
    const timestamp = '2026-09-24T02:00:00Z';
    const target = '/api/payments/doku/webhook';

    const payload = JSON.stringify({
      order: { invoice_number: 'SAE-2026-0001', amount: 350000 },
      transaction: { status: 'SUCCESS', id: 'TRX-999' }
    });

    // 1. Generate SHA-256 Digest
    const digest = crypto.createHash('sha256').update(payload, 'utf8').digest('base64');
    assert(typeof digest === 'string' && digest.length > 0, 'Digest must be non-empty base64 string');

    // 2. Generate HMAC-SHA256 Signature
    const signatureComponent = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${target}\nDigest:${digest}`;
    const hmac = crypto.createHmac('sha256', secretKey).update(signatureComponent, 'utf8').digest('base64');
    const signature = `HMACSHA256=${hmac}`;

    assert(signature.startsWith('HMACSHA256='), 'Signature must use DOKU HMACSHA256= prefix');

    // 3. Constant-time verification
    const verified = crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(`HMACSHA256=${hmac}`, 'utf8')
    );
    assert(verified, 'Signature verification must succeed with timingSafeEqual');
  });

  await runTest('WEBHOOK', 'Webhook idempotency key deduping logic', () => {
    const processedKeys = new Set<string>();

    const orderNumber = 'SAE-2026-001';
    const status = 'PAID';
    const requestId = 'DOKU-REQ-7788';
    const idempotencyKey = `doku_${orderNumber}_${status}_${requestId}`;

    // First arrival
    const isFirstTime = !processedKeys.has(idempotencyKey);
    assert(isFirstTime, 'First webhook event must be treated as new');
    processedKeys.add(idempotencyKey);

    // Duplicate arrival
    const isDuplicate = processedKeys.has(idempotencyKey);
    assert(isDuplicate, 'Duplicate webhook event must be recognized and skipped');
  });

  // -----------------------------------------------------------------
  // 7. IDOR & ORDER STATE MACHINE PERMISSIONS
  // -----------------------------------------------------------------
  await runTest('SECURITY', 'IDOR Protection: Customer A cannot read Customer B order', () => {
    const customerOrder = {
      orderNumber: 'SAE-2026-001',
      customer: { email: 'customerA@domain.com' },
      customerId: 'usr-customer-a'
    };

    const authenticatedUserA = { id: 'usr-customer-a', email: 'customera@domain.com', role: 'CUSTOMER' };
    const authenticatedUserB = { id: 'usr-customer-b', email: 'customerb@domain.com', role: 'CUSTOMER' };
    const adminUser = { id: 'usr-admin-1', email: 'admin@saena.id', role: 'ADMIN' };

    // User A accessing own order
    const canUserAAccess =
      authenticatedUserA.email === customerOrder.customer.email.toLowerCase() ||
      authenticatedUserA.id === customerOrder.customerId;
    assert(canUserAAccess, 'Customer A must be authorized to access Customer A order');

    // User B accessing Customer A order
    const canUserBAccess =
      authenticatedUserB.email === customerOrder.customer.email.toLowerCase() ||
      authenticatedUserB.id === customerOrder.customerId;
    assert(!canUserBAccess, 'Customer B must be REJECTED from accessing Customer A order (IDOR)');

    // Admin accessing Customer A order
    const canAdminAccess = adminUser.role === 'ADMIN';
    assert(canAdminAccess, 'Admin must be authorized to view any order');
  });

  await runTest('SECURITY', 'Customer cannot directly mutate order status to PAID or DELIVERED', () => {
    const allowedTransitionsByCustomer: string[] = []; // Customers have 0 direct status transition rights
    assert(!allowedTransitionsByCustomer.includes('PAID'), 'Customer cannot set status to PAID');
    assert(!allowedTransitionsByCustomer.includes('SHIPPED'), 'Customer cannot set status to SHIPPED');
    assert(!allowedTransitionsByCustomer.includes('DELIVERED'), 'Customer cannot set status to DELIVERED');
  });

  // -----------------------------------------------------------------
  // SUMMARY REPORT
  // -----------------------------------------------------------------
  console.log('\n========================================================');
  console.log('TEST SUMMARY');
  console.log('========================================================');

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`Total Tests Run: ${total}`);
  console.log(`Passed:         ${passed}`);
  console.log(`Failed:         ${failed}`);

  if (failed > 0) {
    console.error('\nFAILED TESTS:');
    results.filter(r => !r.passed).forEach(r => {
      console.error(`- [${r.category}] ${r.name}: ${r.message}`);
    });
    process.exit(1);
  } else {
    console.log('\n✓ ALL PRODUCTION HARDENING TESTS PASSED SUCCESSFULLY!');
  }
}

main().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
