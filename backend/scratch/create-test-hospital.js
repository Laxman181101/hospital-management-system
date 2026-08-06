const mongoose = require('mongoose');
const env = require('../src/config/env');
const Hospital = require('../src/modules/hospital/hospital.model');
const Auth = require('../src/modules/auth/auth.model');

async function createTestHospital() {
  try {
    const mongoUri = 'mongodb+srv://laxmansaroj:lax31579@cluster0.up7cyws.mongodb.net/hms-db';
    await mongoose.connect(mongoUri);
    console.log('Connected to DB');
    
    const adminEmail = 'admin@simplehospital.com';

    // Check if user already exists
    const existingUser = await Auth.findOne({ email: adminEmail });
    if (existingUser) {
        console.log('Deleting old test user and hospital to recreate fresh...');
        await Auth.deleteOne({ _id: existingUser._id });
        await Hospital.deleteMany({ createdBy: existingUser._id });
    }

    // 1. Create Hospital Admin User
    const admin = new Auth({
      firstName: 'Simple',
      lastName: 'Admin',
      email: adminEmail,
      mobile: '1231231234',
      password: '123456', // Will be hashed by pre-save hook
      role: 'hospital_admin',
      isApproved: true, // Auto-approved!
      isProfileComplete: true
    });
    
    await admin.save();
    console.log('Admin created with ID:', admin._id);

    // 2. Create Hospital
    const hospital = new Hospital({
      hospitalName: 'Simple Hospital',
      address: {
          street: '123 Simple Street',
          area: 'Central Area',
          city: 'Simple City',
          state: 'Simple State',
          pincode: '123456'
      },
      phone: '1231231234',
      email: 'contact@simplehospital.com',
      licenseNumber: 'LIC-SIMPLE-001',
      description: 'A test hospital for checking dashboard functionality.',
      documentUrl: 'https://example.com/dummy.pdf', // Dummy document
      createdBy: admin._id,
      status: 'active',
      location: {
          latitude: 12.9716,
          longitude: 77.5946
      }
    });
    
    await hospital.save();
    console.log('Hospital created with ID:', hospital._id);

    // 3. Link hospital ID back to admin
    admin.hospitalId = hospital._id;
    await admin.save();
    console.log('Hospital ID linked to Admin profile');

    console.log('--------------------------------------------------');
    console.log('SUCCESS! Test Hospital has been created and approved.');
    console.log('You can now log in to the dashboard with:');
    console.log('Email: ' + adminEmail);
    console.log('Password: 123456');
    console.log('--------------------------------------------------');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

createTestHospital();
