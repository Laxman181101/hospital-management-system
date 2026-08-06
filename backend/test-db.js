require('dotenv').config();
const mongoose = require('mongoose');
const Auth = require('./src/modules/auth/auth.model');
const Hospital = require('./src/modules/hospital/hospital.model');
const env = require('./src/config/env');

async function debugDB() {
  try {
    await mongoose.connect(env.dbUri);
    console.log('Connected to DB');

    const allHospitals = await Hospital.find({});
    console.log(`Total hospitals: ${allHospitals.length}`);

    for (const h of allHospitals) {
      console.log(`- Hospital: ${h.hospitalName}, isActive: ${h.isActive}, createdBy: ${h.createdBy}`);
      if (h.createdBy) {
        const admin = await Auth.findById(h.createdBy);
        if (admin) {
           console.log(`  -> Created By Role: ${admin.role}, isApproved: ${admin.isApproved}, hospitalId: ${admin.hospitalId}`);
        } else {
           console.log(`  -> Admin not found for id ${h.createdBy}`);
        }
      }
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    mongoose.disconnect();
  }
}

debugDB();
