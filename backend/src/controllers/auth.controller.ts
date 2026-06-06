import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../prisma/client';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../services/token.service';

// Zod schemas for input validation
export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    role: z.enum(['USER', 'PROVIDER']),
    // Provider specific fields
    bio: z.string().optional(),
    serviceCategory: z.string().optional(),
    serviceRadius: z.number().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional()
  }).refine((data) => {
    if (data.role === 'PROVIDER') {
      return (
        data.bio !== undefined &&
        data.serviceCategory !== undefined &&
        data.serviceRadius !== undefined &&
        data.latitude !== undefined &&
        data.longitude !== undefined
      );
    }
    return true;
  }, {
    message: 'Provider profiles require bio, serviceCategory, serviceRadius, latitude, and longitude',
    path: ['bio']
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  })
});

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password, role, bio, serviceCategory, serviceRadius, latitude, longitude } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email address already registered',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user and profile in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role
        }
      });

      if (role === 'PROVIDER') {
        await tx.providerProfile.create({
          data: {
            userId: newUser.id,
            bio: bio!,
            serviceCategory: serviceCategory!,
            serviceRadius: serviceRadius!,
            latitude: latitude!,
            longitude: longitude!
          }
        });
      }

      return newUser;
    });

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role, name: user.name });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role, name: user.name });

    // Store refresh token in DB
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(201).json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role, name: user.name });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role, name: user.name });

    // Save refresh token on user
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    // Read from cookies or request body
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required',
        code: 'REFRESH_TOKEN_REQUIRED'
      });
    }

    // Verify refresh token signature
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Check if user still exists and has this refresh token active
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({
        success: false,
        message: 'Session has been invalidated or expired',
        code: 'SESSION_INVALIDATED'
      });
    }

    // Issue new access token
    const newAccessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role, name: user.name });

    return res.json({
      success: true,
      data: {
        accessToken: newAccessToken
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    // If auth middleware successfully parsed the user
    const userId = (req as any).user?.userId;

    if (userId) {
      // Invalidate refresh token in DB
      await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null }
      });
    }

    // Clear HTTP-only cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
}
