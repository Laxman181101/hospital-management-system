const mongoose = require('mongoose');

async function checkCounts() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hms';
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;

    const authsByRole = await db.collection('auths').aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]).toArray();

    const totalHospitals = await db.collection('hospitals').countDocuments();
    const totalPatients = await db.collection('patients').countDocuments();
    const totalDoctors = await db.collection('doctors').countDocuments();

    const userList = await db.collection('auths').find({}, { projection: { firstName: 1, lastName: 1, email: 1, role: 1, isApproved: 1 } }).toArray();

    console.log(JSON.stringify({
      authsByRole,
      totalHospitals,
      totalPatients,
      totalDoctors,
      userList
    }, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkCounts();
