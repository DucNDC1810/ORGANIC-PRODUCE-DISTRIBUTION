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
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import momoRoutes from './routes/momo.routes';
import subscriptionRoutes from './routes/subscription.routes';
import voucherRoutes from './routes/voucher.routes';
import newsRoutes from './routes/news.routes';
import chatRoutes from './routes/chat.routes';
import blogRoutes from './routes/blog.routes';
import groupRoutes from './routes/group.routes';
import walletRoutes from './routes/wallet.routes';
import notificationRoutes from './routes/notification.routes';
import dashboardRoutes from './routes/dashboard.routes';
import shipperRoutes from './routes/shipper.routes';
// import exampleRoutes from './routes/example.routes'; // Uncomment để test
import { configurePassport } from './config/passport';
// Register models that are referenced via populate but may not be auto-imported
import './models/Address.model';

const app: Application = express();

// Configure passport
configurePassport();

// Middlewares
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: corsOrigins,
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
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/momo', momoRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/shipper', shipperRoutes);
// app.use('/api/example', exampleRoutes); // Uncomment để test authentication

// 404 Handler - Must be after all routes
app.use(notFoundHandler);

// Error handler - Must be last
app.use(errorHandler);

export default app;
