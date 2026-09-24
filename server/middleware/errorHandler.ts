import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Sanitize message to prevent leaking database connection strings or secrets
  const rawMessage = err?.message || 'Terjadi kesalahan sistem';
  let sanitizedMessage = rawMessage;

  // Mask database credentials or secrets if accidentally leaked into error message
  if (sanitizedMessage.includes('password') || sanitizedMessage.includes('postgres://') || sanitizedMessage.includes('postgresql://')) {
    sanitizedMessage = 'Terjadi kesalahan internal pada basis data.';
  }

  // Internal log for server debugging
  console.error(`[Unhandled Error] ${req.method} ${req.url}:`, {
    errorName: err?.name,
    message: rawMessage,
    status: err?.status || err?.statusCode || 500,
    timestamp: new Date().toISOString()
  });

  const statusCode = Number(err?.status || err?.statusCode || 500);

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'Terjadi kendala pada server. Tim teknis Saena.id sedang menanganinya.'
      : sanitizedMessage,
    code: err?.code || 'INTERNAL_ERROR'
  });
}
