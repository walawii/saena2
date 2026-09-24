import { query } from '../../db/connection.js';
import { Product } from '../../../src/types/index.js';

export class PostgresProductRepository {
  async getAllProducts(filters?: {
    categorySlug?: string;
    isFeatured?: boolean;
    isBestSeller?: boolean;
    search?: string;
  }): Promise<Product[]> {
    let sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.deleted_at IS NULL AND p.is_active = TRUE
    `;
    const params: any[] = [];

    if (filters?.categorySlug) {
      params.push(filters.categorySlug);
      sql += ` AND c.slug = $${params.length}`;
    }

    if (filters?.isFeatured) {
      sql += ` AND p.is_featured = TRUE`;
    }

    if (filters?.isBestSeller) {
      sql += ` AND p.is_best_seller = TRUE`;
    }

    if (filters?.search) {
      params.push(`%${filters.search.toLowerCase()}%`);
      sql += ` AND (LOWER(p.name) LIKE $${params.length} OR LOWER(p.description) LIKE $${params.length})`;
    }

    sql += ` ORDER BY p.created_at DESC`;

    const res = await query(sql, params);
    if (res.rows.length === 0) return [];

    const productIds = res.rows.map(r => r.id);

    // Fetch images for these products
    const imagesRes = await query(
      `SELECT * FROM product_images WHERE product_id = ANY($1) ORDER BY position ASC`,
      [productIds]
    );
    const imagesByProd = new Map<string, string[]>();
    for (const img of imagesRes.rows) {
      if (!imagesByProd.has(img.product_id)) imagesByProd.set(img.product_id, []);
      imagesByProd.get(img.product_id)!.push(img.image_url);
    }

    // Fetch variants for these products
    const variantsRes = await query(
      `SELECT pv.*, COALESCE(inv.stock, 0) as stock, COALESCE(inv.reserved, 0) as reserved
       FROM product_variants pv
       LEFT JOIN inventory inv ON pv.id = inv.variant_id
       WHERE pv.product_id = ANY($1) AND pv.is_active = TRUE
       ORDER BY pv.created_at ASC`,
      [productIds]
    );
    const variantsByProd = new Map<string, any[]>();
    for (const v of variantsRes.rows) {
      if (!variantsByProd.has(v.product_id)) variantsByProd.set(v.product_id, []);
      variantsByProd.get(v.product_id)!.push({
        id: v.id,
        sku: v.sku,
        colorName: v.color_name,
        colorHex: v.color_hex,
        size: v.size,
        stock: Math.max(0, Number(v.stock) - Number(v.reserved)),
        availableStock: Math.max(0, Number(v.stock) - Number(v.reserved)),
        reservedStock: Number(v.reserved)
      });
    }

    return res.rows.map(r => {
      const vars = variantsByProd.get(r.id) || [];
      const totalStock = vars.reduce((acc, v) => acc + v.stock, 0);
      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        sku: r.slug,
        category: r.category_slug || 'gamis',
        categoryName: r.category_name || r.category_slug || 'Koleksi Saena',
        categorySlug: r.category_slug || 'gamis',
        description: r.description,
        material: r.material,
        materials: r.material ? [r.material] : [],
        careInstructions: r.care_instructions,
        price: Number(r.price),
        discountPrice: r.discount_price ? Number(r.discount_price) : undefined,
        images: imagesByProd.get(r.id) || [],
        weight: Number(r.weight_grams),
        weightInGrams: Number(r.weight_grams),
        dimensions: r.dimensions_cm,
        isFeatured: Boolean(r.is_featured),
        isBestSeller: Boolean(r.is_best_seller),
        isNewArrival: true,
        stock: totalStock,
        variants: vars,
        colors: vars.map(v => ({ name: v.colorName, hex: v.colorHex })),
        sizes: vars.map(v => v.size),
        rating: 4.9,
        reviewCount: 15,
        status: 'ACTIVE',
        createdAt: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
        updatedAt: r.updated_at ? r.updated_at.toISOString() : new Date().toISOString()
      };
    });
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const products = await this.getAllProducts();
    return products.find(p => p.slug === slug) || null;
  }

  async getProductById(id: string): Promise<Product | null> {
    const products = await this.getAllProducts();
    return products.find(p => p.id === id) || null;
  }

  async findById(id: string): Promise<Product | null> {
    return this.getProductById(id);
  }

  async createProduct(data: {
    name: string;
    slug: string;
    categorySlug: string;
    description: string;
    material?: string;
    careInstructions?: string;
    price: number;
    discountPrice?: number;
    weightGrams: number;
    isFeatured?: boolean;
    isBestSeller?: boolean;
    images: string[];
    variants: Array<{
      sku: string;
      colorName: string;
      colorHex: string;
      size: string;
      initialStock: number;
    }>;
  }): Promise<Product> {
    const id = `prod-${Date.now()}`;

    // Get category ID
    const catRes = await query('SELECT id FROM categories WHERE slug = $1 LIMIT 1', [data.categorySlug]);
    const categoryId = catRes.rows[0]?.id || 'cat-gamis';

    await query(
      `INSERT INTO products (
        id, name, slug, description, material, care_instructions,
        price, discount_price, category_id, weight_grams,
        is_featured, is_best_seller, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, TRUE)`,
      [
        id,
        data.name,
        data.slug,
        data.description,
        data.material || 'Premium Silk & Cotton',
        data.careInstructions || 'Cuci manual dengan air dingin',
        data.price,
        data.discountPrice || null,
        categoryId,
        data.weightGrams || 350,
        Boolean(data.isFeatured),
        Boolean(data.isBestSeller)
      ]
    );

    // Insert images
    for (let i = 0; i < data.images.length; i++) {
      const imgId = `img-${id}-${i}`;
      await query(
        `INSERT INTO product_images (id, product_id, image_url, position, is_primary)
         VALUES ($1, $2, $3, $4, $5)`,
        [imgId, id, data.images[i], i, i === 0]
      );
    }

    // Insert variants and initialize inventory
    for (const v of data.variants) {
      const varId = `var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await query(
        `INSERT INTO product_variants (id, product_id, sku, color_name, color_hex, size, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
        [varId, id, v.sku, v.colorName, v.colorHex, v.size]
      );

      // Inventory record
      await query(
        `INSERT INTO inventory (id, variant_id, stock, reserved)
         VALUES ($1, $2, $3, 0)`,
        [`inv-${varId}`, varId, v.initialStock || 0]
      );
    }

    const created = await this.getProductById(id);
    return created!;
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product | null> {
    const existing = await this.getProductById(id);
    if (!existing) return null;

    let catId = undefined;
    if (data.categorySlug) {
      const catRes = await query('SELECT id FROM categories WHERE slug = $1 LIMIT 1', [data.categorySlug]);
      catId = catRes.rows[0]?.id;
    }

    const materialVal = data.material || (data.materials ? data.materials.join(', ') : undefined);
    const careVal = typeof data.careInstructions === 'string' ? data.careInstructions : (Array.isArray(data.careInstructions) ? data.careInstructions.join(', ') : undefined);

    await query(
      `UPDATE products SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        discount_price = $4,
        category_id = COALESCE($5, category_id),
        material = COALESCE($6, material),
        care_instructions = COALESCE($7, care_instructions),
        is_featured = COALESCE($8, is_featured),
        is_best_seller = COALESCE($9, is_best_seller),
        updated_at = NOW()
       WHERE id = $10`,
      [
        data.name,
        data.description,
        data.price,
        data.discountPrice !== undefined ? data.discountPrice : existing.discountPrice,
        catId,
        materialVal,
        careVal,
        data.isFeatured,
        data.isBestSeller,
        id
      ]
    );

    return this.getProductById(id);
  }

  async deleteProduct(id: string): Promise<boolean> {
    const res = await query('UPDATE products SET deleted_at = NOW(), is_active = FALSE WHERE id = $1', [id]);
    return (res.rowCount || 0) > 0;
  }

  async getAllCategories(): Promise<any[]> {
    const res = await query(
      `SELECT c.*, COUNT(p.id) as product_count
       FROM categories c
       LEFT JOIN products p ON c.id = p.category_id AND p.deleted_at IS NULL AND p.is_active = TRUE
       GROUP BY c.id
       ORDER BY c.name ASC`
    );
    return res.rows.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      image: r.image_url,
      productCount: Number(r.product_count || 0)
    }));
  }
}

export const productRepository = new PostgresProductRepository();
