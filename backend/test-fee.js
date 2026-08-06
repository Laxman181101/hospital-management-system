require('dotenv').config();
const mongoose = require('mongoose');
const authService = require('./src/modules/auth/auth.service');
const Auth = require('./src/modules/auth/auth.model');
const Doctor = require('./src/modules/doctor/doctor.model');
const env = require('./src/config/env');

async function testDoctorFee() {
  try {
    await mongoose.connect(env.dbUri);
    console.log('Connected to DB');

    // Find any existing hospital admin to get their hospitalId
    const admin = await Auth.findOne({ role: 'hospital_admin', hospitalId: { $exists: true, $ne: null } });
    if (!admin) {
      console.log('No hospital admin found with a hospitalId');
      return;
    }

    const hospitalId = admin.hospitalId;
    console.log('Using Hospital ID:', hospitalId);

    // Dummy doctor data
    const dummyDoctor = {
      firstName: 'Test',
      lastName: 'Doc',
      email: 'testdoc_' + Date.now() + '@example.com',
      mobile: '99' + Math.floor(10000000 + Math.random() * 90000000),
      password: 'password123',
      role: 'doctor',
      specialization: 'Neurology',
      consultationFee: 1250, // Setting a custom fee to test
    };

    console.log('Registering doctor with fee:', dummyDoctor.consultationFee);
    const user = await authService.registerStaff(hospitalId, dummyDoctor);

    // Now fetch the doctor model
    const doctor = await Doctor.findOne({ user: user._id });
    
    if (doctor) {
      console.log('--- TEST RESULTS ---');
      console.log('Doctor Created Successfully!');
      console.log('Name:', doctor.name);
      console.log('Specialization:', doctor.specialization);
      console.log('Consultation Fee in DB:', doctor.consultationFee);
      
      if (doctor.consultationFee === 1250) {
        console.log('SUCCESS: The fee was correctly saved as', doctor.consultationFee);
      } else {
        console.log('FAILED: The fee was saved as', doctor.consultationFee, 'instead of 1250');
      }
    } else {
      console.log('Doctor profile not found after registration!');
    }

    // Clean up
    await Auth.findByIdAndDelete(user._id);
    if (doctor) await Doctor.findByIdAndDelete(doctor._id);
    console.log('Test data cleaned up.');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    mongoose.disconnect();
  }
}

testDoctorFee();
