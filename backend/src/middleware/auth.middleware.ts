import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../services/token.service';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Validates the Authorization header JWT Bearer token and attaches user to the request.
 */
export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access token missing or invalid format (Bearer token required)',
      code: 'UNAUTHORIZED'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired access token',
      code: 'UNAUTHORIZED_TOKEN'
    });
  }
}

/**
 * Validates that the authenticated user possesses the required role.
 */
export function requireRole(role: 'USER' | 'PROVIDER') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Access denied: requires ${role} role`,
        code: 'FORBIDDEN'
      });
    }

    next();
  };
}
