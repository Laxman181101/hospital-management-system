require('dotenv').config();
const mongoose = require('mongoose');
const Hospital = require('../src/modules/hospital/hospital.model');

mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI).then(async () => {
  try {
    const count = await Hospital.countDocuments();
    const activeCount = await Hospital.countDocuments({isActive: true});
    const locCount = await Hospital.countDocuments({'location.latitude': {$exists: true, $ne: null}});
    const validCount = await Hospital.countDocuments({isActive:true, 'location.latitude': {$exists: true, $ne: null}});
    console.log('Total Hospitals:', count);
    console.log('Active Hospitals:', activeCount);
    console.log('Hospitals with Location:', locCount);
    console.log('Valid for Nearby Search (Active + Location):', validCount);

    const hs = await Hospital.find({isActive:true, 'location.latitude': {$exists: true, $ne: null}});
    console.log('Sample Valid Hospital:', hs.length > 0 ? hs[0].hospitalName + ' ' + JSON.stringify(hs[0].location) : 'None');
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
}).catch(console.error);
