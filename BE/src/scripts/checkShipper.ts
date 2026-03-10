/**
 * Check shipper user in database
 */

import mongoose from 'mongoose';
import { User } from '../models/User.model';
import dotenv from 'dotenv';

dotenv.config();

async function checkShipper() {
    try {
        const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/organic-produce';
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const user = await User.findOne({ email: 'shipper@test.com' }).select('+password');

        if (!user) {
            console.log('❌ User NOT found');
        } else {
            console.log('✅ User found!');
            console.log('📧 Email:', user.email);
            console.log('👤 Username:', user.username);
            console.log('🎭 Role:', user.role);
            console.log('✅ isActive:', user.isActive);
            console.log('✅ isEmailVerified:', user.isEmailVerified);
            console.log('🔒 Password hash:', user.password?.substring(0, 30) + '...');

            // Test password comparison
            const testPassword = '123456';
            const isMatch = await user.comparePassword(testPassword);
            console.log(`\n🔑 Password '${testPassword}' matches:`, isMatch ? '✅ YES' : '❌ NO');
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

checkShipper();
