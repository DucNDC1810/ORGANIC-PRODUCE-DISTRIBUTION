import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import passport from 'passport';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import { configurePassport } from './config/passport';

const app: Application = express();

// Configure passport
configurePassport();

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
// app.use('/api/products', productRoutes);

// Error handler
app.use(errorHandler);

export default app;
