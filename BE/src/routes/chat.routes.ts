import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';

const router = Router();
const chatController = new ChatController();

// POST /api/chat — public endpoint
router.post('/', chatController.chat as any);

export default router;
