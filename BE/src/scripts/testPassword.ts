import mongoose from 'mongoose';
import { User } from '../models/User.model';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

async function testPassword() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || '');

        const user = await User.findOne({ email: 'shipper@test.com' }).select('+password');
        if (!user || !user.password) {
            console.log('No user or password');
            process.exit(1);
        }

        console.log('User password hash:', user.password);
        console.log('Testing password: "123456"\n');

        // Test direct bcrypt compare
        const match1 = await bcrypt.compare('123456', user.password);
        console.log('Direct bcrypt.compare result:', match1 ? '✅ MATCH' : '❌ NO MATCH');

        // Test user method
        const match2 = await user.comparePassword('123456');
        console.log('user.comparePassword result:', match2 ? '✅ MATCH' : '❌ NO MATCH');

        // Test if password was actually saved
        const freshUser = await User.findOne({ email: 'shipper@test.com' }).select('+password');
        if (freshUser && freshUser.password) {
            console.log('\nFresh user password hash:', freshUser.password);
            const match3 = await bcrypt.compare('123456', freshUser.password);
            console.log('Fresh user bcrypt.compare:', match3 ? '✅ MATCH' : '❌ NO MATCH');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

testPassword();
