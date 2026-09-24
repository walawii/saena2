import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { userRepository, UserRecord } from '../repositories/postgres/userRepository.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF';
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function getJwtSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET environment variable is missing in production');
    }
    return 'development_fallback_secret_must_change_in_production_32bytes';
  }
  return secret;
}

export function signAuthToken(payload: { id: string; email: string; role: string; name: string }): string {
  return jwt.sign(
    {
      sub: payload.id,
      email: payload.email,
      role: payload.role,
      name: payload.name
    },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
}

export function verifyAuthToken(token: string): any {
  return jwt.verify(token, getJwtSecret());
}

/**
 * Middleware: Requires any valid authenticated user
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak: Token autentikasi tidak ditemukan.'
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = verifyAuthToken(token);
    } catch (jwtErr: any) {
      return res.status(401).json({
        success: false,
        message: 'Sesi telah berakhir atau token tidak valid. Silakan login kembali.'
      });
    }

    const user = await userRepository.findById(decoded.sub);
    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'Akun tidak aktif atau tidak ditemukan.'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role
    };

    next();
  } catch (err: any) {
    console.error('[AuthMiddleware] Error:', err.message);
    res.status(500).json({ success: false, message: 'Gagal memverifikasi autentikasi.' });
  }
}

/**
 * Middleware: Requires Administrator role strictly verified from database
 */
export async function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  await requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Endpoint ini hanya dapat diakses oleh Administrator Saena.id.'
      });
    }
    next();
  });
}

/**
 * Middleware: Optional authentication (attaches user if valid token present, otherwise guest)
 */
export async function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded: any = verifyAuthToken(token);
        const user = await userRepository.findById(decoded.sub);
        if (user && user.status === 'ACTIVE') {
          req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role
          };
        }
      } catch (e) {
        // Token expired/invalid, continue as unauthenticated guest
      }
    }
    next();
  } catch (err) {
    next();
  }
}

