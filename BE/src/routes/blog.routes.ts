import { Router } from 'express';
import { blogController } from '../controllers/blog.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Public routes (specific paths BEFORE :id param)
router.get('/', blogController.getFeed as any);
router.get('/tags', blogController.getTags as any);
router.get('/user/:userId', blogController.getUserPosts as any);
router.get('/:id', blogController.getPost as any);

// Protected routes (require login)
router.post('/', authenticate as any, blogController.createPost as any);
router.put('/:id', authenticate as any, blogController.updatePost as any);
router.delete('/:id', authenticate as any, blogController.deletePost as any);
router.post('/:id/like', authenticate as any, blogController.toggleLike as any);
router.post('/:id/comments', authenticate as any, blogController.addComment as any);
router.delete('/:id/comments/:commentId', authenticate as any, blogController.deleteComment as any);

export default router;
