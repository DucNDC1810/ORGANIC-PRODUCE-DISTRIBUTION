/**
 * Migration Script: Reset Product Ratings
 * 
 * Script này sẽ:
 * 1. Reset tất cả rating và reviewCount của products về 0
 * 2. Xóa bỏ các hardcoded review data
 * 
 * Chạy script: ts-node src/scripts/resetProductRatings.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.model';

dotenv.config();

const resetProductRatings = async () => {
  try {
    // Kết nối database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/organic-produce';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Reset tất cả rating và reviewCount về 0
    const result = await Product.updateMany(
      {},
      {
        $set: {
          rating: 0,
          reviewCount: 0
        }
      }
    );

    console.log(`✅ Reset ${result.modifiedCount} products`);
    console.log('📊 All product ratings and review counts have been reset to 0');
    console.log('💡 Ratings will be automatically calculated when users submit reviews');

    // Đóng kết nối
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Chạy script
resetProductRatings();
