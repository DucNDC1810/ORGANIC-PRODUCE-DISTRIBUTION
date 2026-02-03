import { Router } from 'express';
import newsController from '../controllers/news.controller';

const router = Router();


router.get('/agriculture', newsController.getAgricultureNews);

export default router;
