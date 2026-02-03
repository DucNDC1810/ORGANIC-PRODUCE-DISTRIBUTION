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
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching agriculture news:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch news');
  }
};

export const newsService = {
  fetchAgricultureNews,
};

export default newsService;
