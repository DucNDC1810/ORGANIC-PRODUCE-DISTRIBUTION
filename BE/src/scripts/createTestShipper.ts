/**
 * Script to create test shipper account
 * Run: npx ts-node src/scripts/createTestShipper.ts
 */

import mongoose from 'mongoose';
import { User } from '../models/User.model';
import { Shipper } from '../models/Shipper.model';
import { DeliveryZone } from '../models/DeliveryZone.model';
import dotenv from 'dotenv';

dotenv.config();

async function createTestShipper() {
    try {
        // Connect to MongoDB
        const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/organic-produce';
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Create or find User account with shipper role
        let shipperUser = await User.findOne({ email: 'shipper@test.com' });

        if (!shipperUser) {
            shipperUser = await User.create({
                email: 'shipper@test.com',
                password: '123456',
                name: 'Nguyễn Văn Giao',
                username: 'shipper1',
                role: 'shipper',
                phone: '0901234567',
                isEmailVerified: true,
                isActive: true,
                walletBalance: 0,
                firstTopupBonusClaimed: false,
                failedLoginAttempts: 0
            });
            console.log('✅ Created shipper user account:', shipperUser.email);
        } else {
            console.log('ℹ️  Shipper user already exists:', shipperUser.email);
        }

        // 2. Create Shipper profile linked to User
        let shipperProfile = await Shipper.findOne({ userId: shipperUser._id });

        if (!shipperProfile) {
            shipperProfile = await Shipper.create({
                userId: shipperUser._id,
                name: 'Nguyễn Văn Giao',
                phone: '0901234567',
                vehiclePlate: '51H-12345',
                email: 'shipper@test.com',
                isActive: true
            });
            console.log('✅ Created shipper profile:', shipperProfile._id);
        } else {
            console.log('ℹ️  Shipper profile already exists:', shipperProfile._id);
        }

        // 3. Create test delivery zones
        const zone1 = await DeliveryZone.findOneAndUpdate(
            { zoneName: 'Quận 1', shipperId: shipperProfile._id },
            {
                zoneName: 'Quận 1',
                shippingRate: 15000,
                shipperId: shipperProfile._id,
                description: 'Khu vực trung tâm thành phố',
                isActive: true,
                coordinates: {
                    latitude: 10.7769,
                    longitude: 106.7009
                }
            },
            { upsert: true, new: true }
        );
        console.log('✅ Created/Updated zone:', zone1.zoneName);

        const zone2 = await DeliveryZone.findOneAndUpdate(
            { zoneName: 'Quận 3', shipperId: shipperProfile._id },
            {
                zoneName: 'Quận 3',
                shippingRate: 12000,
                shipperId: shipperProfile._id,
                description: 'Khu vực quận 3',
                isActive: true,
                coordinates: {
                    latitude: 10.7844,
                    longitude: 106.6867
                }
            },
            { upsert: true, new: true }
        );
        console.log('✅ Created/Updated zone:', zone2.zoneName);

        console.log('\n🎉 Test shipper setup complete!');
        console.log('📧 Email: shipper@test.com');
        console.log('🔑 Password: 123456');
        console.log('👤 Shipper ID:', shipperProfile._id);
        console.log('📍 Zones:', [zone1.zoneName, zone2.zoneName].join(', '));

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

createTestShipper();
