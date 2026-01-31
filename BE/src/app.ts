import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import passport from 'passport';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import cartRoutes from './routes/cart.routes';
import reviewRoutes from './routes/review.routes';
// import exampleRoutes from './routes/example.routes'; // Uncomment để test
import { configurePassport } from './config/passport';

const app: Application = express();

// Configure passport
configurePassport();

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
// Increase payload limit for base64 images 
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(passport.initialize());

// Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/reviews', reviewRoutes);
// app.use('/api/example', exampleRoutes); // Uncomment để test authentication

// 404 Handler - Must be after all routes
app.use(notFoundHandler);

// Error handler - Must be last
app.use(errorHandler);

export default app;
