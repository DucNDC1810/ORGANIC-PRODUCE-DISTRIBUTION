import api from './api';

export interface NewsArticle {
  title: string;
  description: string;
  image: string;
  source: string;
  publishedAt: string;
  url: string;
}

interface NewsResponse {
  success: boolean;
  count: number;
  data: NewsArticle[];
}

/**
 * Fetch agriculture-related news
 */
export const fetchAgricultureNews = async (maxResults: number = 10): Promise<NewsArticle[]> => {
  try {
    const response = await api.get<NewsResponse>(`/news/agriculture?max=${maxResults}`);
    
    // Check if response itself has the structure (due to axios interceptor)
    if ((response as any).success && Array.isArray(response.data)) {
      return response.data as NewsArticle[];
    }
    
    // Standard axios response structure
    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    // Return empty array if unexpected response format
    return [];
  } catch (error: any) {
    console.error('Error fetching agriculture news:', error);
    
    // Return empty array instead of throwing to avoid breaking the UI
    return [];
  }
};

export const newsService = {
  fetchAgricultureNews,
};

export default newsService;
