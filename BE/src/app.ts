import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler';

const app: Application = express();

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Import routes here
// app.use('/api/users', userRoutes);
// app.use('/api/products', productRoutes);

// Error handler
app.use(errorHandler);

export default app;
