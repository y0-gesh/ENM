import { Request, Response, NextFunction } from 'express';

/**
 * Catches all thrown errors, logs them to console, and sends a consistent error envelope.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error context
  console.error(`[Error] path: ${req.path}, method: ${req.method} =>`, err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'An unexpected error occurred';
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  res.status(statusCode).json({
    success: false,
    message,
    code,
  });
}
