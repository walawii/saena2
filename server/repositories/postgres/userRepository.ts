import { query } from '../../db/connection.js';

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  phone: string;
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF';
  status: 'ACTIVE' | 'SUSPENDED';
  email_verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AddressRecord {
  id: string;
  user_id: string;
  recipient_name: string;
  phone: string;
  province: string;
  city: string;
  subdistrict: string;
  village?: string;
  postal_code: string;
  full_address: string;
  notes?: string;
  is_default: boolean;
  created_at: string;
}

export class PostgresUserRepository {
  async findByEmail(email: string): Promise<UserRecord | null> {
    const res = await query<UserRecord>(
      'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL LIMIT 1',
      [email.trim().toLowerCase()]
    );
    return res.rows[0] || null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const res = await query<UserRecord>(
      'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1',
      [id]
    );
    return res.rows[0] || null;
  }

  async createUser(data: {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    phone: string;
    role?: 'CUSTOMER' | 'ADMIN';
  }): Promise<UserRecord> {
    const role = data.role || 'CUSTOMER';
    const res = await query<UserRecord>(
      `INSERT INTO users (id, email, password_hash, name, phone, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
       RETURNING *`,
      [
        data.id,
        data.email.trim().toLowerCase(),
        data.passwordHash,
        data.name.trim(),
        data.phone.trim(),
        role
      ]
    );

    const user = res.rows[0];

    // Create customer profile or admin user entry
    if (role === 'CUSTOMER') {
      await query(
        `INSERT INTO customer_profiles (id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [`prof-${user.id}`, user.id]
      );
    } else if (role === 'ADMIN') {
      await query(
        `INSERT INTO admin_users (id, user_id, permissions, is_super_admin)
         VALUES ($1, $2, '["ALL"]'::jsonb, TRUE)
         ON CONFLICT DO NOTHING`,
        [`adm-${user.id}`, user.id]
      );
    }

    return user;
  }

  async createCustomer(data: { email: string; passwordHash: string; name: string; phone: string }): Promise<UserRecord> {
    const id = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    return this.createUser({ id, ...data, role: 'CUSTOMER' });
  }

  async getAddresses(userId: string): Promise<AddressRecord[]> {
    const res = await query<AddressRecord>(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [userId]
    );
    return res.rows;
  }

  async addAddress(userId: string, address: {
    recipientName: string;
    phone: string;
    province: string;
    city: string;
    subdistrict: string;
    village?: string;
    postalCode: string;
    fullAddress: string;
    notes?: string;
    isDefault?: boolean;
  }): Promise<AddressRecord> {
    const id = `addr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    if (address.isDefault) {
      // Clear other defaults
      await query('UPDATE addresses SET is_default = FALSE WHERE user_id = $1', [userId]);
    }

    const res = await query<AddressRecord>(
      `INSERT INTO addresses (
        id, user_id, recipient_name, phone, province, city, subdistrict,
        village, postal_code, full_address, notes, is_default
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        id,
        userId,
        address.recipientName,
        address.phone,
        address.province,
        address.city,
        address.subdistrict,
        address.village || null,
        address.postalCode,
        address.fullAddress,
        address.notes || null,
        Boolean(address.isDefault)
      ]
    );
    return res.rows[0];
  }

  async listCustomers(limit = 100): Promise<any[]> {
    const res = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.status, u.created_at,
              COUNT(o.id) as total_orders,
              COALESCE(SUM(CASE WHEN o.payment_status = 'PAID' THEN o.total ELSE 0 END), 0) as total_spent
       FROM users u
       LEFT JOIN orders o ON o.user_id = u.id
       WHERE u.role = 'CUSTOMER' AND u.deleted_at IS NULL
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows;
  }
}

export const userRepository = new PostgresUserRepository();
