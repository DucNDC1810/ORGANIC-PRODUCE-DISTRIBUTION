import { Request, Response } from 'express';
import newsService from '../services/news.service';

/**
 * News Controller
 * Handles news-related API endpoints
 */
class NewsController {
  /**
   * Get agriculture-related news
   * @route GET /api/news/agriculture
   * @access Public
   */
  async getAgricultureNews(req: Request, res: Response): Promise<void> {
    try {
      // Get optional max results from query params (default: 10)
      const maxResults = parseInt(req.query.max as string) || 10;

      // Validate max results
      if (maxResults < 1 || maxResults > 100) {
        res.status(400).json({
          success: false,
          message: 'Max results must be between 1 and 100',
        });
        return;
      }

      // Fetch news from service
      const news = await newsService.fetchAgricultureNews(maxResults);

      // Return successful response
      res.status(200).json({
        success: true,
        count: news.length,
        data: news,
      });
    } catch (error: any) {
      console.error('Error in getAgricultureNews:', error.message);

      // Return error response
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch agriculture news',
      });
    }
  }
}

export default new NewsController();
