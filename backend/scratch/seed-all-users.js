const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seedAllUsers() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hms';
    console.log('Connecting to MongoDB at:', mongoUri);
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;

    const hashedPassword = await bcrypt.hash('123456', 10);

    // 1. Create or get Hospital
    let hospital = await db.collection('hospitals').findOne({ name: 'City General Hospital' });
    if (!hospital) {
      const res = await db.collection('hospitals').insertOne({
        name: 'City General Hospital',
        email: 'admin@hospital.com',
        phone: '9876543210',
        address: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      hospital = { _id: res.insertedId };
      console.log('Created Hospital: City General Hospital');
    }

    const hospitalId = hospital._id;

    // 2. Create Hospital Admin
    let hospAdmin = await db.collection('auths').findOne({ email: 'admin@hospital.com' });
    if (!hospAdmin) {
      await db.collection('auths').insertOne({
        firstName: 'Hospital',
        lastName: 'Admin',
        email: 'admin@hospital.com',
        mobile: '9876543210',
        password: hashedPassword,
        role: 'hospital_admin',
        hospitalId: hospitalId,
        isApproved: true,
        isProfileComplete: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Created Hospital Admin: admin@hospital.com');
    }

    // 3. Create Doctor
    let doctor = await db.collection('auths').findOne({ email: 'doctor@hospital.com' });
    if (!doctor) {
      const docAuth = await db.collection('auths').insertOne({
        firstName: 'Dr. John',
        lastName: 'Smith',
        email: 'doctor@hospital.com',
        mobile: '9876543211',
        password: hashedPassword,
        role: 'doctor',
        specialization: 'Cardiology',
        hospitalId: hospitalId,
        isApproved: true,
        isProfileComplete: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await db.collection('doctors').insertOne({
        user: docAuth.insertedId,
        hospitalId: hospitalId,
        firstName: 'Dr. John',
        lastName: 'Smith',
        email: 'doctor@hospital.com',
        mobile: '9876543211',
        specialization: 'Cardiology',
        experience: 8,
        fees: 500,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Created Doctor: doctor@hospital.com');
    }

    // 4. Create Receptionist / Staff
    let receptionist = await db.collection('auths').findOne({ email: 'receptionist@hospital.com' });
    if (!receptionist) {
      await db.collection('auths').insertOne({
        firstName: 'Sarah',
        lastName: 'Receptionist',
        email: 'receptionist@hospital.com',
        mobile: '9876543212',
        password: hashedPassword,
        role: 'receptionist',
        hospitalId: hospitalId,
        isApproved: true,
        isProfileComplete: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Created Receptionist: receptionist@hospital.com');
    }

    // 5. Create Patient
    let patient = await db.collection('auths').findOne({ email: 'patient@gmail.com' });
    if (!patient) {
      const patientAuth = await db.collection('auths').insertOne({
        firstName: 'Rahul',
        lastName: 'Sharma',
        email: 'patient@gmail.com',
        mobile: '9876543213',
        password: hashedPassword,
        role: 'patient',
        hospitalId: hospitalId,
        isApproved: true,
        isProfileComplete: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await db.collection('patients').insertOne({
        user: patientAuth.insertedId,
        hospitalId: hospitalId,
        name: 'Rahul Sharma',
        firstName: 'Rahul',
        lastName: 'Sharma',
        email: 'patient@gmail.com',
        mobile: '9876543213',
        gender: 'Male',
        age: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Created Patient: patient@gmail.com');
    }

    console.log('\n--- ALL TEST USERS SEEDED SUCCESSFULLY ---');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedAllUsers();
