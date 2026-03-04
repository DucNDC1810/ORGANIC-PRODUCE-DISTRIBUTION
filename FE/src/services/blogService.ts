import api from './api';

export interface BlogAuthor {
  _id: string;
  name: string;
  avatar?: string;
  email: string;
}

export interface BlogComment {
  _id: string;
  user: BlogAuthor;
  content: string;
  createdAt: string;
}

export interface BlogPost {
  _id: string;
  author: BlogAuthor;
  content: string;
  images: string[];
  tags: string[];
  likes: string[];
  comments: BlogComment[];
  likeCount: number;
  commentCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// NOTE: Axios interceptor auto-unwraps response.data, so `res` is already the API body.

const blogService = {
  async getTags(): Promise<string[]> {
    const res: any = await api.get('/blogs/tags');
    return res.data || [];
  },

  async getFeed(page: number = 1, limit: number = 10, tag?: string): Promise<{ posts: BlogPost[]; pagination: BlogPagination }> {
    const params: any = { page, limit };
    if (tag) params.tag = tag;
    const res: any = await api.get('/blogs', { params });
    return { posts: res.data || [], pagination: res.pagination };
  },

  async getPost(id: string): Promise<BlogPost> {
    const res: any = await api.get(`/blogs/${id}`);
    return res.data;
  },

  async getUserPosts(userId: string, page: number = 1, limit: number = 10): Promise<{ posts: BlogPost[]; pagination: BlogPagination }> {
    const res: any = await api.get(`/blogs/user/${userId}`, { params: { page, limit } });
    return { posts: res.data || [], pagination: res.pagination };
  },

  async createPost(data: { content: string; images?: string[]; tags?: string[] }): Promise<BlogPost> {
    const res: any = await api.post('/blogs', data);
    return res.data;
  },

  async updatePost(id: string, data: { content?: string; images?: string[]; tags?: string[] }): Promise<BlogPost> {
    const res: any = await api.put(`/blogs/${id}`, data);
    return res.data;
  },

  async deletePost(id: string): Promise<void> {
    await api.delete(`/blogs/${id}`);
  },

  async toggleLike(id: string): Promise<{ liked: boolean; likeCount: number }> {
    const res: any = await api.post(`/blogs/${id}/like`);
    return res.data;
  },

  async addComment(id: string, content: string): Promise<BlogPost> {
    const res: any = await api.post(`/blogs/${id}/comments`, { content });
    return res.data;
  },

  async deleteComment(postId: string, commentId: string): Promise<BlogPost> {
    const res: any = await api.delete(`/blogs/${postId}/comments/${commentId}`);
    return res.data;
  },
};

export default blogService;
