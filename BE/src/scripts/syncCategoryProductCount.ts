/**
 * Script to sync productCount in Category collection
 * based on actual product count in Product collection
 * 
 * Run with: npx ts-node src/scripts/syncCategoryProductCount.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const syncProductCounts = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/organic-produce';
    console.log('🔗 Connecting to:', mongoUri.substring(0, 30) + '...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Import models after connection
    const { Category } = await import('../models/Category.model');
    const { Product } = await import('../models/Product.model');

    // Get all categories - use direct collection access
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const categoriesCollection = db.collection('categories');
    const categoriesRaw = await categoriesCollection.find({}).toArray();
    console.log(`📦 Found ${categoriesRaw.length} categories in raw collection`);

    let updatedCount = 0;

    for (const category of categoriesRaw) {
      // Count products in this category
      const productCount = await Product.countDocuments({ 
        category: category.slug 
      });

      // Update if different
      if (category.productCount !== productCount) {
        await categoriesCollection.updateOne(
          { _id: category._id },
          { $set: { productCount } }
        );
        console.log(`  ✓ ${category.name} (${category.slug}): ${category.productCount || 0} → ${productCount}`);
        updatedCount++;
      } else {
        console.log(`  - ${category.name} (${category.slug}): ${productCount} (no change)`);
      }
    }

    console.log(`\n🎉 Sync completed! Updated ${updatedCount} categories.`);

  } catch (error) {
    console.error('❌ Error syncing product counts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the sync
syncProductCounts();
