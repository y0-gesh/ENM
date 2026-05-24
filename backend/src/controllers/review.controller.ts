import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../prisma/client';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { updateProviderScoreAndStats } from '../services/scoring.service';

// Validation schemas
export const createReviewSchema = z.object({
  body: z.object({
    bookingId: z.string().uuid('Invalid booking ID format'),
    rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
    comment: z.string().max(1000, 'Comment cannot exceed 1000 characters').optional()
  })
});

export async function createReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const { bookingId, rating, comment } = req.body;

    // Fetch the booking to verify conditions
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        review: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
        code: 'BOOKING_NOT_FOUND'
      });
    }

    // Verify user owns the booking
    if (booking.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to review this booking',
        code: 'FORBIDDEN'
      });
    }

    // Verify status is COMPLETED
    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Reviews can only be submitted for completed bookings',
        code: 'BOOKING_NOT_COMPLETED'
      });
    }

    // Verify review does not already exist
    if (booking.review) {
      return res.status(400).json({
        success: false,
        message: 'A review has already been submitted for this booking',
        code: 'REVIEW_ALREADY_EXISTS'
      });
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        bookingId,
        reviewerId: userId!,
        providerId: booking.providerId,
        rating,
        comment
      }
    });

    // Update the provider's avgRating and score
    await updateProviderScoreAndStats(booking.providerId);

    return res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
}

export async function getReviewsForProvider(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    // Verify provider exists
    const provider = await prisma.providerProfile.findUnique({ where: { id } });
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found',
        code: 'PROVIDER_NOT_FOUND'
      });
    }

    const reviews = await prisma.review.findMany({
      where: { providerId: id },
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
    });

    return res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
}
