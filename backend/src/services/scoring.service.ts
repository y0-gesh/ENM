import prisma from '../prisma/client';

/**
 * Recomputes and updates the denormalized avgRating, completedJobs,
 * and base score for a provider profile inside the database.
 * 
 * Formula: baseScore = (avgRating * 0.5) + (log10(completedJobs + 1) * 0.3)
 */
export async function updateProviderScoreAndStats(providerId: string): Promise<void> {
  // 1. Get total count of completed jobs
  const completedJobs = await prisma.booking.count({
    where: {
      providerId,
      status: 'COMPLETED'
    }
  });

  // 2. Calculate average rating of all reviews
  const reviewsAggregate = await prisma.review.aggregate({
    where: {
      providerId
    },
    _avg: {
      rating: true
    }
  });

  const avgRating = reviewsAggregate._avg.rating || 0;

  // 3. Calculate base score
  const logJobs = Math.log10(completedJobs + 1);
  const baseScore = (avgRating * 0.5) + (logJobs * 0.3);

  // 4. Update provider profile
  await prisma.providerProfile.update({
    where: { id: providerId },
    data: {
      avgRating: Number(avgRating.toFixed(2)),
      completedJobs,
      score: Number(baseScore.toFixed(3))
    }
  });
}
