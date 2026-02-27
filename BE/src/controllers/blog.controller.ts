import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { blogService } from '../services/blog.service';

class BlogController {
  // POST /api/blogs
  async createPost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { content, images, tags } = req.body;
      const post = await blogService.createPost(req.user!.id, { content, images, tags });
      res.status(201).json({ success: true, data: post });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/blogs/tags
  async getTags(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tags = await blogService.getTags();
      res.json({ success: true, data: tags });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/blogs?page=1&limit=10&tag=organic
  async getFeed(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const tag = req.query.tag as string | undefined;
      const result = await blogService.getFeed(page, limit, tag);
      res.json({ success: true, data: result.posts, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/blogs/:id
  async getPost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const post = await blogService.getPostById(req.params.id);
      res.json({ success: true, data: post });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/blogs/user/:userId
  async getUserPosts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await blogService.getPostsByUser(req.params.userId, page, limit);
      res.json({ success: true, data: result.posts, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/blogs/:id
  async updatePost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { content, images, tags } = req.body;
      const post = await blogService.updatePost(req.params.id, req.user!.id, { content, images, tags });
      res.json({ success: true, data: post });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/blogs/:id
  async deletePost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const isAdmin = req.user!.role === 'admin';
      await blogService.deletePost(req.params.id, req.user!.id, isAdmin);
      res.json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/blogs/:id/like
  async toggleLike(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await blogService.toggleLike(req.params.id, req.user!.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/blogs/:id/comments
  async addComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { content } = req.body;
      const post = await blogService.addComment(req.params.id, req.user!.id, content);
      res.json({ success: true, data: post });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/blogs/:id/comments/:commentId
  async deleteComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const isAdmin = req.user!.role === 'admin';
      const post = await blogService.deleteComment(req.params.id, req.params.commentId, req.user!.id, isAdmin);
      res.json({ success: true, data: post });
    } catch (error) {
      next(error);
    }
  }
}

export const blogController = new BlogController();
