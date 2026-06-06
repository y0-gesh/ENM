import { Router } from 'express';
import {
  createBooking,
  getBookings,
  updateBookingStatus,
  createBookingSchema,
  updateBookingStatusSchema
} from '../controllers/booking.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.post('/', requireRole('USER'), validateRequest(createBookingSchema), createBooking);
router.get('/', getBookings);
router.patch('/:id/status', validateRequest(updateBookingStatusSchema), updateBookingStatus);

export default router;
