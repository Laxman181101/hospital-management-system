const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seedUsers() {
  await mongoose.connect('mongodb://127.0.0.1:27017/hms');
  const db = mongoose.connection.db;
  const password = await bcrypt.hash('123456', 10);
  
  // Create Hospital
  const hospital = await db.collection('hospitals').insertOne({
    name: 'Test Hospital',
    email: 'hospital@test.com',
    status: 'approved'
  });
  const hospitalId = hospital.insertedId;

  // Create Receptionist
  const recRes = await db.collection('users').insertOne({
    firstName: 'Test',
    lastName: 'Receptionist',
    email: 'onereceptionist@gmail.com',
    password,
    role: 'receptionist',
    hospital: hospitalId,
    status: 'active'
  });
  
  await db.collection('staffs').insertOne({
    user: recRes.insertedId,
    hospital: hospitalId,
    role: 'receptionist',
    department: 'Front Desk'
  });

  // Create Doctor
  const docRes = await db.collection('users').insertOne({
    firstName: 'Test',
    lastName: 'Doctor',
    email: 'onedoctor@gmail.com',
    password,
    role: 'doctor',
    hospital: hospitalId,
    status: 'active'
  });

  await db.collection('doctors').insertOne({
    user: docRes.insertedId,
    hospital: hospitalId,
    specialization: 'General',
    fees: 500,
    availabilitySchedule: []
  });

  console.log("Seeded test users successfully.");
  process.exit(0);
}

seedUsers();
