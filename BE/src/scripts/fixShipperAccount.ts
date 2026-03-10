import mongoose from 'mongoose';
import { User } from '../models/User.model';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

async function fixShipperAccount() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || '');
        console.log('Connected to MongoDB\n');

        // 1. Find and unlock account
        const user = await User.findOne({ email: 'shipper@test.com' });
        if (!user) {
            console.log('❌ User not found');
            process.exit(1);
        }

        console.log('Found user:', user.email);
        console.log('Current status - isActive:', user.isActive, ', failedAttempts:', user.failedLoginAttempts);

        // 2. Update user - unlock and reset password (let pre-save hook hash it)
        user.isActive = true;
        user.failedLoginAttempts = 0;
        user.lockedUntil = undefined;
        user.password = '123456'; // Set plain password, pre-save hook will hash it
        user.isEmailVerified = true;

        await user.save();

        console.log('\n✅ Account fixed!');
        console.log('  - Unlocked account');
        console.log('  - Reset failed login attempts');
        console.log('  - Updated password to: 123456');
        console.log('  - Verified email\n');

        // 4. Test password
        const updatedUser = await User.findOne({ email: 'shipper@test.com' }).select('+password');
        if (updatedUser) {
            const isMatch = await updatedUser.comparePassword('123456');
            console.log('Password verification:', isMatch ? '✅ MATCH' : '❌ NO MATCH');
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixShipperAccount();
