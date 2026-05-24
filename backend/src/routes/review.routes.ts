import { Router } from 'express';
import {
  createReview,
  getReviewsForProvider,
  createReviewSchema
} from '../controllers/review.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Public route to view reviews
router.get('/provider/:id', getReviewsForProvider);

// Protected route to leave a review
router.post('/', authenticateJWT, requireRole('USER'), validateRequest(createReviewSchema), createReview);

export default router;
