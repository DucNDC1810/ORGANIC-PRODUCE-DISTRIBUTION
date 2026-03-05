import { Blog, IBlog } from '../models/Blog.model';
import { AppError } from '../utils/AppError';

class BlogService {
  // Create a new blog post
  async createPost(authorId: string, data: { content: string; images?: string[]; tags?: string[] }): Promise<IBlog> {
    const blog = await Blog.create({
      author: authorId,
      content: data.content,
      images: data.images || [],
      tags: data.tags || [],
    });

    return blog.populate('author', 'name avatar email');
  }

  // Get all unique tags from active posts
  async getTags(): Promise<string[]> {
    const tags = await Blog.distinct('tags', {
      isActive: true,
      $or: [{ status: 'approved' }, { status: { $exists: false } }],
    });
    return tags.filter(Boolean).sort();
  }

  // Get paginated blog feed
  async getFeed(page: number = 1, limit: number = 10, tag?: string) {
    const query: any = {
      isActive: true,
      $or: [{ status: 'approved' }, { status: { $exists: false } }],
    };
    if (tag) {
      query.tags = tag;
    }

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Blog.find(query)
        .populate('author', 'name avatar email')
        .populate('comments.user', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(query),
    ]);

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get single post
  async getPostById(postId: string): Promise<IBlog> {
    const post = await Blog.findById(postId)
      .populate('author', 'name avatar email')
      .populate('comments.user', 'name avatar');

    if (!post) {
      throw new AppError('Post not found', 404);
    }
    return post;
  }

  // Get posts by a specific user
  async getPostsByUser(userId: string, page: number = 1, limit: number = 10) {
    const query: any = { author: userId, isActive: true };
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Blog.find(query)
        .populate('author', 'name avatar email')
        .populate('comments.user', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(query),
    ]);

    return {
      posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  // Update a post (only author)
  async updatePost(postId: string, userId: string, data: { content?: string; images?: string[]; tags?: string[] }): Promise<IBlog> {
    const post = await Blog.findById(postId);
    if (!post) {
      throw new AppError('Post not found', 404);
    }
    if (post.author.toString() !== userId) {
      throw new AppError('You can only edit your own posts', 403);
    }

    if (data.content !== undefined) post.content = data.content;
    if (data.images !== undefined) post.images = data.images;
    if (data.tags !== undefined) post.tags = data.tags;

    await post.save();
    return post.populate('author', 'name avatar email');
  }

  // Delete a post (only author or admin)
  async deletePost(postId: string, userId: string, isAdmin: boolean = false): Promise<void> {
    const post = await Blog.findById(postId);
    if (!post) {
      throw new AppError('Post not found', 404);
    }
    if (post.author.toString() !== userId && !isAdmin) {
      throw new AppError('You can only delete your own posts', 403);
    }

    post.isActive = false;
    await post.save();
  }

  // Toggle like on a post
  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    const post = await Blog.findById(postId);
    if (!post) {
      throw new AppError('Post not found', 404);
    }

    const userIndex = post.likes.findIndex((id) => id.toString() === userId);
    let liked: boolean;

    if (userIndex > -1) {
      post.likes.splice(userIndex, 1);
      liked = false;
    } else {
      post.likes.push(userId as any);
      liked = true;
    }

    await post.save();
    return { liked, likeCount: post.likes.length };
  }

  // Add comment to a post
  async addComment(postId: string, userId: string, content: string): Promise<IBlog> {
    const post = await Blog.findById(postId);
    if (!post) {
      throw new AppError('Post not found', 404);
    }

    post.comments.push({ user: userId as any, content, createdAt: new Date() });
    await post.save();

    return post.populate([
      { path: 'author', select: 'name avatar email' },
      { path: 'comments.user', select: 'name avatar' },
    ]);
  }

  // Delete comment (only comment author or post author or admin)
  async deleteComment(postId: string, commentId: string, userId: string, isAdmin: boolean = false): Promise<IBlog> {
    const post = await Blog.findById(postId);
    if (!post) {
      throw new AppError('Post not found', 404);
    }

    const comment = post.comments.find((c: any) => c._id.toString() === commentId);
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    const isCommentAuthor = comment.user.toString() === userId;
    const isPostAuthor = post.author.toString() === userId;

    if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
      throw new AppError('Not authorized to delete this comment', 403);
    }

    post.comments = post.comments.filter((c: any) => c._id.toString() !== commentId);
    await post.save();

    return post.populate([
      { path: 'author', select: 'name avatar email' },
      { path: 'comments.user', select: 'name avatar' },
    ]);
  }

  // ===== ADMIN METHODS =====

  // Get all blogs for admin (with pagination and optional status filter)
  async getAllBlogsAdmin(page: number = 1, limit: number = 10, status?: string) {
    // Legacy posts (no `status` field) were already live → treat as 'approved'
    const legacyOrApproved = { $or: [{ status: 'approved' }, { status: { $exists: false } }] };

    let query: any = { isActive: true };
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      if (status === 'approved') {
        query = { isActive: true, ...legacyOrApproved };
      } else {
        query = { isActive: true, status };
      }
    }

    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      Blog.find(query)
        .populate('author', 'name avatar email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(query),
    ]);

    const pending = await Blog.countDocuments({ isActive: true, status: 'pending' });
    const approved = await Blog.countDocuments({ isActive: true, ...legacyOrApproved });
    const rejected = await Blog.countDocuments({ isActive: true, status: 'rejected' });

    return {
      posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      counts: { pending, approved, rejected },
    };
  }

  // Approve a blog post
  async approveBlog(postId: string): Promise<IBlog> {
    const post = await Blog.findById(postId);
    if (!post) throw new AppError('Post not found', 404);
    post.status = 'approved';
    post.rejectedReason = undefined;
    await post.save();
    return post.populate('author', 'name avatar email');
  }

  // Reject a blog post
  async rejectBlog(postId: string, reason?: string): Promise<IBlog> {
    const post = await Blog.findById(postId);
    if (!post) throw new AppError('Post not found', 404);
    post.status = 'rejected';
    if (reason) post.rejectedReason = reason;
    await post.save();
    return post.populate('author', 'name avatar email');
  }
}

export const blogService = new BlogService();
