import { Router } from 'express';
import newsController from '../controllers/news.controller';

const router = Router();

/**
 * @route   GET /api/news/agriculture
 * @desc    Get agriculture-related news from GNews API
 * @access  Public
 * @query   max - Optional: Maximum number of articles (1-100, default: 10)
 * @returns Array of news articles with title, description, image, source, publishedAt, url
 */
router.get('/agriculture', newsController.getAgricultureNews);

export default router;
