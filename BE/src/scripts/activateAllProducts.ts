/**
 * Script: Activate All Products
 *
 * Script này sẽ set isActive = true cho tất cả sản phẩm trong DB.
 * Dùng khi có nhiều sản phẩm bị inactive hoặc thiếu field isActive.
 *
 * Chạy: npx ts-node src/scripts/activateAllProducts.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.model';

dotenv.config();

const activateAllProducts = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/organic-produce';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const result = await Product.updateMany(
      { $or: [{ isActive: false }, { isActive: { $exists: false } }] },
      { $set: { isActive: true } }
    );

    console.log(`✅ Activated ${result.modifiedCount} product(s)`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

activateAllProducts();
