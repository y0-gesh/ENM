import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../prisma/client';
import { findNearbyProviders } from '../services/haversine.service';
import { updateProviderScoreAndStats } from '../services/scoring.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// Validation schemas
export const nearbySchema = z.object({
  query: z.object({
    lat: z.string().refine((val) => !isNaN(parseFloat(val)), { message: 'lat must be a numeric string' }).transform(parseFloat),
    lng: z.string().refine((val) => !isNaN(parseFloat(val)), { message: 'lng must be a numeric string' }).transform(parseFloat),
    radius: z.string().optional().refine((val) => !val || !isNaN(parseFloat(val)), { message: 'radius must be a numeric string' }).transform((val) => val ? parseFloat(val) : undefined)
  })
});

export const updateProfileSchema = z.object({
  body: z.object({
    bio: z.string().min(10, 'Bio must be at least 10 characters long'),
    serviceCategory: z.string().min(2, 'Service category must be at least 2 characters long'),
    serviceRadius: z.number().positive('Service radius must be a positive number'),
    latitude: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
    longitude: z.number().min(-180).max(180, 'Longitude must be between -180 and 180')
  })
});

export const toggleAvailabilitySchema = z.object({
  body: z.object({
    isAvailable: z.boolean()
  })
});

export async function getNearbyProviders(req: Request, res: Response, next: NextFunction) {
  try {
    const { lat, lng, radius } = req.query as any;

    const providers = await findNearbyProviders(lat, lng, radius || 10);

    return res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    next(error);
  }
}

export async function getProviderById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const provider = await prisma.providerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found',
        code: 'PROVIDER_NOT_FOUND'
      });
    }

    return res.json({
      success: true,
      data: provider
    });
  } catch (error) {
    next(error);
  }
}

export async function updateOwnProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const { bio, serviceCategory, serviceRadius, latitude, longitude } = req.body;

    const profile = await prisma.providerProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found',
        code: 'PROVIDER_NOT_FOUND'
      });
    }

    const updatedProfile = await prisma.providerProfile.update({
      where: { userId },
      data: {
        bio,
        serviceCategory,
        serviceRadius,
        latitude,
        longitude
      }
    });

    // Recompute score dynamically (in case rating count changes, although scoring stats are base-calculated)
    await updateProviderScoreAndStats(updatedProfile.id);

    return res.json({
      success: true,
      data: updatedProfile
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleAvailability(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const { isAvailable } = req.body;

    const profile = await prisma.providerProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found',
        code: 'PROVIDER_NOT_FOUND'
      });
    }

    const updatedProfile = await prisma.providerProfile.update({
      where: { userId },
      data: { isAvailable }
    });

    return res.json({
      success: true,
      data: updatedProfile
    });
  } catch (error) {
    next(error);
  }
}

export async function getOwnProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;

    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found',
        code: 'PROVIDER_NOT_FOUND'
      });
    }

    return res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
}
