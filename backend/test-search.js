require('dotenv').config();
const mongoose = require('mongoose');
const Auth = require('./src/modules/auth/auth.model');
const Hospital = require('./src/modules/hospital/hospital.model');
const hospitalService = require('./src/modules/hospital/hospital.service');
const env = require('./src/config/env');

async function testSearch() {
  try {
    await mongoose.connect(env.dbUri);
    console.log('Connected to DB');

    const approvedAdmins = await Auth.find({ role: 'hospital_admin', isApproved: true });
    console.log(`Found ${approvedAdmins.length} approved hospital admins`);
    const approvedHospitalIds = approvedAdmins.map(admin => admin.hospitalId).filter(id => id);
    console.log('Approved Hospital IDs:', approvedHospitalIds);

    const query = { 
      isActive: true,
      _id: { $in: approvedHospitalIds }
    };
    const hospitals = await Hospital.find(query);
    console.log(`Found ${hospitals.length} active hospitals matching the IDs`);

    const result = await hospitalService.searchHospitalsService({});
    console.log(`Search service returned ${result.length} hospitals`);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    mongoose.disconnect();
  }
}

testSearch();
