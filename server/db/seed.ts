import bcrypt from 'bcryptjs';
import pg from 'pg';
import { getDatabasePool, isDatabaseConfigured } from './connection.js';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_VOUCHERS } from '../../src/data/initialProducts.js';

export async function seedDatabase(customClient?: pg.PoolClient | pg.Pool): Promise<void> {
  if (!customClient && !isDatabaseConfigured()) {
    console.warn('[Seed] Skipping seed: DATABASE_URL is not configured.');
    return;
  }

  const client = customClient || getDatabasePool();

  console.log('[Seed] Seeding initial data...');

  // 1. Seed Categories
  for (const cat of INITIAL_CATEGORIES) {
    await client.query(
      `INSERT INTO categories (id, name, slug, icon, description, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       ON CONFLICT (slug) DO UPDATE
       SET name = EXCLUDED.name, icon = EXCLUDED.icon, description = EXCLUDED.description;`,
      [(cat as any).id || `cat-${cat.slug}`, cat.name, cat.slug, (cat as any).icon || 'Sparkles', cat.description || '', 0]
    );
  }

  // 2. Seed Products, Variants, Images, and Inventory
  for (const prod of INITIAL_PRODUCTS) {
    // Find category id
    const catRes = await client.query('SELECT id FROM categories WHERE slug = $1', [prod.category]);
    const categoryId = catRes.rows[0]?.id || null;

    await client.query(
      `INSERT INTO products (
        id, category_id, name, slug, description, material, care_instructions,
        price, discount_price, weight_grams, dimensions_cm, is_featured, is_best_seller, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, TRUE)
      ON CONFLICT (slug) DO UPDATE
      SET name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price,
          discount_price = EXCLUDED.discount_price, weight_grams = EXCLUDED.weight_grams;`,
      [
        prod.id,
        categoryId,
        prod.name,
        prod.slug,
        prod.description,
        prod.material || 'Premium Silk',
        prod.careInstructions || 'Cuci manual dengan air dingin, setrika suhu rendah',
        prod.price,
        prod.discountPrice || null,
        prod.weight || 400,
        prod.dimensions || '30x25x5 cm',
        Boolean(prod.isFeatured),
        Boolean(prod.isBestSeller)
      ]
    );

    // Product Images
    for (let i = 0; i < (prod.images || []).length; i++) {
      const imgUrl = prod.images[i];
      await client.query(
        `INSERT INTO product_images (id, product_id, url, is_primary, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING;`,
        [`img-${prod.id}-${i}`, prod.id, imgUrl, i === 0, i]
      );
    }

    // Variants and Inventory
    for (const v of prod.variants) {
      await client.query(
        `INSERT INTO product_variants (
          id, product_id, sku, color_name, color_hex, size, price_adjustment, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, 0, TRUE)
        ON CONFLICT (sku) DO UPDATE
        SET color_name = EXCLUDED.color_name, color_hex = EXCLUDED.color_hex, size = EXCLUDED.size;`,
        [v.id, prod.id, v.sku, v.colorName, v.colorHex, v.size]
      );

      // Inventory
      await client.query(
        `INSERT INTO inventory (id, variant_id, stock, reserved, low_stock_threshold)
         VALUES ($1, $2, $3, 0, 5)
         ON CONFLICT (variant_id) DO UPDATE
         SET stock = EXCLUDED.stock;`,
        [`inv-${v.id}`, v.id, v.stock || 25]
      );
    }
  }

  // 3. Seed Vouchers
  for (const v of INITIAL_VOUCHERS) {
    await client.query(
      `INSERT INTO vouchers (
        id, code, name, discount_type, discount_value, min_spend, max_discount,
        quota, used_count, start_date, end_date, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE)
      ON CONFLICT (code) DO UPDATE
      SET name = EXCLUDED.name, discount_value = EXCLUDED.discount_value, min_spend = EXCLUDED.min_spend;`,
      [
        v.id,
        v.code,
        (v as any).name || v.description || v.code,
        (v as any).discountType || (v as any).type || 'PERCENTAGE',
        (v as any).discountValue ?? (v as any).value ?? 15,
        (v as any).minSpend ?? (v as any).minimumPurchase ?? 0,
        (v as any).maxDiscount ?? (v as any).maximumDiscount ?? null,
        (v as any).quota ?? (v as any).usageLimit ?? 500,
        v.usedCount || 0,
        v.startDate ? new Date(v.startDate) : new Date(),
        v.endDate ? new Date(v.endDate) : new Date(Date.now() + 180 * 24 * 3600 * 1000)
      ]
    );
  }

  // 4. Seed Initial Admin (Only if not already present, hashed securely with bcrypt)
  const adminEmail = 'admin@saena.id';
  const existingAdmin = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
  if (existingAdmin.rows.length === 0) {
    const rawAdminPass = process.env.ADMIN_KEY || 'SaenaSecureAdmin2026!';
    const passwordHash = await bcrypt.hash(rawAdminPass, 12);
    const adminId = 'usr-admin-default';

    await client.query(
      `INSERT INTO users (id, email, password_hash, name, phone, role, status, email_verified_at)
       VALUES ($1, $2, $3, $4, $5, 'ADMIN', 'ACTIVE', NOW());`,
      [adminId, adminEmail, passwordHash, 'Administrator Saena.id', '081234567890']
    );

    await client.query(
      `INSERT INTO admin_users (id, user_id, permissions, is_super_admin)
       VALUES ($1, $2, '["ALL"]'::jsonb, TRUE);`,
      ['adm-default', adminId]
    );
    console.log('[Seed] Default Administrator Saena.id seeded with bcrypt hash.');
  }

  console.log('[Seed] Database seeding completed successfully.');
}
