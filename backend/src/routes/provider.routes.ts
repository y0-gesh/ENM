import { Router } from 'express';
import {
  getNearbyProviders,
  getProviderById,
  updateOwnProfile,
  toggleAvailability,
  getOwnProfile,
  nearbySchema,
  updateProfileSchema,
  toggleAvailabilitySchema
} from '../controllers/provider.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Provider only routes (placed before dynamic ID search to avoid conflict)
router.get('/me', authenticateJWT, requireRole('PROVIDER'), getOwnProfile);

// Protected routes (requires auth)
router.get('/nearby', authenticateJWT, validateRequest(nearbySchema), getNearbyProviders);

// Public routes
router.get('/:id', getProviderById);

// Provider updates
router.put('/me', authenticateJWT, requireRole('PROVIDER'), validateRequest(updateProfileSchema), updateOwnProfile);
router.patch('/me/availability', authenticateJWT, requireRole('PROVIDER'), validateRequest(toggleAvailabilitySchema), toggleAvailability);

export default router;
