import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-access-secret-for-dev-only-change-in-prod';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-for-dev-only-change-in-prod';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'USER' | 'PROVIDER';
  name: string;
}

/**
 * Generates an Access Token valid for 15 minutes.
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(
    { userId: payload.userId, email: payload.email, role: payload.role, name: payload.name },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

/**
 * Generates a Refresh Token valid for 7 days.
 */
export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(
    { userId: payload.userId, email: payload.email, role: payload.role, name: payload.name },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verifies and returns the payload from an Access Token.
 */
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

/**
 * Verifies and returns the payload from a Refresh Token.
 */
export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
}
