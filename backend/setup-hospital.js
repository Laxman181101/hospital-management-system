const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/modules/auth/auth.model');
const Hospital = require('./src/modules/hospital/hospital.model');
const dotenv = require('dotenv');

dotenv.config();

const setupHospital = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hms');
        
        // Create Hospital
        const hospital = new Hospital({
            hospitalName: 'Test Hospital',
            description: 'A test hospital for E2E testing',
            address: {
                street: '123 Test St',
                area: 'Test Area',
                city: 'Test City',
                state: 'Test State',
                country: 'India',
                pincode: '123456'
            },
            location: { latitude: 0, longitude: 0 },
            contactDetails: {
                phone: '1234567890',
                email: 'test@hospital.com'
            },
            licenseNumber: 'LIC123'
        });
        await hospital.save();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Password123', salt);

        // Create Admin
        const admin = new User({
            firstName: 'Admin',
            lastName: 'Test',
            email: 'admin_test@hospital.com',
            password: hashedPassword,
            role: 'hospital_admin',
            mobile: '1234567891',
            hospitalId: hospital._id
        });
        await admin.save();

        console.log(`Hospital ID: ${hospital._id}`);
        console.log(`Admin created: ${admin.email} / Password123`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        mongoose.disconnect();
    }
};

setupHospital();
