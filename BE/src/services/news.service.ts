import axios from 'axios';

/**
 * News article interface
 */
export interface NewsArticle {
  title: string;
  description: string;
  image: string;
  source: string;
  publishedAt: string;
  url: string;
}

/**
 * GNews API response interface
 */
interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
}

interface GNewsResponse {
  totalArticles: number;
  articles: GNewsArticle[];
}

class NewsService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://gnews.io/api/v4';

  constructor() {
    this.apiKey = process.env.GNEWS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('GNEWS_API_KEY is not set in environment variables');
    }
  }

  /**
   * Fetch agriculture-related news from GNews API
   * @param maxResults Maximum number of articles to fetch (default: 10)
   * @returns Array of normalized news articles
   */
  async fetchAgricultureNews(maxResults: number = 10): Promise<NewsArticle[]> {
    try {
      // Validate API key
      if (!this.apiKey) {
        throw new Error('GNews API key is not configured');
      }

      // Build search query for agriculture-related news (max 200 chars)
      const query = 'organic';
      
      // Make request to GNews API
      const response = await axios.get<GNewsResponse>(`${this.baseUrl}/search`, {
        params: {
          q: query,
          lang: 'en',
          max: maxResults,
          apikey: this.apiKey,
        },
        timeout: 60000, // 60 second timeout
      });

      // Normalize and return articles
      return this.normalizeArticles(response.data.articles);
    } catch (error: any) {
      console.error('Error fetching agriculture news:', error.message);
      
      // Log detailed error for debugging
      if (error.response) {
        console.error('GNews API Response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error('No response received from GNews API');
        console.error('Request config:', {
          url: error.config?.url,
          method: error.config?.method,
          params: error.config?.params
        });
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      // Handle specific error cases
      if (error.response) {
        // GNews API returned an error
        const status = error.response.status;
        const errorData = error.response.data?.errors;
        const message = errorData 
          ? Object.values(errorData)[0] as string
          : error.response.data?.message || 'Failed to fetch news';
        
        if (status === 401 || status === 403) {
          throw new Error('Invalid or expired GNews API key');
        } else if (status === 429) {
          throw new Error('GNews API rate limit exceeded. Please try again later');
        } else {
          throw new Error(`GNews API error: ${message}`);
        }
      } else if (error.request) {
        // Request was made but no response received
        throw new Error('Unable to reach GNews API. The API may be slow or unavailable');
      } else {
        // Something else happened
        throw new Error(error.message || 'Failed to fetch agriculture news');
      }
    }
  }

  /**
   * Normalize GNews articles to our standard format
   * @param articles Raw articles from GNews API
   * @returns Normalized articles
   */
  private normalizeArticles(articles: GNewsArticle[]): NewsArticle[] {
    return articles.map((article) => ({
      title: article.title || 'No title',
      description: article.description || article.content?.substring(0, 200) || 'No description available',
      image: article.image || 'https://via.placeholder.com/400x200?text=No+Image',
      source: article.source?.name || 'Unknown source',
      publishedAt: article.publishedAt || new Date().toISOString(),
      url: article.url || '#',
    }));
  }
}

export default new NewsService();
