import mongoose from 'mongoose';
import { User } from '../models/User.model';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function debugLogin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || '');
        console.log('Connected to MongoDB\n');

        // 1. Find user in database
        const user = await User.findOne({ email: 'shipper@test.com' }).select('+password');
        if (!user) {
            console.log('❌ User not found');
            process.exit(1);
        }

        console.log('✅ User found in database:');
        console.log('  Email:', user.email);
        console.log('  Role:', user.role);
        console.log('  isActive:', user.isActive);
        console.log('  isEmailVerified:', user.isEmailVerified);
        console.log('  Has password:', !!user.password);
        console.log('');

        // 2. Test password comparison
        const isMatch = await user.comparePassword('123456');
        console.log('Password comparison result:', isMatch ? '✅ MATCH' : '❌ NO MATCH');
        console.log('');

        // 3. Test login API
        console.log('Testing login API...');
        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email: 'shipper@test.com',
                password: '123456'
            });

            console.log('✅ Login API successful!');
            console.log('Token:', response.data.data.token.substring(0, 50) + '...');
            console.log('User role:', response.data.data.user.role);
        } catch (error: any) {
            console.log('❌ Login API failed!');
            if (error.response) {
                console.log('Status:', error.response.status);
                console.log('Message:', error.response.data.message);
                console.log('Full error:', JSON.stringify(error.response.data, null, 2));
            } else if (error.request) {
                console.log('No response received');
                console.log('Request:', error.request);
            } else {
                console.log('Error:', error.message);
            }
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

debugLogin();
