const mongoose = require('mongoose');
const env = require('../src/config/env');
const Hospital = require('../src/modules/hospital/hospital.model');
const Auth = require('../src/modules/auth/auth.model');

async function fixUser() {
  try {
    const mongoUri = 'mongodb+srv://laxmansaroj:lax31579@cluster0.up7cyws.mongodb.net/hms-db';
    await mongoose.connect(mongoUri);
    console.log('Connected to DB');

    const user = await Auth.findOne({ email: 'john2@apollocare.com' });
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    console.log('User ID:', user._id);
    console.log('User hospitalId before:', user.hospitalId);

    const hospital = await Hospital.findOne({ createdBy: user._id });
    if (hospital) {
      console.log('Found hospital created by user:', hospital._id, hospital.hospitalName);
      if (!user.hospitalId) {
        user.hospitalId = hospital._id;
        await user.save();
        console.log('Updated user.hospitalId!');
      }
    } else {
      console.log('No hospital found created by this user.');
    }
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.disconnect();
  }
}

fixUser();
