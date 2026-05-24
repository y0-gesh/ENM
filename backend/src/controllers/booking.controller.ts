import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../prisma/client';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { updateProviderScoreAndStats } from '../services/scoring.service';

// Validation schemas
export const createBookingSchema = z.object({
  body: z.object({
    providerId: z.string().uuid('Invalid provider ID format'),
    scheduledAt: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid schedule date' }).transform((val) => new Date(val)),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
  })
});

export const updateBookingStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED'])
  })
});

export async function createBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const { providerId, scheduledAt, notes } = req.body;

    // Verify provider profile exists
    const provider = await prisma.providerProfile.findUnique({ where: { id: providerId } });
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Service provider not found',
        code: 'PROVIDER_NOT_FOUND'
      });
    }

    if (!provider.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Provider is not currently accepting bookings',
        code: 'PROVIDER_UNAVAILABLE'
      });
    }

    const booking = await prisma.booking.create({
      data: {
        userId: userId!,
        providerId,
        scheduledAt,
        notes,
        status: 'PENDING'
      },
      include: {
        provider: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
}

export async function getBookings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    let bookings;

    if (role === 'PROVIDER') {
      // Find provider profile corresponding to user
      const provider = await prisma.providerProfile.findUnique({ where: { userId } });
      if (!provider) {
        return res.status(404).json({
          success: false,
          message: 'Provider profile not found',
          code: 'PROVIDER_NOT_FOUND'
        });
      }

      bookings = await prisma.booking.findMany({
        where: { providerId: provider.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          review: true
        },
        orderBy: { scheduledAt: 'desc' }
      });
    } else {
      // User bookings
      bookings = await prisma.booking.findMany({
        where: { userId: userId! },
        include: {
          provider: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          },
          review: true
        },
        orderBy: { scheduledAt: 'desc' }
      });
    }

    return res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
}

export async function updateBookingStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId;
    const role = req.user?.role;

    // Fetch the booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        provider: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
        code: 'BOOKING_NOT_FOUND'
      });
    }

    // Authorization checks
    if (role === 'PROVIDER') {
      // Must be the provider for this booking
      if (booking.provider.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to modify this booking',
          code: 'FORBIDDEN'
        });
      }
      // Providers can change to ACCEPTED, COMPLETED, CANCELLED
    } else {
      // Must be the user who made the booking
      if (booking.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to modify this booking',
          code: 'FORBIDDEN'
        });
      }
      // Users can only change to CANCELLED
      if (status !== 'CANCELLED') {
        return res.status(400).json({
          success: false,
          message: 'Clients are only permitted to cancel bookings',
          code: 'BAD_REQUEST'
        });
      }
    }

    // Check transition rules (e.g. can't modify cancelled/completed bookings)
    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update status of a cancelled or completed booking',
        code: 'INVALID_TRANSITION'
      });
    }

    const updateData: any = { status };
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData
    });

    // If status is now COMPLETED, update the provider's scoring parameters
    if (status === 'COMPLETED') {
      await updateProviderScoreAndStats(booking.providerId);
    }

    return res.json({
      success: true,
      data: updatedBooking
    });
  } catch (error) {
    next(error);
  }
}
