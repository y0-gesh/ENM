import prisma from '../prisma/client';

export interface NearbyProviderResult {
  id: string;
  userId: string;
  bio: string;
  serviceCategory: string;
  serviceRadius: number;
  latitude: number;
  longitude: number;
  avgRating: number;
  completedJobs: number;
  score: number;
  isAvailable: boolean;
  createdAt: Date;
  distance: number;
  name: string;
  email: string;
}

export async function findNearbyProviders(
  lat: number,
  lng: number,
  radiusKm: number = 10
): Promise<NearbyProviderResult[]> {
  // Use raw query for PostgreSQL geo distance math
  // Distance = 6371 * acos(...)
  const queryResults = await prisma.$queryRaw<any[]>`
    SELECT 
      p.*,
      u.name,
      u.email,
      (6371 * acos(
        LEAST(1.0, GREATEST(-1.0, 
          cos(radians(${lat})) * cos(radians(p.latitude)) *
          cos(radians(p.longitude) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(p.latitude))
        ))
      )) AS distance
    FROM "ProviderProfile" p
    INNER JOIN "User" u ON p."userId" = u.id
    WHERE p."isAvailable" = true
  `;

  // Filter by service radius (or custom user search radius) and calculate composite scores
  const mapped = queryResults
    .map((p) => {
      const distance = Number(p.distance);
      // Ensure distance is within both the search radius AND the provider's own service radius
      const maxRadius = Math.min(radiusKm, p.serviceRadius);
      
      return {
        ...p,
        distance,
        maxRadius
      };
    })
    .filter((p) => p.distance <= p.maxRadius)
    .map((p) => {
      // score = (avgRating * 0.5) + (log10(completedJobs + 1) * 0.3) + (proximityScore * 0.2)
      // proximityScore is normalized inverse distance (closer = higher)
      const proximityScore = p.maxRadius > 0 ? Math.max(0, 1 - p.distance / p.maxRadius) : 0;
      const logJobs = Math.log10(p.completedJobs + 1);
      const compositeScore = (p.avgRating * 0.5) + (logJobs * 0.3) + (proximityScore * 0.2);

      return {
        id: p.id,
        userId: p.userId,
        bio: p.bio,
        serviceCategory: p.serviceCategory,
        serviceRadius: p.serviceRadius,
        latitude: p.latitude,
        longitude: p.longitude,
        avgRating: p.avgRating,
        completedJobs: p.completedJobs,
        isAvailable: p.isAvailable,
        createdAt: p.createdAt,
        distance: Number(p.distance.toFixed(2)),
        name: p.name,
        email: p.email,
        score: Number(compositeScore.toFixed(3)),
      };
    });

  // Sort by composite score descending
  return mapped.sort((a, b) => b.score - a.score);
}
