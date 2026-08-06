require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  
  // Get all prescriptions sorted by date
  const prescriptions = await db.collection('prescriptions').find({}).sort({ createdAt: 1 }).toArray();
  
  console.log('Total prescriptions:', prescriptions.length);
  console.log('---');
  
  prescriptions.forEach(p => {
    const meds = (p.medicines || []).map(m => m.name).join(', ') || 'No meds';
    console.log(
      p._id, '|',
      'patient:', p.patientId || p.patient, '|',
      'meds:', meds, '|',
      'created:', new Date(p.createdAt).toLocaleString('en-IN')
    );
  });
  
  mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
