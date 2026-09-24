import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/postgres/userRepository.js';
import { auditRepository } from '../repositories/postgres/auditRepository.js';
import { requireAuth, signAuthToken, AuthenticatedRequest } from '../middleware/auth.js';
import { RegisterSchema, LoginSchema, AdminLoginSchema, AddressSchema } from '../validators/authValidators.js';
import { getErrorMessage } from '../validators/formatError.js';

const router = Router();

// POST /api/auth/register - Register customer
router.post('/register', async (req: Request, res: Response) => {
  try {
    const parseResult = RegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: getErrorMessage(parseResult.error)
      });
    }

    const { name, email, phone, password } = parseResult.data;

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar. Silakan login menggunakan akun Anda.'
      });
    }

    // Salt rounds: 12 for strong production security
    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await userRepository.createCustomer({
      name,
      email,
      phone,
      passwordHash
    });

    const token = signAuthToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name
    });

    res.status(201).json({
      success: true,
      message: 'Registrasi akun berhasil',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        addresses: []
      }
    });
  } catch (err: any) {
    console.error('[Auth Register Error]:', err.message);
    res.status(500).json({ success: false, message: 'Gagal melakukan pendaftaran akun.' });
  }
});

// POST /api/auth/login - Customer Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: getErrorMessage(parseResult.error)
      });
    }

    const { email, password } = parseResult.data;

    const user = await userRepository.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau kata sandi tidak sesuai.'
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda sedang dinonaktifkan. Silakan hubungi Customer Service.'
      });
    }

    // Verify bcrypt password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email atau kata sandi tidak sesuai.'
      });
    }

    const addresses = await userRepository.getAddresses(user.id);

    const token = signAuthToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    res.json({
      success: true,
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: addresses.map(a => ({
          id: a.id,
          recipientName: a.recipient_name,
          phone: a.phone,
          province: a.province,
          city: a.city,
          subdistrict: a.subdistrict,
          village: a.village,
          postalCode: a.postal_code,
          fullAddress: a.full_address,
          notes: a.notes,
          isDefault: a.is_default
        }))
      }
    });
  } catch (err: any) {
    console.error('[Auth Login Error]:', err.message);
    res.status(500).json({ success: false, message: 'Gagal melakukan login.' });
  }
});

// POST /api/auth/admin/login - Dedicated Admin Login
router.post('/admin/login', async (req: Request, res: Response) => {
  try {
    const parseResult = AdminLoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: getErrorMessage(parseResult.error)
      });
    }

    const { email, password } = parseResult.data;

    const user = await userRepository.findByEmail(email);
    if (!user || user.role !== 'ADMIN') {
      return res.status(401).json({
        success: false,
        message: 'Kredensial Administrator tidak valid.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Kredensial Administrator tidak valid.'
      });
    }

    // Log admin access
    await auditRepository.recordLog({
      adminId: user.id,
      action: 'ADMIN_LOGIN',
      entityType: 'AUTH',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    const token = signAuthToken({
      id: user.id,
      email: user.email,
      role: 'ADMIN',
      name: user.name
    });

    res.json({
      success: true,
      message: 'Login Administrator Berhasil',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: 'ADMIN'
      }
    });
  } catch (err: any) {
    console.error('[Admin Login Error]:', err.message);
    res.status(500).json({ success: false, message: 'Gagal login admin.' });
  }
});

// GET /api/auth/me - Get current authenticated user
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    const addresses = await userRepository.getAddresses(userId);

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: addresses.map(a => ({
          id: a.id,
          recipientName: a.recipient_name,
          phone: a.phone,
          province: a.province,
          city: a.city,
          subdistrict: a.subdistrict,
          village: a.village,
          postalCode: a.postal_code,
          fullAddress: a.full_address,
          notes: a.notes,
          isDefault: a.is_default
        }))
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat profil' });
  }
});

// POST /api/auth/addresses - Add saved address (Protected)
router.post('/addresses', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = AddressSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: getErrorMessage(parseResult.error)
      });
    }

    const saved = await userRepository.addAddress(req.user!.id, parseResult.data);
    res.status(201).json({
      success: true,
      message: 'Alamat berhasil disimpan',
      data: {
        id: saved.id,
        recipientName: saved.recipient_name,
        phone: saved.phone,
        province: saved.province,
        city: saved.city,
        subdistrict: saved.subdistrict,
        village: saved.village,
        postalCode: saved.postal_code,
        fullAddress: saved.full_address,
        notes: saved.notes,
        isDefault: saved.is_default
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal menyimpan alamat' });
  }
});

export default router;
