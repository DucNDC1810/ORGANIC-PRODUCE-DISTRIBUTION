import express from 'express';
import reviewController from '../controllers/review.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

// Routes cho reviews của user
router.get('/my', authenticate as any, reviewController.getMyReviews as any);

// Routes cho specific review
router.put('/:reviewId', authenticate as any, reviewController.updateReview as any);
router.delete('/:reviewId', authenticate as any, reviewController.deleteReview as any);
router.post('/:reviewId/helpful', reviewController.markHelpful as any);

export default router;
